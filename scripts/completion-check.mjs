import {chromium} from 'playwright-core';import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1600,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.LAB_URL||'http://127.0.0.1:8017/ros2-basics-lab/');await page.locator('#start').click();await page.locator('.xterm').waitFor();
 const input=page.locator('.xterm-helper-textarea').first(),transcript=()=>page.locator('.terminal-transcript pre').first().textContent();
 await input.focus();await page.keyboard.insertText('ros2 interface show ');await page.keyboard.press('Tab');await page.waitForTimeout(100);assert.doesNotMatch(await transcript(),/Display all|action_msgs\/msg/);
 await page.keyboard.press('Tab');await page.waitForTimeout(100);assert.match(await transcript(),/Display all 14[78] possibilities\? \(y or n\)/);assert.doesNotMatch(await transcript(),/action_msgs\/msg/);
 await page.keyboard.press('n');await page.keyboard.insertText('geometry_msgs/msg/Twist');await page.keyboard.press('Enter');await page.waitForTimeout(200);assert.match(await transcript(),/# This expresses velocity/,'Declining preserves the editable command');
 await page.keyboard.insertText('ros2 interface show ');await page.keyboard.press('Tab');await page.keyboard.press('Tab');await page.keyboard.press('y');await page.waitForTimeout(100);assert.match(await transcript(),/action_msgs\/msg\/GoalInfo/);
 // First page must stop before dumping every completion. q returns to the input.
 assert.doesNotMatch(await transcript(),/unique_identifier_msgs\/msg\/UUID/);
 await page.keyboard.press('q');await page.keyboard.insertText('std_msgs/msg/String');await page.keyboard.press('Enter');await page.waitForTimeout(200);assert.match(await transcript(),/string data/);
 await page.keyboard.insertText('ros2 interface show ');await page.keyboard.press('Tab');await page.keyboard.press('Tab');await page.keyboard.press('Control+c');
 await page.keyboard.insertText('ros2 top');await page.keyboard.press('Tab');await page.keyboard.insertText('list');await page.keyboard.press('Enter');await page.waitForTimeout(200);assert.match(await transcript(),/ros2 topic list\n/);assert.match(await transcript(),/\/parameter_events/);
 assert.deepEqual(errors,[]);console.log('PASS double Tab, query acceptance/refusal, paging, cancellation, command preservation and unique completion');
}finally{await browser.close();}
