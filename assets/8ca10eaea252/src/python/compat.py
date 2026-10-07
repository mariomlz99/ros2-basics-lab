"""Adapted from KineNest (Apache-2.0). Bounded ROS API in real CPython.
KineNest BASICS: communication, parameters and callback-based actions.
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
    if isinstance(msg, (list, tuple)):
        return [_payload(v) for v in msg]
    if not hasattr(msg, '__dict__'):
        return msg
    return {k: _payload(v) for k, v in vars(msg).items()}

def _from_payload(instance, payload):
    for key, value in payload.items():
        current = getattr(instance, key)
        setattr(instance, key, _from_payload(current, value) if isinstance(value, dict) and hasattr(current, '__dict__') else [_object(v) for v in value] if isinstance(value, list) else value)
    return instance

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
        _subscriptions[key] = (self.name, callback, cls)
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
        _send('parameter_declare', node=self.name, name=name, value=value, value_type=1 if isinstance(value, bool) else 2 if isinstance(value, int) else 3 if isinstance(value, float) else 4)
        return types.SimpleNamespace(value=value)
    def get_parameter(self, name):
        return types.SimpleNamespace(value=self._parameters[name])
    def get_logger(self):
        def log(level, message):
            _send('log', node=self.name, level=level, text=str(message))
        return types.SimpleNamespace(debug=lambda s: log(10, s), info=lambda s: log(20, s), warning=lambda s: log(30, s), warn=lambda s: log(30, s), error=lambda s: log(40, s), fatal=lambda s: log(50, s))
    def destroy_node(self):
        for key, (node, _, _) in list(_subscriptions.items()):
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

def _run_learner(source):
    try:
        exec(compile(source, '<learner>', 'exec'), {'__name__': '__main__'})
    except _Spin:
        pass

def _dispatch_message(key, payload, sample):
    if key in _subscriptions:
        _subscriptions[key][1](_from_payload(_subscriptions[key][2](), json.loads(payload)))
        _send('message_processed', sample=sample)

def _dispatch_timer(key):
    if key in _timers:
        _timers[key][1]()

_module('rclpy', init=init, shutdown=shutdown, ok=lambda: _initialized, spin=spin, create_node=Node)
_module('rclpy.node', Node=Node)
# All concrete message/service types are generated from the canonical registry.
def _install_interfaces(schema):
    classes = {}
    primitives = {'bool': False, 'string': '', 'wstring': '', 'float32': 0.0, 'float64': 0.0}
    def make(name):
        if name in classes:
            return classes[name]
        record = schema[name]
        package, kind, short = name.split('/')
        if package not in sys.modules:
            _module(package)
        if package + '.' + kind not in sys.modules:
            _module(package + '.' + kind)
        def message_class(fields, label):
            def constructor(self, **kwargs):
                for field in fields:
                    typename = field['type']
                    array = '[' in typename
                    count = typename.split('[')[1].rstrip(']') if array else ''
                    base = typename.split('[')[0]
                    def default():
                        if 'default' in field:
                            return field['default']
                        if base in primitives:
                            return primitives[base]
                        if base.startswith(('int', 'uint')) or base in ('byte', 'char'):
                            return 0
                        target = base if base.count('/') == 2 else base.replace('/', '/msg/') if '/' in base else package + '/msg/' + base
                        return make(target)()
                    setattr(self, field['name'], kwargs.pop(field['name'], [default() for _ in range(int(count or 0))] if array else default()))
                if kwargs:
                    raise TypeError('Unknown fields: ' + ', '.join(kwargs))
            return type(label, (), {'__init__': constructor, '_type': name, **{c['name']: c['value'] for c in record.get('responseConstants' if label == 'Response' else 'constants', [])}})
        if 'feedback' in record:
            cls = type(short, (), {'_type': name, 'Goal': message_class(record['fields'], 'Goal'), 'Result': message_class(record['response'], 'Result'), 'Feedback': message_class(record['feedback'], 'Feedback')})
        elif 'response' in record:
            cls = type(short, (), {'_type': name, 'Request': message_class(record['fields'], 'Request'), 'Response': message_class(record['response'], 'Response')})
        else:
            cls = message_class(record['fields'], short)
        classes[name] = cls
        setattr(sys.modules[package + '.' + kind], short, cls)
        return cls
    for name in schema:
        make(name)

_services = {}
_available_services = set()

class Future:
    def __init__(self):
        self._done, self._result, self._error = False, None, None
        self._callbacks = []
    def done(self):
        return self._done
    def result(self):
        if self._error:
            raise RuntimeError(self._error)
        return self._result
    def add_done_callback(self, callback):
        if self._done:
            callback(self)
        else:
            self._callbacks.append(callback)

class Client:
    def __init__(self, node, cls, name):
        self.node, self.cls, self.name = node, cls, name
    def wait_for_service(self, timeout_sec=None):
        if self.name not in _available_services and '/' + self.name not in _available_services:
            raise RuntimeError('Start the service server in another terminal, then rerun the client. Blocking waits are not supported.')
        return True
    def call_async(self, request):
        if not isinstance(request, self.cls.Request):
            raise TypeError('Wrong request type')
        key = _id()
        future = Future()
        _futures[key] = (future, self.cls)
        _send('service_call', id=key, node=self.node, name=self.name, type=self.cls._type, request=_payload(request))
        return future

def _create_service(self, cls, name, callback):
    key = _id()
    _services[key] = (self.name, cls, callback)
    _send('service', node=self.name, name=name, type=cls._type, id=key)
    return key

def _create_client(self, cls, name):
    return Client(self.name, cls, name)

Node.create_service = _create_service
Node.create_client = _create_client
_module('rclpy.task', Future=Future)

def _service_request(key, token, payload):
    if key not in _services:
        raise RuntimeError('Service stopped')
    _, cls, callback = _services[key]
    result = callback(cls.Request(**json.loads(payload)), cls.Response())
    if not isinstance(result, cls.Response):
        raise TypeError('Service callback must return a response')
    _send('service_result', token=token, response=_payload(result))

def _service_response(key, payload):
    entry = _futures.pop(key, None)
    if entry is None:
        return
    future, cls = entry
    data = json.loads(payload)
    future._error = data.get('error')
    future._result = None if future._error else cls.Response(**data)
    future._done = True
    for callback in future._callbacks:
        callback(future)

# Cooperative action execution resumes on a ROS Future, leaving timers and
# cancellation callbacks runnable. No threads or blocking waits are emulated.
def _future_set_result(self, result):
    if self._done:
        raise RuntimeError('Future already completed')
    self._result, self._done = result, True
    callbacks, self._callbacks = self._callbacks, []
    for callback in callbacks:
        callback(self)

def _future_await(self):
    if not self.done():
        yield self
    return self.result()

Future.set_result = _future_set_result
Future.__await__ = _future_await
_action_servers, _server_goals, _action_handles = {}, {}, {}
_available_actions = set()

class GoalResponse:
    REJECT = 1
    ACCEPT = 2

class CancelResponse:
    REJECT = 1
    ACCEPT = 2

class ServerGoalHandle:
    def __init__(self, server, token, request):
        self.server, self.token = server, token
        self.request = server.cls.Goal(**request)
        self.is_cancel_requested = False
        self._status = 2
    def publish_feedback(self, feedback):
        if not isinstance(feedback, self.server.cls.Feedback):
            raise TypeError('Wrong feedback type')
        _send('action_server_reply', token=self.token, event='feedback', payload=_payload(feedback))
    def succeed(self):
        self._status = 4
    def canceled(self):
        if not self.is_cancel_requested:
            raise RuntimeError('Goal has not been canceled')
        self._status = 5
    def abort(self):
        self._status = 6
    def execute(self):
        result = self.server.callback(self)
        if hasattr(result, 'send'):
            def resume(_future=None):
                try:
                    waiting = result.send(None)
                    if not isinstance(waiting, Future):
                        raise RuntimeError('Action coroutine must await a rclpy.task.Future')
                    waiting.add_done_callback(resume)
                except StopIteration as finished:
                    self._finish(finished.value)
            resume()
        else:
            self._finish(result)
    def _finish(self, result):
        if not isinstance(result, self.server.cls.Result):
            raise TypeError('Action callback must return an action Result')
        if self._status not in (4, 5, 6):
            self._status = 6
        _send('action_server_reply', token=self.token, event='result', payload={'status': self._status, 'result': _payload(result)})
        _server_goals.pop(self.token, None)

class ActionServer:
    def __init__(self, node, action_type, name, execute_callback, *, goal_callback=lambda request: GoalResponse.ACCEPT, cancel_callback=lambda handle: CancelResponse.REJECT, handle_accepted_callback=lambda handle: handle.execute()):
        self.cls, self.callback = action_type, execute_callback
        self.goal_callback, self.cancel_callback, self.accepted_callback = goal_callback, cancel_callback, handle_accepted_callback
        self.key = _id()
        _action_servers[self.key] = self
        _send('action_server', node=node.name, name=name, type=action_type._type, id=self.key)

def _server_action_event(event):
    server = _action_servers[event['id']]
    token = event['token']
    if event['event'] == 'goal':
        accepted = server.goal_callback(server.cls.Goal(**event['request'])) == GoalResponse.ACCEPT
        _send('action_server_reply', token=token, event='accepted', payload={'accepted': accepted})
        if accepted:
            handle = ServerGoalHandle(server, token, event['request'])
            _server_goals[token] = handle
            server.accepted_callback(handle)
    elif event['event'] == 'cancel':
        handle = _server_goals.get(token)
        accepted = handle is not None and server.cancel_callback(handle) == CancelResponse.ACCEPT
        if accepted:
            handle.is_cancel_requested = True
        _send('action_server_reply', token=token, event='cancel', payload={'accepted': accepted})

class ClientGoalHandle:
    def __init__(self, key, accepted):
        self.key, self.accepted = key, accepted
        self._result_future = Future()
    def get_result_async(self):
        return self._result_future
    def cancel_goal_async(self):
        key = _id()
        future = Future()
        _action_handles[key] = {'cancel': future}
        _send('action_cancel', id=self.key, request=key)
        return future

class ActionClient:
    def __init__(self, node, action_type, name):
        self.node, self.cls, self.name = node, action_type, name
        _send('action_client', node=node.name, name=name, type=action_type._type)
    def wait_for_server(self, timeout_sec=None):
        if self.name not in _available_actions and '/' + self.name not in _available_actions:
            raise RuntimeError('Start the action server, then rerun this client. Blocking waits are not supported.')
        return True
    def send_goal_async(self, goal, feedback_callback=None):
        if not isinstance(goal, self.cls.Goal):
            raise TypeError('Wrong goal type')
        key, future = _id(), Future()
        _action_handles[key] = {'future': future, 'feedback': feedback_callback, 'cls': self.cls}
        _send('action_goal', id=key, node=self.node.name, name=self.name, type=self.cls._type, goal=_payload(goal))
        return future

def _action_event(key, event, payload):
    state = _action_handles.get(key)
    if state is None:
        return
    data = json.loads(payload)
    if event == 'accepted':
        handle = ClientGoalHandle(key, data['accepted'])
        state['handle'] = handle
        state['future'].set_result(handle)
        if not handle.accepted:
            _action_handles.pop(key, None)
    elif event == 'feedback' and state['feedback']:
        state['feedback'](types.SimpleNamespace(feedback=state['cls'].Feedback(**data['feedback'])))
    elif event == 'result':
        state['handle']._result_future.set_result(types.SimpleNamespace(status=data['status'], result=state['cls'].Result(**data['result'])))
        _action_handles.pop(key, None)
    elif event == 'cancel':
        state['cancel'].set_result(_object(data))
        _action_handles.pop(key, None)

_module('rclpy.action', ActionClient=ActionClient, ActionServer=ActionServer, GoalResponse=GoalResponse, CancelResponse=CancelResponse)
