import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true});
const evidence=[];
try{
 const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('dialog',dialog=>dialog.accept());
 await page.goto((process.env.LAB_URL||'http://127.0.0.1:8044/ros2-basics-lab/')+'?start=1');await page.locator('#start').click();
 await page.locator('#exercise-nav button[data-index="9"]').click();
 await page.locator('#tf-start').click();await page.locator('.tf-node').first().waitFor();
 assert.equal(await page.locator('.tf-node').count(),7);
 const worldOrigin=async()=>page.locator('[data-frame-origin="odom"]').evaluate(el=>[el.getAttribute('cx'),el.getAttribute('cy')]);
 const fixedOrigin=await worldOrigin();
 await page.locator('#tf-forward').click();await page.waitForTimeout(650);await page.locator('#tf-halt').click();
 assert.deepEqual(await worldOrigin(),fixedOrigin,'odom stays anchored while base_link moves');
 await mkdir('artifacts/tf',{recursive:true});
 await page.locator('.terminal-screen').scrollIntoViewIfNeeded();await page.waitForTimeout(100);await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(100);
 await page.screenshot({path:'artifacts/tf/frames-desktop.png',fullPage:true});
 await page.locator('[data-frame="laser_link"]').focus();await page.keyboard.press('Enter');
 assert.equal(await page.locator('#tf-reference').inputValue(),'base_link');assert.equal(await page.locator('#tf-frame').inputValue(),'laser_link');
 assert.match(await page.locator('.tf-values').textContent(),/0.120 m/);
 await page.locator('.tf-ros summary').click();assert.match(await page.locator('.tf-ros pre').textContent(),/rotation.z:.*\nrotation.w:/);await page.locator('.tf-ros summary').click();
 await page.screenshot({path:'artifacts/tf/mount-detail.png',fullPage:true});
 await page.locator('#tf-stage').screenshot({path:'artifacts/tf/visualizer-mount.png'});
 await page.locator('[data-exercise="point"]').click();
 await page.locator('#tf-turn').click();await page.waitForTimeout(650);await page.locator('#tf-halt').click();
 assert(await page.locator('.tf-target').isVisible());
 const targetBounds=await page.locator('.tf-target-mark').evaluate(el=>{const b=el.getBBox();return {x:b.x,y:b.y,right:b.x+b.width,bottom:b.y+b.height};});
 assert(targetBounds.x>=0&&targetBounds.y>=0&&targetBounds.right<=600&&targetBounds.bottom<=310,'The world target stays inside the spatial view');
 await page.screenshot({path:'artifacts/tf/target-desktop.png',fullPage:true});
 for(const [name,width,height]of [['desktop',1440,900],['tablet',820,1180],['phone',390,844]]){
  await page.setViewportSize({width,height});await page.waitForTimeout(200);
  const bounds=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,tree:document.querySelector('.tf-tree').getBoundingClientRect().width,space:document.querySelector('.tf-space').getBoundingClientRect().width}));
  assert(bounds.scroll<=width+1,JSON.stringify(bounds));assert(bounds.tree>170);assert(bounds.space>250);
  await page.screenshot({path:`artifacts/tf/${name}.png`,fullPage:true});evidence.push({name,...bounds});
 }
 await page.setViewportSize({width:1440,height:900});await page.locator('#theme').selectOption('dark');
 await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:'artifacts/tf/target-dark.png',fullPage:true});
 await page.locator('#tf-stage').screenshot({path:'artifacts/tf/visualizer-target.png'});
 await page.locator('#tf-stop').click();assert.equal(await page.locator('.tf-node').count(),0);
 assert.match(await page.locator('.tf-live').textContent(),/stopped/);
 await page.locator('#tf-start').click();assert.equal(await page.locator('.tf-node').count(),7);
 await page.locator('#nav button').first().click();assert(await page.locator('#tf-stage').isHidden());
 await page.locator('#exercise-nav button[data-index="9"]').click();assert.equal(await page.locator('.tf-node').count(),0);
 const direct=new URL(process.env.LAB_URL||'http://127.0.0.1:8044/ros2-basics-lab/');direct.searchParams.set('start','1');direct.searchParams.set('unit','tf');
 await page.goto(direct.href);await page.locator('#start').click();await page.locator('#tf-start').waitFor();assert.equal(await page.locator('#lesson-heading').textContent(),'TF & Odometry');
 assert.deepEqual(errors,[]);await writeFile('artifacts/tf/visual-browser.json',JSON.stringify(evidence,null,2));console.log('PASS TF visual controls, keyboard selection, live tree, lifecycle, desktop/tablet/phone');
}finally{await browser.close();}
