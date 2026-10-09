import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {topicsLesson,TOPICS_TITLE} from '../src/topics-lesson.js';
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true});
try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.LAB_URL||'http://127.0.0.1:8017/ros2-basics-lab/');await page.locator('#start').click();await page.locator('.xterm').waitFor();
 await page.locator('#nav button').nth(1).click();assert.match(await page.locator('#lesson-heading').textContent(),new RegExp(TOPICS_TITLE.replace('&','&')));
 await page.locator('#guide-mode').click();
 assert.deepEqual(await page.locator('.command code').allTextContents(),topicsLesson().filter(s=>s.kind==='commands').flatMap(s=>s.commands));
 for(let i=0;i<2;i++)await page.getByRole('button',{name:'+ Terminal',exact:true}).click();
 const transcript=i=>page.locator('.terminal-transcript pre').nth(i).textContent();
 const focus=async i=>page.locator('.terminal-card').nth(i).locator('.xterm-helper-textarea').focus();
 for(const step of topicsLesson()){
  if(step.kind==='terminal-action'){await focus(step.terminal-1);await page.keyboard.press('Control+c');await page.waitForTimeout(100);}
  if(step.kind!=='commands')continue;
  for(const command of step.commands){
   await focus(step.terminal-1);await page.keyboard.insertText(command);await page.keyboard.press('Enter');await page.waitForTimeout(200);
   if(command.includes('pub /lab_chat'))await page.waitForTimeout(1100);
   if(command.includes('pub --times'))await page.waitForTimeout(1200);
   if(command.includes('hz /lab_twist')){await page.waitForTimeout(1300);assert.match(await transcript(2),/average rate:/);}
   if(command.includes('pub --once /lab_wait'))assert.match(await transcript(0),/Waiting for at least 1/);
   if(command.includes('echo /lab_wait'))await page.waitForTimeout(300);
  }
 }
 const output=await transcript(1);assert.match(output,/data: Hello from Terminal 1/);assert.equal((output.match(/data: Three messages/g)||[]).length,3);assert.match(output,/data: Ready when you are/);assert.doesNotMatch(output,/data: No replay/);
 await page.locator('.complete').click();assert.equal(await page.locator('.checks > p').count(),5);assert((await page.locator('.checks > p').allTextContents()).every(s=>s.startsWith('✓')));assert.deepEqual(errors,[]);
 assert(await page.locator('#next-lesson').isEnabled());await page.locator('#next-lesson').click();assert.match(await page.locator('#lesson-heading').textContent(),/Workspace & packages/);await page.locator('#nav button').nth(1).click();
 await page.locator('#save-session').click();await page.waitForTimeout(400);await page.reload();await page.locator('#start').click();await page.locator('.xterm').first().waitFor();assert.match(await page.locator('#lesson-heading').textContent(),/Talking ROS 2/);
 assert(await page.locator('#nav button').nth(3).isDisabled());assert(await page.locator('#exercise-nav button').isDisabled());
 console.log('PASS visible topic lesson: all commands, three terminals, Ctrl+C, delivery, rate, no replay, checks and saved selection');
}finally{await browser.close();}
