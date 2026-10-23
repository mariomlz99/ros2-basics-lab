import test from 'node:test';
import assert from 'node:assert/strict';
import {OdometryTrace} from '../src/playground/odometry-trace.js';
import {odometry} from '../src/playground/frames.js';
import {Robot} from '../src/playground/robot.js';
import {Lab} from '../src/lab.js';
import {odometryExercise} from '../src/playground/odometry-lesson.js';
const near=(a,b,tolerance=1e-9)=>assert(Math.abs(a-b)<tolerance,`${a} != ${b}`);
const sample=(x=0,y=0,yaw=0,linear=0)=>odometry({x,y,yaw,linear,angular:0},{sec:1,nanosec:0});

test('out and back accumulates distance; a turn changes heading without adding distance',()=>{
 const t=new OdometryTrace();t.add(sample());t.add(sample(.4));t.add(sample(.2));t.add(sample());
 near(t.distance,.8);near(t.displacement,0);t.add(sample(0,0,Math.PI/2,.2));near(t.distance,.8);
 near(t.latest.yaw,Math.PI/2);near(t.worldVelocity.x,0);near(t.worldVelocity.y,.2);
 t.mark();near(t.distance,0);near(t.displacement,0);near(t.latest.yaw,Math.PI/2);
});
test('arc length converges from below; yaw wrap and equivalent quaternions preserve geometry',()=>{
 const t=new OdometryTrace(),r=new Robot();t.add(sample());r.command(.2,.4);
 for(let i=0;i<40;i++){r.step(.05);t.add(odometry(r,{sec:1,nanosec:i}));}
 near(t.distance,.4,1e-4);assert(t.distance<.4);assert(t.displacement<t.distance);
 for(const yaw of [-Math.PI,-2.3,0,Math.PI/2,Math.PI]){
  const m=sample(0,0,yaw,.2);for(const k of ['x','y','z','w'])m.pose.pose.orientation[k]*=-1;
  const tr=new OdometryTrace();tr.add(m);near(Math.sin(tr.latest.yaw),Math.sin(yaw));near(tr.worldVelocity.y,.2*Math.sin(yaw));
 }
});
test('bounded trails preserve totals and reject invalid/tilted samples; frame/time changes start a new measurement',()=>{
 const t=new OdometryTrace(10);for(let i=0;i<100;i++)t.add(sample(i/10));
 assert.equal(t.points.length,10);assert(t.trimmed);near(t.distance,9.9);near(t.displacement,9.9);
 const bad=sample();bad.pose.pose.orientation.w=0;assert.equal(t.add(bad),false);near(t.distance,9.9);
 bad.pose.pose.orientation.x=1;assert.equal(t.add(bad),false);
 const changed=sample(100);changed.header.frame_id='another_odom';t.add(changed);near(t.distance,0);
 const old=sample();old.header.stamp.sec=0;t.add(old);near(t.distance,0);
 t.reset();assert.equal(t.latest,null);assert.equal(t.points.length,0);
});
test('odometry exercise includes runnable inspection and preserves nested-field and unsourced-overlay failures',async()=>{
 const lab=new Lab(),t=lab.terminal(),other=lab.terminal();
 try{
  await assert.rejects(()=>t.execute('ros2 topic echo /odom --once --field pose.position'),/Could not determine/);
  lab.runtime.ensureTopic('/odom','nav_msgs/msg/Odometry').publishers.add('/playground');
  await assert.rejects(()=>t.execute('ros2 topic echo /odom --once --field pose.position'),/Invalid field/);
  for(const command of odometryExercise('python').steps.flatMap(s=>s.kind==='commands'?s.commands:[]).filter(c=>c.startsWith('ros2 topic echo /odom'))){
   await t.execute(command);lab.runtime.publish('/odom','nav_msgs/msg/Odometry',sample(),{node:'/playground'});assert(!t.busy,command);
  }
  await t.execute('mkdir -p ~/ros2_ws/src');await t.execute('cd ~/ros2_ws/src');
  await t.execute('ros2 pkg create --build-type ament_python --license Apache-2.0 odom_lab --dependencies rclpy nav_msgs');
  await assert.rejects(()=>other.execute('ros2 run odom_lab reader'),/not found/);
  await assert.rejects(()=>t.execute('source ~/ros2_ws/install/setup.bash'),/No such file/);
 }finally{lab.reset();}
});
