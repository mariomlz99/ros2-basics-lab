import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true});
try{
 const page=await browser.newPage();await page.goto(process.env.LAB_URL||'http://127.0.0.1:8033/ros2-basics-lab/');
 await page.evaluate(async()=>{
  const base=document.querySelector('script[type=module]').src,{Lab}=await import(new URL('lab.js',base));
  const lab=new Lab(),t=lab.terminal();window.cppAudit={lab,t,log:[]};t.output=s=>window.cppAudit.log.push(s);
  await t.execute('mkdir -p ~/ros2_ws/src');await t.execute('cd ~/ros2_ws/src');await t.execute('ros2 pkg create --build-type ament_cmake --node-name hello demo');await t.execute('cd ..');await t.execute('colcon build');await t.execute('source install/setup.bash');
 });
 // Installed code must run even if its compiler cache has been evicted.
 await page.evaluate(async()=>{for(const key of await caches.keys()){const cache=await caches.open(key);for(const request of await cache.keys())if(/\/(clang|lld)$/.test(request.url))await cache.delete(request);}});
 const compilerRequests=[];await page.route(/\/(clang|lld)$/,route=>{compilerRequests.push(route.request().url());return route.abort();});
 for(let i=0;i<6;i++){
  await page.evaluate(async()=>{window.cppAudit.log=[];await window.cppAudit.t.execute('ros2 run demo hello');});
  await page.waitForFunction(()=>window.cppAudit.log.some(s=>s.includes('hello world demo package'))||window.cppAudit.log.some(s=>/could not load|failed|Error/.test(s)),null,{timeout:120000});
  const log=await page.evaluate(()=>window.cppAudit.log);assert(log.some(s=>s.includes('hello world demo package')),log.join('\n'));
  await page.waitForFunction(()=>window.cppAudit.lab.processes.active().length===0);await page.evaluate(()=>window.cppAudit.lab.stop(window.cppAudit.t.id));
 }
 assert.deepEqual(compilerRequests,[]);console.log('PASS six installed C++ runs after compiler-cache eviction; no compiler/linker downloads');
 await page.evaluate(()=>window.cppAudit.lab.reset());
}finally{await browser.close();}
