// Fresh-profile walkthrough of every visible guided page in each language.
// Preparation is invoked through the same prerequisite button students see.
import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {lesson,LESSON_NAMES} from '../src/course.js';
import {guidePages} from '../src/course/guide.js';
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true});
const reports=[],languages=(process.env.LAB_LANGUAGE||'python,cpp').split(','),selected=process.env.AUDIT_UNITS?.split(',').map(Number)||[0,1,2,3,4,5,6];
const reportPath='artifacts/audit/course-'+languages.join('-')+(process.env.AUDIT_UNITS?'-units-'+selected.map(i=>i+1).join('-'):'')+'.json';
await mkdir('artifacts/audit',{recursive:true});
try{for(const language of languages)for(const index of selected){
 const page=await browser.newPage({viewport:{width:1500,height:1100}}),errors=[],record={unit:index+1,title:LESSON_NAMES[index],language,pages:0,commands:[],passed:false};
 page.on('dialog',d=>d.accept());page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(process.env.LAB_URL||'http://127.0.0.1:8033/ros2-basics-lab/');
  await page.evaluate(async()=>{const base=document.querySelector('script[type=module]').src,{Lab}=await import(new URL('lab.js',base)),terminal=Lab.prototype.terminal;Lab.prototype.terminal=function(...args){window.auditLab=this;return terminal.apply(this,args);};});
  await page.locator('#start').click();await page.locator('.xterm').first().waitFor();await page.locator('#language').selectOption(language);await page.locator(`[data-index="${index}"]`).click();
  const idle=async i=>page.waitForFunction(i=>/^(Jazzy|ROS environment)/.test(document.querySelectorAll('.terminal-state')[i]?.textContent),i,{timeout:180000});
  const ready=async i=>page.waitForFunction(i=>document.querySelectorAll('.terminal-state')[i]?.textContent.includes('callbacks ready'),i,{timeout:180000});
  const command=async(i,line)=>{await page.locator('.xterm-helper-textarea').nth(i).focus();await page.keyboard.type(line,{delay:1});await page.keyboard.press('Enter');await page.waitForTimeout(200);record.commands.push({terminal:i+1,line});};
  const stop=async i=>{await page.locator('.terminal-card .stop').nth(i).click();await page.waitForTimeout(180);};
  const output=async(i,needle)=>page.waitForFunction(([i,needle])=>document.querySelectorAll('.terminal-transcript pre')[i]?.textContent.includes(needle),[i,needle],{timeout:180000});
  if(index>=2){await page.locator('#prepare-lesson').click();await page.waitForFunction(()=>!document.querySelector('#prepare-lesson').disabled,null,{timeout:180000});assert.match(await page.locator('#status').textContent(),/Lesson ready/);}
  // Each terminal is created fresh. Later units' visible prerequisite button
  // sources Terminal 1; additional terminals still require their own source.
  for(let n=1;n<3;n++)await page.locator('#add-terminal').click();
  if(index===4||index===5)await command(1,'source ~/ros2_ws/install/setup.bash');
  const pages=guidePages(lesson(index,language));let commandIndex=0,statusFiles=false;
  for(let n=0;n<pages.length;n++){
   for(const step of pages[n]){
    if(step.kind==='terminal-action')await stop(step.terminal-1);
    if(step.kind==='files'){
     const path=Object.keys(step.items)[0];
     if(index===4&&(path.includes('status_publisher')||path==='package.xml')&&!statusFiles){await stop(0);await stop(1);statusFiles=true;}
     if(index===5&&path.startsWith('launch/'))await stop(1);
     const replace=page.getByRole('button',{name:'Replace with example',exact:true});
     if(await replace.count())await replace.click();else await page.getByRole('button',{name:/^(Add file|Open file)$/}).click();
    }
    if(step.kind==='commands')for(const line of step.commands){
     assert.equal((await page.locator('#lesson .command code').textContent()).trim(),line);
     let terminal=(step.terminal??1)-1;
     if(index===3)terminal=commandIndex>=11?2:commandIndex>=9?1:0;
     if(index===4)terminal=commandIndex>=4&&commandIndex<=16?1:commandIndex>=21?1:0;
     if(index===5)terminal=commandIndex>=7?1:0;
     if(index===3&&commandIndex===17)await stop(2);
     await command(terminal,line);
     if(/^ros2 (run|launch)/.test(line)&&!line.endsWith(' hello')&&!line.endsWith(' client'))await ready(terminal);
     else if(/^ros2 topic (pub|echo|hz)/.test(line)){
      if(line.includes('--once')||line.includes('--times')||line.includes(' -1 ')){
       if(!line.includes('/lab_wait')||line.includes('echo'))await idle(terminal);
      }else await page.waitForTimeout(line.includes(' hz ')?1500:300);
     }else await idle(terminal);
     if(index===2&&commandIndex===10)await output(0,"Package 'my_first_package' not found");
     if(index===2&&commandIndex===13)await output(0,'Hi from my_first_package.');
     if(index===3&&commandIndex===10)await output(1,'I heard:');
     if(index===4&&commandIndex===6)await output(0,'Hello:');
     if(index===4&&commandIndex===22)await output(1,'Ada');
     if(index===5&&commandIndex===8)await output(1,'Sum: 5');
     if(index===5&&commandIndex===11)await output(1,'15');
     commandIndex++;
    }
   }
   record.pages++;
   if(n<pages.length-1)await page.locator('#guide-next').click();
  }
  if(index===2){await command(1,'ros2 run my_first_package hello');await idle(1);await output(1,"Package 'my_first_package' not found");await command(1,'source ~/ros2_ws/install/setup.bash');await command(1,'ros2 run my_first_package hello');await idle(1);await output(1,'Hi from my_first_package.');}
  if(index===5){await command(2,'ros2 topic echo /conversation');await output(2,'Launched:');await stop(2);}
  if(index===6){const downloaded=page.waitForEvent('download');await page.locator('#export').click();const file=await downloaded;await file.saveAs(`artifacts/audit/native-${language}.tar`);record.export=true;}
  await page.locator('.complete').click();record.checks=await page.locator('.checks').innerText();record.checkerPassed=(await page.locator('#status').textContent())==='Lesson checks passed.';assert(record.checkerPassed,record.checks);
  // Reload/history and reset are checked after preserving successful artifacts.
  for(let i=0;i<3;i++)await stop(i);
  const cleanup=await page.evaluate(()=>{const l=window.auditLab;return {nodes:l.runtime.nodes.size,jobs:l.runtime.jobs.size,listeners:l.runtime.listeners.size,services:l.runtime.services.size,parameters:l.runtime.parameters.size,processes:l.processes.active().length};});assert(Object.values(cleanup).every(v=>v===0),JSON.stringify(cleanup));record.cleanup=cleanup;
  await page.locator('#save-session').click();await page.waitForTimeout(500);await page.reload();await page.locator('#start').click();await page.locator('.xterm').first().waitFor();assert((await page.locator('#lesson-heading').textContent()).startsWith(String(index+1)+'.'));await command(0,'history');await idle(0);assert((await page.locator('.terminal-transcript pre').first().textContent()).includes(record.commands.find(c=>c.terminal===1).line));record.reload=true;
  await page.locator('#reset-lesson').click();await page.locator('#reset').click();await page.waitForTimeout(250);assert.equal(await page.locator('.terminal-card').count(),1);assert.equal(await page.locator('#graph-state').textContent(),'0 nodes · 2 topics');record.reset=true;
  assert.deepEqual(errors,[]);record.passed=true;console.log('PASS walkthrough '+language+' unit '+(index+1)+'; checker '+record.checkerPassed);
 }catch(error){record.error=error.message;record.outputs=await page.locator('.terminal-transcript pre').allTextContents().catch(()=>[]);await page.screenshot({path:`artifacts/audit/failure-${language}-${index+1}.png`}).catch(()=>{});console.log('FAIL '+language+' unit '+(index+1)+' '+error.message);process.exitCode=1;
 }finally{reports.push(record);await writeFile(reportPath,JSON.stringify(reports,null,2));await page.close();}
}}finally{await browser.close();}
