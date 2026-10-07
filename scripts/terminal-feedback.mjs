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
 await page.locator('.command-toggle').first().click();assert.equal(await page.locator('.command:visible').count(),15);await page.locator('.command-toggle').first().click();assert.equal(await page.locator('.command:visible').count(),4);
 await input.focus();await page.keyboard.insertText('echo "Hello" > notes.txt');await page.waitForTimeout(300);await page.screenshot({path:'artifacts/screenshots/terminal-feedback.png',fullPage:true});console.log('PASS echo/append, rm -rf *, base topics/echo cleanup, compact commands and visible files');
}finally{await browser.close();}
