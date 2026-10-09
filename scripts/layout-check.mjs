import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:960,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.LAB_URL||'http://127.0.0.1:8017/ros2-basics-lab/');
 await page.locator('#start').click();await page.locator('.xterm').waitFor();
 const height=async selector=>(await page.locator(selector).boundingBox()).height;
 for(const width of [960,700,390]){
  await page.setViewportSize({width,height:1000});await page.locator('#restore-layout').click();
  for(const [handle,panel] of [['#resize-text','#lesson'],['#resize-editor','#files']]){
   const divider=page.locator(handle);assert(await divider.isVisible());
   await divider.scrollIntoViewIfNeeded();const box=await divider.boundingBox(),before=await height(panel);
   await page.mouse.move(box.x+box.width/2,box.y+8);await page.mouse.down();await page.mouse.move(box.x+box.width/2,box.y+68);await page.mouse.up();
   assert(Math.abs(await height(panel)-before-60)<2,`${width}: drag ${panel}`);
   await divider.focus();await page.keyboard.press('ArrowUp');assert(Math.abs(await height(panel)-before-40)<2);
  }
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${width}: no horizontal overflow`);
 }
 await page.reload();await page.locator('#start').click();await page.locator('.xterm').waitFor();
 assert.equal(await height('#lesson'),410);assert.equal(await height('#files'),390);
 await page.setViewportSize({width:1440,height:1000});assert(await page.locator('#resize-text').isHidden());
 const before=await height('#workspace');await page.locator('#resize-workspace').focus();await page.keyboard.press('ArrowDown');assert.equal(await height('#workspace'),before+20);
 await page.setViewportSize({width:960,height:1000});assert.equal(await height('#lesson'),410);
 await page.locator('#restore-layout').click();assert.equal(await height('#lesson'),370);assert.equal(await height('#files'),350);
 assert.deepEqual(errors,[]);console.log('PASS narrow and wide resizing, keyboard controls, saved sizes, restore and no overflow');
}finally{await browser.close();}
