import test from 'node:test';
import assert from 'node:assert/strict';
import {Lab} from '../src/lab.js';
import {ROOT} from '../src/workspace.js';
import {RuntimeAdapter} from '../src/runtime/adapter.js';
import {TransformClient} from '../src/runtime/tf.js';
import {dynamicTransforms,staticTransforms} from '../src/playground/frames.js';
import {tfFiles,tfDependencies,tfExercises,tfChecks,TF_TARGET} from '../src/tf/lesson.js';

// Exercises execute in real language workers in browser acceptance. These tests
// attack the checker boundary: only verified bridge events from installed code
// may count, regardless of source spelling or values printed to the terminal.
class RecordedProgram extends RuntimeAdapter{
 run(){this.worker={postMessage(){},terminate(){}};this.attachTransforms();}
}
const stamp={sec:0,nanosec:0};
function publishFrames(lab,pose={x:0,y:0,yaw:0}){
 lab.runtime.publish('/tf_static','tf2_msgs/msg/TFMessage',staticTransforms(stamp),{node:'/playground'});
 lab.runtime.publish('/tf','tf2_msgs/msg/TFMessage',dynamicTransforms(pose,stamp),{node:'/playground'});
}
async function fixture(language='python'){
 const lab=new Lab();lab.fs.mkdir(ROOT+'/src',true);
 lab.workspace.create('tf_lab',language==='python'?'ament_python':'ament_cmake',{dependencies:tfDependencies(language)});
 for(const [path,source]of Object.entries(tfFiles(language)))lab.fs.write(ROOT+'/src/tf_lab/'+path,source);
 lab.builder.compile=async()=>({imports:[]});await lab.builder.build();
 lab.processes.factories=new Map([[language,async()=>RecordedProgram]]);
 publishFrames(lab);return lab;
}
async function program(lab,executable='lookup',{listen=true}={}){
 const process=await lab.processes.run('tf_lab',executable),adapter=process.adapter;
 adapter.handle({kind:'node',node:'/alternative_reader'});
 if(listen)adapter.handle({kind:'tf_listener',node:'/alternative_reader',id:1});
 return process;
}
function request(lab,process,options){
 const client=new TransformClient(event=>process.adapter.handle(event),process.adapter.tfProof);
 client.update(lab.runtime.tf.snapshot());return client.request(options);
}
const lookup={operation:'lookup',target:'base_link',source:'laser_link'};
const point={operation:'point',target:'base_link',input:{header:{frame_id:'odom',stamp},point:{...TF_TARGET}}};
const passed=(lab,id)=>tfChecks(lab,id).every(check=>check.passed);

test('TF has four frame exercises and a shared odometry extension with ungraded reflection and bounded topic samples',()=>{
 for(const language of ['python','cpp']){
  const exercises=tfExercises(language);assert.deepEqual(exercises.map(e=>e.id),['frames','tree','lookup','point','odometry']);
  assert(exercises.slice(0,2).every(e=>e.steps.some(step=>step.kind==='tf-reflection')));
  assert(exercises.slice(0,2).every(e=>!e.steps.some(step=>step.kind==='tf-check')));
  for(const command of exercises.flatMap(e=>e.steps).flatMap(step=>step.commands??[]).filter(command=>command.startsWith('ros2 topic echo ')))assert(command.includes('--once'));
  assert.deepEqual(tfChecks({runtime:{}},'frames'),[]);assert.deepEqual(tfChecks({runtime:{}},'tree'),[]);
 }
});

test('both language packages install both exercises; replacing one keeps the other executable',async()=>{
 for(const language of ['python','cpp']){
  const lab=await fixture(language);
  try{
   assert.deepEqual([...lab.workspace.installed.get('tf_lab').executables.keys()].sort(),['lookup','point']);
   for(const [path,source]of Object.entries(tfFiles(language,'lookup',{starter:true})))lab.fs.write(ROOT+'/src/tf_lab/'+path,source);
   await lab.builder.build();assert.deepEqual([...lab.workspace.installed.get('tf_lab').executables.keys()].sort(),['lookup','point']);
  }finally{lab.reset();}
 }
});

test('TF checker rejects print-only, terminal lookup, wrong pair and missing listener',async()=>{
 const lab=await fixture();try{
  const p=await program(lab,'lookup',{listen:false});p.adapter.handle({kind:'stdout',text:'x = 0.12, y = 0.00 m'});
  assert(!passed(lab,'lookup'));request(lab,p,lookup);assert(!passed(lab,'lookup'),'no listener means no observed TF');
  p.adapter.handle({kind:'tf_listener',node:'/alternative_reader',id:1});
  const terminal=new RecordedProgram(lab.runtime);terminal.run();terminal.handle({kind:'node',node:'/terminal_reader'});terminal.handle({kind:'tf_listener',node:'/terminal_reader',id:1});
  request(lab,{adapter:terminal},lookup);assert(!passed(lab,'lookup'),'terminal adapter is not installed student code');terminal.stop();
  request(lab,p,{...lookup,target:'laser_link',source:'base_link'});assert(!passed(lab,'lookup'),'reversed relationship does not fulfill this exercise');
  request(lab,p,{...lookup,source:'camera_link'});assert(!passed(lab,'lookup'));
  assert.throws(()=>request(lab,p,{...lookup,source:'laser'}),/Frame names must match the TF tree/);
  request(lab,p,lookup);assert(passed(lab,'lookup'));
 }finally{lab.reset();}
});

test('copied point coordinates and fabricated transform results do not pass',async()=>{
 const lab=await fixture();try{
  const p=await program(lab,'point');
  p.adapter.handle({kind:'stdout',text:'x = 1.00, y = 1.00 m'});assert(!passed(lab,'point'));
  request(lab,p,{...point,input:{...point.input,point:{x:1,y:0,z:0}}});assert(!passed(lab,'point'),'must transform the visible target');
  request(lab,p,{...point,target:'laser_link'});assert(!passed(lab,'point'),'must express the point in the robot frame');
  p.adapter.handle({kind:'tf_evidence',operation:'point',target:'base_link',source:'odom',input:point.input,result:{header:{stamp,frame_id:'base_link'},point:{x:42,y:42,z:0}},revision:lab.runtime.tf.revision});
  assert(!passed(lab,'point'),'bridge rejects invented result values');
  p.adapter.handle({kind:'tf_evidence',operation:'point',target:'base_link',source:'odom',input:point.input,result:lab.runtime.tf.transformPoint('base_link',point.input),revision:-1});
  assert(!passed(lab,'point'),'bridge rejects an unobserved snapshot');
  request(lab,p,point);assert(passed(lab,'point'));
  publishFrames(lab,{x:.6,y:-.2,yaw:Math.PI/3});assert(passed(lab,'point'),'completed evidence is tied to its sampled pose, not a later one');
 }finally{lab.reset();}
});

test('TF evidence survives Stop, but edited source, rerun and Reset need fresh work',async()=>{
 const lab=await fixture();try{
  let p=await program(lab);request(lab,p,lookup);assert(passed(lab,'lookup'));
  const path=ROOT+'/src/tf_lab/tf_lab/lookup.py',original=lab.fs.read(path);
  lab.fs.write(path,original+'\n# Edited after this run\n');assert(!passed(lab,'lookup'));
  lab.fs.write(path,original);lab.processes.stop(p.id);assert(passed(lab,'lookup'),'Stop preserves a completed lookup');
  p=await program(lab);assert(!passed(lab,'lookup'),'a fresh run cannot reuse the previous run');
  request(lab,p,lookup);assert(passed(lab,'lookup'));
  lab.reset();assert(!passed(lab,'lookup'));assert(!passed(lab,'point'));assert.equal(lab.runtime.tfEvidence.length,0);assert.equal(lab.runtime.tf.listeners.size,0);
 }finally{lab.reset();}
});

test('valid alternate implementations count without matching reference source strings',async()=>{
 const lab=await fixture();try{
  const path=ROOT+'/src/tf_lab/tf_lab/lookup.py';
  lab.fs.write(path,lab.fs.read(path).replace("'base_link', 'laser_link'","target_frame, sensor_frame").replace('        try:',"        target_frame = 'base_link'\n        sensor_frame = 'laser_link'\n        try:"));
  await lab.builder.build();const p=await program(lab);request(lab,p,lookup);assert(passed(lab,'lookup'));
 }finally{lab.reset();}
});
