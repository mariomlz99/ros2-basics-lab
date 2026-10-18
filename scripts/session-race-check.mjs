import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true});
try{
 const page=await browser.newPage();await page.goto(process.env.LAB_URL||'http://127.0.0.1:8033/ros2-basics-lab/');await page.locator('#start').click();await page.locator('.xterm').waitFor();
 // Hold a completed command at its asynchronous return boundary, so autosave
 // observes history before the successful checker evidence arrives.
 await page.evaluate(async()=>{
  const base=document.querySelector('script[src*="/app.js"]').src,{Terminal}=await import(new URL('shell.js',base)),execute=Terminal.prototype.executeCommand;
  Terminal.prototype.executeCommand=async function(line,options){const result=await execute.call(this,line,options);if(line==='pwd'){window.commandWaiting=true;await new Promise(resolve=>window.releaseCommand=resolve);}return result;};
 });
 await page.locator('.xterm-helper-textarea').focus();await page.keyboard.insertText('pwd');await page.keyboard.press('Enter');await page.waitForFunction(()=>window.commandWaiting);
 await page.locator('#save-session').click();await page.waitForTimeout(500);await page.evaluate(()=>window.releaseCommand());
 await page.waitForTimeout(3300);
 const saved=await page.evaluate(async()=>{const base=document.querySelector('script[src*="/app.js"]').src,{loadSession}=await import(new URL('session.js',base));return (await loadSession()).terminals[0];});
 assert(saved.history.includes('pwd'));assert(saved.completedCommands.some(c=>c.line==='pwd'),'Autosave must persist newly completed commands even when history was saved earlier');
 console.log('PASS asynchronous command evidence autosave');
}finally{await browser.close();}
