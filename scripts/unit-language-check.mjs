// Public UI: compare the same Unit 3 step, including an existing package.
import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.LAB_URL||'http://127.0.0.1:8062/basics.html';
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true});
const results=[],errors=[];
await mkdir('artifacts/unit-language',{recursive:true});
try{
 for(const initial of ['python','cpp']){
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  page.on('pageerror',e=>errors.push(e.message));
  page.on('dialog',d=>d.accept());
  await page.goto(base);await page.locator('#start').click();
  const heading=page.locator('#unit-heading,#lesson-heading'),panel=page.locator('#unit,#lesson');
  await page.locator('#language').selectOption(initial);
  await page.locator('[data-index="2"]').click();
  // Compare all stages, rather than only the source-file page that first failed.
  const count=Number((await page.locator('.guide-progress').innerText()).split('/').at(-1));
  for(let n=0;n<count;n++){
   const progress=await page.locator('.guide-progress').innerText();
   const commands=await panel.locator('.command code').allTextContents();
   await page.locator('#language').selectOption(initial==='python'?'cpp':'python');
   assert.equal(await page.locator('.guide-progress').innerText(),progress);
   assert.deepEqual((await panel.locator('.command code').allTextContents()).map(c=>c.replace('ament_cmake','ament_python')),commands.map(c=>c.replace('ament_cmake','ament_python')));
   await page.locator('#language').selectOption(initial);
   if(n<count-1)await page.locator('#guide-next').click();
  }
  for(let n=count-1;n>7;n--)await page.locator('#guide-back').click();
  const before=await page.locator('.guide-progress').innerText();
  const other=initial==='python'?'cpp':'python';
  await page.locator('#language').selectOption(other);
  const after=await page.locator('.guide-progress').innerText();
  const record={initial,before,after,heading:await heading.innerText(),sameStep:before===after,stages:count};results.push(record);
  await page.screenshot({path:`artifacts/unit-language/${initial}-switch.png`});
  // Move to the source page regardless of the initial regression.
  while(!await panel.locator('details').count())await page.locator('#guide-next').click();
  const type=initial==='python'?'ament_python':'ament_cmake';
  const input=page.locator('.xterm-helper-textarea').first();
  for(const line of ['mkdir -p ~/ros2_ws/src','cd ~/ros2_ws/src',`ros2 pkg create --build-type ${type} --license Apache-2.0 --node-name hello my_first_package`]){
   await input.focus();await page.keyboard.insertText(line);await page.keyboard.press('Enter');
   await page.waitForTimeout(120);
  }
  record.unsafeAdd=await panel.getByRole('button',{name:'Add file',exact:true}).count();
  record.warning=await panel.locator('[data-package-guard]').count();
  await page.screenshot({path:`artifacts/unit-language/${initial}-package.png`});
  await page.locator('#language').selectOption(initial);
  record.ownFile=await panel.getByRole('button',{name:'Open file',exact:true}).count();
  // A language/step selection must survive an immediate reload.
  await page.reload();await page.locator('#start').click();await page.locator('.xterm').first().waitFor();
  record.restored=await heading.innerText();
  record.restoredLanguage=await page.locator('#language').inputValue();
  record.restoredStep=await page.locator('.guide-progress').innerText();
  await page.close();
 }
 await writeFile('artifacts/unit-language/results.json',JSON.stringify({results,errors},null,2));
 console.log(JSON.stringify(results,null,2));
 assert.deepEqual(errors,[]);
 for(const r of results){assert(r.sameStep,'Switching language changed the unit step');assert.equal(r.unsafeAdd,0,'Other-language file can be added to the package');assert(r.warning,'Missing package-language notice');assert.equal(r.ownFile,1);assert(r.restored.startsWith('3.'));assert.equal(r.restoredLanguage,r.initial);assert.equal(r.restoredStep,r.before);}
 console.log('PASS Unit 3 language continuity, package protection and immediate reload');
}finally{await browser.close();}
