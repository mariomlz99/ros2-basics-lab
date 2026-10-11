import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true});
try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.LAB_URL||'http://127.0.0.1:8017/ros2-basics-lab/');
 await page.locator('#start').click();await page.locator('.xterm').waitFor();
 const buttons=page.locator('#nav button,#exercise-nav button');assert.equal(await buttons.count(),8);
 for(let i=0;i<8;i++){assert.equal(await buttons.nth(i).isDisabled(),false);assert.equal(await buttons.nth(i).locator('.lock-icon').count(),0);}
 for(let i=0;i<7;i++){await buttons.nth(i).click();assert((await page.locator('#lesson-heading').textContent()).startsWith(`${i+1}.`));}
 await buttons.nth(7).click();assert.equal(await page.locator('#lesson-heading').textContent(),'Robotics Playground');
 assert(await page.locator('#playground-stage').isVisible());
 assert.match(await page.locator('#playground-status').textContent(),/simulator stopped/);
 await page.locator('#playground-start').click();assert.equal(await page.locator('#playground-status').textContent(),'Live sensor streams');
 await page.locator('#playground-stop').click();assert.match(await page.locator('#playground-status').textContent(),/simulator stopped/);
 for(const index of [3,4,5,6,7]){
  await page.evaluate(async index=>{
   const {Lab}=await import('./src/lab.js');const {captureSession,saveSession}=await import('./src/session.js');
   const lab=new Lab();lab.fs.write('/home/student/review-preserved.txt','keep my work');lab.terminal();
   const ui={lessonIndex:index,language:'python',progress:[],guidePositions:[],activeFile:null,draft:null};
   const record=captureSession(lab,ui),other=new Lab();other.fs.write('/home/student/other-preserved.txt','keep the other workspace');other.terminal();
   record.other=captureSession(other,{...ui,lessonIndex:index===7?2:7});await saveSession(record);
  },index);
  await page.reload();await page.locator('#start').click();await page.locator('.xterm').waitFor();
  const heading=await page.locator('#lesson-heading').textContent();assert(index===7?heading==='Robotics Playground':heading.startsWith(`${index+1}.`));
  assert.equal(await page.locator('#playground-stage').isVisible(),index===7);
  await page.locator('#save-session').click();await page.waitForTimeout(200);
  const preserved=await page.evaluate(async()=>{const {loadSession}=await import('./src/session.js');const record=await loadSession();return [JSON.stringify(record.workspace.entries),JSON.stringify(record.other.workspace.entries)];});
  assert(preserved[0].includes('review-preserved.txt'));assert(preserved[1].includes('other-preserved.txt'));
  await buttons.nth(index===7?2:7).click();assert(await page.locator('#file-tree').textContent().then(text=>text.includes('other-preserved.txt')));
  await buttons.nth(index).click();assert(await page.locator('#file-tree').textContent().then(text=>text.includes('review-preserved.txt')));
 }
 assert.deepEqual(errors,[]);console.log('PASS all lessons and playground open, simulator start/stop, saved selections and both workspaces preserved');
}finally{await browser.close();}
