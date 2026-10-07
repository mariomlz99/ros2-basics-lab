"""Small teaching API, executed by real CPython in Pyodide. Not ROS middleware."""
import sys
import types
import json
import traceback
import numpy as np
from js import emit_json

_nodes = {}
_subscriptions = {}
_futures = {}
_counter = 0
_current_frame = None
_initialized = False
_timers = {}
_action_handles = {}
_current_sample = None
_tf_buffers = []

def _send(kind, **values):
    emit_json(json.dumps(dict(kind=kind, **values)))

def _id():
    global _counter
    _counter += 1
    return str(_counter)

def _module(name, **values):
    module = types.ModuleType(name)
    module.__dict__.update(values)
    sys.modules[name] = module
    if '.' in name:
        parent, child = name.rsplit('.', 1)
        setattr(sys.modules[parent], child, module)
    else:
        module.__path__ = []
    return module

class Vector3:
    def __init__(self):
        self.x = self.y = self.z = 0.0

class Twist:
    def __init__(self):
        self.linear, self.angular = Vector3(), Vector3()

class TargetInfo:
    def __init__(self, visible=False, position='UNKNOWN', confidence=0.0):
        self.visible, self.position, self.confidence = visible, position, confidence

class String:
    def __init__(self, data=''):
        self.data = data

class LaserScan:
    pass

class Odometry:
    pass

class TFMessage:
    pass

class Image:
    def __init__(self, metadata=None, data=b''):
        metadata = metadata or {}
        self._width = metadata.get('width', 0)
        self._height = metadata.get('height', 0)
        self.encoding = metadata.get('encoding', 'rgb8')
        self.step = metadata.get('step', self._width * 3)
        self.is_bigendian = 0
        self.header = types.SimpleNamespace(**metadata.get('header', {}))
        self._data = data
        self._access = set()
    @property
    def width(self):
        self._access.add('width')
        return self._width
    @property
    def height(self):
        self._access.add('height')
        return self._height
    @property
    def data(self):
        self._access.add('data')
        return self._data

class CvBridge:
    def imgmsg_to_cv2(self, msg, desired_encoding='passthrough'):
        if not isinstance(msg, Image):
            raise TypeError('CvBridge expects sensor_msgs.msg.Image')
        if desired_encoding not in ('passthrough', 'rgb8', 'bgr8') or msg.encoding != 'rgb8':
            raise ValueError('This lab supports rgb8 and bgr8 only')
        image = np.frombuffer(msg.data, dtype=np.uint8).reshape(msg._height, msg._width, 3).copy()
        if desired_encoding == 'bgr8':
            image = image[:, :, ::-1].copy()
        msg._access.add('converted')
        return image

class Trigger:
    class Request:
        pass
    class Response:
        def __init__(self, success=False, message=''):
            self.success, self.message = success, message

class Future:
    def __init__(self):
        self._done = False
        self._result = None
        self._error = None
        self._callbacks = []
    def done(self):
        return self._done
    def result(self):
        if not self._done:
            raise RuntimeError('Response not received yet; use add_done_callback')
        if self._error:
            raise RuntimeError(self._error)
        return self._result
    def add_done_callback(self, callback):
        if self._done:
            callback(self)
        else:
            self._callbacks.append(callback)

class Publisher:
    def __init__(self, node, topic, message_type):
        self.node, self.topic, self.message_type = node, topic, message_type
    def publish(self, msg):
        if not isinstance(msg, self.message_type):
            raise TypeError('Wrong message type for publisher')
        if isinstance(msg, Twist):
            import math
            for vector in ('linear', 'angular'):
                for axis in ('x', 'y', 'z'):
                    value = getattr(getattr(msg, vector), axis)
                    if not isinstance(value, (int, float)) or not math.isfinite(value):
                        raise ValueError(f'Twist.{vector}.{axis} must be a finite number')
        payload = vars(msg) if isinstance(msg, (String, TargetInfo)) else {'linear': vars(msg.linear), 'angular': vars(msg.angular)}
        _send('publish', node=self.node, topic=self.topic, type=_type_name(self.message_type), message=payload)

class Client:
    def __init__(self, node, name):
        self.node, self.name = node, name
    def wait_for_service(self, timeout_sec=None):
        return self.name == '/reset_robot'
    def call_async(self, request):
        if not isinstance(request, Trigger.Request):
            raise TypeError('Expected Trigger.Request()')
        key = _id()
        future = Future()
        _futures[key] = future
        _send('service_call', id=key, node=self.node, name=self.name)
        return future
    def call(self, request):
        raise NotImplementedError('Use call_async and future.add_done_callback in this browser lab')

class Node:
    def __init__(self, name):
        if not _initialized:
            raise RuntimeError('Call rclpy.init() first')
        if not isinstance(name, str) or not name.replace('_', '').isalnum() or name[0].isdigit():
            raise ValueError('Use a simple ROS node name: letters, digits and underscores')
        self.name = '/' + name
        if self.name in _nodes:
            raise ValueError('Duplicate node name')
        _nodes[self.name] = self
        _send('node', node=self.name)
    def create_subscription(self, message_type, topic, callback, qos):
        _type_name(message_type)
        key = _id()
        _subscriptions[key] = (self.name, callback)
        _send('subscribe', node=self.name, topic=topic, type=_type_name(message_type), id=key)
        return key
    def create_publisher(self, message_type, topic, qos):
        if message_type not in (Twist, String, TargetInfo):
            raise NotImplementedError('Publishers support Twist and String')
        _send('publisher', node=self.name, topic=topic, type=_type_name(message_type))
        return Publisher(self.name, topic, message_type)
    def create_timer(self, period, callback):
        key = _id()
        _timers[key] = (self.name, callback)
        _send('timer', node=self.name, id=key, period=float(period))
        return types.SimpleNamespace(cancel=lambda: self.destroy_timer(key))
    def destroy_timer(self, timer):
        _timers.pop(timer, None)
        _send('timer_cancel', id=timer)
    def declare_parameter(self, name, value):
        if not hasattr(self, '_parameters'):
            self._parameters = {}
        if name in self._parameters:
            raise ValueError('Parameter already declared')
        self._parameters[name] = value
        _send('parameter_declare', node=self.name, name=name, value=value)
        return types.SimpleNamespace(value=value)
    def get_parameter(self, name):
        if name not in getattr(self, '_parameters', {}):
            raise KeyError(f'Parameter not declared: {name}. Call declare_parameter first.')
        value = self._parameters[name]
        _send('parameter_read', node=self.name, name=name, value=value)
        return types.SimpleNamespace(value=value)
    def create_client(self, service_type, name):
        if service_type is not Trigger or name != '/reset_robot':
            raise NotImplementedError('Session 3 supports Trigger on /reset_robot')
        _send('client', node=self.name, name=name)
        return Client(self.name, name)
    def get_logger(self):
        return types.SimpleNamespace(info=print, warning=print, error=print)
    def destroy_node(self):
        for key in [k for k, (node, _) in _subscriptions.items() if node == self.name]:
            del _subscriptions[key]
        for key in [k for k, (node, _) in _timers.items() if node == self.name]:
            self.destroy_timer(key)
        _nodes.pop(self.name, None)
        _send('destroy', node=self.name)

class _Spin(BaseException):
    pass

def init(args=None):
    global _initialized
    _initialized = True

def shutdown():
    global _initialized
    for node in list(_nodes.values()):
        node.destroy_node()
    _initialized = False

def spin(node):
    # Yield the worker to browser events; callbacks execute in the same Python globals.
    if node.name not in _nodes:
        raise RuntimeError('Node was destroyed')
    raise _Spin()

def report_detection(visible, cx=None):
    if _current_frame is None:
        raise RuntimeError('Call report_detection inside the image callback')
    if not isinstance(visible, (bool, np.bool_)):
        raise TypeError('visible must be a boolean')
    _send('detection', frame=_current_frame, visible=bool(visible), cx=None if cx is None else float(cx))

def report_image_stats(shape, channel_means):
    if _current_frame is None:
        raise RuntimeError('Call report_image_stats inside the image callback')
    _send('image_stats', frame=_current_frame, shape=[int(v) for v in shape], means=[float(v) for v in channel_means])

# Deliberately tiny OpenCV-style subset; RGB input is explicit in these lessons.
def inRange(src, lowerb, upperb):
    src = np.asarray(src)
    selected = (src >= np.asarray(lowerb)) & (src <= np.asarray(upperb))
    if src.ndim == 3:
        selected = selected.all(axis=2)
    return selected.astype(np.uint8) * 255

def countNonZero(src):
    if np.asarray(src).ndim != 2:
        raise ValueError('countNonZero expects a single-channel image')
    return int(np.count_nonzero(src))

def moments(src, binaryImage=False):
    weights = np.asarray(src, dtype=float)
    if weights.ndim != 2:
        raise ValueError('moments expects a single-channel image')
    if binaryImage:
        weights = (weights != 0).astype(float)
    ys, xs = np.indices(weights.shape)
    return {'m00': float(weights.sum()), 'm10': float((weights * xs).sum()), 'm01': float((weights * ys).sum())}

_module('rclpy', init=init, shutdown=shutdown, ok=lambda: _initialized, spin=spin, create_node=Node)
_module('rclpy.node', Node=Node)
_module('rclpy.task', Future=Future)
_module('sensor_msgs')
_module('sensor_msgs.msg', Image=Image, LaserScan=LaserScan)
_module('nav_msgs')
_module('nav_msgs.msg', Odometry=Odometry)
_module('std_msgs')
_module('std_msgs.msg', String=String)
_module('tf2_msgs')
_module('tf2_msgs.msg', TFMessage=TFMessage)
_module('geometry_msgs')
_module('geometry_msgs.msg', Twist=Twist)
_module('std_srvs')
_module('std_srvs.srv', Trigger=Trigger)
_module('cv_bridge', CvBridge=CvBridge)
_module('cv2', inRange=inRange, countNonZero=countNonZero, moments=moments)
_module('ros2learn', report_detection=report_detection, report_image_stats=report_image_stats)
_student_globals = {'__name__': '__main__'}

def _run_student(source):
    try:
        exec(compile(source, '<student>', 'exec'), _student_globals)
    except _Spin:
        pass

def _dispatch_image(key, metadata, raw, frame):
    global _current_frame
    if key not in _subscriptions:
        return
    msg = Image(json.loads(metadata), bytes(raw.to_py()))
    _current_frame = frame
    try:
        _subscriptions[key][1](msg)
        _send('processed', frame=frame, access=list(msg._access))
    finally:
        _current_frame = None

def _service_response(key, payload):
    future = _futures.pop(key, None)
    if future is None:
        return
    data = json.loads(payload)
    future._done = True
    future._error = data.get('error')
    future._result = Trigger.Response(data.get('success', False), data.get('message', ''))
    _send('response_received', success=future._result.success)
    for callback in future._callbacks:
        callback(future)

# Shared course API: typed messages, simulation timers, parameters, actions and TF.
def _type_name(cls):
    table = {TargetInfo:'ros2learn_interfaces/msg/TargetInfo', Twist: 'geometry_msgs/msg/Twist', String: 'std_msgs/msg/String', Image: 'sensor_msgs/msg/Image', LaserScan: 'sensor_msgs/msg/LaserScan', Odometry: 'nav_msgs/msg/Odometry', TFMessage: 'tf2_msgs/msg/TFMessage'}
    if cls not in table:
        raise NotImplementedError('Message type not supported in this course')
    return table[cls]

def _object(value):
    if isinstance(value, dict):
        return types.SimpleNamespace(**{k: _object(v) for k, v in value.items()})
    if isinstance(value, list):
        return [_object(v) for v in value]
    return value

class _SensorMessage(types.SimpleNamespace):
    def __getattribute__(self, name):
        if name in ('ranges', 'angle_min', 'angle_increment'):
            object.__getattribute__(self, '_access').add(name)
        return super().__getattribute__(name)

def _dispatch_message(key, payload, sample):
    global _current_sample
    if key not in _subscriptions:
        return
    data = json.loads(payload)
    if 'ranges' in data:
        data['ranges'] = [float('inf') if v == 'Infinity' else v for v in data['ranges']]
    _current_sample = sample
    try:
        msg = _object(data)
        access = set()
        if 'ranges' in data:
            msg = _SensorMessage(**vars(msg), _access=access)
        _subscriptions[key][1](msg)
        _send('message_processed', sample=sample, access=list(access))
    finally:
        _current_sample = None

def _dispatch_timer(key):
    if key in _timers:
        _timers[key][1]()
        _send('timer_processed')

def report_range(distance):
    _send('course_report', sample=_current_sample, report='range', values=[float(distance)])

def report_pose(x, y, yaw):
    _send('course_report', sample=_current_sample, report='pose', values=[float(x), float(y), float(yaw)])

def report_position(x, y):
    _send('course_report', sample=_current_sample, report='position', values=[float(x), float(y)])

def report_transform(x, y):
    _send('course_report', sample=_current_sample, report='transform', values=[float(x), float(y)])

class DriveDistance:
    class Goal:
        def __init__(self):
            self.distance = 0.0


class ClientGoalHandle:
    def __init__(self, key, accepted):
        self.key, self.accepted = key, accepted
        self._result_future = Future()
        self._result_requested = False
    def get_result_async(self):
        self._result_requested = True
        return self._result_future
    def cancel_goal_async(self):
        key = _id()
        future = Future()
        _futures[key] = future
        _send('action_cancel', id=self.key, request=key)
        return future

class ActionClient:
    def __init__(self, node, action_type, name):
        if action_type is not DriveDistance or name != '/drive_distance':
            raise NotImplementedError('This course provides /drive_distance with DriveDistance')
        self.node, self.name = node, name
        _send('action_client', node=node.name, name=name)
    def wait_for_server(self, timeout_sec=None):
        return True
    def send_goal_async(self, goal, feedback_callback=None):
        if not isinstance(goal, DriveDistance.Goal):
            raise TypeError('Expected DriveDistance.Goal')
        key = _id()
        future = Future()
        _futures[key] = future
        _action_handles[key] = {'feedback': feedback_callback}
        _send('action_goal', id=key, node=self.node.name, goal=vars(goal))
        return future

def _resolve(future, result):
    future._done, future._result = True, result
    for callback in future._callbacks:
        callback(future)

def _action_event(key, event, payload):
    data = json.loads(payload)
    state = _action_handles.get(key)
    if event == 'accepted':
        handle = ClientGoalHandle(key, data['accepted'])
        state['handle'] = handle
        _resolve(_futures.pop(key), handle)
    elif event == 'feedback':
        if state['feedback']:
            state['feedback'](types.SimpleNamespace(feedback=_object(data)))
            _send('action_observed', event=event)
    elif event == 'result':
        _resolve(state['handle']._result_future, _object(data))
        if state['handle']._result_requested:
            _send('action_observed', event=event, status=data['status'])
    elif event == 'cancel':
        _resolve(_futures.pop(key), _object(data))

class TransformException(Exception):
    pass

class Buffer:
    def __init__(self):
        self.transforms = {}
    def lookup_transform(self, target_frame, source_frame, time):
        import math
        # Resolve a tiny tree in either direction; values map source into target.
        edges = {}
        for (parent, child), (x, y, angle) in self.transforms.items():
            edges.setdefault(child, []).append((parent, x, y, angle))
            edges.setdefault(parent, []).append((child, -math.cos(angle)*x-math.sin(angle)*y, math.sin(angle)*x-math.cos(angle)*y, -angle))
        if target_frame not in edges or source_frame not in edges:
            raise TransformException('Transform not received yet or unknown frame')
        queue = [(source_frame, 0., 0., 0.)]
        seen = set()
        while queue:
            frame, x, y, angle = queue.pop(0)
            if frame == target_frame:
                _send('tf_lookup', target=target_frame, source=source_frame)
                return types.SimpleNamespace(header=types.SimpleNamespace(frame_id=target_frame), child_frame_id=source_frame, transform=types.SimpleNamespace(translation=types.SimpleNamespace(x=x, y=y, z=0.), rotation=types.SimpleNamespace(x=0., y=0., z=math.sin(angle/2), w=math.cos(angle/2))))
            seen.add(frame)
            for other, ex, ey, ea in edges.get(frame, []):
                if other not in seen:
                    queue.append((other, ex+math.cos(ea)*x-math.sin(ea)*y, ey+math.sin(ea)*x+math.cos(ea)*y, ea+angle))
        raise TransformException('Transform not received yet or unknown frame')

class TransformListener:
    def __init__(self, buffer, node):
        import math
        def receive(msg):
            for t in msg.transforms:
                p, q = t.transform.translation, t.transform.rotation
                buffer.transforms[(t.header.frame_id, t.child_frame_id)] = (p.x, p.y, 2*math.atan2(q.z, q.w))
        self.subscription = node.create_subscription(TFMessage, '/tf', receive, 10)

_module('rclpy.action', ActionClient=ActionClient)
_module('rclpy.time', Time=lambda: None)
_module('tf2_ros', Buffer=Buffer, TransformListener=TransformListener, TransformException=TransformException)
_module('ros2learn_interfaces')
_module('ros2learn_interfaces.action', DriveDistance=DriveDistance)
sys.modules['ros2learn'].report_range = report_range
sys.modules['ros2learn'].report_pose = report_pose
sys.modules['ros2learn'].report_position = report_position
sys.modules['ros2learn'].report_transform = report_transform

def report_sectors(front, left, right):
    _send('course_report', sample=_current_sample, report='sectors', values=[float(front), float(left), float(right)])
sys.modules['ros2learn'].report_sectors = report_sectors

def euler_from_quaternion(q):
    import math
    x, y, z, w = q
    roll = math.atan2(2*(w*x+y*z), 1-2*(x*x+y*y))
    pitch = math.asin(max(-1., min(1., 2*(w*y-z*x))))
    yaw = math.atan2(2*(w*z+x*y), 1-2*(y*y+z*z))
    return roll, pitch, yaw
_module('tf_transformations', euler_from_quaternion=euler_from_quaternion)

_module('ros2learn_interfaces.msg', TargetInfo=TargetInfo)

def report_relative(x, y):
    _send('course_report', sample=_current_sample, report='relative', values=[float(x), float(y)])
sys.modules['ros2learn'].report_relative = report_relative
