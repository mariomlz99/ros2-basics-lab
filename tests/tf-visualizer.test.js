import test from 'node:test';
import assert from 'node:assert/strict';
import {Runtime} from '../src/runtime/graph.js';
import {Playground} from '../src/playground/playground.js';
import {SENSORS,WHEELS,sensorPose} from '../src/playground/sensors.js';
import {dynamicTransforms,staticTransforms} from '../src/playground/frames.js';
import {tfViewModel,tfTreeRows} from '../src/tf/view-model.js';
import {sessionScope,savedSlots} from '../src/session-scopes.js';
import {Lab} from '../src/lab.js';
import {prepareLesson} from '../src/course/prepare.js';

const near=(a,b)=>assert(Math.abs(a-b)<=1e-10,`${a} != ${b}`);
const canvas=()=>({width:800,height:640,getContext:()=>new Proxy({},{get:(o,key)=>o[key]??(()=>{})})});

test('simulator, published TF, lookup and spatial coordinates agree at deterministic poses',()=>{
 const runtime=new Runtime(),stamp={sec:1,nanosec:0};
 runtime.publish('/tf_static','tf2_msgs/msg/TFMessage',staticTransforms(stamp),{node:'/playground'});
 for(const pose of [{x:0,y:0,yaw:0},{x:1.1,y:-.6,yaw:Math.PI/2},{x:-1,y:2,yaw:-2.8},{x:.005,y:-.01,yaw:Math.PI},...Array.from({length:40},(_,i)=>({x:Math.sin(i)*2,y:Math.cos(i)*2,yaw:i/7-Math.PI}))]){
  const robot={...pose,leftWheel:.4,rightWheel:-1.2};
  const message=dynamicTransforms(robot,stamp);runtime.publish('/tf','tf2_msgs/msg/TFMessage',message,{node:'/playground'});
  const model=tfViewModel(runtime.tf),positions=new Map(model.poses.map(p=>[p.name,p]));
  for(const [key,value]of Object.entries({x:robot.x,y:robot.y,z:0})){
   near(message.transforms[0].transform.translation[key],value);
   near(runtime.tf.lookup('odom','base_link').transform.translation[key],value);
   near(positions.get('base_link').origin[key],value);
  }
  near(positions.get('base_link').yaw,Math.atan2(Math.sin(robot.yaw),Math.cos(robot.yaw)));
  for(const [key,mount]of Object.entries(SENSORS)){
   const geometric=sensorPose(robot,key),live=runtime.tf.lookup('odom',mount.frame),visual=positions.get(mount.frame);
   near(live.transform.translation.x,geometric.x);near(live.transform.translation.y,geometric.y);
   near(visual.origin.x,geometric.x);near(visual.origin.y,geometric.y);near(visual.origin.z,mount.z);
   near(runtime.tf.lookup('base_link',mount.frame).transform.translation.x,mount.x);
  }
  for(const [name,side]of [[WHEELS.left,1],[WHEELS.right,-1]]){
   const position=positions.get(name).origin;
   near(position.x,robot.x-Math.sin(robot.yaw)*side*WHEELS.track/2);
   near(position.y,robot.y+Math.cos(robot.yaw)*side*WHEELS.track/2);near(position.z,WHEELS.radius);
  }
  const optical=positions.get('camera_optical_frame'),camera=positions.get('camera_link');
  near(optical.origin.x,camera.origin.x);near(optical.origin.y,camera.origin.y);
  // Optical y points down out of the top view: its projected axis is a dot.
  near(optical.yAxis.x,optical.origin.x);near(optical.yAxis.y,optical.origin.y);
  const relative=model.relativeTarget.point,dx=1-robot.x,dy=1-robot.y;
  near(relative.x,Math.cos(robot.yaw)*dx+Math.sin(robot.yaw)*dy);
  near(relative.y,-Math.sin(robot.yaw)*dx+Math.cos(robot.yaw)*dy);
 }
});

test('tree derives new/deleted relationships from runtime, including disconnected components',()=>{
 const r=new Runtime(),stamp={sec:0,nanosec:0};
 assert.deepEqual(tfViewModel(r.tf).poses,[]);
 r.publish('/tf','tf2_msgs/msg/TFMessage',dynamicTransforms({x:0,y:0,yaw:0},stamp),{node:'robot'});
 r.publish('/tf_static','tf2_msgs/msg/TFMessage',staticTransforms(stamp),{node:'mounts'});
 let rows=tfTreeRows(r.tf.edges(),r.tf.frames());
 assert.equal(rows.length,7);assert.equal(rows.find(row=>row.name==='camera_optical_frame').depth,3);
 assert.equal(rows.find(row=>row.name==='laser_link').edge.static,true);
 assert.equal(rows.find(row=>row.name==='left_wheel_link').edge.static,false);
 const extra=structuredClone(staticTransforms(stamp));extra.transforms=extra.transforms.slice(0,1);extra.transforms[0].header.frame_id='tripod';extra.transforms[0].child_frame_id='probe';
 r.publish('/tf_static','tf2_msgs/msg/TFMessage',extra,{node:'extra'});
 assert(tfTreeRows(r.tf.edges(),r.tf.frames()).some(row=>row.name==='probe'));
 assert.equal(tfViewModel(r.tf,'odom','probe').poses.length,7);
 assert.match(tfViewModel(r.tf,'odom','probe').error,/not connected/);
 r.removeNode('extra');assert(!tfViewModel(r.tf).names.includes('probe'));
 r.reset();assert.deepEqual(tfViewModel(r.tf).names,[]);
});

test('20 Hz movement and immediate reset never leave TF behind simulator pose; repeated lifecycle cleans up',()=>{
 const previous=globalThis.ImageData;globalThis.ImageData=class{};
 const runtime=new Runtime(),scene=new Playground(runtime,canvas(),canvas());
 try{
  for(let cycle=0;cycle<12;cycle++){
   scene.start();assert.equal(runtime.tf.frames().length,7);
   scene.robot.command(.2,.4);
   for(let tick=0;tick<30;tick++){
    scene.step();const pose=tfViewModel(runtime.tf).poses.find(p=>p.name==='base_link');
    near(pose.origin.x,scene.robot.x);near(pose.origin.y,scene.robot.y);near(pose.yaw,scene.robot.yaw);
   }
   scene.resetPose();near(runtime.tf.lookup('odom','base_link').transform.translation.x,0);
   near(tfViewModel(runtime.tf).relativeTarget.point.x,1);
   scene.stop();assert.equal(runtime.tf.frames().length,0);assert.equal(runtime.listeners.size,0);assert.equal(scene.disposers.length,0);assert.equal(scene.timer,null);
  }
 }finally{scene.stop();globalThis.ImageData=previous;}
});

test('TF uses an isolated session and repeat preparation preserves edited files',async()=>{
 assert.equal(sessionScope(9),'tf');assert.notEqual(sessionScope(9),sessionScope(7));assert.notEqual(sessionScope(9),sessionScope(8));assert.notEqual(sessionScope(9),sessionScope(0));
 assert.deepEqual([...savedSlots({ui:{unitIndex:9},slots:{course:{},playground:{},free:{},tf:{}}}).keys()],['course','playground','free']);
 for(const language of ['python','cpp']){
  const lab=new Lab();lab.terminal();await prepareLesson(lab,9,language);
  const path='/home/student/ros2_ws/src/tf_lab/'+(language==='python'?'tf_lab/lookup.py':'src/lookup.cpp');
  lab.fs.write(path,'learner edits');await prepareLesson(lab,9,language);assert.equal(lab.fs.read(path),'learner edits');
  await assert.rejects(()=>prepareLesson(lab,9,language==='python'?'cpp':'python'),/other language/);lab.reset();
 }
});
