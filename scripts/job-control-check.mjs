import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true});
try{
 const page=await browser.newPage();await page.goto(process.env.LAB_URL||'http://127.0.0.1:8017/ros2-basics-lab/');await page.locator('#start').click();await page.locator('.xterm').waitFor();
 const input=page.locator('.xterm-helper-textarea').first(),log=()=>page.locator('.terminal-transcript pre').first().textContent();
 const command=async text=>{await input.focus();await page.keyboard.insertText(text);await page.keyboard.press('Enter');await page.waitForTimeout(150);};
 await command(`ros2 topic pub --rate 10 /control_z std_msgs/msg/String "{data: hello}"`);await page.waitForTimeout(300);
 await page.keyboard.press('Control+z');await page.waitForTimeout(200);assert.match(await log(),/\^Z\n\[1\]\+  Stopped/);const frozen=await log();await page.waitForTimeout(400);assert.equal(await log(),frozen);
 await command('jobs');assert.match(await log(),/jobs\n\[1\]\+  Stopped/);await command('fg');const before=(await log()).match(/publishing #/g).length;await page.waitForTimeout(300);assert((await log()).match(/publishing #/g).length>before);
 await page.keyboard.press('Control+c');await command('jobs');assert((await log()).endsWith('jobs\n'));await command('echo terminal-ready');assert((await log()).endsWith('terminal-ready\n'));
 console.log('PASS browser Ctrl+Z, stopped output, jobs, fg, resumed publisher and Ctrl+C');
}finally{await browser.close();}
