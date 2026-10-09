import test from 'node:test';
import assert from 'node:assert/strict';
import {Lab} from '../src/lab.js';
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
test('Ctrl+Z preserves publisher state; jobs, fg, bg and kill control stopped jobs',async()=>{
 const lab=new Lab(),t=lab.terminal(),logs=[];t.output=s=>logs.push(s);
 try{
  const cmd=`ros2 topic pub --rate 10 /jobs std_msgs/msg/String "{data: hello}"`;
  await t.execute(cmd);await sleep(130);assert.match(t.suspend(),/Stopped.*ros2 topic pub/);const n=logs.length;
  await sleep(240);assert.equal(logs.length,n);assert(!t.busy);assert.match(await t.execute('jobs'),/Stopped/);assert.equal(await t.execute('echo available'),'available');
  await t.execute('fg');assert(t.busy);await sleep(130);assert(logs.length>n);assert.equal(lab.processes.active().length,1);t.suspend();
  await t.execute('bg %1');assert(!t.busy);assert.match(await t.execute('jobs'),/Running/);lab.stop(t.id);assert.equal(lab.processes.active().length,1,'Ctrl+C at prompt leaves background job alive');
  await t.execute('kill %1');assert.equal(await t.execute('jobs'),'');assert.equal(lab.processes.active().length,0);
 }finally{lab.reset();}
});
test('wait loop repeats, suspension pauses it, and a matching subscriber releases it',async()=>{
 const lab=new Lab(),t=lab.terminal(),echo=lab.terminal(),logs=[];t.output=s=>logs.push(s);
 try{
  assert.match(await t.execute(`ros2 topic pub --once /waiting std_msgs/msg/String "{data: ready}"`),/Waiting/);
  await sleep(1100);assert.equal(logs.filter(s=>s.startsWith('Waiting')).length,1);t.suspend();const n=logs.length;await sleep(1100);assert.equal(logs.length,n);
  await echo.execute('ros2 topic echo /waiting std_msgs/msg/String --once');await t.execute('fg');await sleep(1100);assert(!t.busy);assert(!echo.busy);assert.equal(logs.filter(s=>s==='publisher: beginning loop').length,1);assert.equal(await t.execute('jobs'),'');
 }finally{lab.reset();}
});
