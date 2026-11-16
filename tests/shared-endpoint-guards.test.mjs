import test from 'node:test';
import assert from 'node:assert/strict';
import {load} from './source-root.mjs';
const {Runtime}=await load('runtime/graph.js');
const {RuntimeAdapter}=await load('runtime/adapter.js');
const type='std_msgs/msg/String';
function fixture(){
 const runtime=new Runtime(),messages=[],adapter=new RuntimeAdapter(runtime);
 adapter.worker={postMessage:message=>messages.push(message),terminate(){}};
 return {runtime,adapter,messages};
}

for(const state of ['never-created','destroyed','stopped']){
 test(`bridge rejects ${state} node operations before graph mutation`,()=>{
  const {runtime:r,adapter:a}=fixture();
  try{
   if(state!=='never-created')a.handle({kind:'node',node:'/old'});
   if(state==='destroyed')a.handle({kind:'destroy',node:'/old'});
   if(state==='stopped')a.stop();
   for(const operation of [
    {kind:'publisher',id:'p',topic:'/ghost',type},
    {kind:'subscribe',id:'s',topic:'/ghost',type},
    {kind:'timer',id:'t',period:.05},
    {kind:'publish',topic:'/ghost',type,message:{data:'ghost'}},
    {kind:'service',id:'service',name:'/ghost_service',type:'example_interfaces/srv/AddTwoInts'}
   ])assert.throws(()=>a.handle({...operation,node:'/old'}),/live ROS node/,operation.kind);
   assert.equal(r.nodes.size,0);assert.equal(r.listeners.size,0);assert.equal(r.jobs.size,0);
   assert.equal(r.services.size,0);assert.equal(r.samples.size,0);assert.equal(r.topics.has('/ghost'),false);
   assert.equal(a.publishers.size+a.subscriptions.size+a.jobs.size,0);
  }finally{a.stop();r.reset();}
 });
}

test('invalid service client cannot dispatch a request or earn service evidence',async()=>{
 const {runtime:r,adapter:a,messages}=fixture();let calls=0;
 r.services.set('/sum',{type:'example_interfaces/srv/AddTwoInts',handler:async()=>{calls++;return {sum:3};}});
 try{
  a.handle({kind:'service_call',node:'/missing',id:9,name:'/sum',type:'example_interfaces/srv/AddTwoInts',request:{a:1,b:2}});
  await new Promise(resolve=>setTimeout(resolve,0));
  assert.equal(calls,0);assert.equal(r.serviceCalls.length,0);
  assert.match(messages[0]?.response?.error??'',/live ROS node/);
 }finally{a.stop();r.reset();}
});

test('an adapter cannot destroy a node owned by another program',()=>{
 const {runtime:r,adapter:owner}=fixture();
 const foreign=new RuntimeAdapter(r);foreign.worker={postMessage(){},terminate(){}};
 try{
  owner.handle({kind:'node',node:'/victim'});
  owner.handle({kind:'publisher',node:'/victim',topic:'/kept',id:'p',type});
  foreign.handle({kind:'destroy',node:'/victim'});
  assert.equal(r.nodes.size,1);assert.equal(owner.nodes.size,1);
  assert.equal(r.topics.get('/kept')?.publishers.size,1);
  owner.handle({kind:'publish',node:'/victim',topic:'/kept',type,message:{data:'still alive'}});
 }finally{foreign.stop();owner.stop();r.reset();}
});

test('live sibling and recreated nodes retain working endpoints; Stop cleans all resources',()=>{
 const {runtime:r,adapter:a,messages}=fixture();
 try{
  for(const node of ['/one','/two']){
   a.handle({kind:'node',node});
   a.handle({kind:'publisher',node,id:'p'+node,topic:node,type});
   a.handle({kind:'subscribe',node,id:'s'+node,topic:node,type});
   a.handle({kind:'timer',node,id:'t'+node,period:60});
  }
  a.handle({kind:'destroy',node:'/one'});
  a.handle({kind:'publish',node:'/two',topic:'/two',type,message:{data:'sibling'}});
  assert(messages.some(m=>m.kind==='message'&&m.message.data==='sibling'));
  assert.equal(a.publishers.size,1);assert.equal(a.subscriptions.size,1);assert.equal(a.jobs.size,1);
  a.handle({kind:'node',node:'/one'});
  a.handle({kind:'publisher',node:'/one',id:'fresh',topic:'/fresh',type});
  a.handle({kind:'publish',node:'/one',topic:'/fresh',type,message:{data:'new'}});
  assert.equal(r.programPublications.get(a).get('/fresh').message.data,'new');
  a.stop();a.stop();
  assert.equal(r.nodes.size+r.listeners.size+r.jobs.size,0);
  assert.equal(a.publishers.size+a.subscriptions.size+a.jobs.size,0);
 }finally{a.stop();r.reset();}
});
