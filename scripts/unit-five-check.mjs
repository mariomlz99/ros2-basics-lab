import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {mkdir} from 'node:fs/promises';
import {customFiles} from '../src/examples.js';
const native=JSON.parse(readFileSync(new URL('../tests/fixtures/native-topic-echo.json',import.meta.url)));
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.LAB_URL||'http://127.0.0.1:8031/ros2-basics-lab/');
 await page.evaluate(async()=>{const base=document.querySelector('script[type="module"]').src,{CodeEditor}=await import(new URL('vendor/ui.js',base)),open=CodeEditor.prototype.open;CodeEditor.prototype.open=function(...args){window.testCodeEditor=this;return open.apply(this,args);};});
 await page.locator('#start').click();await page.locator('.xterm').first().waitFor();
 const transcript=i=>page.locator('.terminal-transcript pre').nth(i);
 const command=async(i,text)=>{const input=page.locator('.xterm-helper-textarea').nth(i);await input.focus();await page.keyboard.type(text,{delay:1});await page.keyboard.press('Enter');await page.waitForTimeout(140);};
 await command(0,native.cases.absent.command);
 assert((await transcript(0).textContent()).includes(native.cases.absent.stdout+native.cases.absent.stderr));
 for(const text of ['mkdir -p ~/ros2_ws/src','cd ~/ros2_ws/src','ros2 pkg create --build-type ament_cmake my_first_package','cd ..','colcon build'])await command(0,text);
 await page.getByRole('button',{name:'+ Terminal',exact:true}).click();await command(1,'source ~/ros2_ws/install/setup.bash');
 for(const text of ['cd ~/ros2_ws/src','ros2 pkg create --build-type ament_cmake tutorial_interfaces','mkdir -p tutorial_interfaces/msg'])await command(0,text);
 for(const [file,content]of Object.entries(customFiles())){
  await command(0,'gedit tutorial_interfaces/'+file);
  await page.evaluate(content=>{const e=window.testCodeEditor;e.view.dispatch({changes:{from:0,to:e.view.state.doc.length,insert:content}});},content);
  await page.locator('#save').click();
 }
 for(const text of ['cd ..','colcon build --packages-select tutorial_interfaces','source install/setup.bash',`ros2 topic pub -r 10 ${native.topic} ${native.messageType} '{name: Ada, counter: 7, ready: true}'`])await command(0,text);
 await command(1,native.cases.custom_unsourced.command);assert((await transcript(1).textContent()).includes(native.cases.custom_unsourced.stderr.trim()),JSON.stringify({publisher:await transcript(0).textContent(),receiver:await transcript(1).textContent()}));
 await command(1,'source ~/ros2_ws/install/setup.bash');await command(1,native.cases.custom_sourced.command);
 await page.waitForFunction(text=>document.querySelectorAll('.terminal-transcript pre')[1].textContent.includes(text),native.cases.custom_sourced.stdout.trim());
 // Resizing must preserve an unsaved editor buffer while a publisher is active.
 const draft='# unsaved CMake draft\n';await page.evaluate(draft=>{const e=window.testCodeEditor;e.view.dispatch({changes:{from:0,to:e.view.state.doc.length,insert:draft}});},draft);
 const tree=page.locator('#file-tree'),handle=page.locator('#resize-file-tree'),width=async()=> (await tree.boundingBox()).width;
 const before=await width(),bounds=await handle.boundingBox();await page.mouse.move(bounds.x+6,bounds.y+80);await page.mouse.down();await page.mouse.move(bounds.x+86,bounds.y+80,{steps:6});await page.mouse.up();
 assert((await width())>before+60);await handle.focus();const dragged=await width();await page.keyboard.press('ArrowLeft');assert(Math.abs(await width()-dragged+10)<1);
 assert.equal(await page.evaluate(()=>window.testCodeEditor.value),draft);
 const running=await transcript(0).textContent();await page.waitForTimeout(200);assert.notEqual(await transcript(0).textContent(),running,'Publisher survives resizing');
 const savedWidth=await width();await page.locator('#save-session').click();await page.waitForTimeout(300);
 await page.reload();await page.locator('#start').click();await page.locator('.xterm').first().waitFor();
 assert(Math.abs(await width()-savedWidth)<1);assert.equal((await page.locator('.cm-content').innerText()).trimEnd(),draft.trimEnd());
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(150);
 assert(await handle.isVisible());assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 await page.setViewportSize({width:1440,height:1000});await page.waitForTimeout(150);assert(Math.abs(await width()-savedWidth)<1);
 await handle.focus();await page.keyboard.press('Home');assert.equal(await width(),160);
 await page.keyboard.press('ArrowRight');await page.locator('#restore-layout').click();assert.equal(await width(),160);
 await mkdir('artifacts/screenshots',{recursive:true});await page.locator('#files').screenshot({path:'artifacts/screenshots/file-tree-divider.png'});
 assert.deepEqual(errors,[]);console.log('PASS visible native echo diagnostics, custom interface re-sourcing and delivery; file-tree drag/keyboard resize, draft/process preservation, reload, responsive limits and reset');
}finally{await browser.close();}
