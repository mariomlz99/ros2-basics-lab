import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright-core';

// Learner setup goes through visible file cards and real terminal input. The
// instrumentation only observes the lab selected by the application.
const standalone=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8')).name==='ros2-basics-lab';
const url=process.env.LAB_URL||(standalone?'http://127.0.0.1:8017/ros2-basics-lab/':'http://127.0.0.1:8017/basics.html');
const statusOnly=process.argv.includes('--status-only');
const output=process.env.ODOMETRY_UI_ARTIFACTS||(statusOnly?'artifacts/odometry-ui/status':'artifacts/odometry-ui');
await mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true});
const report={url,browser:browser.version(),cases:[]};

async function run(language){
 const context=await browser.newContext({viewport:{width:1440,height:1050}}),page=await context.newPage();
 const result={language,commands:[],readerRuns:[],fileActions:[],dialogs:[],errors:[]};report.cases.push(result);
 page.on('pageerror',error=>result.errors.push(error.message));
 page.on('dialog',async dialog=>{result.dialogs.push(dialog.message());await dialog.accept();});
 const root=standalone?'#lesson':'#unit';
 const prepare=standalone?'#prepare-lesson':'#prepare-unit';
 const card=index=>page.locator('.terminal-card').nth(index-1);
 const readState=()=>page.evaluate(()=>({
  processes:window.odometryUILab.processes.active().map(p=>({language:p.language,status:p.status,executable:p.executable})),
  samples:window.odometryUILab.runtime.sampleCounter
 }));
 const command=async(line,index=1)=>{
  const terminal=card(index),before=(await terminal.locator('.terminal-transcript pre').textContent()).length;
  await terminal.locator('.xterm-helper-textarea').focus();
  await page.keyboard.insertText(line);await page.keyboard.press('Enter');
  await page.waitForFunction(({index,line})=>document.querySelectorAll('.terminal-transcript pre')[index-1]?.textContent.includes(line),{index,line});
  // Yield to the terminal's asynchronous command dispatcher before inspecting
  // its busy flag. No commands or source files are injected through internals.
  await page.waitForTimeout(100);
  if(line.startsWith('ros2 run ')){
   await page.waitForFunction(language=>window.odometryUILab.processes.active().some(p=>p.language===language&&p.status==='Running'),language,{timeout:180000});
   await page.waitForFunction(({index,before})=>/x=.*y=.*yaw=.*v=/.test(document.querySelectorAll('.terminal-transcript pre')[index-1].textContent.slice(before)),{index,before},{timeout:180000});
   result.readerRuns.push(await readState());
  }else if(line.includes('pub --rate'))await page.waitForTimeout(350);
  else await page.waitForFunction(index=>![...window.odometryUILab.terminals.values()][index-1].busy,index,{timeout:180000});
  const transcript=(await terminal.locator('.terminal-transcript pre').textContent()).slice(before);
  assert(!/Traceback|Build failed|No executable found|Package 'odom_lab' not found/.test(transcript),line+'\n'+transcript);
  result.commands.push({line,terminal:index,output:transcript});
 };
 const stop=async(index=1)=>{
  await card(index).locator('.xterm-helper-textarea').focus();await page.keyboard.press('Control+c');
  await page.waitForFunction(index=>![...window.odometryUILab.terminals.values()][index-1].busy,index,{timeout:30000});
 };
 try{
  await page.goto(url);
  await page.evaluate(async()=>{
   const base=document.querySelector('script[src*="/app.js"]').src,{Lab}=await import(new URL('lab.js',base)),original=Lab.prototype.terminal;
   Lab.prototype.terminal=function(...args){window.odometryUILab=this;return original.apply(this,args);};
  });
  await page.locator('#start').click();await page.locator('.xterm').first().waitFor();
  await page.locator('#language').selectOption(language);
  const tf=await page.locator('#exercise-nav [data-index="9"]').count();
  await page.locator(`#exercise-nav [data-index="${tf?9:7}"]`).click();
  await page.locator('[data-exercise="odometry"]').click();
  const start=tf?'#tf-start':'#playground-start',stopSimulator=tf?'#tf-stop':'#playground-stop',reset=tf?'#tf-reset-pose':'#playground-reset';
  const notebook=page.locator('.odom-notebook:visible'),status=notebook.locator('.odom-status');
  assert.match(await status.textContent(),/Start the simulator/);
  await page.evaluate(()=>{
   const status=document.querySelector('.odom-notebook:not([hidden]) .odom-status');
   window.odometryStatusEvents=[];
   window.odometryStatusObserver=new MutationObserver(records=>{for(const record of records)window.odometryStatusEvents.push(status.textContent);});
   window.odometryStatusObserver.observe(status,{childList:true,characterData:true,subtree:true});
  });
  await page.locator(start).click();await status.filter({hasText:'Live /odom'}).waitFor();
  const stable=async label=>{
   await page.waitForTimeout(80);
   const before=await readState();await page.evaluate(()=>{window.odometryStatusEvents=[];});
   await page.waitForTimeout(400);
   assert((await readState()).samples>before.samples,label+': simulator must continue publishing');
   assert.deepEqual(await page.evaluate(()=>window.odometryStatusEvents),[],label+': unchanged status mutated its live region');
  };
  await stable('English live status');
  await page.locator('#locale').selectOption('fr');await page.waitForTimeout(80);
  assert.notEqual(await status.textContent(),'Live /odom · recording published poses');
  const translated=await status.textContent();await stable('Localized live status');assert.equal(await status.textContent(),translated);
  await page.locator('#locale').selectOption('en');await page.waitForTimeout(80);
  await page.locator(stopSimulator).click();await status.filter({hasText:'Paused'}).waitFor();
  assert(await notebook.locator('.odom-mark').isDisabled());
  await page.evaluate(()=>{window.odometryStatusEvents=[];});await page.waitForTimeout(150);
  assert.deepEqual(await page.evaluate(()=>window.odometryStatusEvents),[],'Paused status must remain stable');
  await page.locator(start).click();await status.filter({hasText:'Live /odom'}).waitFor();
  await page.locator(reset).click();await notebook.locator('[data-odom="pose"]').filter({hasText:'x 0.000 · y 0.000'}).waitFor();
  await notebook.locator('.odom-mark').click();await stable('Marked live status');
  await page.evaluate(()=>window.odometryStatusObserver.disconnect());
  result.statusTransitions='English/French live, pause, restart, reset and mark; no redundant live-region mutations';
  if(statusOnly){console.log(`PASS ${language}: odometry live-region state transitions`);return;}

  await page.locator(prepare).click();await page.waitForFunction(selector=>!document.querySelector(selector).disabled,prepare);
  await page.locator('#add-terminal').click();
  const pageCount=Number((await page.locator('.guide-progress').innerText()).split('/')[1]);
  for(let index=0;index<pageCount;index++){
   const body=await page.locator(root).innerText();
   if(/Terminal 1: press Ctrl\+C/.test(body))await stop(1);
   for(const details of await page.locator(root+' details').all()){
    const summary=await details.locator('summary').textContent();
    if(!summary?.startsWith('odom_lab/'))continue;
    const metadata=/\/(setup\.py|CMakeLists\.txt)$/.test(summary);
    const action=metadata?'Replace with example':'Add file';
    if(metadata)assert.match(body,/Replace with example/,'Metadata instructions must name the explicit replacement action');
    await details.getByRole('button',{name:action,exact:true}).click();
    result.fileActions.push({file:summary,action});
    const source=await page.locator('.cm-content').innerText();
    if(metadata)assert.match(source,language==='python'?/reader\s*=\s*odom_lab\.reader:main/:/add_executable\(reader/);
   }
   const commands=await page.locator(root+' .command code').allTextContents();
   for(const line of commands){
    const index=Number((await page.locator(root+' .command-terminal').innerText()).match(/\d+/)[0]);
    await command(line,index);
   }
   if(index<pageCount-1)await page.locator('#guide-next').click();
  }
  result.firstRun=result.readerRuns[0];
  assert(result.firstRun.processes.some(p=>p.language===language&&p.status==='Running'&&p.executable==='reader'));
  await stop();

  // An existing package must never silently run the opposite implementation.
  // A dirty draft makes data preservation observable through the actual editor.
  const fileSuffix=language==='python'?'/odom_lab/reader.py':'/src/reader.cpp';
  const file=page.locator(`#file-tree [data-path$="${fileSuffix}"]`),original=await file.elementHandle(),beforeSelection=await readState();
  await page.waitForTimeout(400);
  assert((await readState()).samples>beforeSelection.samples,'Sensors must remain live while choosing a file');
  assert(await original.evaluate(node=>node.isConnected),'Sensor updates detached the file being selected');
  await file.click();await original.dispose();
  const marker=language==='python'?'# odometry UI preserved draft':'// odometry UI preserved draft';
  await page.locator('.cm-content').focus();await page.keyboard.press('Control+End');await page.keyboard.insertText('\n'+marker+'\n');
  const draft=await page.locator('.cm-content').innerText();
  await page.locator('#language').selectOption(language==='python'?'cpp':'python');
  assert.equal(await page.locator('#language').inputValue(),language,'Incompatible switch must keep the package language selected');
  assert.equal(await page.locator('.cm-content').innerText(),draft,'Rejected language switch lost the dirty draft');
  assert.match(await page.locator('.odom-language-notice').innerText(),/export|Export|reset|Reset/,'Language mismatch must explain a safe recovery');
  assert.equal((await readState()).processes.length,0,'Language rejection must not run the old implementation');
  result.languageRejection={selected:await page.locator('#language').inputValue(),status:await page.locator('#status').innerText(),draftPreserved:true};

  // Entering from another exercise is a distinct route to the same mismatch.
  if(tf)await page.locator('[data-exercise="frames"]').click();
  else await page.locator('.playground-exercises button').first().click();
  await page.locator('#language').selectOption(language==='python'?'cpp':'python');
  await page.locator('[data-exercise="odometry"]').click();
  const usePackageLanguage=page.getByRole('button',{name:'Use package language',exact:true});
  await usePackageLanguage.waitFor();
  assert.equal(await page.locator('.cm-content').innerText(),draft,'Entering mismatched exercise lost the draft');
  const switchRejected=await page.locator('#language').inputValue()===language;
  if(tf)assert(switchRejected,'TF workspace language guard must apply from every exercise');
  const blockedPages=switchRejected?0:Number((await page.locator('.guide-progress').innerText()).split('/')[1]);
  for(let index=0;index<blockedPages;index++){
   const offered=await page.locator(root+' .command code').allTextContents();
   assert(!offered.some(line=>/ros2 pkg create|colcon build|ros2 run odom_lab/.test(line)),'Mismatched exercise offered a package/build/run command');
   assert.equal(await page.locator(root+' summary').filter({hasText:'odom_lab/'}).count(),0,'Mismatched exercise offered source files for the wrong package');
   if(index<blockedPages-1)await page.locator('#guide-next').click();
  }
  await usePackageLanguage.click();assert.equal(await page.locator('#language').inputValue(),language);
  assert.equal(await page.locator('.cm-content').innerText(),draft);
  await page.locator('#save').click();
  for(const line of ['cd ~/ros2_ws','colcon build --packages-select odom_lab','source install/setup.bash','ros2 run odom_lab reader'])await command(line);
  result.recoveredRun=await readState();
  assert(result.recoveredRun.processes.some(p=>p.language===language&&p.status==='Running'&&p.executable==='reader'));
  await page.screenshot({path:`${output}/${language}-reader.png`,fullPage:true});
  await stop();assert.deepEqual(result.errors,[]);
  console.log(`PASS ${language}: visible odometry walkthrough, metadata, language guard, preserved draft and running ${language} reader`);
 }catch(error){result.error=error.stack;result.status=await page.locator('#status').textContent().catch(()=>null);result.transcripts=await page.locator('.terminal-transcript pre').allTextContents().catch(()=>[]);await page.screenshot({path:`${output}/${language}-failure.png`,fullPage:true}).catch(()=>{});throw error;}
 finally{await writeFile(`${output}/visible-workflow.json`,JSON.stringify(report,null,2));await context.close();}
}
try{for(const language of ['python','cpp'])await run(language);}
finally{await browser.close();}
