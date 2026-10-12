import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:899,height:900}}),errors=[],measurements=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.LAB_URL||'http://127.0.0.1:8033/ros2-basics-lab/');await page.locator('#start').click();await page.locator('.xterm').waitFor();await page.locator('[data-index="7"]').click();
 await mkdir('artifacts/screenshots',{recursive:true});await mkdir('artifacts/audit',{recursive:true});
 for(const width of [1440,1100,899,760,650,390]){
  await page.setViewportSize({width,height:900});await page.locator('#restore-layout').click();
  const measured=await page.locator('.playground-streams').evaluate(grid=>{
   const box=e=>{const b=e.getBoundingClientRect();return {x:b.x,y:b.y,width:b.width,height:b.height,right:b.right,bottom:b.bottom};};
   return {viewport:innerWidth,panel:box(grid),figures:[...grid.children].map(f=>({figure:box(f),caption:box(f.querySelector('figcaption')),button:box(f.querySelector('button')),canvas:box(f.querySelector('canvas')),captionScroll:f.querySelector('figcaption').scrollWidth}))};
  });
  for(const f of measured.figures){assert(f.canvas.width>=260,`${width}: sensor view has useful width`);assert(f.captionScroll<=f.caption.width+1,`${width}: complete topic label fits`);assert(f.caption.right<=f.button.x+1,`${width}: caption and control do not overlap`);assert(f.canvas.y>=Math.max(f.caption.bottom,f.button.bottom)-1,`${width}: canvas starts below its heading`);}
  if(measured.panel.width<=560)assert(measured.figures.every(f=>Math.abs(f.figure.x-measured.figures[0].figure.x)<1));
  else if(measured.panel.width<=920){assert(measured.figures[1].figure.y>=measured.figures[0].figure.bottom);assert(Math.abs(measured.figures[1].figure.y-measured.figures[2].figure.y)<1);}
  else assert(measured.figures.every(f=>Math.abs(f.figure.y-measured.figures[0].figure.y)<1));
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No horizontal page overflow');
  if([1440,899,390].includes(width)){await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:`artifacts/screenshots/playground-responsive-${width}.png`,fullPage:true});}
  measurements.push(measured);
 }
 await page.setViewportSize({width:899,height:900});await page.locator('.stream-expand').nth(1).click();assert.equal(await page.locator('.stream-expand').nth(1).getAttribute('aria-expanded'),'true');assert.equal(await page.locator('figure.expanded').count(),1);await page.locator('#restore-layout').click();assert.equal(await page.locator('figure.expanded').count(),0);
 await page.locator('#playground-start').click();assert.match(await page.locator('#playground-status').textContent(),/Live/);await page.locator('#playground-stop').click();assert.deepEqual(errors,[]);
 await writeFile('artifacts/audit/playground-responsive.json',JSON.stringify(measurements,null,2));console.log('PASS responsive simulator at six widths, full captions, view controls and sensor start/stop');
}finally{await browser.close();}
