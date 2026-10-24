import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium,firefox} from 'playwright-core';
const url=process.env.LAB_URL;if(!url)throw Error('Set LAB_URL');
const out=process.env.OUTPUT_ARTIFACTS||'artifacts/long-output';await mkdir(out,{recursive:true});const results=[];
for(const engine of ['chrome','firefox']){
 const browser=await(engine==='firefox'?firefox:chromium).launch({headless:true,...(engine==='chrome'?{executablePath:'/usr/bin/google-chrome'}:{})});
 const page=await browser.newPage(),r={browser:engine,version:browser.version(),url,started:new Date().toISOString(),pageerrors:[]};page.on('pageerror',e=>r.pageerrors.push({message:e.message,stack:e.stack}));
 try{
  await page.goto(url);if(await page.locator('#start:visible').count())await page.locator('#start').click();await page.getByRole('button',{name:/Free Lab/}).click();
  const input=page.locator('.xterm-helper-textarea').first();
  const command=async text=>{await input.focus();await page.keyboard.type(text);await page.keyboard.press('Enter');await page.waitForTimeout(200);};
  await command('touch ~/audit_long_line.cpp');await command('gedit ~/audit_long_line.cpp');await page.locator('.cm-content').fill('first\nsecond\nthird');await page.locator('#save').click();
  await command(`echo 'audit_long_line.cpp:2:1: error: independent diagnostic control'`);await page.locator('.cm-lintRange-error').first().waitFor();r.diagnosticControl=true;
  for(const [id,suffix] of [['plain',''],['cpp_suffix','.cpp:2:']]){
   const marker='LONG_OUTPUT_DONE_'+id;
   await command(`python3 -c "print('X'*81000+'${suffix}'); print('${marker}')"`);
   await page.waitForFunction(marker=>document.querySelector('.terminal-transcript pre').textContent.split('\n').includes(marker),marker,{timeout:60000});
   await page.waitForFunction(()=>document.querySelector('.terminal-state').textContent.startsWith('Jazzy'),null,{timeout:15000});
   assert.deepEqual(r.pageerrors,[],'Long learner output must not throw in the diagnostic listener');
  }
  await command('echo RECOVERED_INPUT');await page.waitForFunction(()=>document.querySelector('.terminal-transcript pre').textContent.includes('\nRECOVERED_INPUT\n'));
  r.status='PASS';
 }catch(e){r.status='FAIL';r.error=e.stack;process.exitCode=1;}
 r.finished=new Date().toISOString();r.transcriptTail=await page.locator('.terminal-transcript pre').first().textContent().then(x=>x.slice(-700)).catch(()=>null);results.push(r);await writeFile(out+'/results.json',JSON.stringify(results,null,2));console.log(engine,r.status,r.pageerrors.map(e=>e.message));await browser.close();
}
