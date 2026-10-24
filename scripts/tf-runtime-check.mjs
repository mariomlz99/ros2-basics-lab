import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',headless:true});
try{
 const page=await browser.newPage(),url=new URL(process.env.LAB_URL||'http://127.0.0.1:8044/ros2-basics-lab/');await page.goto(url.href);
 await page.exposeFunction('tfProgress',message=>console.log(message));
 const result=await page.evaluate(async()=>{
  const base=document.querySelector('script[src*="/app.js"]').src;
  const {Runtime}=await import(new URL('runtime/graph.js',base)),{PythonBridge}=await import(new URL('python/bridge.js',base)),{CppBridge}=await import(new URL('cpp/bridge.js',base)),{tfFiles}=await import(new URL('tf/lesson.js',base)),{dynamicTransforms,staticTransforms}=await import(new URL('playground/frames.js',base));
  const runtime=new Runtime(),cases=[],logs=[];let current;
  const seed=pose=>{const stamp=runtime.stamp();runtime.publish('/tf_static','tf2_msgs/msg/TFMessage',staticTransforms(stamp),{node:'/robot',durability:'transient_local'});runtime.publish('/tf','tf2_msgs/msg/TFMessage',dynamicTransforms(pose,stamp),{node:'/robot'});};
  const until=async(predicate,label)=>{for(let count=0;count<2400;count++){if(predicate())return;await new Promise(resolve=>setTimeout(resolve,50));}throw Error(label+'\n'+logs.slice(-20).join('\n'));};
  const record=async name=>{cases.push(name);await window.tfProgress(name);};
  const assert=(condition,message)=>{if(!condition)throw Error(message+'\n'+logs.slice(-15).join('\n'));};
  try{
   for(const language of ['python','cpp']){
    const Bridge=language==='python'?PythonBridge:CppBridge,files=tfFiles(language,'all'),starters=tfFiles(language,'all',{starter:true});
    const source=(files,exercise)=>files[language==='python'?`tf_lab/${exercise}.py`:`src/${exercise}.cpp`]+(language==='python'?'\nmain()\n':'');
    const run=code=>{current?.stop();logs.length=0;current=new Bridge(runtime,{output:text=>logs.push(text),status:text=>logs.push('STATUS '+text)});current.run({code,schema:runtime.registry.schema()});return current;};
    seed({x:0,y:0,yaw:0});let adapter=run(source(starters,'lookup'));await until(()=>logs.some(line=>line.includes('Unknown TF frame "laser"')),language+' wrong frame');assert(!runtime.tfEvidence.some(event=>event.owner===adapter),'Wrong frame generated evidence');adapter.stop();await record(language+': wrong frame reports real lookup failure');
    runtime.removeNode('/robot');adapter=run(source(files,'lookup'));await until(()=>logs.some(line=>line.includes('TF lookup failed:')),language+' waits without simulator');assert(adapter.worker,'Missing TF stopped reader');seed({x:0,y:0,yaw:0});await until(()=>runtime.tfEvidence.some(event=>event.owner===adapter&&event.operation==='lookup')&&logs.some(line=>line.includes('x = 0.12, y = 0.00')),language+' lookup');
    runtime.removeNode('/robot');logs.length=0;await until(()=>logs.some(line=>line.includes('TF lookup failed:')),language+' simulator stop');assert(adapter.worker,'Stopped simulator killed reader');seed({x:0,y:0,yaw:0});await until(()=>logs.some(line=>line.includes('x = 0.12, y = 0.00')),language+' simulator restart');await record(language+': reader waits for missing TF and recovers after simulator restart');assert(logs.some(line=>line.includes('x = 0.12, y = 0.00')),language+' lookup output');await record(language+': lesson lookup returns live laser mount');
    adapter.stop();assert(runtime.tf.listeners.size===0,'Stop leaked snapshot listener');assert(runtime.listeners.size===0,'Stop leaked TF endpoints');await record(language+': Stop releases listener and endpoints');
    adapter=run(source(starters,'point'));await until(()=>logs.some(line=>line.includes('Target is ready')),language+' starter point');assert(!runtime.tfEvidence.some(event=>event.owner===adapter),'Point starter generated evidence');adapter.stop();await record(language+': point starter needs a real transform');
    adapter=run(source(files,'point'));await until(()=>runtime.tfEvidence.some(event=>event.owner===adapter&&event.operation==='point'),language+' point');let event=runtime.tfEvidence.filter(event=>event.owner===adapter).at(-1);assert(event.result.point.x===1&&event.result.point.y===1,'Initial relative target mismatch');
    seed({x:.5,y:-.5,yaw:Math.PI/2});const revision=runtime.tf.revision;await until(()=>runtime.tfEvidence.some(event=>event.owner===adapter&&event.revision===revision)&&logs.some(line=>line.includes('x = 1.50, y = -0.50')),language+' moved point');event=runtime.tfEvidence.filter(event=>event.owner===adapter).at(-1);assert(Math.abs(event.result.point.x-1.5)<1e-10&&Math.abs(event.result.point.y+.5)<1e-10,'Moved relative target mismatch');assert(logs.some(line=>line.includes('x = 1.50, y = -0.50')),'Moved output mismatch');await record(language+': point follows moved robot using updated TF snapshot');
    seed({x:0,y:0,yaw:0});await until(()=>runtime.tfEvidence.some(event=>event.owner===adapter&&event.revision===runtime.tf.revision),language+' pose reset');await record(language+': pose reset updates the running program');adapter.stop();
    const alternate=source(files,'lookup').replaceAll('tf_lookup','alternate_frame_reader').replaceAll('0.5','0.2').replaceAll('milliseconds(500)','milliseconds(200)');adapter=run(alternate);await until(()=>runtime.tfEvidence.some(event=>event.owner===adapter),language+' alternate');adapter.stop();await record(language+': alternative node name/timer and rerun work');
    runtime.reset();assert(runtime.tf.frames().length===0&&runtime.tfEvidence.length===0&&runtime.jobs.size===0&&runtime.listeners.size===0&&runtime.tf.listeners.size===0,'Reset leaked TF state');await record(language+': Reset clears evidence, transforms, timers and listeners');
   }
   return {passed:true,cases};
  }finally{current?.stop();runtime.reset();}
 });
 assert(result.passed);await mkdir('artifacts/tf',{recursive:true});await writeFile('artifacts/tf/runtime-browser.json',JSON.stringify(result,null,2));console.log('PASS TF Python/C++ runtime acceptance');
}finally{await browser.close();}
