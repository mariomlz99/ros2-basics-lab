import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {playgroundLesson} from '../src/playground/lessons.js';
import {guidePages} from '../src/course/guide.js';
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true});
try{
 for(const language of ['python','cpp']){
  const page=await browser.newPage({viewport:{width:1520,height:1100}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',dialog=>dialog.accept());
  await page.goto(process.env.LAB_URL||'http://127.0.0.1:8031/ros2-basics-lab/');
  await page.evaluate(async()=>{
   const base=document.querySelector('script[type="module"]').src,{Runtime}=await import(new URL('runtime/graph.js',base)),publish=Runtime.prototype.publish;
   window.cameraFrames=[];Runtime.prototype.publish=function(topic,...args){if(topic==='/camera/image_raw'){window.cameraFrames.push(performance.now());if(window.cameraFrames.length>200)window.cameraFrames.shift();}return publish.call(this,topic,...args);};
  });
  await page.locator('#start').click();await page.locator('.xterm').waitFor();await page.locator('#exercise-nav button[data-index="7"]').click();await page.locator('#language').selectOption(language);await page.locator('#add-terminal').click();
  assert.equal(await page.locator('[data-exercise]').count(),7);
  const command=async(i,text)=>{const input=page.locator('.xterm-helper-textarea').nth(i);await input.focus();await page.keyboard.type(text,{delay:1});await page.keyboard.press('Enter');};
  const idle=async i=>page.waitForFunction(i=>/^(Jazzy|ROS environment not sourced)/.test(document.querySelectorAll('.terminal-state')[i].textContent),i,{timeout:180000});
  const stop=async i=>{await page.locator('.xterm-helper-textarea').nth(i).focus();await page.keyboard.press('Control+c');await page.waitForTimeout(100);};
  const allPages=guidePages(playgroundLesson(language)).slice(0,-1),only=process.env.PLAYGROUND_ONLY;
  if(only){await page.locator('[data-exercise="'+only+'"]').click();await page.locator('#playground-start').click();}
  const first=only?allPages.findIndex(p=>p.some(s=>s.kind==='section'&&s.id===only)):0,pages=allPages.slice(first);
  for(let index=0;index<pages.length;index++){
   for(const step of pages[index]){
    if(step.kind==='section')console.log(language+' exercise: '+step.id);
    if(step.kind==='simulator-action'){await page.locator('#playground-start').click();if(step.action==='reset')await page.locator('#playground-reset').click();}
    if(step.kind==='terminal-action')await stop(step.terminal-1);
    if(step.kind==='files')await page.getByRole('button',{name:/^(Add file|Replace with example)$/}).click();
    if(step.kind==='commands')for(const line of step.commands){
     assert.equal((await page.locator('#lesson .command code').textContent()).trim(),line);
     await command(step.terminal-1,line);
     if(line.startsWith('ros2 run ')){await page.waitForTimeout(250);await page.waitForFunction(i=>document.querySelectorAll('.terminal-state')[i].textContent.includes('callbacks ready'),step.terminal-1,{timeout:90000}).catch(async error=>{console.log(await page.locator('.terminal-transcript pre').allTextContents());throw error;});}
     else if(!line.includes('pub --rate')){await page.waitForTimeout(100);await idle(step.terminal-1);}
     else await page.waitForTimeout(250);
    }
   }
   if(index<pages.length-1)await page.locator('#guide-next').click();
  }
  await page.waitForTimeout(500);
  const outputs=await page.locator('.terminal-transcript pre').allTextContents();assert(outputs[0].includes('Front:'));assert(outputs[1].includes('Image:'));
  for(const output of outputs)assert(!/Traceback|failed to load|Error:|Could not determine|not found/.test(output),output.slice(-2500));
  await stop(0);await stop(1);
  const rate=await page.evaluate(()=>{const f=window.cameraFrames.slice(-20);return 1000*(f.length-1)/(f.at(-1)-f[0]);});assert(rate>=7&&rate<=13,'Camera rate '+rate);
  await page.locator('[data-exercise="tf"]').click();await page.locator('#playground-reset').click();await page.locator('#guide-next').click();
  await mkdir('artifacts/screenshots',{recursive:true});await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:`artifacts/screenshots/playground-${language}.png`});
  await page.locator('#playground-stop').click();await page.locator('#nav button').first().click();assert(await page.locator('#playground-stage').isHidden());
  await page.locator('#exercise-nav button[data-index="7"]').click();assert.match(await page.locator('#playground-status').textContent(),/stopped/);
  await page.setViewportSize({width:390,height:844});await page.waitForFunction(()=>document.documentElement.scrollWidth<=innerWidth+1,{},{timeout:5000}).catch(async error=>{await page.screenshot({path:'artifacts/screenshots/playground-mobile-overflow.png'});console.log(await page.evaluate(()=>[...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().right>innerWidth+1).map(e=>[e.tagName,e.id,e.className,e.getBoundingClientRect().right]).slice(0,20)));throw error;});await page.locator('[data-exercise="camera"]').click();assert((await page.locator('.exercise-title').textContent()).includes('Camera'));
  assert.deepEqual(errors,[]);console.log(`PASS ${language}: every guided exercise, real sensor readers, TF, cleanup, mobile navigation; camera ${rate.toFixed(1)} Hz`);await page.close();
 }
}finally{await browser.close();}
