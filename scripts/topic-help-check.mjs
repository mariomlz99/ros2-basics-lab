import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {NATIVE_INTERFACE_TEXT} from '../src/interfaces/native-text.js';
import {nativeTopicHelp} from '../src/native-topic-help.js';
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true});
try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.LAB_URL||'http://127.0.0.1:8017/ros2-basics-lab/');await page.locator('#start').click();await page.locator('.xterm').waitFor();
 for(const command of ['topic echo','topic pub','topic pub /example','topic hz','topic info','topic type','topic pub --rate','topic echo --help','topic echo --h','node list --help']){
  await page.locator('.xterm-helper-textarea').first().focus();await page.keyboard.insertText('ros2 '+command);await page.keyboard.press('Enter');
  await page.waitForFunction(expected=>document.querySelector('.terminal-transcript pre').textContent.includes(expected),nativeTopicHelp[command].text);
  await page.waitForFunction(()=>document.querySelector('.terminal-state').textContent.startsWith('Jazzy'));
 }
 await page.locator('.xterm-helper-textarea').first().focus();await page.keyboard.insertText('ros2 interface show geometry_msgs/msg/Twist');await page.keyboard.press('Enter');
 await page.waitForFunction(expected=>document.querySelector('.terminal-transcript pre').textContent.includes(expected),NATIVE_INTERFACE_TEXT['geometry_msgs/msg/Twist'].default);
 assert.deepEqual(errors,[]);console.log('PASS visible native topic usage/errors, help and return to prompt');
}finally{await browser.close();}
