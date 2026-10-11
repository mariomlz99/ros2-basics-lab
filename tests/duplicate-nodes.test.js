import test from 'node:test';
import assert from 'node:assert/strict';
import {Lab} from '../src/lab.js';
import {RuntimeAdapter} from '../src/runtime/adapter.js';
test('duplicate node names preserve separate endpoints, messages, parameters and cleanup',async()=>{
 const lab=new Lab(),r=lab.runtime,t=lab.terminal(),workers=[],adapters=[];
 try{
  for(let i=0;i<2;i++){
   const a=new RuntimeAdapter(r),events=[];a.worker={postMessage:d=>events.push(d),terminate(){}};adapters.push(a);workers.push(events);
   a.handle({kind:'node',node:'/same_name'});a.handle({kind:'publisher',node:'/same_name',topic:'/shared',type:'std_msgs/msg/String'});
   a.handle({kind:'subscribe',id:1,node:'/same_name',topic:'/shared',type:'std_msgs/msg/String'});
   a.handle({kind:'parameter_declare',node:'/same_name',name:'prefix',value:'node'+i});
  }
  assert.equal(r.nodes.size,2);assert.equal(r.topics.get('/shared').publishers.size,2);assert.equal(r.topics.get('/shared').subscribers.size,2);
  assert.equal(await t.execute('ros2 node list --no-daemon'),'WARNING: Be aware that there are nodes in the graph that share an exact name, which can have unintended side effects.\n/same_name\n/same_name');
  const info=await t.execute('ros2 topic info /shared --verbose');assert.match(info,/Publisher count: 2\nSubscription count: 2/);assert(!info.includes('#'));
  for(const a of adapters)a.handle({kind:'publish',node:'/same_name',topic:'/shared',type:'std_msgs/msg/String',message:{data:'hello'}});
  assert(workers.every(events=>events.some(e=>e.kind==='message')));
  adapters[0].stop();assert.equal(r.nodes.size,1);assert.equal(r.topics.get('/shared').publishers.size,1);assert.equal(r.topics.get('/shared').subscribers.size,1);
  assert.equal(await t.execute('ros2 node list'),'/same_name');assert.match(await t.execute('ros2 node info /same_name'),/\/shared: std_msgs\/msg\/String/);
  assert.equal(await t.execute('ros2 param get /same_name prefix'),'"node1"');await t.execute('ros2 param set /same_name prefix changed');
  assert.equal(r.parameters.get([...adapters[1].nodes][0]).get('prefix'),'changed');
  assert.match(await t.execute('ros2 param list /same_name'),/^\/same_name\n/);
  adapters[1].stop();assert.equal(r.nodes.size,0);assert.equal(r.nodeNames.size,0);assert.equal(r.listeners.size,0);assert.equal(r.parameters.size,0);
 }finally{for(const a of adapters)a.stop();lab.reset();}
});
