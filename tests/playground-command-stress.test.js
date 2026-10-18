import test from 'node:test';
import assert from 'node:assert/strict';
import {Lab} from '../src/lab.js';
import {Playground} from '../src/playground/playground.js';
import {TRAINING_WORLD,collides} from '../src/playground/lidar.js';
const canvas=()=>({width:400,height:320,getContext:()=>new Proxy({},{get:()=>()=>{}})});
test('hostile Twist traffic remains finite, bounded and recoverable through Stop and Reset',()=>{
 const prior=globalThis.ImageData;globalThis.ImageData=class{};
 const lab=new Lab(),r=lab.runtime,scene=new Playground(r,canvas(),canvas());
 const send=(v,w,node='/a')=>r.publish('/cmd_vel','geometry_msgs/msg/Twist',r.registry.complete('geometry_msgs/msg/Twist',{linear:{x:v},angular:{z:w}}),{node});
 try{
  scene.start();clearInterval(scene.timer);
  for(const [v,w]of [[1e300,-1e300],[-1e300,1e300],[0,0],[.2,.4],[-.2,-.4]]){
   send(v,w);assert.equal(scene.robot.linear,Math.max(-2,Math.min(2,v)));assert.equal(scene.robot.angular,Math.max(-3,Math.min(3,w)));
   scene.step();assert(!collides(scene.robot,TRAINING_WORLD));assert(Object.values(scene.robot).every(Number.isFinite));
  }
  send(.2,0);for(const value of [NaN,Infinity,-Infinity,'fast',null]){
   assert.throws(()=>send(value,0),/finite|number/);assert.equal(scene.robot.linear,.2);
  }
  // The last valid publisher command wins; publisher death does not send zero.
  r.addNode('/a');r.addNode('/b');send(.3,0,'/a');send(-.3,0,'/b');r.removeNode('/b');assert.equal(scene.robot.linear,-.3);
  for(let i=0;i<41;i++)scene.step();assert.equal(scene.robot.linear,0);assert.equal(scene.robot.angular,0);
  const stopped=[scene.robot.x,scene.robot.y,scene.robot.yaw];scene.step();assert.deepEqual([scene.robot.x,scene.robot.y,scene.robot.yaw],stopped);
  scene.resetPose();for(let i=0;i<55;i++){send(2,0);scene.step();assert(!collides(scene.robot,TRAINING_WORLD));}
  assert(scene.robot.x<3&&scene.robot.x>2.7);scene.resetPose();assert.equal(scene.robot.x,0);assert.equal(scene.robot.yaw,0);
  r.removeNode('/a');scene.stop();assert.equal(r.nodes.size,0);assert.equal(r.listeners.size,0);assert.equal(r.retained.size,0);
  scene.start();scene.stop();assert.equal(r.nodes.size,0);assert.equal(r.listeners.size,0);
 }finally{scene.stop();lab.reset();globalThis.ImageData=prior;}
});
