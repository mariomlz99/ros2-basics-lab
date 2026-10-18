// Real browser keyboard events only: observation hooks never call input() or set
// the command line/cursor. The xterm buffer is the visible terminal's source.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium,firefox} from 'playwright-core';

const url=process.env.LAB_URL||'http://127.0.0.1:8017/basics.html';
const artifacts=process.env.TERMINAL_ARTIFACTS||'artifacts/terminal-shortcuts';
await mkdir(artifacts,{recursive:true});
const results=[];
for(const [name,engine,executablePath] of [
 ['chrome',chromium,process.env.CHROME_BIN||'/usr/bin/google-chrome'],
 ['firefox',firefox,process.env.FIREFOX_BIN]
]){
 // Firefox's Playwright backend has no clipboard permission grant. Its test
 // preference permits reading the actual clipboard without a native doorhanger.
 const browser=await engine.launch({headless:true,...(executablePath?{executablePath}:{}),...(name==='firefox'?{firefoxUserPrefs:{'dom.events.testing.asyncClipboard':true}}:{})});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  if(name==='chrome')await page.context().grantPermissions(['clipboard-read','clipboard-write']);
  await page.goto(url);await page.locator('#start').click();await page.locator('.xterm').waitFor();
  await page.evaluate(()=>{
   window.shortcutEvents=[];
   const prototype=window.TerminalView.prototype,original=prototype.input;
   prototype.input=function(data){window.shortcutView=this;window.shortcutEvents.push({type:'data',data});return original.call(this,data);};
   document.addEventListener('keydown',event=>{
    if(!event.target.closest('.terminal-screen'))return;
    const record={type:'keydown',key:event.key,code:event.code,ctrl:event.ctrlKey};
    window.shortcutEvents.push(record);
    setTimeout(()=>{record.prevented=event.defaultPrevented;record.pageSelection=String(window.getSelection());},0);
   },true);
  });
  const input=page.locator('.xterm-helper-textarea');
  await input.focus();await page.keyboard.press('Control+a');
  const flush=async()=>{await page.evaluate(()=>new Promise(resolve=>window.shortcutView.xterm.write('',()=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))));};
  const snapshot=async()=>{await flush();return page.evaluate(()=>{
   const v=window.shortcutView,b=v.xterm.buffer.active;
   return {line:v.line,cursor:v.cursor,prompt:v.promptText(),cols:v.xterm.cols,x:b.cursorX,y:b.baseY+b.cursorY,rows:Array.from({length:b.length},(_,i)=>b.getLine(i).translateToString(false)),selection:String(window.getSelection()),history:[...v.terminal.history]};
  });};
  let anchor=0,prior=[];
  const begin=async()=>{await input.focus();await page.keyboard.press('Control+c');const s=await snapshot();anchor=s.y-Math.floor(s.prompt.length/s.cols);prior=s.rows.slice(0,anchor);return s;};
  const visible=async(line,cursor,label)=>{
   const s=await snapshot(),text=s.prompt+line,offset=s.prompt.length+cursor;
   assert.equal(s.line,line,`${name} ${label}: logical command`);
   assert.equal(s.cursor,cursor,`${name} ${label}: logical cursor`);
   assert.equal(s.rows.slice(anchor,anchor+Math.ceil(text.length/s.cols)).join('').slice(0,text.length),text,`${name} ${label}: rendered command`);
   assert.equal(s.x,offset%s.cols,`${name} ${label}: visible cursor column`);
   assert.equal(s.y,anchor+Math.floor(offset/s.cols),`${name} ${label}: visible cursor row`);
   assert.deepEqual(s.rows.slice(0,anchor),prior,`${name} ${label}: earlier output preserved`);
   assert.equal(s.selection,'',`${name} ${label}: no webpage selection`);
   return s;
  };
  const submit=async command=>{
   await page.keyboard.press('Enter');
   await page.waitForFunction(()=>!window.shortcutView.executing&&!window.shortcutView.terminal.busy);
   const s=await snapshot();assert.equal(s.history.at(-1),command,`${name}: submitted exact edited command`);
   assert((await page.locator('.terminal-transcript pre').textContent()).includes(s.prompt+command),`${name}: submitted command transcript`);
  };
  // Single line, several wrapped rows, and exact multiples of terminal width.
  // Exact-width lines expose delayed wrapping even while normal lines work.
  for(const [start,end] of [['Control+a','Control+e'],['Home','End']]){
   for(const size of ['single','wrapped','boundary-1','boundary-2','boundary-3']){
    const s=await begin();
    const length=size==='single'?16:size==='wrapped'?s.cols*3+31:s.cols*Number(size.at(-1))-s.prompt.length;
    const original='echo hello world'+'x'.repeat(Math.max(0,length-16));
    await page.keyboard.type(original);await visible(original,original.length,`${size} before`);
    for(let i=0;i<4;i++)await page.keyboard.press('ArrowLeft');
    await page.keyboard.press(start);await visible(original,0,`${size} ${start}`);
    await page.keyboard.type('PREFIX-');await visible('PREFIX-'+original,7,`${size} prefix`);
    await page.keyboard.press(end);await visible('PREFIX-'+original,7+original.length,`${size} ${end}`);
    await page.keyboard.type('-SUFFIX');await visible('PREFIX-'+original+'-SUFFIX',14+original.length,`${size} suffix`);
    await submit('PREFIX-'+original+'-SUFFIX');
   }
  }
  console.log(`PASS ${name}: Ctrl+A/E, Home/End; single, >2-row wrap and 1/2/3 exact boundaries`);
  for(const wrapped of [false,true]){
   const s=await begin(),padding=wrapped?'x'.repeat(s.cols*2):'';
   const initial='echo '+padding+'alpha beta gamma';
   await page.keyboard.type(initial);for(let i=0;i<6;i++)await page.keyboard.press('ArrowLeft');
   await page.keyboard.press('Control+w');
   let line='echo '+padding+'alpha  gamma',cursor=('echo '+padding+'alpha ').length;
   await visible(line,cursor,'Ctrl+W keeps following text');
   await page.keyboard.press('Control+k');line=line.slice(0,cursor);await visible(line,cursor,'Ctrl+K keeps prefix');
   await page.keyboard.type('tail');line+='tail';cursor=line.length;
   for(let i=0;i<4;i++)await page.keyboard.press('ArrowLeft');cursor-=4;
   await page.keyboard.press('Control+u');line='tail';cursor=0;await visible(line,cursor,'Ctrl+U keeps suffix');
   await page.keyboard.type('echo ');line='echo tail';cursor=5;await visible(line,cursor,'edit after Ctrl+U');
   await submit(line);
  }
  console.log(`PASS ${name}: Ctrl+U/K/W preserve the intended half of single and wrapped lines`);
  // Command history and completion still travel through xterm's event chain.
  await begin();await page.keyboard.press('ArrowUp');await visible('echo tail',9,'history up');
  await page.keyboard.press('ArrowDown');await visible('',0,'history down');
  await page.keyboard.type('pw');await page.keyboard.press('Tab');await visible('pwd ',4,'completion');await submit('pwd ');
  await begin();await page.keyboard.type('echo clipboard-selection');await submit('echo clipboard-selection');
  const clipboard=await page.evaluate(()=>{
   const v=window.shortcutView,b=v.xterm.buffer.active;
   let row=-1;for(let i=0;i<b.length;i++)if(b.getLine(i).translateToString(true)==='clipboard-selection')row=i;
   if(row<0)throw Error('Selection output missing');
   v.xterm.select(0,row,'clipboard-selection'.length);
   window.clipboardWrites=[];const write=navigator.clipboard.writeText.bind(navigator.clipboard);
   navigator.clipboard.writeText=text=>{const record={text,ok:false};window.clipboardWrites.push(record);return write(text).then(()=>{record.ok=true;},error=>{record.error=String(error);throw error;});};
   return {transcript:document.querySelector('.terminal-transcript pre').textContent,selection:v.xterm.getSelection()};
  });
  assert.equal(clipboard.selection,'clipboard-selection');
  await page.keyboard.press('Control+c');
  await page.waitForFunction(()=>window.clipboardWrites.some(record=>record.ok));
  assert.equal(await page.locator('.terminal-transcript pre').textContent(),clipboard.transcript,`${name}: selected Ctrl+C copies without interrupt`);
  assert.equal(await page.evaluate(()=>window.clipboardWrites.at(-1).text),'clipboard-selection');
  await page.keyboard.press('Control+Shift+c');await page.waitForFunction(()=>window.clipboardWrites.length===2&&window.clipboardWrites[1].ok);
  assert.equal(await page.locator('.terminal-transcript pre').textContent(),clipboard.transcript,`${name}: selected Ctrl+Shift+C also copies`);
  await page.evaluate(()=>window.shortcutView.xterm.clearSelection());
  assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),'clipboard-selection',`${name}: actual clipboard contains the selection`);
  await begin();await page.keyboard.type('echo not submitted');await page.keyboard.press('Control+c');
  assert.equal((await snapshot()).line,'',`${name}: unselected Ctrl+C cancels input`);
  assert((await page.locator('.terminal-transcript pre').textContent()).endsWith('^C\n'));
  await page.keyboard.type('ros2 topic echo /keyboard_test std_msgs/msg/String');await page.keyboard.press('Enter');
  await page.waitForFunction(()=>window.shortcutView.terminal.busy);
  await page.keyboard.press('Control+z');await page.waitForFunction(()=>!window.shortcutView.terminal.busy&&!window.shortcutView.executing);
  assert(await page.evaluate(()=>[...window.shortcutView.terminal.jobs.values()].some(job=>job.state==='Stopped')),`${name}: Ctrl+Z suspends supported topic command`);
  await page.keyboard.type('fg');await page.keyboard.press('Enter');await page.waitForFunction(()=>window.shortcutView.terminal.busy);
  await page.keyboard.press('Control+c');await page.waitForFunction(()=>!window.shortcutView.terminal.busy&&!window.shortcutView.executing);
  assert.equal(await page.evaluate(()=>window.shortcutView.terminal.jobs.size),0,`${name}: no job remains after interrupt`);
  console.log(`PASS ${name}: real clipboard copy/read, cancel, Ctrl+Z/fg and foreground interrupt`);
  // No global interception: ordinary browser selection remains outside xterm.
  await page.locator('#lesson-heading').click();await page.keyboard.press('Control+a');
  assert((await page.evaluate(()=>String(window.getSelection()))).length>100,`${name}: browser Select All outside terminal`);
  await page.evaluate(()=>window.getSelection().removeAllRanges());
  // Offscreen xterm canvases pause rendering. Scroll into view when checking a
  // new session, then type visibly and revisit it to exercise resize/lifecycle.
  const playground=page.getByRole('button',{name:'↗ Robotics Playground',exact:true});
  if(await playground.count()){
   await playground.click();await input.scrollIntoViewIfNeeded();await input.focus();await page.keyboard.press('Control+a');
   await begin();await page.keyboard.type('echo navigation');await visible('echo navigation',15,'Playground session');
   await page.getByRole('button',{name:'1 ROS 2 environment',exact:true}).click();await input.focus();await page.keyboard.press('Control+a');
   await playground.click();await input.scrollIntoViewIfNeeded();await input.focus();await page.keyboard.press('Control+e');
   const s=await snapshot();anchor=s.y-Math.floor((s.prompt.length+s.cursor)/s.cols);prior=s.rows.slice(0,anchor);
   await visible('echo navigation',15,'Playground session return');await submit('echo navigation');
  }
  const events=await page.evaluate(()=>window.shortcutEvents);
  for(const key of ['a','e','u','k','w']){
   const records=events.filter(e=>e.type==='keydown'&&e.ctrl&&e.key===key);
   assert(records.length&&records.every(e=>e.prevented&&!e.pageSelection),`${name}: Ctrl+${key} default prevented, no browser selection`);
  }
  const result={browser:name,version:browser.version(),passed:true,keyboardEvents:events.filter(e=>e.type==='keydown').length,cases:'line editing; exact wrap; visible cursor; output preservation; submitted commands; history; completion; clipboard; cancellation; scope; help; Playground navigation'};
  results.push(result);console.log(`PASS ${name}: scoped browser shortcuts, optional translated help and navigation`);
 }finally{await browser.close();}
}
await writeFile(`${artifacts}/results.json`,JSON.stringify(results,null,2)+'\n');
console.log('PASS terminal keyboard regressions in Chrome and Firefox');
