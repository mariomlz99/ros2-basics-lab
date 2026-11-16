"""Local CPython tests of the shipped compatibility layer with a stub JS transport.

These do not certify native rclpy or actual Pyodide execution. The minimal schema
contains the standard String and AddTwoInts fields needed for lifecycle tests.
Run from the repository root; LAB_SOURCE_ROOT selects a shipped asset directory.
"""
import json
import os
from pathlib import Path
import sys
import types
import textwrap
import unittest

ROOT = Path(__file__).resolve().parents[1]
SOURCE_ROOT = Path(os.environ.get("LAB_SOURCE_ROOT", str(ROOT / "src"))).resolve()
SCHEMA = {
    "std_msgs/msg/String": {"fields": [{"type": "string", "name": "data"}]},
    "example_interfaces/srv/AddTwoInts": {
        "fields": [{"type": "int64", "name": "a"}, {"type": "int64", "name": "b"}],
        "response": [{"type": "int64", "name": "sum"}],
    },
}

class PythonLifecycle(unittest.TestCase):
    def run_case(self, code):
        events = []
        sys.modules["js"] = types.SimpleNamespace(emit_json=lambda text: events.append(json.loads(text)))
        namespace = {"events": events}
        path = SOURCE_ROOT / "python/compat.py"
        exec(compile(path.read_text(), str(path), "exec"), namespace)
        namespace["_install_interfaces"](SCHEMA)
        namespace["init"]()
        exec("import gc, weakref\nfrom std_msgs.msg import String\nfrom example_interfaces.srv import AddTwoInts", namespace)
        exec(textwrap.dedent(code), namespace)

    def test_01(self):
        """destroyed Python nodes reject all supported endpoint factories without changing transport or registries."""
        self.run_case("""
            old=Node('learner')
            old.destroy_node()
            for recreated in (False, True):
                if recreated:
                    replacement=Node('learner')
                for factory in (
                    lambda:old.create_publisher(String,'/ghost',10),
                    lambda:old.create_subscription(String,'/ghost',lambda msg:None,10),
                    lambda:old.create_timer(.1,lambda:None),
                    lambda:old.create_service(AddTwoInts,'/ghost',lambda req,res:res),
                    lambda:old.create_client(AddTwoInts,'/ghost'),
                ):
                    before=len(events)
                    try:
                        factory()
                    except RuntimeError:
                        pass
                    else:
                        raise AssertionError('a destroyed Node created an endpoint')
                    assert len(events)==before
                    assert not any((_publishers,_subscriptions,_timers,_services,_futures))
            assert _nodes['/learner'] is replacement
        """)

    def test_02(self):
        """a retired or unrelated Python node cannot remove a replacement node or its endpoints."""
        self.run_case("""
            old=Node('learner')
            old.destroy_node()
            live=Node('learner')
            other=Node('other')
            publisher=live.create_publisher(String,'/live',10)
            subscription=live.create_subscription(String,'/live',lambda msg:None,10)
            timer=live.create_timer(.1,lambda:None)
            service=live.create_service(AddTwoInts,'/add',lambda req,res:res)
            assert isinstance(publisher,Publisher) and isinstance(timer,Timer)
            assert isinstance(subscription,str) and isinstance(service,str)
            for foreign in (old,other):
                before=len(events)
                assert foreign.destroy_publisher(publisher) is False
                assert foreign.destroy_subscription(subscription) is False
                assert foreign.destroy_timer(timer) is False
                assert foreign.destroy_service(service) is False
                assert len(events)==before
            before=len(events)
            old.destroy_node()
            assert len(events)==before and _nodes['/learner'] is live
            publisher.publish(String(data='still alive'))
            for remove,endpoint in ((live.destroy_publisher,publisher),(live.destroy_subscription,subscription),(live.destroy_timer,timer),(live.destroy_service,service)):
                assert remove(endpoint) is True
                assert remove(endpoint) is False
            assert not any((_publishers,_subscriptions,_timers,_services))
        """)

    def test_03(self):
        """Python node cleanup drops queued endpoint callbacks while live sibling callbacks still run."""
        self.run_case("""
            calls=[]
            old=Node('old')
            live=Node('live')
            old_sub=old.create_subscription(String,'/old',lambda msg:calls.append('old message'),10)
            old_timer=old.create_timer(.1,lambda:calls.append('old timer'))
            old_pub=old.create_publisher(String,'/old',10)
            live_sub=live.create_subscription(String,'/live',lambda msg:calls.append(msg.data),10)
            live_timer=live.create_timer(.1,lambda:calls.append('live timer'))
            old.destroy_node()
            replacement=Node('old')
            _dispatch_event({'kind':'message','subscription':old_sub,'message':{'data':'old'},'sample':1})
            _dispatch_event({'kind':'timer','id':old_timer.id})
            for operation in (lambda:old_pub.publish(String(data='old')),old_timer.reset):
                try:
                    operation()
                except RuntimeError:
                    pass
                else:
                    raise AssertionError('destroyed endpoint accepted use')
            _dispatch_event({'kind':'message','subscription':live_sub,'message':{'data':'live message'},'sample':2})
            _dispatch_event({'kind':'timer','id':live_timer.id})
            assert calls==['live message','live timer']
            old.destroy_node()
            assert _nodes['/old'] is replacement and _nodes['/live'] is live
            shutdown()
            assert not any((_nodes,_publishers,_subscriptions,_timers,_services))
        """)

    def test_04(self):
        """late service results cannot complete a retired Python client or remove a same-name replacement."""
        self.run_case("""
            old=Node('client')
            client=old.create_client(AddTwoInts,'/add')
            retired=client.call_async(AddTwoInts.Request(a=1,b=2))
            retired_id=events[-1]['id']
            calls=[]
            retired.add_done_callback(lambda done:calls.append('retired'))
            old.destroy_node()
            replacement=Node('client')
            fresh=replacement.create_client(AddTwoInts,'/add').call_async(AddTwoInts.Request(a=7,b=8))
            fresh_id=events[-1]['id']
            fresh.add_done_callback(lambda done:calls.append(done.result().sum))
            _dispatch_event({'kind':'service_response','id':retired_id,'response':{'sum':3}})
            assert calls==[] and not retired.done() and list(_futures)==[fresh_id]
            old.destroy_node()
            assert _nodes['/client'] is replacement
            _dispatch_event({'kind':'service_response','id':fresh_id,'response':{'sum':15}})
            assert calls==[15] and fresh.done() and not _futures
        """)

    def test_05(self):
        """retired Python clients reject calls and readiness checks before and after node-name reuse."""
        self.run_case("""
            old=Node('client')
            client=old.create_client(AddTwoInts,'/add')
            _available_services.add('/add')
            assert client.wait_for_service(timeout_sec=0) is True
            old.destroy_node()
            for recreated in (False, True):
                if recreated:
                    replacement=Node('client')
                for operation in (lambda:client.call_async(AddTwoInts.Request(a=1,b=2)),lambda:client.wait_for_service(timeout_sec=0)):
                    before=len(events)
                    try:
                        operation()
                    except RuntimeError:
                        pass
                    else:
                        raise AssertionError('retired client was reused')
                    assert len(events)==before and not _futures
            assert replacement.create_client(AddTwoInts,'/add').wait_for_service(timeout_sec=0) is True
        """)

    def test_06(self):
        """Python teardown releases pending service callback captures without discarding sibling requests."""
        self.run_case("""
            class Payload:
                pass
            sibling=Node('sibling')
            keep=sibling.create_client(AddTwoInts,'/add').call_async(AddTwoInts.Request(a=10,b=20))
            keep_id=events[-1]['id']
            references=[]
            for cycle in range(40):
                node=Node('transient')
                future=node.create_client(AddTwoInts,'/add').call_async(AddTwoInts.Request(a=1,b=2))
                payload=Payload()
                references.append(weakref.ref(payload))
                future.add_done_callback(lambda result,capture=payload:None)
                node.destroy_node()
                del node,future,payload
            gc.collect()
            assert list(_futures)==[keep_id], 'retired requests retained or sibling removed'
            assert all(reference() is None for reference in references), 'retired callback captures retained'
            _dispatch_event({'kind':'service_response','id':keep_id,'response':{'sum':30}})
            assert keep.done() and keep.result().sum==30 and not _futures
        """)

    def test_07(self):
        """completed Python service futures release callbacks and preserve both results and errors."""
        self.run_case("""
            class Payload:
                pass
            node=Node('client')
            client=node.create_client(AddTwoInts,'/add')
            for response in ({'sum':9},{'error':'server unavailable'}):
                future=client.call_async(AddTwoInts.Request(a=4,b=5))
                key=events[-1]['id']
                payload=Payload()
                reference=weakref.ref(payload)
                calls=[]
                future.add_done_callback(lambda done,capture=payload:calls.append(done.done()))
                del payload
                _dispatch_event({'kind':'service_response','id':key,'response':response})
                gc.collect()
                assert future.done() and calls==[True] and not _futures
                assert reference() is None, 'completed callback capture retained'
                future.add_done_callback(lambda done:calls.append(done.done()))
                assert calls==[True,True]
                if 'error' in response:
                    try:
                        future.result()
                    except RuntimeError as error:
                        assert str(error)=='server unavailable'
                    else:
                        raise AssertionError('service error lost')
                else:
                    assert future.result().sum==9
        """)

    def test_08(self):
        """Python shutdown retires pending service requests across context restart."""
        self.run_case("""
            calls=[]
            for name in ('one','two'):
                node=Node(name)
                future=node.create_client(AddTwoInts,'/add').call_async(AddTwoInts.Request(a=1,b=2))
                future.add_done_callback(lambda done:calls.append(done.result().sum))
            keys=list(_futures)
            shutdown()
            assert not _nodes and not _futures
            init()
            replacement=Node('one')
            for key in keys:
                _dispatch_event({'kind':'service_response','id':key,'response':{'sum':3}})
            assert not calls and _nodes['/one'] is replacement
        """)

if __name__ == "__main__":
    print("Lab Python source under test:", SOURCE_ROOT, flush=True)
    unittest.main(verbosity=2)
