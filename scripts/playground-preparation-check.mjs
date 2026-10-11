import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true});
try{for(const language of ['python','cpp']){
 const page=await browser.newPage({viewport:{width:1500,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
 await page.goto(process.env.LAB_URL||'http://127.0.0.1:8033/ros2-basics-lab/');await page.locator('#start').click();await page.locator('.xterm').first().waitFor();await page.locator('[data-index="7"]').click();await page.locator('#language').selectOption(language);
 for(const id of ['intro','odom','tf','lidar','camera','readers']){
  await page.locator(`[data-exercise="${id}"]`).click();await page.locator('#guide-next').click();
  const before=await page.locator('.guide-progress').textContent();
  for(let n=0;n<3;n++){await page.locator('#prepare-lesson').click();await page.waitForFunction(()=>!document.querySelector('#prepare-lesson').disabled);}
  assert.equal(await page.locator('.guide-progress').textContent(),before);assert.equal(await page.locator('[data-exercise].active').getAttribute('data-exercise'),id);
  const prompts=await page.locator('.xterm-rows').first().textContent();assert.equal((prompts.match(/student@ros2lab:/g)||[]).length,1,prompts);
 }
 await page.locator('[data-exercise="readers"]').click();await page.locator('#guide-mode').click();
 const cmd=async text=>{await page.locator('.xterm-helper-textarea').first().focus();await page.keyboard.type(text,{delay:1});await page.keyboard.press('Enter');await page.waitForTimeout(180);};
 const idle=()=>page.waitForFunction(()=>/^(Jazzy|ROS environment)/.test(document.querySelector('.terminal-state').textContent),null,{timeout:180000});
 await cmd('mkdir -p ~/ros2_ws/src');await cmd('cd ~/ros2_ws/src');await cmd(`ros2 pkg create --build-type ${language==='python'?'ament_python':'ament_cmake'} --license Apache-2.0 sensor_lab --dependencies ${language==='python'?'rclpy':'rclcpp'} sensor_msgs`);await idle();
 for(const detail of await page.locator('#lesson details').all()){
  await detail.evaluate(e=>e.open=true);
  const starter=detail.getByRole('button',{name:'Add starter skeleton',exact:true});
  if(await starter.count()){assert(await detail.locator('pre').isHidden());await detail.getByRole('button',{name:'Show reference solution',exact:true}).click();assert(await detail.locator('pre').isVisible());await starter.click();}
  else await detail.getByRole('button',{name:/^(Add file|Replace with example)$/}).click();
 }
 await cmd('cd ~/ros2_ws');await cmd('colcon build');await idle();assert.match(await page.locator('.terminal-transcript pre').textContent(),/1 package finished/);
 await cmd('source install/setup.bash');await page.locator('#playground-start').click();await cmd('ros2 run sensor_lab lidar');await page.waitForFunction(()=>document.querySelector('.terminal-state').textContent.includes('callbacks ready'),null,{timeout:180000});await page.waitForTimeout(300);
 await page.locator('.stop').click();await page.locator('#playground-stop').click();await idle();assert.doesNotMatch(await page.locator('.terminal-transcript pre').textContent(),/Traceback|Error:|Failed <<</);
 assert.deepEqual(errors,[]);console.log(`PASS ${language}: prepare preserves all six exercise positions; repeated preparation gives one prompt; optional skeleton builds and runs`);await page.close();
}}finally{await browser.close();}
