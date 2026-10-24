import test from 'node:test';
import assert from 'node:assert/strict';
import {Lab} from '../src/lab.js';
import {Playground} from '../src/playground/playground.js';
import {laserScan,TRAINING_WORLD} from '../src/playground/lidar.js';
import {renderCamera} from '../src/playground/camera.js';
const canvas=()=>({width:400,height:320,getContext:()=>new Proxy({},{get:()=>()=>{}})});

test('one simulation acquisition shares pose and timestamp across odometry, TF, LiDAR and image',()=>{
 const prior=globalThis.ImageData;globalThis.ImageData=class{};
 const lab=new Lab(),scene=new Playground(lab.runtime,canvas(),canvas());let clock=0;
 lab.runtime.stamp=()=>({sec:100,nanosec:++clock});
 try{
  scene.start();clearInterval(scene.timer);
  for(const [x,y,yaw]of [[0,0,0],[-.4,.8,Math.PI-1e-6],[1,-1,-Math.PI+1e-6],[.5,.4,-.7]]){
   Object.assign(scene.robot,{x,y,yaw});scene.robot.command(.1,.2);
   if(Math.round(scene.elapsed*20)%2===0)scene.step();
   const first=lab.runtime.sampleCounter;scene.step();
   const samples=[...lab.runtime.samples].filter(([id])=>id>first).map(([,s])=>s);
   const messages=Object.fromEntries(samples.map(s=>[s.topic,s.message]));
   assert.deepEqual(Object.keys(messages),['/odom','/tf','/scan','/camera/image_raw']);
   const stamp=messages['/odom'].header.stamp;
   for(const topic of ['/scan','/camera/image_raw'])assert.deepEqual(messages[topic].header.stamp,stamp,topic+' acquisition time');
   for(const t of messages['/tf'].transforms)assert.deepEqual(t.header.stamp,stamp);
   const pose=messages['/odom'].pose.pose,tf=messages['/tf'].transforms[0].transform;
   assert.deepEqual(pose.position,tf.translation);assert.deepEqual(pose.orientation,tf.rotation);
   assert(Math.abs(Math.hypot(...Object.values(pose.orientation))-1)<1e-12);
   const scan=laserScan(scene.robot,TRAINING_WORLD,stamp);
   assert.deepEqual(messages['/scan'].ranges,scan.ranges.map(v=>Math.fround(Number.isFinite(v)?v:scan.range_max)));
   assert.deepEqual(messages['/camera/image_raw'].data,renderCamera(scene.robot).data);
  }
 }finally{scene.stop();lab.reset();globalThis.ImageData=prior;}
});

test('reset immediately republishes coherent pose and sensor samples; preview creates no publishers',()=>{
 const prior=globalThis.ImageData;globalThis.ImageData=class{};
 const lab=new Lab(),scene=new Playground(lab.runtime,canvas(),canvas());let clock=0;
 lab.runtime.stamp=()=>({sec:200,nanosec:++clock});
 try{
  scene.resetPose();assert.equal(lab.runtime.samples.size,0);
  scene.start();clearInterval(scene.timer);Object.assign(scene.robot,{x:.7,y:.4,yaw:1.2});
  const first=lab.runtime.sampleCounter;scene.resetPose();
  const messages=Object.fromEntries([...lab.runtime.samples].filter(([id])=>id>first).map(([,s])=>[s.topic,s.message]));
  assert.deepEqual(Object.keys(messages),['/odom','/tf','/scan','/camera/image_raw']);
  assert.deepEqual(messages['/odom'].pose.pose.position,{x:0,y:0,z:0});
  for(const topic of ['/scan','/camera/image_raw'])assert.deepEqual(messages[topic].header.stamp,messages['/odom'].header.stamp);
  assert.deepEqual(messages['/camera/image_raw'].data,renderCamera(scene.robot).data);
  assert.equal(messages['/camera/image_raw'].encoding,'rgb8');assert.equal(messages['/camera/image_raw'].step,960);
 }finally{scene.stop();lab.reset();globalThis.ImageData=prior;}
});
