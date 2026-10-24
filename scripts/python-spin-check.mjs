import {chromium,firefox} from 'playwright-core';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {spinFixtures} from './python-spin-fixtures.mjs';

const engine=process.env.BROWSER==='firefox'?firefox:chromium;
const browser=await engine.launch({headless:true,...(engine===chromium?{executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome'}:{})});
try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto(process.env.LAB_URL||'http://127.0.0.1:8017/ros2-basics-lab/');
 const result=await page.evaluate(async fixtures=>{
  const base=document.querySelector('script[src*="/app.js"]').src;
  const {Runtime}=await import(new URL('runtime/graph.js',base));
  const {PythonBridge}=await import(new URL('python/bridge.js',base));
  const results=[];
  const wait=async(predicate,logs)=>{for(let i=0;i<2400;i++){if(predicate())return;await new Promise(r=>setTimeout(r,25));}throw Error('Timeout: '+logs.join('\n'));};
  for(const [name,code]of Object.entries(fixtures)){
   const runtime=new Runtime(),logs=[];let stopped=false;
   const adapter=new PythonBridge(runtime,{output:text=>logs.push(text),onStop:()=>{stopped=true;}});
   try{
    adapter.run({code,schema:runtime.registry.schema()});
    if(name.startsWith('interrupt')){
     await wait(()=>logs.includes('TICK 2')||stopped,logs);
     if(stopped)throw Error('Reader stopped before interrupt: '+logs.join('\n'));
     if(logs.includes('FINALLY'))throw Error('Premature finally');
     adapter.stop();
     await wait(()=>name==='interrupt_error'?logs.some(line=>line.includes('cleanup failed')):logs.includes('FINALLY'),logs);
     await new Promise(r=>setTimeout(r,100));
    }else await wait(()=>stopped,logs);
    results.push({name,logs,nodes:runtime.nodes.size,jobs:runtime.jobs.size,listeners:runtime.listeners.size,worker:!!adapter.worker});
   }finally{adapter.stop();runtime.reset();}
  }
  return {jspi:typeof WebAssembly.Suspending==='function',results};
 },spinFixtures);
 assert.deepEqual(errors,[],'Python lifecycle leaked an uncaught browser error');
 const expected={
  shutdown:['ENTER','TICK 1','TICK 2','TICK 3','AFTER','EXIT','FINALLY','RETURN'],
  exception:['ENTER','TICK 1','EXIT','CAUGHT callback failed','FINALLY','RETURN'],
  finite:['FINITE'],
 };
 expected.sequential=[...expected.shutdown,...expected.shutdown];
 for(const row of result.results){
  const markers=row.logs.filter(line=>/^(ENTER|TICK|AFTER|EXIT|CAUGHT|INTERRUPTED|FINALLY|RETURN|FINITE|UNEXPECTED)/.test(line));
  if(row.name.startsWith('interrupt')){
   assert.equal(markers[0],'ENTER');assert(markers.includes('TICK 2'));
   if(row.name==='interrupt_error'){assert.deepEqual(markers.slice(-3),['EXIT','INTERRUPTED','FINALLY']);assert(row.logs.some(line=>line.includes('RuntimeError: cleanup failed')));}
   else assert.deepEqual(markers.slice(-4),['EXIT','INTERRUPTED','FINALLY','RETURN']);
   assert(!markers.includes('AFTER'));
  }else assert.deepEqual(markers,expected[row.name],row.name+'\n'+row.logs.join('\n'));
  assert.equal(row.nodes,0);assert.equal(row.jobs,0);assert.equal(row.listeners,0);assert.equal(row.worker,false);
  console.log('PASS Python stack lifecycle: '+row.name);
 }
 await mkdir('artifacts/product-fixes',{recursive:true});
 await writeFile('artifacts/product-fixes/python-spin-'+(process.env.BROWSER||'chrome')+'.json',JSON.stringify({browser:browser.version(),...result},null,2));
}finally{await browser.close();}
