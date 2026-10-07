import {chromium} from 'playwright-core';import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});await page.goto(process.env.LAB_URL||'http://127.0.0.1:8017/ros2-basics-lab/');await page.locator('#start').click();await page.locator('.xterm').waitFor();
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
 await page.locator('.command button').first().click();await page.getByRole('button',{name:'Copied!',exact:true}).waitFor();assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),'pwd');await page.getByRole('button',{name:'Copy',exact:true}).first().waitFor();
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
 await page.locator('.complete').click();assert.equal(await page.locator('#progress').textContent(),'0 / 6 completed');assert.equal(await page.locator('#next-lesson').count(),0);
 await command('pwd');await command('echo $ROS_DISTRO');await command('ros2 node list');
 await page.locator('.complete').click();assert.equal(await page.locator('#progress').textContent(),'1 / 6 completed');assert.equal(await page.locator('#next-lesson').textContent(),'Move to lesson 2');
 await page.locator('#locale').selectOption('nl');await page.getByRole('button',{name:'Ga naar les 2',exact:true}).waitFor();await page.locator('#locale').selectOption('en');
 await page.locator('#next-lesson').click();assert((await page.locator('#lesson-heading').textContent()).includes('Workspace & packages'));
 // Passing the final lesson without earlier checks must not claim the whole course is complete.
 await page.locator('#nav button').nth(5).click();while(!await page.locator('#guide-next').isDisabled())await page.locator('#guide-next').click();
 await command('mkdir -p ~/ros2_ws/src');await page.locator('#export').click();await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('exported'));
 await page.locator('.complete').click();assert.equal(await page.locator('.lesson-onward strong').textContent(),'Final lesson complete.');
 await page.getByRole('button',{name:'Explore exercises',exact:true}).click();await page.getByRole('button',{name:'Start playground',exact:true}).waitFor();
 await page.locator('#nav button').nth(1).click();
 await command('echo course > course-only.txt');
 await page.locator('#exercise-nav button').click();assert.equal(await page.locator('#guide-next').count(),1);
 assert.equal(await page.locator('#file-tree button').filter({hasText:'course-only.txt'}).count(),0);
 for(const cls of ['world','camera','scan'])assert(await page.locator('#playground-stage .'+cls).evaluate(canvas=>canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data.some(value=>value!==0)),cls+' preview is rendered');
 await command('echo exercise > exercise-only.txt');await page.locator('#playground-start').click();
 const before=await page.locator('#playground-stage .camera').evaluate(canvas=>canvas.toDataURL());
 await command("ros2 topic pub --once /cmd_vel geometry_msgs/msg/Twist '{linear: {x: 0.5}}'");await page.waitForTimeout(1100);
 assert.notEqual(await page.locator('#playground-stage .camera').evaluate(canvas=>canvas.toDataURL()),before,'Camera stream follows movement');
 await page.locator('#guide-next').click();assert.equal(await page.locator('#playground-status').textContent(),'Live sensor streams','Step navigation keeps streams alive');
 const cameraView=page.locator('#playground-stage .camera'),originalHeight=(await cameraView.boundingBox()).height;
 await page.locator('.stream-expand').nth(1).click();assert((await cameraView.boundingBox()).height>originalHeight+100);assert.equal(await page.locator('.stream-expand').nth(1).getAttribute('aria-expanded'),'true');
 await page.locator('.stream-expand').nth(1).click();assert.equal((await cameraView.boundingBox()).height,originalHeight);
 const divider=await page.locator('#resize-streams').boundingBox();await page.mouse.move(divider.x+30,divider.y+7);await page.mouse.down();await page.mouse.move(divider.x+30,divider.y+87);await page.mouse.up();assert((await cameraView.boundingBox()).height>=originalHeight+75);
 await page.locator('#resize-streams').focus();await page.keyboard.press('ArrowDown');assert((await cameraView.boundingBox()).height>=originalHeight+95);
 await page.locator('.stream-expand').nth(0).click();await page.locator('#restore-layout').click();assert.equal(await page.locator('figure.expanded').count(),0);assert.equal((await cameraView.boundingBox()).height,originalHeight);assert.equal(await page.locator('#playground-status').textContent(),'Live sensor streams');

 await page.screenshot({path:'artifacts/screenshots/playground-streams.png',fullPage:true});
 await page.locator('#nav button').nth(1).click();assert.equal(await page.locator('#file-tree button').filter({hasText:'exercise-only.txt'}).count(),0);assert.equal(await page.locator('#file-tree button').filter({hasText:'course-only.txt'}).count(),1);
 await page.locator('#exercise-nav button').click();await page.locator('#save-session').click();await page.waitForTimeout(500);await page.reload();await page.locator('#start').click();await page.locator('.xterm').waitFor();
 assert.equal(await page.locator('#file-tree button').filter({hasText:'exercise-only.txt'}).count(),1);await page.locator('#nav button').nth(1).click();assert.equal(await page.locator('#file-tree button').filter({hasText:'course-only.txt'}).count(),1,'Both independent workspaces survive reload');
 console.log('PASS playground previews/live streams, guided steps and independent saved workspaces');
 await page.locator('#nav button').nth(4).click();
 while(!await page.locator('#lesson details').count())await page.locator('#guide-next').click();
 await page.getByRole('button',{name:'Show package command',exact:true}).click();assert((await page.locator('.command code').textContent()).includes('ros2 pkg create'));
 await command('mkdir -p ~/ros2_ws/src');await command('cd ~/ros2_ws/src');await command(await page.locator('.command code').textContent());await page.locator('#guide-next').click();
 await page.getByRole('button',{name:'Add file',exact:true}).click();await page.getByRole('button',{name:'Open file',exact:true}).waitFor();assert((await page.locator('#active-file').textContent()).includes('server.py'));
 console.log('PASS lesson 5 missing-package guidance and Add/Open file actions');
 await input.focus();await page.keyboard.insertText('echo "Hello" > notes.txt');await page.waitForTimeout(300);await page.screenshot({path:'artifacts/screenshots/terminal-feedback.png',fullPage:true});console.log('PASS echo/append, rm -rf *, base topics/echo cleanup, guided navigation, scoped keyboard shortcuts and visible files');
}finally{await browser.close();}
