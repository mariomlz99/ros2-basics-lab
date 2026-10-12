// Start before publishing: retain a real old C++ session across a Pages release.
import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
const url=process.env.LAB_URL||'https://mariomlz99.github.io/ros2-basics-lab/';
const expected=JSON.parse(await readFile('dist/build-info.json','utf8'));
assert(expected.publicBuild);
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true});
await mkdir('artifacts/audit',{recursive:true});
try{
 const context=await browser.newContext(),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.goto(url);
 const old=await page.evaluate(()=>fetch('./build-info.json',{cache:'no-store'}).then(r=>r.json()));
 assert.notEqual(old.assetVersion,expected.assetVersion,'Start this check before publishing the new version');
 await page.evaluate(async()=>{
  const base=document.querySelector('script[type=module]').src;
  const [{Lab},{pubsubFiles}]=await Promise.all([import(new URL('lab.js',base)),import(new URL('examples.js',base))]);
  const l=new Lab(),t=l.terminal();window.releaseLab=l;window.releaseTerminal=t;window.releaseLogs=[];
  t.output=s=>window.releaseLogs.push(s);
  await t.execute('mkdir -p ~/ros2_ws/src');await t.execute('cd ~/ros2_ws/src');
  await t.execute('ros2 pkg create --build-type ament_cmake release_probe --dependencies rclcpp std_msgs');
  for(const [path,code]of Object.entries(pubsubFiles('cpp','release_probe')))l.fs.write(t.cwd+'/release_probe/'+path,code);
  await t.execute('cd ..');await t.execute('colcon build');
  if(!l.workspace.current('release_probe'))throw Error(window.releaseLogs.join('\n'));
 });
 await writeFile('artifacts/audit/live-release-ready.json',JSON.stringify({old,expected,compiled:true},null,2));
 console.log('READY: old live C++ package compiled; waiting for source '+expected.commit);
 let deployed=null;
 for(let attempt=0;attempt<180;attempt++){
  const response=await context.request.get(new URL('build-info.json?release='+Date.now(),url).href);
  if(response.ok()){const build=await response.json();if(build.commit===expected.commit&&build.assetVersion===expected.assetVersion){deployed=build;break;}}
  await new Promise(resolve=>setTimeout(resolve,5000));
 }
 assert(deployed,'Expected public release did not become live within 15 minutes');
 const retained=[];
 for(const path of ['cpp/worker.js','cpp/compat.hpp','cpp/protocol.js','python/worker.js','lab.js']){
  const response=await context.request.get(new URL('assets/'+old.assetVersion+'/src/'+path+'?release='+Date.now(),url).href);
  assert.equal(response.status(),200,'Retain old '+path);retained.push(path);
 }
 await page.evaluate(async()=>{
  const l=window.releaseLab,t=window.releaseTerminal,listener=l.terminal();listener.output=s=>window.releaseLogs.push(s);
  await t.execute('source install/setup.bash');await t.execute('ros2 run release_probe talker');
  await listener.execute('source ~/ros2_ws/install/setup.bash');await listener.execute('ros2 run release_probe listener');
 });
 await page.waitForFunction(()=>window.releaseLogs.some(s=>s.includes('I heard:')),null,{timeout:180000});
 const cleanup=await page.evaluate(()=>{const l=window.releaseLab;l.reset();return {nodes:l.runtime.nodes.size,processes:l.processes.active().length,listeners:l.runtime.listeners.size,timers:l.runtime.jobs.size};});
 assert(Object.values(cleanup).every(v=>v===0));assert.deepEqual(errors,[]);
 const fresh=await browser.newPage();await fresh.goto(url+'?release='+Date.now());
 assert((await fresh.locator('script[type=module]').getAttribute('src')).includes(expected.assetVersion));
 const result={url,passed:true,old,deployed,retained,oldCppSessionDelivery:true,newTabVersion:expected.assetVersion,cleanup};
 await writeFile('artifacts/audit/live-release.json',JSON.stringify(result,null,2));console.log('PASS live release '+JSON.stringify(result));
}finally{await browser.close();}
