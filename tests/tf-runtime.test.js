import test from 'node:test';
import assert from 'node:assert/strict';
import {Runtime} from '../src/runtime/graph.js';
import {RuntimeAdapter} from '../src/runtime/adapter.js';
import {TransformStore,TransformClient,applyTransform,quaternionYaw} from '../src/runtime/tf.js';
import {dynamicTransforms,staticTransforms} from '../src/playground/frames.js';
import {SENSORS,WHEELS} from '../src/playground/sensors.js';
import {Lab} from '../src/lab.js';
const stamp={sec:42,nanosec:100};
const near=(a,b)=>assert(Math.abs(a-b)<1e-10,`${a} != ${b}`);
const vectorNear=(a,b)=>{for(const key of ['x','y','z'])near(a[key],b[key]);};
function seed(runtime,pose={x:0,y:0,yaw:0}){runtime.publish('/tf_static','tf2_msgs/msg/TFMessage',staticTransforms(stamp),{node:'/robot',durability:'transient_local'});runtime.publish('/tf','tf2_msgs/msg/TFMessage',dynamicTransforms(pose,stamp),{node:'/robot'});}

test('simulator publications, lookup, worker and spatial coordinates agree over deterministic poses',()=>{
 const runtime=new Runtime();let revision=0;const client=new TransformClient(()=>{});
 for(const pose of [{x:0,y:0,yaw:0},{x:1.25,y:-.7,yaw:Math.PI/2},{x:-2,y:3,yaw:-2.2},{x:.1,y:.2,yaw:Math.PI,leftWheel:1.2,rightWheel:-.8}]){
  seed(runtime,pose);assert(runtime.tf.revision>revision);revision=runtime.tf.revision;client.update(runtime.tf.snapshot());
  const root=runtime.tf.lookup('odom','base_link');vectorNear(root.transform.translation,{x:pose.x,y:pose.y,z:0});near(quaternionYaw(root.transform.rotation),pose.yaw);
  assert.deepEqual(client.request({operation:'lookup',target:'odom',source:'base_link'}),root);
  for(const sensor of Object.values(SENSORS)){
   const local=runtime.tf.lookup('base_link',sensor.frame);vectorNear(local.transform.translation,{x:sensor.x,y:sensor.y,z:sensor.z});near(quaternionYaw(local.transform.rotation),sensor.yaw);
   const world=runtime.tf.lookup('odom',sensor.frame),expected={x:pose.x+Math.cos(pose.yaw)*sensor.x-Math.sin(pose.yaw)*sensor.y,y:pose.y+Math.sin(pose.yaw)*sensor.x+Math.cos(pose.yaw)*sensor.y,z:sensor.z};vectorNear(world.transform.translation,expected);
   vectorNear(applyTransform(root,local.transform.translation),expected);
  }
  for(const [frame,y]of [[WHEELS.left,WHEELS.track/2],[WHEELS.right,-WHEELS.track/2]])vectorNear(runtime.tf.lookup('base_link',frame).transform.translation,{x:0,y,z:WHEELS.radius});
  const input={header:{frame_id:'odom',stamp:{sec:0,nanosec:0}},point:{x:1,y:1,z:0}},relative=runtime.tf.transformPoint('base_link',input);
  vectorNear(relative.point,{x:Math.cos(pose.yaw)*(1-pose.x)+Math.sin(pose.yaw)*(1-pose.y),y:-Math.sin(pose.yaw)*(1-pose.x)+Math.cos(pose.yaw)*(1-pose.y),z:0});
  vectorNear(applyTransform(root,relative.point),input.point);assert.deepEqual(client.request({operation:'point',target:'base_link',input}),relative);
 }
 assert.equal(runtime.tf.edges().filter(edge=>edge.static).length,3);assert.equal(runtime.tf.edges().filter(edge=>!edge.static).length,3);
});

test('TF full quaternion composition preserves camera optical axes and reverses transforms',()=>{
 const runtime=new Runtime();seed(runtime,{x:2,y:3,yaw:.7});const optical=runtime.tf.lookup('camera_link','camera_optical_frame');
 vectorNear(applyTransform(optical,{x:0,y:0,z:1}),{x:1,y:0,z:0});vectorNear(applyTransform(optical,{x:1,y:0,z:0}),{x:0,y:-1,z:0});
 const world=runtime.tf.lookup('odom','camera_optical_frame'),back=runtime.tf.lookup('camera_optical_frame','odom'),point={x:.3,y:-2,z:4};vectorNear(applyTransform(back,applyTransform(world,point)),point);
});

test('TF tree validates cycles/unknown/disconnected frames and clears stopped publisher/reset',()=>{
 const runtime=new Runtime();seed(runtime);const before=runtime.tf.snapshot();
 assert.throws(()=>runtime.tf.lookup('base_link','laser'),/Frame names must match the TF tree/);
 const cycle={transforms:[{...before.edges[0].transform,header:{stamp,frame_id:'laser_link'},child_frame_id:'odom'}]};assert.throws(()=>runtime.tf.ingest('/tf',cycle,{node:'/bad'}),/cycle/);assert.deepEqual(runtime.tf.snapshot(),before);
 const other={transforms:[{header:{stamp,frame_id:'other'},child_frame_id:'island',transform:{translation:{x:0,y:0,z:0},rotation:{x:0,y:0,z:0,w:1}}}]};runtime.tf.ingest('/tf',other,{node:'/other'});assert.throws(()=>runtime.tf.lookup('base_link','island'),/not connected/);
 runtime.removeNode('/robot');assert.deepEqual(runtime.tf.frames(),['island','other']);runtime.reset();assert.deepEqual(runtime.tf.frames(),[]);assert.deepEqual(runtime.tfEvidence,[]);
});

test('TF evidence needs a real listener, matching snapshot/result and owner; rerun/reset clear it',()=>{
 const runtime=new Runtime();seed(runtime);const adapter=new RuntimeAdapter(runtime),sent=[];adapter.worker={postMessage:d=>sent.push(d),terminate(){}};adapter.attachTransforms();adapter.handle({kind:'node',node:'/learner'});
 const client=new TransformClient(event=>adapter.handle(event),adapter.tfProof);client.update(runtime.tf.snapshot());client.request({operation:'lookup',target:'base_link',source:'laser_link'});assert.equal(runtime.tfEvidence.length,0);
 adapter.handle({kind:'tf_listener',node:'/learner',id:'listener'});assert.equal(runtime.topics.get('/tf_static').subscribers.size,1);
 client.request({operation:'lookup',target:'base_link',source:'laser_link'});assert.equal(runtime.tfEvidence.length,1);assert.equal(runtime.tfEvidence[0].owner,adapter);
 const fake={kind:'tf_evidence',...runtime.tfEvidence[0],result:{transform:{translation:{x:999}}}};adapter.handle(fake);assert.equal(runtime.tfEvidence.length,1);
 seed(runtime,{x:2,y:1,yaw:.7});const oldRevision=client.store.revision;client.request({operation:'point',target:'base_link',input:{header:{frame_id:'odom'},point:{x:1,y:1,z:0}}});assert.equal(runtime.tfEvidence.at(-1).revision,oldRevision);
 adapter.stop();assert.equal(runtime.tf.listeners.size,0);assert.equal(runtime.topics.get('/tf_static')?.subscribers.size??0,0);assert.equal(runtime.tfEvidence.length,2);
 adapter.worker={postMessage(){},terminate(){}};adapter.attachTransforms();assert.equal(runtime.tfEvidence.length,0);adapter.stop();runtime.reset();
});

test('TF runtime modules, headers, package indexes and libraries are inspectable and restore safely',()=>{
 const lab=new Lab(),base='/opt/ros/jazzy';for(const pkg of ['tf2','tf2_ros','tf2_geometry_msgs'])assert(lab.fs.exists(`${base}/share/ament_index/resource_index/packages/${pkg}`));
 for(const path of ['/include/tf2_ros/buffer.h','/include/tf2_ros/transform_listener.h','/include/tf2_geometry_msgs/tf2_geometry_msgs.hpp','/include/tf2/time.h','/lib/python3.12/site-packages/tf2_ros/__init__.py','/lib/python3.12/site-packages/tf2_ros/buffer.py','/lib/python3.12/site-packages/tf2_geometry_msgs/__init__.py','/lib/libtf2.so','/lib/libtf2_ros.so'])assert(lab.fs.exists(base+path),path);
 assert.match(lab.fs.read(base+'/include/tf2_ros/buffer.h'),/lookupTransform/);assert.match(lab.fs.read(base+'/lib/libtf2.so'),/not a native ELF/);lab.reset();
});

test('Reset pose and navigation invalidation reject queued evidence from an earlier snapshot',()=>{
 const runtime=new Runtime();seed(runtime);const adapter=new RuntimeAdapter(runtime);adapter.worker={postMessage(){},terminate(){}};adapter.attachTransforms();adapter.handle({kind:'node',node:'/learner'});adapter.handle({kind:'tf_listener',node:'/learner',id:1});
 let queued;const client=new TransformClient(event=>{queued=event;},adapter.tfProof);client.update(runtime.tf.snapshot());client.request({operation:'lookup',target:'base_link',source:'laser_link'});adapter.handle(queued);assert.equal(runtime.tfEvidence.length,1);
 runtime.invalidateTfEvidence();assert.equal(runtime.tfEvidence.length,0);assert(runtime.tfEvidenceFloor>queued.revision);adapter.handle(queued);assert.equal(runtime.tfEvidence.length,0,'in-flight callback cannot restore pre-reset proof');
 client.update(runtime.tf.snapshot());client.request({operation:'lookup',target:'base_link',source:'laser_link'});adapter.handle(queued);assert.equal(runtime.tfEvidence.length,1,'fresh observation is accepted');
 runtime.reset();adapter.handle(queued);assert.equal(runtime.tfEvidence.length,0,'full runtime reset also fences old callbacks');adapter.stop();
});
