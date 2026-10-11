import test from 'node:test';
import assert from 'node:assert/strict';
import {Lab} from '../src/lab.js';
import {Robot} from '../src/playground/robot.js';
import {WHEELS} from '../src/playground/sensors.js';
import {Playground} from '../src/playground/playground.js';
import {dynamicTransforms,staticTransforms} from '../src/playground/frames.js';
const canvas=()=>({width:400,height:320,getContext:()=>new Proxy({},{get:()=>()=>{}})});
const close=(a,b)=>assert(Math.abs(a-b)<1e-9,`${a} != ${b}`);
test('wheel TF obeys forward, reverse and positive-yaw differential drive conventions',()=>{
 const robot=new Robot();robot.command(.09,0);robot.step(1);
 close(robot.leftWheel,1);close(robot.rightWheel,1);
 let tf=dynamicTransforms(robot,{sec:0,nanosec:0}).transforms;
 assert.equal(tf[1].child_frame_id,'left_wheel_link');assert.equal(tf[2].child_frame_id,'right_wheel_link');
 close(tf[1].transform.translation.y,WHEELS.track/2);close(tf[2].transform.translation.y,-WHEELS.track/2);
 close(tf[1].transform.rotation.y,Math.sin(.5));assert(!staticTransforms({}).transforms.some(t=>t.child_frame_id.includes('wheel')));
 robot.reset();robot.command(-.09,0);robot.step(1);close(robot.leftWheel,-1);close(robot.rightWheel,-1);
 robot.reset();robot.command(0,.4);robot.step(1);assert(robot.leftWheel<0&&robot.rightWheel>0);close(robot.leftWheel,-robot.rightWheel);close(robot.yaw,.4);
 robot.command(0,0);const angles=[robot.leftWheel,robot.rightWheel];robot.step(1);assert.deepEqual([robot.leftWheel,robot.rightWheel],angles);
 robot.reset();assert.deepEqual([robot.x,robot.y,robot.yaw,robot.leftWheel,robot.rightWheel],[0,0,0,0,0]);
});
test('over-limit Twist is saturated without crashing publishers or leaking graph state',async()=>{
 const prior=globalThis.ImageData;globalThis.ImageData=class{};
 const lab=new Lab(),t=lab.terminal(),scene=new Playground(lab.runtime,canvas(),canvas(),canvas());
 try{
  scene.start();await t.execute("ros2 topic pub --once /cmd_vel geometry_msgs/msg/Twist '{linear: {x: 3}, angular: {z: -8}}'");
  assert.equal(scene.robot.linear,2);assert.equal(scene.robot.angular,-3);
  await new Promise(r=>setTimeout(r,150));assert(!t.busy);assert.equal(lab.processes.active().length,0);assert.deepEqual([...lab.runtime.nodes],['/playground']);
  await t.execute("ros2 topic pub --once /cmd_vel geometry_msgs/msg/Twist '{linear: {y: 1}, angular: {x: 1}}'");
  assert.equal(scene.robot.linear,0);assert.equal(scene.robot.angular,0);lab.stop(t.id);
  for(let i=0;i<30;i++){scene.stop();scene.start();scene.start();scene.stop();assert.equal(lab.runtime.nodes.size,0);assert.equal(lab.runtime.listeners.size,0);assert.equal(lab.runtime.retained.size,0);assert.equal(lab.runtime.topics.size,2);}
 }finally{scene.stop();lab.reset();globalThis.ImageData=prior;}
});
test('conflicting sensor/command types fail before simulator startup and recover cleanly',async()=>{
 const prior=globalThis.ImageData;globalThis.ImageData=class{};
 const lab=new Lab(),t=lab.terminal(),scene=new Playground(lab.runtime,canvas(),canvas(),canvas());
 try{for(const topic of ['/cmd_vel','/scan','/tf']){
  await t.execute(`ros2 topic pub ${topic} std_msgs/msg/String '{data: wrong}'`);
  assert.throws(()=>scene.start(),/Cannot start playground/);assert(!lab.runtime.nodes.has('/playground'));assert(!scene.timer);
  lab.stop(t.id);scene.start();scene.stop();assert.equal(lab.runtime.nodes.size,0);assert.equal(lab.runtime.jobs.size,0);
 }}finally{scene.stop();lab.reset();globalThis.ImageData=prior;}
});
