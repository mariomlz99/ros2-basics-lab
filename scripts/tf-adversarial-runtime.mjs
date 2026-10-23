import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {mkdir,writeFile} from 'node:fs/promises';
import {poses,pairs,probeSource,expected} from './tf-review-fixtures.mjs';
await mkdir('artifacts/review',{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true});
const reports=[];
try{
 const page=await browser.newPage();await page.goto(process.env.LAB_URL||'http://127.0.0.1:8044/ros2-basics-lab/');
 await page.evaluate(async()=>{const base=document.querySelector('script[src*="/app.js"]').src;const {Runtime}=await import(new URL('runtime/graph.js',base));window.tfReview={runtime:new Runtime(),base,logs:[]};});
 for(const language of (process.env.LAB_LANGUAGE||'python,cpp').split(',')){
  const code=probeSource(language);await writeFile(`artifacts/review/probe.${language==='python'?'py':'cpp'}`,code);
  await page.evaluate(async({language,code})=>{const s=window.tfReview,{PythonBridge}=await import(new URL('python/bridge.js',s.base)),{CppBridge}=await import(new URL('cpp/bridge.js',s.base));s.adapter=new(language==='python'?PythonBridge:CppBridge)(s.runtime,{output:line=>s.logs.push(line),status:line=>s.logs.push('STATUS '+line)});s.adapter.run({code,schema:s.runtime.registry.schema()});},{language,code});
  await page.waitForFunction(()=>window.tfReview.logs.some(line=>/Unknown TF frame|Create a TransformListener/.test(line)),null,{timeout:180000});
  assert(!await page.evaluate(()=>window.tfReview.logs.some(line=>line.includes('Create a TransformListener'))),'Surviving listener must keep buffer usable');
  if(language==='cpp')assert.equal(await page.evaluate(()=>!!window.tfReview.adapter.worker),false,'C++ missing startup transforms stop safely');
  await page.evaluate(()=>{window.tfReview.adapter.stop();window.tfReview.logs=[];});
  for(const [index,pose]of poses.entries()){
   await page.evaluate(async pose=>{const s=window.tfReview,{staticTransforms,dynamicTransforms}=await import(new URL('playground/frames.js',s.base));s.logs=[];s.runtime.publish('/tf_static','tf2_msgs/msg/TFMessage',staticTransforms(s.runtime.stamp()),{node:'/fixture',durability:'transient_local'});s.runtime.publish('/tf','tf2_msgs/msg/TFMessage',dynamicTransforms({...pose,leftWheel:.4,rightWheel:-.9},s.runtime.stamp()),{node:'/fixture'});},pose);
   if(index===0)await page.evaluate(code=>{const s=window.tfReview;s.adapter.run({code,schema:s.runtime.registry.schema()});},code);
   await page.waitForFunction(()=>{const s=window.tfReview;return s.logs.some(line=>line.includes('Create a TransformListener'))||s.runtime.tfEvidence.some(e=>e.owner===s.adapter&&e.operation==='point'&&e.revision===s.runtime.tf.revision)&&s.logs.some(line=>line.includes('CHECK point'));},null,{timeout:180000});
   assert(!await page.evaluate(()=>window.tfReview.logs.some(line=>line.includes('Create a TransformListener'))),'Surviving listener must keep buffer usable');
   // A full subsequent callback ensures its printed values belong to this pose.
   await page.evaluate(()=>{window.tfReview.logs=[];});await page.waitForFunction(()=>window.tfReview.logs.some(line=>line.includes('CHECK point'))&&window.tfReview.logs.some(line=>line.includes('CHECK 0 ')));
   const logs=await page.evaluate(()=>window.tfReview.logs),values={};for(const line of logs){const m=/CHECK (\w+) ([^\n]+)/.exec(line);if(m)values[m[1]]=m[2].trim().split(/\s+/).map(Number);}
   const oracle=expected(pose);for(const [i,expectedValues]of oracle.entries()){if(!expectedValues)continue;const actual=values[i===7?'point':String(i)];assert(actual,`${language} pose ${index} missing ${i}`);expectedValues.forEach((value,k)=>assert(Math.abs(value-actual[k])<1e-9,`${language} pose ${index} query ${i} field ${k}: ${actual[k]} versus ${value}`));}
   const model=await page.evaluate(async()=>{const s=window.tfReview,{tfViewModel}=await import(new URL('tf/view-model.js',s.base));return tfViewModel(s.runtime.tf);});assert(Math.abs(model.poses.find(p=>p.name==='base_link').origin.x-pose.x)<1e-10);assert(Math.abs(model.relativeTarget.point.x-values.point[0])<1e-9);
   reports.push({language,index,pose,values});console.log('PASS '+language+' numerical pose '+index);
  }
  await page.evaluate(()=>{const s=window.tfReview;s.adapter.stop();s.runtime.reset();if(s.runtime.listeners.size||s.runtime.tf.listeners.size||s.runtime.jobs.size)throw Error('Cleanup leak');});
 }
 if(reports.length===poses.length*2)for(let i=0;i<poses.length;i++)for(const key of Object.keys(reports[i].values))reports[i].values[key].forEach((value,k)=>assert(Math.abs(value-reports[i+poses.length].values[key][k])<1e-9,'Python/C++ numerical parity'));
 await writeFile('artifacts/review/runtime-numerics.json',JSON.stringify({tolerance:1e-9,pairs,reports},null,2));
}finally{await browser.close();}
