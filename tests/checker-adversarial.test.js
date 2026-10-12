import test from 'node:test';
import assert from 'node:assert/strict';
import {Lab} from '../src/lab.js';
import {ROOT} from '../src/workspace.js';
import {pubsubFiles} from '../src/examples.js';
import {RuntimeAdapter} from '../src/runtime/adapter.js';
import {changedParameterOutput} from '../src/runtime/parameter-evidence.js';
import {lessonChecks} from '../src/course/checks.js';
// These tests isolate checker state transitions. course-audit.mjs separately
// executes the visible exercises through real Python and C++ browser workers.
class RecordedProgram extends RuntimeAdapter{
 run(){this.worker={postMessage(){},terminate(){}};}
}
test('observed parameter values may overlap as in the visible Hello World to Hello exercise',()=>{
 assert(changedParameterOutput({data:'Hello World: 0'},{data:'Hello: 1'},'Hello World','Hello'));
 assert(changedParameterOutput({data:'Hello: 0'},{data:'Hello World: 1'},'Hello','Hello World'));
 assert(!changedParameterOutput({data:'Hello: constant'},{data:'Hello: constant'},'Hello World','Hello'));
});
async function fixture(){
 const lab=new Lab();lab.fs.mkdir(ROOT+'/src',true);
 lab.workspace.create('py_pubsub','ament_python',{dependencies:['rclpy','std_msgs']});
 for(const [path,source] of Object.entries(pubsubFiles('python')))lab.fs.write(ROOT+'/src/py_pubsub/'+path,source);
 lab.builder.compile=async()=>({imports:[]});await lab.builder.build();
 lab.processes.factories=new Map([['python',async()=>RecordedProgram]]);
 return lab;
}
async function program(lab,executable,node){const p=await lab.processes.run('py_pubsub',executable);p.adapter.handle({kind:'node',node});return p;}
function publish(p,text,topic='/alternate'){p.adapter.handle({kind:'publisher',node:'/sender',topic,type:'std_msgs/msg/String'});p.adapter.handle({kind:'publish',node:'/sender',topic,type:'std_msgs/msg/String',message:{data:text}});}
function delivered(lab,p,s){publish(p,'data');s.adapter.handle({kind:'message_processed',sample:lab.runtime.sampleCounter});}
test('CLI pub/echo and empty executions cannot pass the program communication lesson',async()=>{
 const lab=await fixture(),a=lab.terminal(),b=lab.terminal();
 try{
  await a.execute("ros2 topic pub /fake std_msgs/msg/String '{data: Hello}'");await b.execute('ros2 topic echo /fake');
  assert.deepEqual(lessonChecks(lab,3).map(c=>c.passed),[true,false,false]);
  await lab.processes.run('py_pubsub','talker');await lab.processes.run('py_pubsub','listener');
  assert.deepEqual(lessonChecks(lab,3).map(c=>c.passed),[true,false,false]);
 }finally{lab.reset();}
});
test('valid alternative names pass, while stopped runs and edited source invalidate delivery evidence',async()=>{
 const lab=await fixture();
 try{
  const p=await program(lab,'talker','/sender'),s=await program(lab,'listener','/receiver');
  s.adapter.handle({kind:'subscribe',id:1,node:'/receiver',topic:'/alternate',type:'std_msgs/msg/String'});
  delivered(lab,p,s);assert(lessonChecks(lab,3).every(c=>c.passed));
  for(let i=0;i<120;i++)lab.runtime.log('/sender','later output');
  assert(lessonChecks(lab,3).every(c=>c.passed),'later output must not erase completed delivery');
  const path=ROOT+'/src/py_pubsub/py_pubsub/talker.py',original=lab.fs.read(path);lab.fs.write(path,original+'\n# changed');
  assert.equal(lessonChecks(lab,3)[1].passed,false);lab.fs.write(path,original);
  lab.processes.stop(s.id);assert.equal(lessonChecks(lab,3)[1].passed,false);
  await program(lab,'listener','/new_receiver');assert.equal(lessonChecks(lab,3)[1].passed,false,'a rerun needs its own delivery');
 }finally{lab.reset();assert.equal(lab.runtime.programDeliveries.length,0);assert.equal(lab.processes.runs.size,0);}
});
test('parameter evidence requires a payload change from the same program, not a constant or CLI output',async()=>{
 const lab=await fixture();
 try{
  const p=await program(lab,'talker','/sender');p.adapter.handle({kind:'parameter_declare',node:'/sender',name:'prefix',value:'Old'});
  publish(p,'New: constant');lab.runtime.setParameter('/sender','prefix','New');publish(p,'New: constant');
  assert.equal(lessonChecks(lab,4)[2].passed,false);
  lab.runtime.setParameter('/sender','prefix','Old');publish(p,'Old: 1');
  lab.runtime.parameterChanges=[];lab.runtime.setParameter('/sender','prefix','Fresh');
  lab.runtime.publish('/alternate','std_msgs/msg/String',{data:'Fresh: 2'},{node:'/cli'});
  assert.equal(lessonChecks(lab,4)[2].passed,false);publish(p,'Fresh: 2');
  assert.equal(lessonChecks(lab,4)[2].passed,true);
  lab.processes.stop(p.id);assert.equal(lessonChecks(lab,4)[2].passed,true,'later custom-message work can stop the parameter program');
  await program(lab,'talker','/sender');assert.equal(lessonChecks(lab,4)[2].passed,false,'previous-run evidence is not reusable');
 }finally{lab.reset();}
});
test('service check needs a real program owner, program client and CLI result; late responses cannot survive reset',async()=>{
 const lab=await fixture(),r=lab.runtime;
 try{
  const server=await program(lab,'talker','/server'),client=await program(lab,'listener','/client');
  r.services.set('/sum',{owner:server.adapter,type:'example_interfaces/srv/AddTwoInts',handler:async({a,b})=>({sum:a+b})});
  await r.callService('/sum','example_interfaces/srv/AddTwoInts',{a:7,b:8});
  assert.equal(lessonChecks(lab,5)[0].passed,false);
  await r.callService('/sum','example_interfaces/srv/AddTwoInts',{a:2,b:3},{caller:client.adapter});
  assert.equal(lessonChecks(lab,5)[0].passed,true);
  let resolve;r.services.set('/late',{type:'example_interfaces/srv/AddTwoInts',handler:()=>new Promise(r=>resolve=r)});
  const pending=r.callService('/late','example_interfaces/srv/AddTwoInts',{a:1,b:2});r.reset();resolve({sum:3});
  await assert.rejects(pending,/stopped before responding/);assert.equal(r.serviceCalls.length,0);
 }finally{lab.reset();}
});
test('a parameter named publish_rate has no invented global range restriction',async()=>{
 const lab=await fixture();try{
  const p=await program(lab,'talker','/sender');p.adapter.handle({kind:'parameter_declare',node:'/sender',name:'publish_rate',value:2,value_type:3});
  lab.runtime.setParameter('/sender','publish_rate',25);assert.equal(lab.runtime.parameters.get('/sender').get('publish_rate'),25);
 }finally{lab.reset();}
});
test('restarting the native handoff lesson clears a later export acknowledgement',async()=>{
 const {snapshotLesson,restoreLesson}=await import('../src/course/checks.js');
 const lab=new Lab();try{
  const before=snapshotLesson(lab);lab.exported=true;assert(lessonChecks(lab,6)[0].passed);
  restoreLesson(lab,before);assert.equal(lessonChecks(lab,6)[0].passed,false);
 }finally{lab.reset();}
});
