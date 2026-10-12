// Observe worker requests while real Python programs build, exchange messages and reload.
import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';

const url=process.env.LAB_URL||'http://127.0.0.1:8031/ros2-basics-lab/';
const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',headless:true});
const requests=[],errors=[];
try{
 const context=await browser.newContext(),page=await context.newPage();
 context.on('request',request=>requests.push(request.url()));
 page.on('pageerror',error=>errors.push(error.message));
 await page.goto(url);
 const observe=()=>page.evaluate(async()=>{
  const base=document.querySelector('script[type=module]').src,{Lab}=await import(new URL('lab.js',base)),terminal=Lab.prototype.terminal;
  Lab.prototype.terminal=function(...args){window.loadingLab=this;return terminal.apply(this,args);};
 });
 await observe();await page.locator('#start').click();await page.locator('.xterm').first().waitFor();
 await page.locator('#language').selectOption('python');await page.locator('[data-index="8"]').click();
 const command=async line=>{
  await page.locator('.xterm-helper-textarea').first().focus();await page.keyboard.type(line);await page.keyboard.press('Enter');
  await page.waitForFunction(()=>/^(Jazzy|ROS environment)/.test(document.querySelector('.terminal-state')?.textContent),null,{timeout:180000});
 };
 const commands=await page.locator('#unit .command code, #lesson .command code').allTextContents();
 assert.equal(commands.length,6,'Visible Free Lab setup must include all six commands');
 for(const line of commands)await command(line);
 await page.waitForFunction(()=>/Hi from|hello world/.test(document.querySelector('.terminal-transcript pre')?.textContent),null,{timeout:180000});
 console.log('PASS visible Python Free Lab hello');
 await page.evaluate(async()=>{
  const lab=window.loadingLab,base=document.querySelector('script[type=module]').src,{pubsubFiles}=await import(new URL('examples.js',base)),t=[...lab.terminals.values()][0];
  window.loadingOutput=[];lab.onOutput=(id,line)=>window.loadingOutput.push(line);
  await t.execute('cd ~/ros2_ws/src');await t.execute('ros2 pkg create python_only --build-type ament_python --dependencies rclpy std_msgs');
  for(const [path,source]of Object.entries(pubsubFiles('python','python_only'))){const full=t.cwd+'/python_only/'+path;lab.fs.mkdir(full.slice(0,full.lastIndexOf('/')),true);lab.fs.write(full,source);}
  await t.execute('cd ..');await t.execute('colcon build --packages-select python_only');await t.execute('source install/setup.bash');
  const listener=lab.terminal();await listener.execute('source ~/ros2_ws/install/setup.bash');
  await listener.execute('ros2 run python_only listener');await t.execute('ros2 run python_only talker');
 });
 await page.waitForFunction(()=>window.loadingOutput.filter(line=>line.includes('I heard:')).length>=3,null,{timeout:180000});
 const cleanup=await page.evaluate(()=>{
  const l=window.loadingLab;l.processes.stopAll();
  return {processes:l.processes.active().length,nodes:l.runtime.nodes.size,jobs:l.runtime.jobs.size,listeners:l.runtime.listeners.size};
 });
 assert(Object.values(cleanup).every(n=>n===0),JSON.stringify(cleanup));
 console.log('PASS real Python publisher/subscriber callbacks and cleanup');
 await page.locator('#save-session').click();await page.waitForTimeout(600);await page.reload();await observe();
 await page.locator('#start').click();await page.locator('.xterm').first().waitFor();
 await command('source ~/ros2_ws/install/setup.bash');await command('ros2 run my_experiment hello');
 await page.waitForFunction(()=>/Hi from|hello world/.test(document.querySelector('.terminal-transcript pre')?.textContent),null,{timeout:180000});
 assert.deepEqual(errors,[]);
 const pythonRequests=[...new Set(requests.filter(url=>url.includes('/pyodide/')))];
 const cppRequests=[...new Set(requests.filter(url=>/\/wasm-clang\/|\/cpp\/worker\.js(?:\?|$)/.test(url)))];
 assert(pythonRequests.length>0,'Network observer must see the real Python runtime download');
 assert.deepEqual(cppRequests,[],'Python-only build/run/reload must not fetch the C++ toolchain or worker');
 const result={url,passed:true,hello:true,callbacks:3,reload:true,cleanup,pythonRequests,cppRequests};
 await mkdir('artifacts/audit',{recursive:true});await writeFile('artifacts/audit/python-only-loading.json',JSON.stringify(result,null,2));
 console.log('PASS Python-only build/run/reload: '+pythonRequests.length+' Python assets, zero C++ toolchain/worker requests');
}finally{await browser.close();}
