"""Adapted from KineNest (Apache-2.0). Bounded ROS API in real CPython.
ROS 2 Basics Lab: removed curriculum, perception, actions and TF dependencies.
"""
import sys
import types
import json
from js import emit_json
_nodes, _subscriptions, _timers, _futures = {}, {}, {}, {}
_counter = 0
_initialized = False

def _send(kind, **values):
    emit_json(json.dumps(dict(kind=kind, **values)))

def _id():
    global _counter
    _counter += 1
    return str(_counter)

def _module(name, **values):
    module = types.ModuleType(name)
    module.__dict__.update(values)
    module.__path__ = []
    sys.modules[name] = module
    if '.' in name:
        parent, child = name.rsplit('.', 1)
        setattr(sys.modules[parent], child, module)
    return module

class String:
    _type = 'std_msgs/msg/String'
    def __init__(self, data=''):
        self.data = data

class Vector3:
    def __init__(self):
        self.x = self.y = self.z = 0.0

class Twist:
    _type = 'geometry_msgs/msg/Twist'
    def __init__(self):
        self.linear, self.angular = Vector3(), Vector3()

class LaserScan:
    _type = 'sensor_msgs/msg/LaserScan'

class Image:
    _type = 'sensor_msgs/msg/Image'

def _type_name(cls):
    if not hasattr(cls, '_type'):
        raise TypeError('Unsupported or unbuilt ROS interface')
    return cls._type

def _object(data):
    if isinstance(data, dict):
        return types.SimpleNamespace(**{k: _object(v) for k, v in data.items()})
    if isinstance(data, list):
        return [_object(v) for v in data]
    return data

def _payload(msg):
    return {k: _payload(v) if hasattr(v, '__dict__') else v for k, v in vars(msg).items()}

class Publisher:
    def __init__(self, node, topic, cls):
        self.node, self.topic, self.cls = node, topic, cls
    def publish(self, msg):
        if not isinstance(msg, self.cls):
            raise TypeError('Wrong message type for publisher')
        _send('publish', node=self.node, topic=self.topic, type=_type_name(self.cls), message=_payload(msg))

class Node:
    def __init__(self, name):
        if not _initialized:
            raise RuntimeError('Call rclpy.init() first')
        if not name or not name.replace('_', '').isalnum() or name[0].isdigit():
            raise ValueError('Use a simple ROS node name')
        self.name = '/' + name
        self._parameters = {}
        _nodes[self.name] = self
        _send('node', node=self.name)
    def create_publisher(self, cls, topic, qos):
        _send('publisher', node=self.name, topic=topic, type=_type_name(cls))
        return Publisher(self.name, topic, cls)
    def create_subscription(self, cls, topic, callback, qos):
        key = _id()
        _subscriptions[key] = (self.name, callback)
        _send('subscribe', node=self.name, topic=topic, type=_type_name(cls), id=key)
        return key
    def destroy_subscription(self, key):
        _subscriptions.pop(key, None)
        _send('unsubscribe', id=key)
    def create_timer(self, period, callback):
        key = _id()
        _timers[key] = (self.name, callback)
        _send('timer', node=self.name, period=float(period), id=key)
        return types.SimpleNamespace(cancel=lambda: self.destroy_timer(key))
    def destroy_timer(self, timer):
        _timers.pop(timer, None)
        _send('timer_cancel', id=timer)
    def declare_parameter(self, name, value):
        if name in self._parameters:
            raise ValueError('Parameter already declared')
        self._parameters[name] = value
        _send('parameter_declare', node=self.name, name=name, value=value)
        return types.SimpleNamespace(value=value)
    def get_parameter(self, name):
        return types.SimpleNamespace(value=self._parameters[name])
    def get_logger(self):
        return types.SimpleNamespace(info=print, warning=print, error=print)
    def destroy_node(self):
        for key, (node, _) in list(_subscriptions.items()):
            if node == self.name:
                self.destroy_subscription(key)
        for key, (node, _) in list(_timers.items()):
            if node == self.name:
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
    _send('shutdown')

def spin(node):
    raise _Spin()

def _run_student(source):
    try:
        exec(compile(source, '<student>', 'exec'), {'__name__': '__main__'})
    except _Spin:
        pass

def _dispatch_message(key, payload, sample):
    if key in _subscriptions:
        _subscriptions[key][1](_object(json.loads(payload)))

def _dispatch_timer(key):
    if key in _timers:
        _timers[key][1]()

_module('rclpy', init=init, shutdown=shutdown, ok=lambda: _initialized, spin=spin, create_node=Node)
_module('rclpy.node', Node=Node)
for _pkg, _values in [('std_msgs', {'String': String}), ('geometry_msgs', {'Twist': Twist}), ('sensor_msgs', {'Image': Image, 'LaserScan': LaserScan})]:
    _module(_pkg)
    _module(_pkg + '.msg', **_values)
