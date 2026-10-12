import test from 'node:test';
import assert from 'node:assert/strict';
import {Lab} from '../src/lab.js';
import {RuntimeAdapter} from '../src/runtime/adapter.js';

test('same-node endpoints count individually and survive independent destruction',async()=>{
 const lab=new Lab(),r=lab.runtime,t=lab.terminal(),a=new RuntimeAdapter(r),b=new RuntimeAdapter(r);
 const events=[];
 try{
  for(const adapter of [a,b]){
   adapter.worker={postMessage:d=>events.push(d),terminate(){}};
   adapter.handle({kind:'node',node:'/peer'});
   for(let id=1;id<=2;id++){
    adapter.handle({kind:'publisher',id,node:'/peer',topic:'/shared',type:'std_msgs/msg/String'});
    adapter.handle({kind:'subscribe',id,node:'/peer',topic:'/shared',type:'std_msgs/msg/String'});
   }
  }
  assert.equal(r.topics.get('/shared').publishers.size,4);
  assert.equal(r.topics.get('/shared').subscribers.size,4);
  const verbose=await t.execute('ros2 topic info /shared -v');
  assert.equal(verbose.split('\n').filter(line=>line==='/peer').length,8);
  assert.match(await t.execute('ros2 node info /peer'),/Publishers:\n[\s\S]*\/shared: std_msgs\/msg\/String/);
  a.handle({kind:'unpublisher',id:1});a.handle({kind:'unsubscribe',id:1});
  // Repeated disposal must not affect the peer's identically numbered endpoint.
  a.handle({kind:'unpublisher',id:1});a.handle({kind:'unsubscribe',id:1});
  assert.equal(r.topics.get('/shared').publishers.size,3);
  assert.equal(r.topics.get('/shared').subscribers.size,3);
  a.handle({kind:'publish',node:'/peer',topic:'/shared',type:'std_msgs/msg/String',message:{data:'survivor'}});
  assert.equal(events.filter(d=>d.kind==='message').length,3);
  a.stop();assert.equal(a.publishers.size,0);
  assert.equal(r.topics.get('/shared').publishers.size,2);
  assert.equal(r.topics.get('/shared').subscribers.size,2);
  b.stop();assert.equal(r.topics.has('/shared'),false);assert.equal(r.listeners.size,0);
 }finally{a.stop();b.stop();lab.reset();}
});

test('rejected publication does not leave an empty topic or evidence',()=>{
 const lab=new Lab();
 try{
  assert.throws(()=>lab.runtime.publish('/invalid','std_msgs/msg/String',{data:12},{node:'/bad'}),/string/);
  assert.equal(lab.runtime.topics.has('/invalid'),false);
  assert.equal(lab.runtime.samples.size,0);
 }finally{lab.reset();}
});

test('destroying a service removes discovery and rejects in-flight calls immediately',async()=>{
 const lab=new Lab(),r=lab.runtime,a=new RuntimeAdapter(r);
 try{
  a.worker={postMessage(){},terminate(){}};a.handle({kind:'node',node:'/server'});
  for(const nodeDestruction of [false,true]){
   a.handle({kind:'service',node:'/server',name:'/ping',type:'std_srvs/srv/Trigger',id:1});
   const call=r.callService('/ping','std_srvs/srv/Trigger',{});
   const rejection=assert.rejects(call,/stopped/);
   a.handle(nodeDestruction?{kind:'destroy',node:'/server'}:{kind:'unservice',id:1});
   assert.equal(r.services.size,0);assert.equal(a.pendingServices.size,0);
   await rejection;
  }
 }finally{a.stop();lab.reset();}
});

test('resetting a running timer replaces its interval without leaking one',()=>{
 const lab=new Lab(),a=new RuntimeAdapter(lab.runtime);
 try{
  a.worker={postMessage(){},terminate(){}};a.handle({kind:'node',node:'/timer'});
  for(let i=0;i<10;i++)a.handle({kind:'timer',node:'/timer',period:1,id:1});
  assert.equal(lab.runtime.jobs.size,1);a.stop();assert.equal(lab.runtime.jobs.size,0);
 }finally{a.stop();lab.reset();}
});

test('Reset clears modeled daemon endpoints as well as learner nodes',()=>{
 const lab=new Lab();lab.runtime.startDaemon();lab.runtime.reset();
 assert.equal(lab.runtime.daemonRunning,false);
 for(const topic of lab.runtime.topics.values())assert.equal(topic.publishers.size,0);
 lab.reset();
});
