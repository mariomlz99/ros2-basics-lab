import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true});
const results=[];
try{
 for(const language of ['python','cpp']){
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));page.on('dialog',dialog=>dialog.accept());
  await page.goto(process.env.LAB_URL||'http://127.0.0.1:8033/ros2-basics-lab/');
  const observe=()=>page.evaluate(async()=>{
   const base=document.querySelector('script[type="module"]').src,{Lab}=await import(new URL('lab.js',base)),terminal=Lab.prototype.terminal;
   window.auditLabs=[];Lab.prototype.terminal=function(...args){if(!window.auditLabs.includes(this))window.auditLabs.push(this);return terminal.apply(this,args);};
  });
  await observe();await page.locator('#start').click();await page.locator('.xterm').first().waitFor();
  const command=async(text,i=0)=>{await page.locator('.xterm-helper-textarea').nth(i).focus();await page.keyboard.type(text,{delay:1});await page.keyboard.press('Enter');await page.waitForTimeout(150);};
  const idle=()=>page.waitForFunction(()=>[...document.querySelectorAll('.terminal-state')].every(e=>/^(Jazzy|ROS environment not sourced)/.test(e.textContent)),null,{timeout:180000});
  const select=async index=>{await page.locator(`button[data-index="${index}"]`).click();await page.waitForTimeout(80);};
  await command('touch course_marker');await select(7);await command('touch playground_marker');
  assert.equal(await page.locator('[data-exercise]').count(),7);
  assert((await page.locator('[data-exercise]').allTextContents()).every(title=>!title.includes('—')));
  await select(8);await page.locator('#language').selectOption(language);
  assert.equal(await page.locator('.complete').count(),0);assert(await page.locator('#prepare-lesson').isHidden());
  const commands=await page.locator('#lesson .command code').allTextContents();
  for(const line of commands){await command(line);await idle();}
  await page.waitForFunction(()=>document.querySelector('.terminal-transcript pre').textContent.includes('hello world')||document.querySelector('.terminal-transcript pre').textContent.includes('Hi from'),null,{timeout:180000});
  await idle();await command('touch free_marker');await page.locator('#add-terminal').click();
  await command('ros2 run my_experiment hello',1);await idle();
  assert((await page.locator('.terminal-transcript pre').nth(1).textContent()).includes("Package 'my_experiment' not found"));
  await command('source ~/ros2_ws/install/setup.bash',1);await command('ros2 run my_experiment hello',1);await idle();
  await page.locator('#free-robot').click();
  for(let i=0;i<20;i++){
   await page.locator('#playground-start').click();await page.waitForTimeout(110);
   await page.locator('#playground-stop').click();
   assert.deepEqual(await page.evaluate(()=>{const r=window.auditLabs.at(-1).runtime;return [r.nodes.size,r.jobs.size,r.listeners.size,r.retained.size];}),[0,0,0,0]);
  }
  await page.locator('#playground-start').click();
  await command("ros2 topic pub -r 10 /cmd_vel geometry_msgs/msg/Twist '{linear: {x: 0.2}}'");
  await command('ros2 topic echo /odom --once --field pose.pose.position',1);await page.waitForTimeout(500);
  await page.locator('.xterm-helper-textarea').first().focus();await page.keyboard.press('Control+c');
  await command("ros2 topic pub --once /cmd_vel geometry_msgs/msg/Twist '{}'");await idle();
  const position=()=>page.evaluate(()=>[...window.auditLabs.at(-1).runtime.samples.values()].reverse().find(s=>s.topic==='/odom')?.message.pose.pose.position.x);
  const stopped=await position();await page.waitForTimeout(400);assert.equal(await position(),stopped);
  await select(0);await select(7);await select(8);
  assert.match(await page.locator('#playground-status').textContent(),/stopped/);
  await page.locator('#save-session').click();await page.waitForTimeout(500);await page.reload();await observe();await page.locator('#start').click();await page.locator('.xterm').first().waitFor();
  assert.equal(await page.locator('#lesson-heading').textContent(),'Free Lab');
  await command('cat free_marker');await idle();
  assert.deepEqual(await page.evaluate(()=>{const lab=window.auditLabs.at(-1);return [lab.fs.exists(lab.terminals.values().next().value.env.HOME+'/ros2_ws/free_marker'),lab.runtime.nodes.size];}),[true,0]);
  await select(0);await command('ls');await idle();assert((await page.locator('.terminal-transcript pre').first().textContent()).includes('course_marker'));
  await select(7);await command('ls');await idle();assert((await page.locator('.terminal-transcript pre').first().textContent()).includes('playground_marker'));
  await select(8);await page.locator('#reset').click();await page.waitForTimeout(150);
  assert.deepEqual(await page.evaluate(()=>{const l=window.auditLabs.at(-1),home=l.terminals.values().next().value.env.HOME;return [l.fs.exists(home+'/ros2_ws/src'),l.workspace.installed.size,l.terminals.size,l.runtime.nodes.size];}),[true,0,1,0]);
  await select(0);await command('ls');await idle();assert((await page.locator('.terminal-transcript pre').first().textContent()).includes('course_marker'));
  await select(8);await page.setViewportSize({width:390,height:844});await page.waitForFunction(()=>document.documentElement.scrollWidth<=innerWidth+1);
  assert.deepEqual(errors,[]);results.push({language,hello:true,separateEnvironments:true,workspaceIsolation:true,reload:true,reset:true,robotStartStopCycles:20,zeroTwist:true,mobile:true});console.log('PASS Free Lab '+JSON.stringify(results.at(-1)));await page.close();
 }
 await mkdir('artifacts/audit',{recursive:true});await writeFile('artifacts/audit/free-lab.json',JSON.stringify(results,null,2));
}finally{await browser.close();}
