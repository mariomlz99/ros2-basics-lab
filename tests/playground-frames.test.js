import test from 'node:test';
import assert from 'node:assert/strict';
import {Lab} from '../src/lab.js';
import {HOME} from '../src/fs.js';
import {Robot} from '../src/playground/robot.js';
import {dynamicTransforms,staticTransforms,odometry} from '../src/playground/frames.js';
import {Playground} from '../src/playground/playground.js';
import {playgroundExercises} from '../src/playground/lessons.js';
import {playgroundSections} from '../src/playground/sections.js';
import {guidePages} from '../src/course/guide.js';
import {lesson} from '../src/course.js';
const stamp={sec:123,nanosec:500000000};
const close=(a,b)=>assert(Math.abs(a-b)<1e-9,`${a} versus ${b}`);
function canvas(){const context=new Proxy({},{get:(target,key)=>target[key]??(()=>{})});return {width:400,height:320,getContext:()=>context};}
test('odometry and TF agree with integrated robot motion and sensor frame conventions',()=>{
 const robot=new Robot();robot.command(.2,.4);robot.step(1);
 const odom=odometry(robot,stamp),tf=dynamicTransforms(robot,stamp).transforms[0];
 assert.equal(odom.header.frame_id,'odom');assert.equal(odom.child_frame_id,'base_link');assert.deepEqual(tf.transform.translation,odom.pose.pose.position);assert.deepEqual(tf.transform.rotation,odom.pose.pose.orientation);assert.deepEqual(tf.header,odom.header);
 close(robot.x,.5*Math.sin(.4));close(robot.y,.5*(1-Math.cos(.4)));assert.equal(odom.twist.twist.linear.x,.2);assert.equal(odom.twist.twist.angular.z,.4);
 const fixed=staticTransforms(stamp).transforms;assert.deepEqual(fixed.map(t=>[t.header.frame_id,t.child_frame_id]),[['base_link','laser_link'],['base_link','camera_link'],['camera_link','camera_optical_frame']]);
 close(fixed[0].transform.translation.x,.12);close(fixed[1].transform.translation.x,.1);
 // Optical forward +z rotates to camera_link forward +x.
 const {x,y,z,w}=fixed[2].transform.rotation;close(2*(x*z+w*y),1);close(2*(y*z-w*x),0);close(1-2*(x*x+y*y),0);
 robot.step(2);assert.equal(odometry(robot,stamp).twist.twist.linear.x,0);
});
test('static TF reaches late durable subscribers, stops with its publisher and does not leak into required lessons',async()=>{
 const output=[],lab=new Lab({onOutput:(id,text)=>output.push(text)}),t=lab.terminal();
 assert(!lab.runtime.topics.has('/odom'));assert(!lab.runtime.topics.has('/tf'));
 lab.runtime.addNode('/playground');lab.runtime.ensureTopic('/tf_static','tf2_msgs/msg/TFMessage').publishers.add('/playground');
 lab.runtime.publish('/tf_static','tf2_msgs/msg/TFMessage',staticTransforms(stamp),{node:'/playground',durability:'transient_local'});
 try{
  await t.execute('ros2 topic echo /tf_static --once --qos-durability transient_local');await new Promise(resolve=>setTimeout(resolve,0));
  assert(output.join('\n').includes('camera_optical_frame'));assert(!t.busy);assert.equal(lab.processes.active().length,0);
  output.length=0;await t.execute('ros2 topic echo /tf_static --once --qos-durability volatile');await new Promise(resolve=>setTimeout(resolve,0));assert.equal(output.length,0);assert(t.busy);lab.stop(t.id);
  await t.execute('ros2 topic echo /tf_static --once');await new Promise(resolve=>setTimeout(resolve,0));assert(output.join('\n').includes('laser_link'));assert(!t.busy);
  lab.runtime.removeNode('/playground');assert.equal(lab.runtime.retained.size,0);assert(!lab.runtime.topics.has('/tf_static'));
 }finally{lab.reset();}
});
test('every introductory exercise command runs against the live playground; reset and cleanup preserve isolation',async()=>{
 const output=[],lab=new Lab({onOutput:(id,text)=>output.push(text)}),terminals=[lab.terminal(),lab.terminal()],prior=globalThis.ImageData;
 globalThis.ImageData=class{constructor(data,width,height){Object.assign(this,{data,width,height});}};
 const scene=new Playground(lab.runtime,canvas(),canvas(),canvas());
 try{
  for(const exercise of playgroundExercises('python').filter(e=>e.id!=='readers')){
   for(const step of exercise.steps){
    if(step.kind==='simulator-action'){scene.start();if(step.action==='reset')scene.resetPose();}
    if(step.kind==='terminal-action')lab.stop(terminals[step.terminal-1].id);
    if(step.kind==='commands')for(const command of step.commands){
     const t=terminals[step.terminal-1];assert(!t.busy,command+' needs a free terminal');
     await t.execute(command);
     if(command.startsWith('ros2 topic echo ')){for(let i=0;i<10;i++)scene.step();await new Promise(resolve=>setTimeout(resolve,0));assert(!t.busy,command+' must exit after one sample');}
     if(command.includes('pub --once'))await new Promise(resolve=>setTimeout(resolve,130));
    }
   }
  }
  const samples=[...lab.runtime.samples.values()];assert(samples.some(s=>s.topic==='/odom'));assert(samples.some(s=>s.topic==='/tf'));assert(samples.some(s=>s.topic==='/camera/image_raw'&&s.message.header.frame_id==='camera_optical_frame'));
  scene.stop();for(const t of terminals)lab.stop(t.id);assert.equal(lab.runtime.retained.size,0);assert.equal(lab.runtime.listeners.size,0);assert.equal(lab.processes.active().length,0);
  for(const topic of ['/odom','/tf','/tf_static','/scan','/camera/image_raw','/cmd_vel'])assert(!lab.runtime.topics.has(topic),topic);
  await assert.rejects(()=>terminals[0].execute('ros2 topic echo /odom --once'),/Could not determine the type/);
 }finally{scene.stop();lab.reset();globalThis.ImageData=prior;}
});
test('playground sections are navigable and remain outside all seven required lessons',()=>{
 for(const language of ['python','cpp']){
  const steps=lesson(7,language),pages=guidePages(steps).slice(0,-1),sections=playgroundSections(pages);
  assert.deepEqual(sections.map(s=>s.id),['intro','odom','tf','lidar','camera','readers']);
  for(const section of sections)assert(section.end>=section.start);
  for(let i=0;i<7;i++)assert(!lesson(i,language).some(s=>s.kind==='section'||s.kind==='simulator-action'));
 }
});


import {captureSession,restoreSession} from '../src/session.js';
import {migrateCurriculum} from '../src/curriculum-session.js';
test('old playground sessions gain TF installation entries and restart only their old guide position',()=>{
 const lab=new Lab();lab.terminal();lab.fs.write(HOME+'/keep.txt','my work');
 const saved=captureSession(lab,{lessonIndex:7,progress:[0,1,2],guidePositions:[['3:python',5],['7:python',18]]});saved.curriculumVersion=3;
 delete saved.workspace.schema['tf2_msgs/msg/TFMessage'];
 for(const path of [...saved.workspace.entries.keys()])if(path.includes('/tf2_msgs/'))saved.workspace.entries.delete(path);
 const record=migrateCurriculum(saved),restored=new Lab();restoreSession(restored,record);
 assert.deepEqual(record.ui.guidePositions,[['3:python',5],['7:python',0]]);assert.deepEqual(record.ui.progress,[0,1,2]);assert.equal(restored.fs.read(HOME+'/keep.txt'),'my work');
 assert(restored.fs.exists('/opt/ros/jazzy/share/tf2_msgs/msg/TFMessage.msg'));assert(restored.fs.exists('/opt/ros/jazzy/include/tf2_msgs/msg/tf_message.hpp'));assert(restored.workspace.registry.definitions.has('tf2_msgs/msg/TFMessage'));
 record.ui.guidePositions[1][1]=6;migrateCurriculum(record);assert.equal(record.ui.guidePositions[1][1],6);lab.reset();restored.reset();
});
