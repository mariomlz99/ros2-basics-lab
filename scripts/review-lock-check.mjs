import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true});
try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.LAB_URL||'http://127.0.0.1:8017/ros2-basics-lab/');
 await page.locator('#start').click();await page.locator('.xterm').waitFor();
 const buttons=page.locator('#nav button,#exercise-nav button');assert.equal(await buttons.count(),8);
 for(let i=0;i<8;i++){assert.equal(await buttons.nth(i).isDisabled(),i===7);if(i===7)assert.equal(await buttons.nth(i).locator('.lock-icon').textContent(),'🔒');else assert.equal(await buttons.nth(i).locator('.lock-icon').count(),0);}
 for(let i=0;i<7;i++){await buttons.nth(i).click();assert((await page.locator('#lesson-heading').textContent()).startsWith(`${i+1}.`));}
 await buttons.nth(7).evaluate(b=>b.onclick());assert.match(await page.locator('#lesson-heading').textContent(),/^7\./);
 for(const index of [3,4,5,6,7]){
  await page.evaluate(async index=>{
   const {Lab}=await import('./src/lab.js');const {captureSession,saveSession}=await import('./src/session.js');
   const lab=new Lab();lab.fs.write('/home/student/review-preserved.txt','keep my work');lab.terminal();
   await saveSession(captureSession(lab,{lessonIndex:index,language:'python',progress:[],guidePositions:[],activeFile:null,draft:null}));
  },index);
  await page.reload();await page.locator('#start').click();await page.locator('.xterm').waitFor();
  assert((await page.locator('#lesson-heading').textContent()).startsWith(`${index===7?1:index+1}.`));
  assert(await page.locator('#playground-stage').isHidden());
  await page.locator('#save-session').click();await page.waitForTimeout(200);
  const preserved=await page.evaluate(async index=>{const {loadSession}=await import('./src/session.js');const record=await loadSession();return JSON.stringify([...(index===7?record.other:record).workspace.entries]);},index);
  // Preserve saved work when reopening a lesson or redirecting the locked playground.
  assert(preserved.includes('review-preserved.txt'));
 }
 assert.deepEqual(errors,[]);console.log('PASS all seven lessons open, playground locked, saved lesson selections and work preserved');
}finally{await browser.close();}
