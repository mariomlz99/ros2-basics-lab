import {sortedCompletions,commonCompletion,completionColumns,COMPLETION_QUERY_ITEMS} from './completion-display.js';
import{rosCompletions}from'./completion.js';
import{NanoEditor}from'./nano-editor.js';
import{t}from'./i18n.js';
import{Terminal as XTerm,FitAddon}from'./vendor/ui.js';
import{HOME}from'./fs.js';
export class TerminalView{
 constructor(lab,terminal,parent,onClose,onOpenFile){this.lab=lab;this.terminal=terminal;terminal.color=true;this.line='';this.cursor=0;this.historyIndex=0;this.executing=false;this.disposed=false;this.renderedRows=1;this.renderedCursor=0;
  this.element=document.createElement('section');this.element.className='terminal-card';this.element.innerHTML=`<div class="terminal-title"><strong><span aria-hidden="true">🐧</span> Terminal ${terminal.id}</strong><span class="terminal-state">Jazzy base</span><button class="stop">Stop · Ctrl+C</button><button class="close" aria-label="Close Terminal ${terminal.id}">×</button></div><div class="terminal-screen"></div><details class="terminal-transcript"><summary>Plain-text transcript</summary><pre></pre></details>`;parent.append(this.element);
  this.xterm=new XTerm({convertEol:true,cursorBlink:true,cursorStyle:'block',fontSize:13,fontFamily:'"DejaVu Sans Mono", monospace',scrollback:2000,theme:{background:'#101a20',foreground:'#dceae5',cursor:'#a2e7c4',cursorAccent:'#101a20',selectionBackground:'#406358',blue:'#79aaff',brightBlue:'#79aaff'}});this.fit=new FitAddon();this.xterm.loadAddon(this.fit);this.xterm.open(this.element.querySelector('.terminal-screen'));this.fit.fit();this.xterm.textarea?.setAttribute('aria-label',`Terminal ${terminal.id} input`);
  this.element.querySelector('.stop').onclick=()=>this.interrupt();this.element.querySelector('.close').onclick=()=>{if(this.nano?.buffer.dirty&&!confirm(t('Discard unsaved terminal edits?')))return;onClose();};
  terminal.editFile=(mode,path)=>{if(mode==='gedit'){if(!onOpenFile)throw Error('Workspace editor unavailable');onOpenFile(path);return;}this.nano=new NanoEditor(lab.fs,path,this.element,()=>{this.nano=null;terminal.busy=false;terminal.foreground=null;terminal.stopTask=null;this.element.classList.remove('editing');this.xterm.focus();if(!this.executing)this.prompt();});this.element.classList.add('editing');terminal.busy=true;terminal.foreground='editor';terminal.stopTask=()=>{this.nano?.destroy();this.nano=null;this.element.classList.remove('editing');terminal.foreground=null;};};
  terminal.onForegroundEnd=()=>{if(!this.executing&&!this.disposed)this.prompt();};
  terminal.output=s=>this.output(s);this.xterm.onData(s=>this.input(s));this.xterm.attachCustomKeyEventHandler(e=>{
   if(e.ctrlKey&&!e.altKey&&e.code==='KeyC'){
    e.preventDefault();e.stopPropagation();
    if(e.type==='keydown'){
     const selection=this.xterm.getSelection();
     if(selection||e.shiftKey){if(selection)navigator.clipboard?.writeText(selection).catch(()=>this.output(t('Copy failed. Select text in the plain-text transcript and use the browser copy menu.')));}
     else this.interrupt();
    }
    return false;
   }if(e.ctrlKey&&!e.altKey&&e.code==='KeyZ'){e.preventDefault();e.stopPropagation();if(e.type==='keydown')this.suspend();return false;}return true;
  });
  this.resize=new ResizeObserver(()=>{if(this.element.isConnected){this.fit.fit();}});this.resize.observe(this.element);terminal.ready.then(()=>{if(!this.disposed)this.prompt();});
  this.poll=setInterval(()=>{if(!this.executing&&terminal.busy&&terminal.foreground==='process'&&!lab.processes.active().some(p=>p.terminal===terminal.id)){terminal.busy=false;terminal.stopTask=null;terminal.foreground=null;this.prompt();}const state=this.element.querySelector('.terminal-state');const owned=lab.processes.active().filter(p=>p.terminal===terminal.id&&p.language!=='cli');state.textContent=this.nano?'Editing · nano':terminal.busy?(owned.length?(owned.every(p=>p.status==='Running')?'Running · callbacks ready':owned.map(p=>p.status||'Loading').join(' / ')):'Running · foreground'):lab.workspace.visible(terminal).length?'Jazzy + workspace overlay':(terminal.env.AMENT_PREFIX_PATH||'').split(':').includes('/opt/ros/jazzy')?'Jazzy base':'ROS environment not sourced';},150);
 }
 promptText(){if(this.terminal.pythonShell)return this.terminal.pythonShell.more?'... ':'>>> ';return `student@ros2lab:${this.terminal.cwd===HOME?'~':this.terminal.cwd.replace(HOME+'/','~/')}$ `;}
 prompt(){if(this.disposed)return;this.historyIndex=this.terminal.history.length;this.line='';this.cursor=0;this.renderedRows=1;this.renderedCursor=0;this.xterm.write('\x1b[38;2;162;231;196m'+this.promptText()+'\x1b[0m');}
 redraw(){const cols=this.xterm.cols,prompt=this.promptText(),oldRow=Math.floor((prompt.length+this.renderedCursor)/cols);this.xterm.write('\r'+(oldRow?`\x1b[${oldRow}A`:'')+'\x1b[J\x1b[38;2;162;231;196m'+prompt+'\x1b[0m'+this.line);const end=prompt.length+this.line.length,target=prompt.length+this.cursor,endRow=Math.floor(end/cols),targetRow=Math.floor(target/cols);if(endRow>targetRow)this.xterm.write(`\x1b[${endRow-targetRow}A`);this.xterm.write('\r'+(target%cols?`\x1b[${target%cols}C`:''));this.renderedCursor=this.cursor;}

 record(s){const pre=this.element.querySelector('.terminal-transcript pre');pre.textContent=(pre.textContent+String(s).replace(/\x1b\[[0-9;]*m/g,'')+'\n').slice(-80000);}
 output(s){if(this.disposed)return;this.record(s);document.dispatchEvent(new CustomEvent('lab-diagnostic',{detail:{text:String(s),terminal:this.terminal.id}}));if(s==='\x1bc'){this.xterm.clear();return;}this.xterm.writeln(String(s).replace(/\x1b\][^\x07]*(\x07|$)/g,''));}
 interrupt(){if(this.disposed)return;this.completionMode=null;this.completionRows=null;this.completionKey=null;if(this.nano){this.nano.requestExit();return;}if(this.terminal.pythonShell&&!this.executing&&!this.terminal.busy){this.terminal.pythonShell.interrupt();this.line='';this.cursor=0;this.xterm.write('^C\r\n');this.prompt();return;}this.cancelled=true;const executing=this.executing;this.executing=true;this.lab.stop(this.terminal.id);this.executing=executing;this.terminal.foreground=null;this.record('^C');this.xterm.write('^C\r\n');this.line='';this.cursor=0;if(!this.executing)this.prompt();}
 suspend(){if(this.disposed||this.nano)return;try{const notice=this.terminal.suspend();if(notice){this.output('^Z\n'+notice);if(!this.executing)this.prompt();}}catch(error){this.output(error.message);}}
 async submit(){const line=this.line;this.record(this.promptText()+line);this.cursor=this.line.length;this.redraw();this.xterm.write('\r\n');this.line='';this.cursor=0;this.executing=true;this.element.querySelector('.terminal-state').textContent='Running · foreground';this.cancelled=false;try{const value=await (this.terminal.pythonShell?this.terminal.pythonShell.send(line):this.terminal.execute(line));if(value&&!this.cancelled)this.output(value);}catch(e){if(!this.cancelled)this.output(e.message);}finally{this.executing=false;if(!this.terminal.busy&&!this.disposed)this.prompt();}}
 input(data){if(data==='\x1a'){this.suspend();return;}if(data==='\x03'){this.interrupt();return;}if(this.executing||this.terminal.busy)return;
  if(this.completionMode){this.completionInput(data);return;}
  if(data!=='\t')this.completionKey=null;
  if(data.length>1&&!data.startsWith('\x1b')){const lines=data.replace(/\r\n/g,'\n').replace(/\r/g,'\n').split('\n');if(lines.length>1){(async()=>{for(let i=0;i<lines.length;i++){if(this.disposed||this.terminal.busy)break;this.line+=lines[i];this.cursor=this.line.length;this.redraw();if(i<lines.length-1)await this.submit();}})();return;}}
  switch(data){case '\r':this.submit();return;case '\x7f':if(this.cursor){this.line=this.line.slice(0,this.cursor-1)+this.line.slice(this.cursor);this.cursor--;}break;case '\x1b[3~':this.line=this.line.slice(0,this.cursor)+this.line.slice(this.cursor+1);break;
   case '\x1b[A':this.historyIndex=Math.max(0,this.historyIndex-1);this.line=this.terminal.history[this.historyIndex]??'';this.cursor=this.line.length;break;
   case '\x1b[B':this.historyIndex=Math.min(this.terminal.history.length,this.historyIndex+1);this.line=this.terminal.history[this.historyIndex]??'';this.cursor=this.line.length;break;
   case '\x1b[D':this.cursor=Math.max(0,this.cursor-1);break;case '\x1b[C':this.cursor=Math.min(this.line.length,this.cursor+1);break;
   case '\x01':case '\x1b[H':this.cursor=0;break;case '\x05':case '\x1b[F':this.cursor=this.line.length;break;case '\x15':this.line=this.line.slice(this.cursor);this.cursor=0;break;case '\x0b':this.line=this.line.slice(0,this.cursor);break;
   case '\x17':{const prefix=this.line.slice(0,this.cursor).replace(/\S+\s*$/,'');this.line=prefix+this.line.slice(this.cursor);this.cursor=prefix.length;break;}
   case '\x0c':this.xterm.clear();break;
   case '\t':this.complete();return;
   case '\x04':if(!this.line&&this.terminal.pythonShell){this.terminal.pythonShell.close();this.xterm.write('\r\n');this.prompt();return;}if(!this.line)this.element.querySelector('.close').click();return;
   default:if(!data.startsWith('\x1b')&&![...data].some(c=>c.charCodeAt(0)<32)){this.line=this.line.slice(0,this.cursor)+data+this.line.slice(this.cursor);this.cursor+=data.length;}
  }this.redraw();
 }
 complete(){
  const prefix=this.line.slice(0,this.cursor),word=prefix.split(/\s+/).at(-1);let choices=rosCompletions(this.lab,this.terminal,prefix),ros=choices!==null;
  if(!ros){try{const slash=word.lastIndexOf('/'),dir=slash>=0?word.slice(0,slash+1):'',part=word.slice(slash+1);choices=this.lab.fs.list(this.terminal.path(dir||'.')).filter(e=>e.name.startsWith(part)).map(e=>dir+e.name+(e.kind==='dir'?'/':''));if(!prefix.includes(' '))choices=['pwd','ls','cd','mkdir','touch','cat','cp','mv','rm','tree','clear','history','echo','which','printenv','source','ros2','colcon','nano','gedit','python3','jobs','fg','bg','kill'].filter(c=>c.startsWith(word));}catch{choices=[];}}
  choices=sortedCompletions(choices);
  const key=JSON.stringify([this.line,this.cursor,choices]),repeated=this.completionKey===key;
  if(!choices.length){this.completionKey=null;this.xterm.write('\x07');return;}
  const replacement=choices.length===1?choices[0]+(!ros&&choices[0].endsWith('/')?'':' '):commonCompletion(choices);
  if(replacement.length>word.length){this.line=prefix.slice(0,prefix.length-word.length)+replacement+this.line.slice(this.cursor);this.cursor+=replacement.length-word.length;this.redraw();}
  if(choices.length===1){this.completionKey=null;return;}
  this.completionKey=JSON.stringify([this.line,this.cursor,choices]);
  if(!repeated){this.xterm.write('\x07');return;}
  this.completionKey=null;
  // Move below the complete input line before presenting a question or list.
  const cursor=this.cursor;this.cursor=this.line.length;this.redraw();this.cursor=cursor;this.xterm.write('\r\n');this.renderedCursor=0;
  this.completionRows=completionColumns(choices,this.xterm.cols);this.completionOffset=0;
  if(choices.length>=COMPLETION_QUERY_ITEMS){this.completionMode='query';const question=`Display all ${choices.length} possibilities? (y or n)`;this.record(question);this.xterm.write(question);}
  else this.showCompletions();
 }
 restoreCompletionInput(){this.completionMode=null;this.completionRows=null;this.completionOffset=0;this.renderedCursor=0;this.redraw();}
 showCompletions(count=Math.max(1,this.xterm.rows-1)){
  const page=this.completionRows.slice(this.completionOffset,this.completionOffset+count);this.completionOffset+=page.length;
  if(page.length)this.output(page.join('\n'));
  if(this.completionOffset<this.completionRows.length){this.completionMode='pager';this.xterm.write('--More--');}
  else this.restoreCompletionInput();
 }
 completionInput(data){
  for(const key of data){
   if(this.completionMode==='query'){
    if(key==='y'||key==='Y'||key===' '){this.xterm.write('\r\n');this.showCompletions();}
    else if(key==='n'||key==='N'||key==='\x7f'){this.xterm.write('\r\n');this.restoreCompletionInput();}
    else this.xterm.write('\x07');
   }else if(this.completionMode==='pager'){
    if(['q','Q','\x1b'].includes(key)){this.xterm.write('\r\x1b[K');this.restoreCompletionInput();}
    else if(key===' '||key==='y'||key==='Y'||key==='\r'||key==='\n'){this.xterm.write('\r\x1b[K');this.showCompletions(key==='\r'||key==='\n'?1:Math.max(1,this.xterm.rows-1));}
    else this.xterm.write('\x07');
   }
   if(!this.completionMode)break;
  }
 }
 destroy(){this.disposed=true;clearInterval(this.poll);this.resize.disconnect();this.lab.close(this.terminal.id);this.xterm.dispose();this.element.remove();}
}
