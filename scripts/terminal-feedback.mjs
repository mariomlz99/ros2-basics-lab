import {chromium} from 'playwright-core';import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});await page.goto('http://127.0.0.1:8017/ros2-basics-lab/');await page.locator('#start').click();await page.locator('.xterm').waitFor();
 const input=page.locator('.xterm-helper-textarea'),transcript=page.locator('.terminal-transcript pre');
 const command=async text=>{await input.focus();await page.keyboard.insertText(text);await page.keyboard.press('Enter');await page.waitForTimeout(120);};
 await command('mkdir -p practice/practice');await command('cd practice');await command('echo "This is my text" > notes.txt');await command('echo "Hello" >> notes.txt');await command('cat notes.txt');assert((await transcript.textContent()).includes('This is my text\nHello'));
 assert(await page.locator('#file-tree button').filter({hasText:'notes.txt'}).count());
 await command('rm -rf *');await command('ls');assert.equal(await page.locator('#file-tree button').filter({hasText:'notes.txt'}).count(),0);
 await command('ros2 topic list');await command('ros2 topic info /parameter_events');await command('ros2 topic info /rosout');assert((await transcript.textContent()).includes('Publisher count: 1\nSubscription count: 0'));
 await command('ros2 topic echo /rosout');await page.keyboard.press('Control+c');await command('ros2 topic info /rosout');assert(!(await transcript.textContent()).includes('Unknown topic'));
 assert.equal(await page.locator('.command:visible').count(),1);
 assert.equal(await page.locator('.command code').textContent(),'pwd');
 await page.locator('#guide-next').click();assert.equal(await page.locator('.command code').textContent(),'ls -a');
 await page.locator('#nav button').nth(1).click();await page.locator('#nav button').nth(0).click();assert.equal(await page.locator('.command code').textContent(),'ls -a');
 await page.locator('#guide-back').click();assert.equal(await page.locator('.command code').textContent(),'pwd');
 await page.locator('#guide-mode').click();assert.equal(await page.locator('.command:visible').count(),15);await page.locator('#guide-mode').click();assert.equal(await page.locator('.command:visible').count(),1);
 // A canceled shortcut must never reach the browser's inspector handler.
 await page.evaluate(()=>{window.copyEvents=[];document.querySelector('.terminal-screen').addEventListener('keydown',e=>{if(e.code==='KeyC')setTimeout(()=>window.copyEvents.push(e.defaultPrevented),0);},true);});
 await input.focus();await page.keyboard.press('Control+Shift+c');await page.waitForFunction(()=>window.copyEvents.length);assert.deepEqual(await page.evaluate(()=>window.copyEvents),[true]);
 await page.context().grantPermissions(['clipboard-read','clipboard-write']);
 await page.evaluate(async()=>{
  const {Lab}=await import('./src/lab.js');const lab=new Lab();const host=document.createElement('div');document.body.append(host);
  const view=new window.TerminalView(lab,lab.terminal(),host,()=>{});window.copyTest={view,host};
  await new Promise(resolve=>view.xterm.write('selected command',resolve));view.xterm.selectAll();window.selectedCommand=view.xterm.getSelection();view.xterm.focus();
 });
 await page.keyboard.press('Control+c');assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),await page.evaluate(()=>window.selectedCommand));
 assert.equal(await page.evaluate(()=>window.copyTest.view.element.querySelector('.terminal-transcript pre').textContent),'');
 await page.keyboard.press('Control+Shift+c');assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),await page.evaluate(()=>window.selectedCommand));
 await page.evaluate(()=>{window.copyTest.view.destroy();window.copyTest.host.remove();});
 // Every guide page remains reachable; Next alone does not complete a lesson.
 while(!await page.locator('#guide-next').isDisabled())await page.locator('#guide-next').click();
 await page.locator('.complete').click();assert.equal(await page.locator('#progress').textContent(),'0 / 6 completed');
 await page.locator('#nav button').nth(1).click();
 await input.focus();await page.keyboard.insertText('echo "Hello" > notes.txt');await page.waitForTimeout(300);await page.screenshot({path:'artifacts/screenshots/terminal-feedback.png',fullPage:true});console.log('PASS echo/append, rm -rf *, base topics/echo cleanup, guided navigation, scoped keyboard shortcuts and visible files');
}finally{await browser.close();}
