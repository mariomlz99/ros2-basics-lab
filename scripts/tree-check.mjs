import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 await page.goto(process.env.LAB_URL||'http://127.0.0.1:8017/ros2-basics-lab/');
 await page.evaluate(async()=>{
  const base=document.querySelector('script[type="module"]').src;
  const {TerminalView}=await import(new URL('terminal-view.js',base));
  const original=TerminalView.prototype.output;
  TerminalView.prototype.output=function(s){window.checkedTerminal=this;return original.call(this,s);};
 });
 await page.locator('#start').click();await page.locator('.xterm').waitFor();
 for(const command of ['mkdir -p practice/aa','cd practice','touch notes.txt','ls -a','tree']){
  await page.locator('.xterm-helper-textarea').focus();await page.keyboard.insertText(command);await page.keyboard.press('Enter');await page.waitForTimeout(150);
 }
 const transcript=await page.locator('.terminal-transcript pre').textContent();
 assert(transcript.includes('.\n├── aa\n└── notes.txt\n\n2 directories, 1 file'));
 assert(!transcript.includes('\x1b'));assert(transcript.includes('.  ..  aa  notes.txt'));
 const colors=await page.evaluate(()=>{
  const buffer=window.checkedTerminal.xterm.buffer.active,result={};
  for(let row=0;row<buffer.length;row++){
   const line=buffer.getLine(row),text=line.translateToString(true);
   for(const [prefix,key] of [['├── aa','directory'],['└── notes.txt','file']])if(text.startsWith(prefix)){
    const cell=line.getCell(4);result[key]={bold:!!cell.isBold(),color:cell.getFgColor(),palette:!!cell.isFgPalette()};
   }
  }
  return result;
 });
 assert.deepEqual(colors.directory,{bold:true,color:4,palette:true});assert.equal(colors.file.bold,false);
 for(const command of ['ls /opt/ros/jazzy/bin','ros2 --help','ros2 node list --all','ros2 daemon stop','ros2 daemon status','ros2 daemon start']){
  await page.locator('.xterm-helper-textarea').focus();await page.keyboard.insertText(command);await page.keyboard.press('Enter');await page.waitForTimeout(150);
 }
 const final=await page.locator('.terminal-transcript pre').textContent();
 for(const expected of ['rviz2','rqt_graph','urdf_to_graphviz','usage: ros2','Various daemon related sub-commands','/_ros2cli_daemon_0_browser','The daemon has been stopped','The daemon is not running','The daemon has been started'])assert(final.includes(expected),expected);
 assert(!final.includes('bounded Jazzy model'));
 console.log('PASS native tree, directory colors, complete bin listing, root help, daemon and clean transcript');
}finally{await browser.close();}
