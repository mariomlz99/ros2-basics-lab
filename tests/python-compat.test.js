import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {InterfaceRegistry} from '../src/interfaces/registry.js';
const compat=readFileSync(new URL('../src/python/compat.py',import.meta.url),'utf8');
function python(code){
 const fixture=`import sys, types, json\nevents=[]\nsys.modules['js']=types.SimpleNamespace(emit_json=lambda s:events.append(json.loads(s)))\n`+compat+`\n_install_interfaces(json.loads(${JSON.stringify(JSON.stringify(new InterfaceRegistry().schema()))}))\ninit()\n`+code;
 const result=spawnSync('python3',['-c',fixture],{encoding:'utf8',timeout:10000});
 assert.equal(result.status,0,result.stderr);
}
test('destroy_timer accepts the returned timer, stops callbacks and reports ownership',()=>python(`
node=Node('timers')
ticks=[]
timer=node.create_timer(0.1,lambda:ticks.append(1))
key=events[-1]['id']
_dispatch_timer(key)
assert ticks==[1]
assert node.destroy_timer(timer) is True
_dispatch_timer(key)
assert ticks==[1]
assert node.destroy_timer(timer) is False
assert not _timers
assert events[-1]=={'kind':'timer_cancel','id':key}
timer=node.create_timer(0.1,lambda:ticks.append(2))
key=events[-1]['id']
timer.cancel()
_dispatch_timer(key)
assert ticks==[1]
assert node.destroy_timer(timer) is True
`));
test('nested arrays retain generated ROS types on receipt and can be republished',()=>python(`
from nav_msgs.msg import Path
from geometry_msgs.msg import PoseStamped
from builtin_interfaces.msg import Time
node=Node('nested')
pub=node.create_publisher(PoseStamped,'/pose',10)
def receive(message):
    assert isinstance(message.poses[0],PoseStamped)
    assert isinstance(message.poses[0].header.stamp,Time)
    pub.publish(message.poses[0])
sub=node.create_subscription(Path,'/path',receive,10)
pose=PoseStamped()
pose.pose.position.x=4.5
_dispatch_message(sub,json.dumps(_payload(Path(poses=[pose]))),1)
assert [e for e in events if e['kind']=='publish'][0]['message']['pose']['position']['x']==4.5
`));
test('nested service request and response restore typed fields',()=>python(`
from nav_msgs.srv import GetPlan
from nav_msgs.msg import Path
from geometry_msgs.msg import PoseStamped
node=Node('server')
def callback(request,response):
    assert isinstance(request.start,PoseStamped)
    response.plan=Path(poses=[request.start,request.goal])
    return response
service=node.create_service(GetPlan,'/plan',callback)
request=GetPlan.Request()
request.start.pose.position.x=3.0
_service_request(service,'token',json.dumps(_payload(request)))
client=node.create_client(GetPlan,'/plan')
future=client.call_async(request)
key=events[-1]['id']
payload=[e for e in events if e['kind']=='service_result'][-1]['response']
_service_response(key,json.dumps(payload))
assert isinstance(future.result().plan,Path)
assert isinstance(future.result().plan.poses[0],PoseStamped)
assert future.result().plan.poses[0].pose.position.x==3.0
`));
test('service destruction removes the callback and rejects repeated disposal',()=>python(`
from std_srvs.srv import Trigger
node=Node('server')
service=node.create_service(Trigger,'/ping',lambda req,res:res)
assert node.destroy_service(service) is True
assert service not in _services
assert events[-1]=={'kind':'unservice','id':service}
assert node.destroy_service(service) is False
`));
