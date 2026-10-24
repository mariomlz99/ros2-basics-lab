// Reproduced independently by two reviewers on both live products, Chrome/Firefox.
import assert from 'node:assert/strict';
import {chromium,firefox} from 'playwright-core';
import {mkdir,writeFile} from 'node:fs/promises';
const url=process.env.LAB_URL,output=process.env.AUDIT_OUTPUT||'artifacts/session-multitab';
if(!url)throw Error('LAB_URL is required');await mkdir(output,{recursive:true});
const results=[];
for(const name of (process.env.AUDIT_ENGINES||'chrome,firefox').split(',')){
 const browser=await(name==='chrome'?chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome'}):firefox.launch({headless:true}));
 try{
  const context=await browser.newContext();
  async function open(){const p=await context.newPage();p.on('dialog',d=>d.accept());await p.goto(url);if(await p.locator('#start:visible').count())await p.locator('#start').click();await p.locator('.xterm-helper-textarea').first().waitFor({state:'attached'});await p.getByRole('button',{name:/Free Lab/}).click();return p;}
  async function cmd(p,line){const before=await p.locator('.terminal-transcript pre').first().textContent();await p.locator('.xterm-helper-textarea').first().focus();await p.keyboard.type(line);await p.keyboard.press('Enter');await p.waitForTimeout(200);return(await p.locator('.terminal-transcript pre').first().textContent()).slice(before.length);}
  async function save(p){await p.locator('#save-session').click();await p.waitForFunction(()=>!/Saving/.test(document.querySelector('#session-state').textContent));return p.locator('#session-state').innerText();}
  const a=await open();await cmd(a,'echo SEED > ~/ros2_ws/src/seed.txt');await save(a);
  const b=await open();await save(b); // Establish a known newer save, with the same seed.
  await cmd(a,'echo ALPHA > ~/ros2_ws/src/alpha.txt');const staleStatus=await save(a);
  const localAlpha=await cmd(a,'cat ~/ros2_ws/src/alpha.txt');
  await cmd(b,'echo BETA > ~/ros2_ws/src/beta.txt');const latestStatus=await save(b);
  const c=await open();const savedBeta=await cmd(c,'cat ~/ros2_ws/src/beta.txt');
  const record={url,browser:name,version:browser.version(),staleStatus,latestStatus,localAlpha,savedBeta};results.push(record);await writeFile(output+'/results.json',JSON.stringify(results,null,2));
  assert.match(staleStatus,/another tab/i,'stale workspace must warn rather than report saved');assert.match(localAlpha,/\nALPHA\n/,'conflicted local changes remain readable');assert.match(latestStatus,/saved/i,'current writer can keep saving');assert.match(savedBeta,/\nBETA\n/,'stale writer cannot replace newer saved workspace');
  console.log('PASS '+name+' rejects stale-tab writes, retains local edits and preserves latest persisted work');await context.close();
 }finally{await browser.close();}
}
