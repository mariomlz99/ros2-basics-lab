import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';

const url=process.env.LAB_URL||'http://127.0.0.1:8044/ros2-basics-lab/';
const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',headless:true});
const reports=[];await mkdir('artifacts/tf',{recursive:true});
try{for(const language of (process.env.LAB_LANGUAGE||'python,cpp').split(',')){
 const page=await browser.newPage({viewport:{width:1440,height:900}}),report={language,commands:[],cases:[],passed:false},errors=[];
 page.on('dialog',dialog=>dialog.accept());page.on('pageerror',error=>errors.push(error.message));
 const record=message=>{report.cases.push(message);console.log('PASS '+language+': '+message);};
 try{
  await page.goto(url.replace(/[?&]start=1/,'').replace(/\?$/,''));
  await page.evaluate(async()=>{
   const base=document.querySelector('script[type=module]').src,{Lab}=await import(new URL('lab.js',base)),terminal=Lab.prototype.terminal;
   Lab.prototype.terminal=function(...args){window.tfAuditLab=this;return terminal.apply(this,args);};
  });
  await page.locator('#start').click();await page.locator('.xterm').first().waitFor();
  await page.locator('#language').selectOption(language);await page.locator('[data-index="9"]').click();
  const idle=()=>page.waitForFunction(()=>/^(Jazzy|ROS environment)/.test(document.querySelector('.terminal-state')?.textContent),null,{timeout:180000});
  const output=needle=>page.waitForFunction(needle=>document.querySelector('.terminal-transcript pre')?.textContent.includes(needle),needle,{timeout:180000});
  const stop=async()=>{await page.locator('.terminal-card .stop').first().click();await idle();};
  const command=async line=>{await page.locator('.xterm-helper-textarea').first().focus();await page.keyboard.type(line,{delay:1});await page.keyboard.press('Enter');report.commands.push(line);};
  const prepare=async()=>{await page.locator('#prepare-lesson').click();await page.waitForFunction(()=>!document.querySelector('#prepare-lesson').disabled,null,{timeout:180000});assert.match(await page.locator('#status').textContent(),/Lesson ready/);};
  const check=async(id,expected)=>{await page.locator(`[data-tf-check="${id}"]`).click();assert.equal((await page.locator('#status').textContent()).includes('passed'),expected);};
  // A visible-page walk: execute only the command currently displayed, use the
  // existing file cards, and follow Next through every instruction in a section.
  const walk=async(id,{repair=false,expected=true}={})=>{
   await page.locator(`[data-exercise="${id}"]`).click();
   const count=Number((await page.locator('.guide-progress').textContent()).match(/\/\s*(\d+)/)[1]);
   for(let index=0;index<count;index++){
    const open=page.getByRole('button',{name:'Open file',exact:true});
    if(await open.count()){
     await open.first().click();
     if(repair){
      // Read only the visible starter and apply the instructions. Never reveal
      // or import a reference solution during the beginner walkthrough.
      const content=page.locator('.cm-content');let source=await content.innerText();
      if(id==='lookup')source=source.replace(language==='python'?"'laser'":'"laser"',language==='python'?"'laser_link'":'"laser_link"');
      else if(language==='python')source=source.replace("self.get_logger().info('Target is ready in odom')","result = self.buffer.transform(target, 'base_link')\n            self.get_logger().info(f'x = {result.point.x:.2f}, y = {result.point.y:.2f} m')");
      else source=source.replace('RCLCPP_INFO(node->get_logger(), "Target is ready in odom");','auto result = buffer.transform(target, "base_link");\n    RCLCPP_INFO(node->get_logger(), "x = %.2f, y = %.2f m", result.point.x, result.point.y);');
      await content.focus();await page.keyboard.press('Control+a');await page.keyboard.insertText(source);await page.locator('#save').click();
     }
    }
    for(const line of await page.locator('#lesson .command code').allTextContents()){
     await command(line);
     if(line.startsWith('ros2 run ')){
      if(expected)await page.waitForFunction(id=>window.tfAuditLab.runtime.tfEvidence.some(event=>event.operation===(id==='lookup'?'lookup':'point')),id,{timeout:180000});
      else await output(id==='lookup'?'Unknown TF frame "laser"':'Target is ready');
     }else await idle();
    }
    const checker=page.locator(`[data-tf-check="${id}"]`);if(await checker.count())await check(id,expected);
    const reflection=page.locator('#lesson details').filter({has:page.locator('summary', {hasText:'Think it through:'})});if(await reflection.count())await reflection.first().locator('summary').click();
    if(index<count-1)await page.locator('#guide-next').click();
   }
  };
  await page.locator('#tf-start').click();await page.locator('[data-frame="laser_link"]').waitFor();
  for(const frame of ['odom','base_link','laser_link'])await page.locator(`[data-frame="${frame}"]`).click();
  await walk('frames');record('all frame instructions and bounded topic inspection');
  await page.locator('#tf-forward').click();await page.waitForTimeout(450);await page.locator('#tf-turn').click();await page.waitForTimeout(450);await page.locator('#tf-halt').click();
  await walk('tree');record('static/dynamic comparison and retained static sample');
  await page.locator('#tf-reset-pose').click();await prepare();
  await walk('lookup',{expected:false});await stop();record('unchanged lookup starter reports the deliberate frame-name failure');
  await walk('lookup',{repair:true});await output('x = 0.12, y = 0.00 m');await stop();record('learner repairs the visible starter without references, builds, runs and passes the runtime checker');
  await walk('point',{expected:false});await stop();record('unchanged point starter cannot pass by printing');
  await walk('point',{repair:true});await output('x = 1.00, y = 1.00 m');
  await page.locator('#tf-forward').click();await page.waitForTimeout(450);await page.locator('#tf-turn').click();await page.waitForTimeout(450);await page.locator('#tf-halt').click();
  await page.waitForFunction(()=>window.tfAuditLab.runtime.tfEvidence.some(event=>event.operation==='point'&&Math.abs(event.result.point.x-1)>.01),null,{timeout:10000});
  await check('point',true);await stop();record('target result follows moved robot and agrees with live program evidence');
  assert.equal(await page.evaluate(()=>window.tfAuditLab.runtime.tf.listeners.size),0,'Stop leaked program TF listeners');
  // Repeated runs use visible commands; inspect only resource ownership/state.
  for(let cycle=0;cycle<3;cycle++){
   await page.locator('#tf-reset-pose').click();await check('point',false);
   await command('ros2 run tf_lab point');await page.waitForFunction(()=>window.tfAuditLab.runtime.tfEvidence.some(e=>e.operation==='point'),null,{timeout:180000});await check('point',true);await stop();
   await page.locator('#tf-stop').click();assert.equal(await page.evaluate(()=>window.tfAuditLab.runtime.tf.frames().length),0);
   await page.locator('#tf-start').click();
  }
  record('three pose-reset, check, rerun, Stop and simulator restart cycles');
  await command('ros2 run tf_lab point');await page.waitForFunction(()=>window.tfAuditLab.runtime.tfEvidence.some(event=>event.operation==='point'),null,{timeout:180000});
  await page.evaluate(()=>{window.priorTfLab=window.tfAuditLab;});
  await page.locator('[data-index="2"]').click();
  assert(await page.evaluate(()=>window.priorTfLab.processes.active().length===0&&window.priorTfLab.runtime.jobs.size===0&&window.priorTfLab.runtime.tf.listeners.size===0&&window.priorTfLab.runtime.tfEvidence.length===0),'navigation left a ghost program, timer, listener or proof');
  await page.locator('[data-index="9"]').click();assert.equal(await page.evaluate(()=>window.tfAuditLab===window.priorTfLab),true);
  assert.equal(await page.evaluate(()=>window.tfAuditLab.runtime.tf.frames().length),0);record('navigation preserves TF workspace but clears all live processes and proof');
  await page.locator('#tf-start').click();await walk('point',{repair:true});await stop();
  await page.locator('#reset-lesson').click();
  assert(await page.evaluate(()=>window.tfAuditLab.processes.active().length===0&&window.tfAuditLab.runtime.tfEvidence.length===0&&window.tfAuditLab.runtime.tf.listeners.size===0));
  await page.locator('[data-exercise="lookup"]').click();const count=Number((await page.locator('.guide-progress').textContent()).match(/\/\s*(\d+)/)[1]);for(let i=1;i<count;i++)await page.locator('#guide-next').click();await check('lookup',false);
  record('Restart unit then Check rejects stale previous-run evidence');
  assert.deepEqual(errors,[]);report.passed=true;
 }catch(error){report.error=error.stack;report.outputs=await page.locator('.terminal-transcript pre').allTextContents().catch(()=>[]);await page.screenshot({path:`artifacts/tf/learning-failure-${language}.png`,fullPage:true}).catch(()=>{});console.error('FAIL '+language+' '+error.stack);process.exitCode=1;
 }finally{reports.push(report);await writeFile('artifacts/tf/learning-browser.json',JSON.stringify(reports,null,2));await page.close();}
}}finally{await browser.close();}
if(reports.every(report=>report.passed))console.log('PASS TF beginner walkthrough and lifecycle stress');
