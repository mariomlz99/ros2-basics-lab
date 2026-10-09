import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
const language=process.env.LAB_LANGUAGE||'python',pkg=language==='cpp'?'cpp_pubsub':'py_pubsub';
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 await page.goto(process.env.LAB_URL||'http://127.0.0.1:8017/ros2-basics-lab/');await page.locator('#start').click();await page.locator('.xterm').waitFor();
 const command=async text=>{await page.locator('.xterm-helper-textarea').focus();await page.keyboard.type(text,{delay:2});await page.keyboard.press('Enter');await page.waitForTimeout(150);};
 await command('mkdir -p ~/practice/ros2_ws/src');await command('cd ~/practice/ros2_ws/src');await command('ros2 pkg create --build-type ament_cmake saved_package');await command('cd ..');await command('colcon build');await command('source install/setup.bash');await command('echo "saved text" > notes.txt');
 await page.locator('#nav button').nth(2).click();await page.locator('#guide-mode').click();await page.locator('.complete').click();assert.equal(await page.locator('.checks p').filter({hasText:'✓'}).count(),3,'Nested workspace passes all three checks');
 await page.locator('#save-session').click();await page.waitForFunction(()=>document.querySelector('#session-state').textContent==='Saved in this browser');await page.waitForTimeout(300);
 await page.reload();await page.locator('#start').click();await page.locator('.xterm').waitFor();assert((await page.locator('#lesson-heading').textContent()).includes('Workspace & packages'));assert.equal(await page.locator('#progress').textContent(),'1 / 6 completed');
 await command('pwd');await command('cat notes.txt');await command('ros2 pkg list');const text=await page.locator('.terminal-transcript pre').textContent();assert(text.includes('/home/student/practice/ros2_ws'));assert(text.includes('saved text'));assert(text.includes('saved_package'));
 await page.locator('#guide-mode').click();await page.locator('.complete').click();assert.equal(await page.locator('.checks p').filter({hasText:'✓'}).count(),3,'Restored installed package and sourced overlay remain valid');
 await command('rm -rf src');await command('mkdir src');await page.locator('.complete').click();assert((await page.locator('.checks p').first().textContent()).startsWith('✓'),'Recreated empty src is recognized');assert((await page.locator('.checks p').nth(1).textContent()).startsWith('○'),'Deleted package must not pass build checks');
 page.on('dialog',dialog=>dialog.accept());await page.locator('#reset').click();await page.locator('#language').selectOption(language);await page.locator('#nav button').nth(4).click();await page.locator('#prepare-lesson').click();await page.waitForFunction(()=>document.querySelector('#status').textContent.startsWith('Lesson ready.'),null,{timeout:180000});
 assert.equal(await page.locator('#progress').textContent(),'0 / 6 completed','Preparing does not complete earlier lessons');
 await page.locator('.xterm-helper-textarea').focus();await page.keyboard.type(`ros2 run ${pkg} ta`);await page.keyboard.press('Tab');await page.keyboard.press('Enter');await page.waitForFunction(()=>document.querySelector('.terminal-transcript pre').textContent.includes('Publishing:'),null,{timeout:180000});await page.keyboard.press('Control+c');
 await page.locator('#save-session').click();await page.waitForTimeout(500);await page.reload();await page.locator('#start').click();await page.locator('.xterm').waitFor();await command(`ros2 run ${pkg} talker`);await page.waitForFunction(()=>document.querySelector('.terminal-transcript pre').textContent.includes('Publishing:'),null,{timeout:180000});await page.keyboard.press('Control+c');
 console.log(`PASS prepared lesson, real ${language} build/run, Tab completion and executable restoration`);
 await command('python3 -c "import math; print(math.sqrt(81))"');await page.waitForFunction(()=>document.querySelector('.terminal-transcript pre').textContent.includes('\n9.0\n'),null,{timeout:180000});
 await command('python3');await page.waitForFunction(()=>document.querySelector('.terminal-transcript pre').textContent.includes('Type exit()'),null,{timeout:180000});
 await command('import numpy as np');await page.waitForFunction(()=>!document.querySelector('.terminal-state').textContent.includes('Running'),null,{timeout:180000});
 await command('print(np.array([2, 4, 6]).sum())');await page.waitForFunction(()=>document.querySelector('.terminal-transcript pre').textContent.includes('\n12\n'));
 await command('open("python-result.txt", "w").write("from Python")');await command('exit()');await command('cat python-result.txt');assert((await page.locator('.terminal-transcript pre').textContent()).includes('\nfrom Python\n'));
 await command("python3 -c \"print('loop-start'); exec('while True: pass')\"");await page.waitForFunction(()=>document.querySelector('.terminal-transcript pre').textContent.includes('\nloop-start\n'),null,{timeout:180000});await page.keyboard.press('Control+c');await command('pwd');
 console.log('PASS real python3 -c, interactive NumPy, shared file writes, exit and interrupt');
 console.log('PASS nested workspace checks, browser session reload, installed metadata, overlay, cwd, files and progress');
}catch(error){console.error(error);for(const page of browser.contexts().flatMap(c=>c.pages()))console.error(await page.locator('#status,.terminal-transcript pre,#session-state').allTextContents());process.exitCode=1;}finally{await browser.close();}
