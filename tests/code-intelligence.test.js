import test from 'node:test';import assert from 'node:assert/strict';
import {codeCompletions,callSignature} from '../src/code-intelligence.js';
import {BUILTIN} from '../src/interfaces/builtin.js';
const suggest=(code,language='python',registry)=>codeCompletions(code,code.length,language,registry).options;
test('Python NumPy aliases, from imports, array members and call help are local',()=>{
 assert(suggest('import numpy as np\nnp.con').some(o=>o.label==='concatenate'));
 assert.match(callSignature('import numpy as np\nnp.concatenate(',38,'python')?.signature||'',/concatenate\(arrays/);
 assert(suggest('from numpy import conc').some(o=>o.label==='concatenate'));
 assert(suggest('import numpy as n\na = n.array([1])\na.sh').some(o=>o.label==='shape'));
 const code='from numpy import concatenate as join\njoin(';assert.match(callSignature(code,code.length,'python').signature,/concatenate/);
});
test('canonical ROS messages support imports, aliases, fields and nested fields in Python and C++',()=>{
 for(const [type,record] of Object.entries(BUILTIN)){
  if(!type.includes('/msg/'))continue;const [pkg,kind,name]=type.split('/');
  assert(suggest(`from ${pkg}.${kind} import `).some(o=>o.label===name),type);
  for(const language of ['python','cpp']){
   const code=language==='python'?`from ${pkg}.${kind} import ${name} as Message\nmsg = Message()\nmsg.`:`${pkg}::${kind}::${name} msg;\nmsg.`;
   assert.deepEqual(suggest(code,language).map(o=>o.label),[...record.fields,...record.constants??[]].map(f=>f.name),language+' '+type);
  }
 }
 assert.deepEqual(suggest('from geometry_msgs.msg import Twist\nmsg = Twist()\nmsg.linear.').map(o=>o.label),['x','y','z']);
 assert.deepEqual(suggest('geometry_msgs::msg::Twist::SharedPtr msg;\nmsg->angular.','cpp').map(o=>o.label),['x','y','z']);
 assert.deepEqual(suggest('import geometry_msgs.msg as gm\nmsg = gm.Twist()\nmsg.linear.').map(o=>o.label),['x','y','z']);
 assert.deepEqual(suggest('auto msg = std::make_shared<geometry_msgs::msg::Twist>();\nmsg->linear.','cpp').map(o=>o.label),['x','y','z']);
 assert(suggest('#include <geometry_msgs/msg/tw','cpp').some(o=>o.label==='geometry_msgs/msg/twist.hpp'));
 assert(suggest('std_msgs::msg::','cpp').some(o=>o.label==='String'));
});
test('service sections and dynamic workspace messages use registry fields',()=>{
 assert.deepEqual(suggest('from example_interfaces.srv import AddTwoInts\nreq = AddTwoInts.Request()\nreq.').map(o=>o.label),['a','b']);
 assert.deepEqual(suggest('example_interfaces::srv::AddTwoInts::Response response;\nresponse.','cpp').map(o=>o.label),['sum']);
 const registry=new Map(Object.entries({...BUILTIN,'custom/msg/Reading':{fields:[{name:'value',type:'float64'}]}}));
 assert.equal(suggest('from custom.msg import Reading\nx = Reading()\nx.','python',registry)[0].label,'value');
});
