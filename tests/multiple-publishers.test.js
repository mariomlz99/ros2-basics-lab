import test from 'node:test';
import assert from 'node:assert/strict';
import {Lab} from '../src/lab.js';
const wait=ms=>new Promise(r=>setTimeout(r,ms));
test('publishers on separate terminals share a topic and hz measures their combined stream',async()=>{
 const lab=new Lab(),a=lab.terminal(),b=lab.terminal(),echo=lab.terminal(),hz=lab.terminal(),output=[],rates=[];
 echo.output=s=>output.push(s);hz.output=s=>rates.push(s);
 try{
  await echo.execute('ros2 topic echo /shared std_msgs/msg/String');await hz.execute('ros2 topic hz /shared');
  await a.execute("ros2 topic pub -r 3 /shared std_msgs/msg/String '{data: first}'");await b.execute("ros2 topic pub -r 7 /shared std_msgs/msg/String '{data: second}'");
  assert.match(await lab.terminal().execute('ros2 topic info /shared'),/Publisher count: 2\nSubscription count: 2/);
  await wait(2200);assert(output.some(s=>s.includes('first')));assert(output.some(s=>s.includes('second')));
  const rate=Number(/average rate: ([\d.]+)/.exec(rates.at(-1))[1]);assert(rate>8&&rate<12,rate);
  lab.close(a.id);assert.equal(lab.runtime.topics.get('/shared').publishers.size,1);const start=output.length;await wait(400);assert(output.length>start);assert(output.slice(start).every(s=>s.includes('second')));
 }finally{lab.reset();assert.equal(lab.runtime.nodes.size,0);assert.equal(lab.runtime.jobs.size,0);assert.equal(lab.runtime.listeners.size,0);}
});
test('two background publishers in one terminal have independent endpoints and cleanup',async()=>{
 const lab=new Lab(),t=lab.terminal(),observer=lab.terminal();
 try{
  await t.execute("ros2 topic pub -r 2 /shared std_msgs/msg/String '{data: first}'");t.suspend();await t.execute('bg');
  await t.execute("ros2 topic pub -r 3 /shared std_msgs/msg/String '{data: second}'");t.suspend();await t.execute('bg');
  assert.equal(lab.runtime.topics.get('/shared').publishers.size,2);assert.equal(lab.runtime.nodes.size,2);
  await t.execute('kill %1');assert.equal(lab.runtime.topics.get('/shared').publishers.size,1);assert.equal(lab.processes.active().length,1);
  await assert.rejects(()=>observer.execute("ros2 topic pub /shared std_msgs/msg/Int32 '{data: 4}'"),/type mismatch/);assert(!observer.busy);assert.equal(lab.processes.active().length,1);
  lab.close(t.id);assert(!lab.runtime.topics.has('/shared'));assert.equal(lab.runtime.nodes.size,0);assert.equal(lab.runtime.jobs.size,0);
 }finally{lab.reset();}
});
test('two background echoes in one terminal stay independently subscribed',async()=>{
 const lab=new Lab(),t=lab.terminal();
 try{
  for(let i=0;i<2;i++){await t.execute('ros2 topic echo /shared std_msgs/msg/String');t.suspend();await t.execute('bg');}
  assert.equal(lab.runtime.topics.get('/shared').subscribers.size,2);await t.execute('kill %1');assert.equal(lab.runtime.topics.get('/shared').subscribers.size,1);
  lab.close(t.id);assert.equal(lab.runtime.listeners.size,0);assert.equal(lab.runtime.nodes.size,0);
 }finally{lab.reset();}
});
