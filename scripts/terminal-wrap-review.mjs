// Independent keyboard/renderer oracle: no calls to TerminalView.input().
import assert from 'node:assert/strict';
import {chromium,firefox} from 'playwright-core';
import {mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const url=process.env.LAB_URL||'http://127.0.0.1:8042/basics.html';
const reports=[];await mkdir('artifacts/review',{recursive:true});
for(const [name,engine] of [['chrome',chromium],['firefox',firefox]]){
 const browser=await engine.launch({headless:process.env.HEADED!=='1',...(name==='chrome'?{executablePath:'/usr/bin/google-chrome'}:{})});
 const report={browser:name,cases:[],failures:[]};
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  if(process.env.OLD_TERMINAL==='1')await page.route('**/src/terminal-view.js',route=>route.fulfill({contentType:'text/javascript',body:execFileSync('git',['show','2ae347acc02c98b3cfaa96715ce79c27f1bb78e3:src/terminal-view.js'],{encoding:'utf8'})}));
  await page.goto(url);await page.locator('#start').click();await page.locator('.xterm').waitFor();
  await page.evaluate(()=>{window.reviewKeys=[];for(const type of ['keydown','keyup'])document.addEventListener(type,e=>{window.reviewKeys.push({type,key:e.key,code:e.code,ctrl:e.ctrlKey,repeat:e.repeat,target:e.target.className});if(window.reviewKeys.length>200)window.reviewKeys.shift();},true);const input=window.TerminalView.prototype.input;window.TerminalView.prototype.input=function(data){window.reviewTerminal=this;return input.call(this,data);};});
  const focus=async()=>{await page.locator('.xterm-helper-textarea').focus();};await focus();await page.keyboard.press('Control+a');
  const state=async()=>{await page.evaluate(()=>new Promise(resolve=>window.reviewTerminal.xterm.write('',()=>requestAnimationFrame(resolve))));return page.evaluate(()=>{const v=window.reviewTerminal,b=v.xterm.buffer.active;return{line:v.line,cursor:v.cursor,prompt:v.promptText(),cols:v.xterm.cols,height:v.xterm.rows,x:b.cursorX,y:b.baseY+b.cursorY,rows:Array.from({length:b.length},(_,i)=>b.getLine(i).translateToString(false))};});};
  const resize=async width=>{await page.locator('.terminal-card').evaluate((el,width)=>{el.style.width=width+'px';el.style.maxWidth='none';},width);await page.waitForTimeout(100);await focus();};
  const begin=async()=>{await page.keyboard.press('Control+c');await page.keyboard.type('echo SENTINEL');await page.keyboard.press('Enter');await page.waitForFunction(()=>!window.reviewTerminal.executing);return state();};
  const verify=async(line,cursor,label)=>{const s=await state(),offset=s.prompt.length+cursor,capacity=Math.max(s.cols,(s.height-2)*s.cols),full=s.prompt+line,start=full.length<capacity?0:Math.max(0,Math.floor(offset/s.cols)-Math.floor(capacity/s.cols)+1)*s.cols,anchor=s.y-Math.floor((offset-start)/s.cols),text=full.slice(start,start+capacity-1);assert.equal(s.line,line,label+' logical line');assert.equal(s.cursor,cursor,label+' logical cursor');assert.equal(s.x,offset%s.cols,label+' visual column');assert.equal(s.rows.slice(anchor,anchor+Math.ceil(text.length/s.cols)).join('').slice(0,text.length),text,label+' visual content');assert(s.rows.slice(0,anchor).some(row=>row.trim()==='SENTINEL'),label+' prior output');assert.equal(await page.evaluate(()=>String(window.getSelection())),'');};
  const run=async(label,fn)=>{try{await fn();report.cases.push(label);}catch(e){report.failures.push({label,message:e.message,keys:await page.evaluate(()=>window.reviewKeys)});await page.screenshot({path:`artifacts/review/${name}-wrap-failure.png`});console.log('FAIL '+name+' '+label+': '+e.message);}};
  for(const width of [240,400,790,1150]){
   await resize(width);
   for(const rows of [1,2])for(const delta of [-1,0,1])await run(`width ${width}, ${rows} rows ${delta}`,async()=>{
    const s=await begin();let line='echo '+'x'.repeat(Math.max(0,rows*s.cols-s.prompt.length+delta-5)),cursor=line.length;
    await page.keyboard.type(line);await verify(line,cursor,'type');
    for(const key of ['Control+a','Home']){await page.keyboard.press(key);cursor=0;await verify(line,cursor,key);await page.keyboard.type('P-');line='P-'+line;cursor=2;await verify(line,cursor,'prefix');await page.keyboard.press('Control+e');cursor=line.length;await verify(line,cursor,'end');}
    await page.keyboard.press('ArrowLeft');cursor--;await page.keyboard.type('M');line=line.slice(0,cursor)+'M'+line.slice(cursor);cursor++;await verify(line,cursor,'middle');
    await page.keyboard.press('Backspace');line=line.slice(0,cursor-1)+line.slice(cursor);cursor--;await verify(line,cursor,'backspace');
    await page.keyboard.press('Delete');line=line.slice(0,cursor)+line.slice(cursor+1);await verify(line,cursor,'delete');
    await page.keyboard.press('End');cursor=line.length;await page.keyboard.type(' tail word');line+=' tail word';cursor=line.length;await page.keyboard.press('Control+w');line=line.slice(0,-4);cursor=line.length;await verify(line,cursor,'word');
    await page.keyboard.press('ArrowLeft');cursor--;await page.keyboard.press('Control+k');line=line.slice(0,cursor);await verify(line,cursor,'kill');
    await page.keyboard.press('Home');cursor=0;await page.keyboard.press('ArrowRight');cursor++;await page.keyboard.press('Control+u');line=line.slice(cursor);cursor=0;await verify(line,cursor,'clear prefix');
    await page.keyboard.press('End');await page.keyboard.press('Enter');await page.waitForFunction(()=>!window.reviewTerminal.executing);assert.equal(await page.evaluate(()=>window.reviewTerminal.terminal.history.at(-1)),line);
   });
  }
  for(const [first,second]of [[790,400],[400,1150],[1150,240],[240,790]])await run(`resize ${first} to ${second}`,async()=>{
   await resize(first);const s=await begin();let line='echo '+'abc '.repeat(s.cols),cursor=line.length;await page.keyboard.type(line);await page.keyboard.press('Home');cursor=0;await page.keyboard.press('ArrowRight');cursor=1;
   await resize(second);await verify(line,cursor,'after resize');await page.keyboard.press('Control+a');cursor=0;await page.keyboard.type('P-');line='P-'+line;cursor=2;await verify(line,cursor,'resized prefix');
   await page.keyboard.press('Control+e');cursor=line.length;await page.keyboard.type('-S');line+='-S';cursor+=2;await verify(line,cursor,'resized suffix');await page.keyboard.press('Enter');await page.waitForFunction(()=>!window.reviewTerminal.executing);assert.equal(await page.evaluate(()=>window.reviewTerminal.terminal.history.at(-1)),line);
  });
 }finally{await browser.close();reports.push(report);await writeFile('artifacts/review/terminal-wrap'+(process.env.OLD_TERMINAL==='1'?'-old':process.env.HEADED==='1'?'-headed':'')+'.json',JSON.stringify(reports,null,2));}
 console.log(name+': '+report.cases.length+' pass / '+report.failures.length+' fail');
}
assert(reports.every(r=>!r.failures.length),'Terminal torture regressions failed');
