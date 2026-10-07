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
            return type(label, (), {'__init__': constructor, '_type': name, **{c['name']: c['value'] for c in record.get('constants', [])}})
        if 'response' in record:
            cls = type(short, (), {'_type': name, 'Request': message_class(record['fields'], 'Request'), 'Response': message_class(record['response'], 'Response')})
        else:
            cls = message_class(record['fields'], short)
        classes[name] = cls
        setattr(sys.modules[package + '.' + kind], short, cls)
        return cls
    for name in schema:
        make(name)
