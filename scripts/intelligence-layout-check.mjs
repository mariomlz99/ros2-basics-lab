import {chromium} from 'playwright-core';import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),requests=[],errors=[];page.on('request',r=>requests.push(r.url()));page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.LAB_URL||'http://127.0.0.1:8017/ros2-basics-lab/');
 await page.evaluate(async()=>{const base=document.querySelector('script[type=module]').src,{CodeEditor}=await import(new URL('vendor/ui.js',base)),open=CodeEditor.prototype.open;CodeEditor.prototype.open=function(...args){window.testCodeEditor=this;return open.apply(this,args);};});
 await page.locator('#start').click();await page.locator('.xterm').waitFor();
 const command=async text=>{await page.locator('.xterm-helper-textarea').first().focus();await page.keyboard.insertText(text);await page.keyboard.press('Enter');await page.waitForTimeout(150);};
 await command('gedit example.py');const before=requests.length;
 const edit=async(source,path='example.py')=>{await page.evaluate(([source,path])=>{const e=window.testCodeEditor;e.open(path,source);e.view.dispatch({selection:{anchor:source.length}});e.view.focus();},[source,path]);};
 const options=()=>page.locator('.cm-tooltip-autocomplete .cm-completionLabel').allTextContents();
 await edit('import numpy as np\nnp');await page.keyboard.type('.');await page.waitForTimeout(400);assert((await options()).includes('concatenate'),'automatic dot completion');
 await page.keyboard.press('Escape');await edit('import numpy as np\nnp.con');await page.keyboard.press('Control+Space');await page.waitForTimeout(200);assert((await options()).includes('concatenate'));await page.keyboard.press('Tab');await page.waitForTimeout(150);assert((await page.locator('.cm-content').innerText()).includes('np.concatenate()'));assert.match(await page.locator('.code-signature').innerText(),/concatenate\(arrays/);
 await edit('from geometry_msgs.msg import Twist\nmsg = Twist()\nmsg.linear.');await page.keyboard.press('Control+Space');await page.waitForTimeout(200);assert.deepEqual((await options()).sort(),['x','y','z']);
 await page.keyboard.press('Escape');await edit('geometry_msgs::msg::Twist::SharedPtr msg;\nmsg->angular.','example.cpp');await page.keyboard.press('Control+Space');await page.waitForTimeout(200);assert.deepEqual((await options()).sort(),['x','y','z']);await page.keyboard.press('Escape');
 await edit('#include <std_msgs/msg/str','example.cpp');await page.keyboard.press('Control+Space');await page.waitForTimeout(200);assert((await options()).includes('std_msgs/msg/string.hpp'));await page.keyboard.press('Escape');
 await page.evaluate(()=>window.testCodeEditor.getRegistry().set('custom/msg/Reading',{fields:[{name:'temperature',type:'float64'}]}));await edit('from custom.msg import Reading\nmsg = Reading()\nmsg.');await page.keyboard.press('Control+Space');await page.waitForTimeout(200);assert.deepEqual(await options(),['temperature']);await page.keyboard.press('Escape');
 assert.equal(requests.length,before,'completions and signatures make no network requests');
 for(let i=0;i<2;i++)await page.getByRole('button',{name:'+ Terminal',exact:true}).click();await page.waitForTimeout(250);
 const widths=()=>page.locator('.terminal-card').evaluateAll(cards=>cards.map(c=>c.getBoundingClientRect().width));
 const drag=async()=>{const old=await widths(),handle=page.locator('.terminal-column-divider').first();await handle.scrollIntoViewIfNeeded();const box=await handle.boundingBox();await page.mouse.move(box.x+6,box.y+30);await page.mouse.down();await page.mouse.move(box.x+86,box.y+30,{steps:8});await page.mouse.up();await page.waitForTimeout(200);const next=await widths();assert(next[0]>old[0]+40,JSON.stringify({old,next,box,viewport:page.viewportSize(),layout:await page.locator('#terminals').evaluate(e=>({width:e.clientWidth,columns:getComputedStyle(e).gridTemplateColumns}))}));assert(next[1]<old[1]-40);return next;};
 await drag();await page.setViewportSize({width:860,height:1000});await page.waitForTimeout(300);await drag();
 await page.locator('#restore-layout').click();await page.waitForTimeout(150);let equal=await widths();assert(Math.abs(equal[0]-equal[1])<2);
 await page.locator('.terminal-column-divider').first().focus();await page.keyboard.press('ArrowRight');const persisted=await widths();assert(persisted[0]>persisted[1]);
 await page.locator('#save-session').click();await page.waitForTimeout(400);await page.reload();await page.locator('#start').click();await page.locator('.terminal-card').nth(2).waitFor();await page.waitForTimeout(200);equal=await widths();assert(Math.abs(equal[0]-persisted[0])<2);
 await page.setViewportSize({width:390,height:900});await page.waitForTimeout(200);assert.equal(await page.locator('.terminal-column-divider').count(),0);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.deepEqual(errors,[]);
 console.log('PASS local NumPy/Python/C++ ROS completion, signatures, zero editor network requests; terminal pointer/keyboard resize, half-width, restore, persistence and mobile stacking');
}finally{await browser.close();}
