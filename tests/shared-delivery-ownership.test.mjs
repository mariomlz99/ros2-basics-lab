import test from 'node:test';
import assert from 'node:assert/strict';
import {load} from './source-root.mjs';
const {Runtime}=await load('runtime/graph.js');
const {RuntimeAdapter}=await load('runtime/adapter.js');
const {Lab}=await load('lab.js');
const {ROOT,setup}=await load('workspace.js');
const {pubsubFiles,launchSource}=await load('examples.js');
const {lessonChecks}=await load('course/checks.js');
const type='std_msgs/msg/String';
function fixture(){
 const runtime=new Runtime(),adapters=[];
 const make=node=>{const adapter=new RuntimeAdapter(runtime),messages=[];adapter.worker={postMessage:event=>messages.push(event),terminate(){}};adapter.handle({kind:'node',node});adapters.push(adapter);return {adapter,messages};};
 const {adapter:sender}=make('/sender'),{adapter:receiver,messages}=make('/receiver');
 const subscribe=(id='s',node='/receiver')=>receiver.handle({kind:'subscribe',node,id,topic:'/data',type});
 const publish=(data='hello')=>{sender.handle({kind:'publish',node:'/sender',topic:'/data',type,message:{data}});return runtime.sampleCounter;};
 const ack=sample=>receiver.handle({kind:'message_processed',sample});
 return {runtime,sender,receiver,messages,make,subscribe,publish,ack,close(){runtime.onChange=()=>{};for(const a of adapters)a.stop();runtime.reset();}};
}

test('invented and other-owner ACKs cannot create received evidence',()=>{
 const f=fixture();try{
  const sample=f.publish();f.ack(sample);f.ack(sample+1);
  assert.equal(f.runtime.programDeliveries.length,0);assert.equal(f.runtime.samples.get(sample).receivedOwners.size,0);
  const other=f.make('/other');other.adapter.handle({kind:'subscribe',node:'/other',id:'s',topic:'/data',type});
  const next=f.publish();assert.equal(other.messages.length,1);f.ack(next);
  assert.equal(f.runtime.programDeliveries.length,0);
 }finally{f.close();}
});
for(const order of ['python-publish-ack-done','cpp-ack-publish-done'])test(`${order} permits genuine delivery exactly once`,()=>{
 const f=fixture();try{
  f.subscribe();const sample=f.publish();assert.equal(f.messages[0].sample,sample);
  const publish=()=>f.receiver.handle({kind:'publish',node:'/receiver',topic:'/reply',type,message:{data:'reply'}});
  if(order.startsWith('python'))publish();f.ack(sample);if(order.startsWith('cpp'))publish();
  f.ack(sample);assert.equal(f.runtime.programDeliveries.length,1);
  f.receiver.handle({kind:'frame_done',subscription:'s'});f.ack(sample);
  assert.equal(f.runtime.programDeliveries.length,1);assert.deepEqual([...f.runtime.samples.get(sample).receivedBy],['/receiver']);
 }finally{f.close();}
});

test('two actual subscriptions sharing a sample consume separate receipts and credit only their nodes',()=>{
 const f=fixture();try{
  f.receiver.handle({kind:'node',node:'/second'});f.receiver.handle({kind:'node',node:'/uninvolved'});
  f.subscribe();f.subscribe('other','/second');const sample=f.publish();assert.equal(f.messages.length,2);
  f.ack(sample);assert.equal(f.runtime.samples.get(sample).receivedBy.size,1);
  f.ack(sample);f.ack(sample);
  assert.deepEqual([...f.runtime.samples.get(sample).receivedBy].sort(),['/receiver','/second']);assert.equal(f.runtime.programDeliveries.length,2);
 }finally{f.close();}
});

test('queued latest samples cannot ACK before dispatch and overwritten samples never count',()=>{
 const f=fixture();try{
  f.subscribe();const first=f.publish(),dropped=f.publish(),latest=f.publish();
  assert.equal(f.messages.length,1);f.ack(dropped);f.ack(latest);assert.equal(f.runtime.programDeliveries.length,0);
  f.ack(first);f.receiver.handle({kind:'frame_done',subscription:'s'});
  assert.equal(f.messages.length,2);assert.equal(f.messages[1].sample,latest);
  f.ack(first);f.ack(dropped);assert.equal(f.runtime.programDeliveries.length,1);
  f.ack(latest);assert.equal(f.runtime.programDeliveries.length,2);
 }finally{f.close();}
});
for(const lifecycle of ['unsubscribe','replace-subscription','destroy','stop','replace-worker','frame-done','reset'])test(`${lifecycle} invalidates a pending receipt`,()=>{
 const f=fixture();try{
  f.subscribe();const sample=f.publish(),record=f.runtime.samples.get(sample);
  if(lifecycle==='unsubscribe')f.receiver.handle({kind:'unsubscribe',id:'s'});
  if(lifecycle==='replace-subscription'){f.subscribe();assert.equal(f.runtime.listeners.size,1);}
  if(lifecycle==='destroy')f.receiver.handle({kind:'destroy',node:'/receiver'});
  if(lifecycle==='stop')f.receiver.stop();
  if(lifecycle==='replace-worker')f.receiver.worker={postMessage(){},terminate(){}};
  if(lifecycle==='frame-done')f.receiver.handle({kind:'frame_done',subscription:'s'});
  if(lifecycle==='reset'){
   f.runtime.reset();
   // Even restoration of the old sample/node cannot restore the removed
   // runtime subscription lifetime. Normal Reset does not restore either.
   f.runtime.addNode('/receiver');f.runtime.samples.set(sample,record);
  }
  f.ack(sample);assert.equal(f.runtime.programDeliveries.length,0);assert.equal(record.receivedOwners.size,0);
 }finally{f.close();}
});

test('failed postMessage never authorizes an ACK; resubscribe recovers',()=>{
 const f=fixture();try{
  f.subscribe();f.receiver.worker.postMessage=()=>{throw Error('delivery failed');};
  assert.throws(f.publish,/delivery failed/);f.ack(f.runtime.sampleCounter);assert.equal(f.runtime.programDeliveries.length,0);
  f.receiver.worker.postMessage=event=>f.messages.push(event);f.subscribe();const sample=f.publish();f.ack(sample);
  assert.equal(f.runtime.programDeliveries.length,1);
 }finally{f.close();}
});

// Real package/install/process/checker code; compilation and worker execution
// are explicit doubles. This is not an actual Python/C++ browser execution.
class Recorded extends RuntimeAdapter{run(){this.messages=[];this.worker={postMessage:event=>this.messages.push(event),terminate(){}};}}
for(const launched of [false,true])test(`${launched?'launch':'pub/sub'} checker rejects no-subscription ACK and accepts delivered callback`,async()=>{
 const lab=new Lab();try{
  lab.fs.mkdir(ROOT+'/src',true);lab.workspace.create('delivery_probe','ament_python',{dependencies:['rclpy','std_msgs']});
  const files={...pubsubFiles('python','delivery_probe'),'setup.py':setup('delivery_probe',['talker = delivery_probe.talker:main','listener = delivery_probe.listener:main'],['launch/system.launch.py']),'launch/system.launch.py':launchSource('delivery_probe')};
  for(const [name,content]of Object.entries(files)){const target=ROOT+'/src/delivery_probe/'+name;lab.fs.mkdir(target.slice(0,target.lastIndexOf('/')),true);lab.fs.write(target,content);}
  lab.builder.compile=async()=>({imports:[]});await lab.builder.build();lab.processes.factories=new Map([['python',async()=>Recorded]]);
  const processes=launched?(await lab.processes.launch('delivery_probe','system.launch.py')).processes:[await lab.processes.run('delivery_probe','talker'),await lab.processes.run('delivery_probe','listener')];
  const [sender,receiver]=processes;
  sender.adapter.handle({kind:'node',node:'/talker'});receiver.adapter.handle({kind:'node',node:'/listener'});
  sender.adapter.handle({kind:'publisher',node:'/talker',topic:'/topic',type});
  const publish=()=>{sender.adapter.handle({kind:'publish',node:'/talker',topic:'/topic',type,message:{data:'Hello'}});return lab.runtime.sampleCounter;};
  receiver.adapter.handle({kind:'message_processed',sample:publish()});
  assert.equal(receiver.adapter.subscriptions.size,0);assert.equal(receiver.adapter.messages.length,0);
  assert.equal(lessonChecks(lab,3)[1].passed,false);assert.equal(lessonChecks(lab,3)[2].passed,false);
  if(launched)assert.equal(lessonChecks(lab,5)[2].passed,false);
  receiver.adapter.handle({kind:'subscribe',node:'/listener',id:'real',topic:'/topic',type});
  const sample=publish();assert.equal(receiver.adapter.messages[0].sample,sample);
  receiver.adapter.handle({kind:'message_processed',sample});receiver.adapter.handle({kind:'frame_done',subscription:'real'});
  assert(lessonChecks(lab,3).every(check=>check.passed));if(launched)assert.equal(lessonChecks(lab,5)[2].passed,true);
  receiver.adapter.stop();assert.equal(lessonChecks(lab,3)[1].passed,false);if(launched)assert.equal(lessonChecks(lab,5)[2].passed,false);
 }finally{lab.reset();}
});

// Independent review regressions: evidence retention must not control transport,
// and synchronous graph observers must not orphan subscription registrations.
test('unrelated evidence-cache eviction preserves the latest queued payload without granting evidence',()=>{
 const f=fixture();try{
  f.subscribe();f.publish('first');const queued=f.publish('latest');
  assert.equal(f.messages.length,1);assert(f.receiver.mailbox.latest.has('s'));
  for(let i=0;i<110;i++)f.runtime.publish('/unrelated',type,{data:String(i)},{node:'/background'});
  assert.equal(f.runtime.samples.has(queued),false);
  f.receiver.handle({kind:'frame_done',subscription:'s'});
  assert.deepEqual(f.messages.map(event=>event.message.data),['first','latest']);
  f.ack(queued);assert.equal(f.runtime.programDeliveries.length,0);
  f.receiver.handle({kind:'frame_done',subscription:'s'});
  const fresh=f.publish('fresh');f.ack(fresh);
  assert.equal(f.messages.at(-1).message.data,'fresh');assert.equal(f.runtime.programDeliveries.length,1);
 }finally{f.close();}
});

test('cache eviction after dispatch revokes evidence without changing the delivered payload',()=>{
 const f=fixture();try{
  f.subscribe();const sample=f.publish('actual payload'),record=f.runtime.samples.get(sample);
  for(let i=0;i<110;i++)f.runtime.publish('/unrelated',type,{data:String(i)},{node:'/background'});
  f.ack(sample);assert.equal(record.receivedOwners.size,0);
  assert.equal(f.runtime.programDeliveries.length,0);assert.equal(f.messages[0].message.data,'actual payload');
 }finally{f.close();}
});

test('synchronous unsubscribe during registration disposes the returned listener',()=>{
 const f=fixture();try{
  let retired=false;
  f.runtime.onChange=()=>{
   if(retired||!f.runtime.listeners.size)return;
   retired=true;f.receiver.handle({kind:'unsubscribe',id:'s'});
  };
  f.subscribe();assert(retired);assert.equal(f.receiver.subscriptions.size,0);
  assert.equal(f.runtime.listeners.size,0);
  f.publish();assert.equal(f.messages.length,0);
 }finally{f.close();}
});

test('synchronous replacement during registration disposes only the superseded registration',()=>{
 const f=fixture();try{
  let replaced=false;
  f.runtime.onChange=()=>{
   if(replaced||!f.runtime.listeners.size)return;
   replaced=true;f.receiver.handle({kind:'subscribe',node:'/receiver',id:'s',topic:'/replacement',type});
  };
  f.subscribe();assert(replaced);assert.equal(f.receiver.subscriptions.size,1);assert.equal(f.runtime.listeners.size,1);
  assert.equal([...f.runtime.listeners.values()][0].topic,'/replacement');
  f.publish();assert.equal(f.messages.length,0);
  f.runtime.publish('/replacement',type,{data:'current'},{node:'/sender',owner:f.sender});
  f.ack(f.runtime.sampleCounter);assert.equal(f.messages[0].message.data,'current');assert.equal(f.runtime.programDeliveries.length,1);
 }finally{f.close();}
});

for(const request of ['unsubscribe','subscribe'])test(`replacement created during ${request} disposal retains its own slot and listener`,()=>{
 const f=fixture();try{
  f.subscribe();const old=f.publish('old');
  let replaced=false;
  f.runtime.onChange=()=>{
   if(replaced||f.runtime.listeners.size)return;
   replaced=true;f.receiver.handle({kind:'subscribe',node:'/receiver',id:'s',topic:'/newest',type});
  };
  if(request==='unsubscribe')f.receiver.handle({kind:'unsubscribe',id:'s'});
  else f.receiver.handle({kind:'subscribe',node:'/receiver',id:'s',topic:'/superseded_request',type});
  assert(replaced);assert.equal(f.receiver.subscriptions.size,1);assert.equal(f.runtime.listeners.size,1);
  assert.equal([...f.runtime.listeners.values()][0].topic,'/newest');
  f.ack(old);assert.equal(f.runtime.programDeliveries.length,0);
  f.runtime.publish('/newest',type,{data:'latest registration'},{node:'/sender',owner:f.sender});
  f.ack(f.runtime.sampleCounter);assert.equal(f.messages.at(-1).message.data,'latest registration');assert.equal(f.runtime.programDeliveries.length,1);
 }finally{f.close();}
});
