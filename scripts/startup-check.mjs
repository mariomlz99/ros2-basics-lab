import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true});
try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto(process.env.LAB_URL||'http://127.0.0.1:8017/ros2-basics-lab/');await page.locator('#start').click();await page.locator('.xterm').waitFor();
 const command=async(index,text)=>{const card=page.locator('.terminal-card').nth(index);await card.locator('.xterm-helper-textarea').focus();await page.keyboard.insertText(text);await page.keyboard.press('Enter');await page.waitForTimeout(180);};
 const transcript=index=>page.locator('.terminal-transcript pre').nth(index).textContent();
 await command(0,"echo 'export STARTUP_CHECK=loaded' > ~/.bashrc");
 await page.getByRole('button',{name:'+ Terminal',exact:true}).click();await page.locator('.terminal-card').nth(1).waitFor();
 await command(1,'echo $STARTUP_CHECK');assert.match(await transcript(1),/\nloaded\n/);
 await command(1,'ros2 --help');assert.match(await transcript(1),/ros2: command not found/);
 await command(0,'ros2 --help');assert.match(await transcript(0),/Commands:/);
 await command(1,'source /opt/ros/jazzy/setup.bash');await command(1,'/opt/ros/jazzy/bin/ros2 --help');assert.match(await transcript(1),/Commands:/);
 await command(1,'export PATH=/usr/bin:/bin');await command(1,'which ros2');await command(1,'ros2 --help');assert.match(await transcript(1),/ros2: command not found/);
 await page.locator('#save-session').click();await page.waitForTimeout(500);await page.reload();await page.locator('#start').click();await page.locator('.terminal-card').nth(1).waitFor();
 await command(1,'ros2 --help');assert.match(await transcript(1),/ros2: command not found/);
 await command(1,'echo $STARTUP_CHECK');assert.match(await transcript(1),/\nloaded\n/);
 assert.deepEqual(errors,[]);console.log('PASS visible bashrc startup, independent environments, explicit executable paths and saved-session restoration');
}finally{await browser.close();}
