import test from 'node:test';import assert from 'node:assert/strict';
import {Runtime} from '../src/runtime/graph.js';import {RuntimeAdapter} from '../src/runtime/adapter.js';import {TransformClient,applyTransform} from '../src/runtime/tf.js';
import {staticTransforms,dynamicTransforms} from '../src/playground/frames.js';import {tfViewModel,tfTreeRows} from '../src/tf/view-model.js';
const stamp={sec:12,nanosec:345000000},near=(a,b)=>assert(Math.abs(a-b)<1e-10,`${a} != ${b}`);
test('512 seeded varied poses: independent planar inverse, point and mount oracle',()=>{
 const runtime=new Runtime();runtime.publish('/tf_static','tf2_msgs/msg/TFMessage',staticTransforms(stamp),{node:'/sim'});const fixed=runtime.tf.edges().filter(e=>e.static);
 let seed=0x7ee2351;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32),seen=new Set();
 for(let i=0;i<512;i++){
  const pose={x:40*random()-20,y:40*random()-20,yaw:(random()*2-1)*Math.PI,leftWheel:random()*20-10,rightWheel:random()*20-10};seen.add(JSON.stringify(pose));
  if(i<4)pose.yaw=[Math.PI-1e-12,-Math.PI+1e-12,Math.PI/2,-Math.PI/2][i];
  const message=dynamicTransforms(pose,stamp);runtime.publish('/tf','tf2_msgs/msg/TFMessage',message,{node:'/sim'});
  assert.equal(new Set(message.transforms.map(t=>t.child_frame_id)).size,3);assert.deepEqual(runtime.tf.edges().filter(e=>e.static),fixed);
  const c=Math.cos(pose.yaw),s=Math.sin(pose.yaw),model=tfViewModel(runtime.tf);
  for(const [name,x,y,z]of [['base_link',0,0,0],['laser_link',.12,0,.15],['camera_link',.1,0,.5],['left_wheel_link',0,.1225,.09],['right_wheel_link',0,-.1225,.09]]){
   const world=runtime.tf.lookup('odom',name),visual=model.poses.find(p=>p.name===name),expected={x:pose.x+c*x-s*y,y:pose.y+s*x+c*y,z};
   for(const key of ['x','y','z']){near(world.transform.translation[key],expected[key]);near(visual.origin[key],expected[key]);}
   const restored=applyTransform(runtime.tf.lookup(name,'odom'),applyTransform(world,{x:.37,y:-.41,z:.23}));near(restored.x,.37);near(restored.y,-.41);near(restored.z,.23);
  }
  for(const point of [{x:1,y:1,z:0},{x:-1,y:0,z:.4},{x:0,y:-1,z:0},{x:pose.x,y:pose.y,z:0}]){
   const result=runtime.tf.transformPoint('base_link',{header:{frame_id:'odom'},point}).point,dx=point.x-pose.x,dy=point.y-pose.y;near(result.x,c*dx+s*dy);near(result.y,-s*dx+c*dy);near(result.z,point.z);
  }
 }
 assert.equal(seen.size,512);
});
test('malformed batches are atomic; disconnected roots stay visible; no cycles or duplicate tree nodes',()=>{
 const r=new Runtime();r.publish('/tf_static','tf2_msgs/msg/TFMessage',staticTransforms(stamp),{node:'/sim'});r.publish('/tf','tf2_msgs/msg/TFMessage',dynamicTransforms({x:0,y:0,yaw:0},stamp),{node:'/sim'});
 const before=r.tf.snapshot(),one=structuredClone(before.edges[0].transform);
 for(const mutate of [t=>t.transform.translation.x=NaN,t=>t.transform.rotation={x:0,y:0,z:0,w:0},t=>t.header.frame_id=t.child_frame_id,t=>{t.header.frame_id='laser_link';t.child_frame_id='odom';},t=>t.child_frame_id='']){
  const invalid=structuredClone(one);mutate(invalid);assert.throws(()=>r.tf.ingest('/tf',{transforms:[invalid]},{node:'/sim'}));assert.deepEqual(r.tf.snapshot(),before);
 }
 const disconnected=structuredClone(one);disconnected.header.frame_id='unpublished_root';disconnected.child_frame_id='detached';r.tf.ingest('/tf',{transforms:[disconnected,disconnected]},{node:'/other'});
 const model=tfViewModel(r.tf,'odom','detached');assert.match(model.error,/not connected/);const rows=tfTreeRows(model.edges,model.names);assert.equal(rows.length,new Set(rows.map(r=>r.name)).size);assert(rows.some(r=>r.name==='unpublished_root'));r.removeNode('/other');assert.deepEqual(r.tf.edges(),before.edges);
});
test('copied exact lookup result cannot forge proof; per-run proof is not rebroadcast or reused',()=>{
 const r=new Runtime();r.publish('/tf_static','tf2_msgs/msg/TFMessage',staticTransforms(stamp),{node:'/sim'});const a=new RuntimeAdapter(r),sent=[];a.worker={postMessage:v=>sent.push(v),terminate(){}};a.attachTransforms();a.handle({kind:'node',node:'/student'});a.handle({kind:'tf_listener',node:'/student',id:1});
 const request={operation:'lookup',target:'base_link',source:'laser_link'},forged={kind:'tf_evidence',...request,revision:r.tf.revision,result:r.tf.lookup(request.target,request.source)};
 a.handle(forged);assert.equal(r.tfEvidence.length,0);const firstProof=a.tfProof;assert(firstProof);r.tf.changed();assert.equal(sent[0].proof,firstProof);assert.equal(sent[1].proof,undefined);
 let evidence;const client=new TransformClient(e=>{evidence=e;},firstProof);client.update(r.tf.snapshot());client.request(request);a.handle(evidence);assert.equal(r.tfEvidence.length,1);
 a.stop();a.worker={postMessage(){},terminate(){}};a.attachTransforms();a.handle({kind:'node',node:'/student'});a.handle({kind:'tf_listener',node:'/student',id:1});assert.notEqual(a.tfProof,firstProof);a.handle(evidence);assert.equal(r.tfEvidence.length,0);a.stop();r.reset();
});
