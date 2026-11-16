import {FileBuffer} from './file-buffer.js';
export class NanoEditor{
 constructor(fs,path,parent,onExit){
  this.buffer=new FileBuffer(fs,path);this.onExit=onExit;
  this.element=document.createElement('section');this.element.className='nano-editor';
  this.element.innerHTML='<div class="nano-title"><strong>nano · teaching editor</strong><span class="nano-path"></span><span class="nano-dirty"></span></div><textarea class="nano-text" spellcheck="false" aria-label="nano file contents"></textarea><div class="nano-message" role="status"></div><div class="nano-actions"><button class="nano-save">^O Save</button><button class="nano-exit">^X Exit</button><span>Arrow keys to move · Tab to indent</span></div><div class="nano-question" hidden></div>';
  parent.append(this.element);this.element.querySelector('.nano-path').textContent=path.replace('/home/student/','~/');
  this.input=this.element.querySelector('textarea');this.input.value=this.buffer.text;
  this.input.oninput=()=>{this.buffer.text=this.input.value;this.update();};
  this.element.addEventListener('keydown',event=>{if(event.ctrlKey&&!event.altKey&&['o','s','x','c'].includes(event.key.toLowerCase())){event.preventDefault();event.stopPropagation();const key=event.key.toLowerCase();if(key==='x')this.requestExit();else if(key==='c')this.cancelQuestion();else if(key==='o')this.writePrompt();else this.save();}else if(event.key==='Tab'&&event.target===this.input){event.preventDefault();this.input.setRangeText('\t',this.input.selectionStart,this.input.selectionEnd,'end');this.input.oninput();}});
  this.element.querySelector('.nano-save').onclick=()=>this.writePrompt();this.element.querySelector('.nano-exit').onclick=()=>this.requestExit();this.update();this.input.focus();
 }
 update(){this.element.querySelector('.nano-dirty').textContent=this.buffer.dirty?'Modified':'';}
 message(text){this.element.querySelector('.nano-message').textContent=text;}
 cancelQuestion(){this.element.querySelector('.nano-question').hidden=true;this.exitAfterSave=false;this.input.focus();}
 save(){try{this.buffer.text=this.input.value;this.buffer.save();this.update();this.message('File saved.');if(this.exitAfterSave)this.exit();else this.cancelQuestion();return true;}catch(error){this.message(error.message);return false;}}
 writePrompt(exitAfterSave=false){this.element.querySelector('.nano-question').onkeydown=event=>{if(event.key==='Escape'){event.preventDefault();this.cancelQuestion();}};this.exitAfterSave=exitAfterSave;const box=this.element.querySelector('.nano-question');box.replaceChildren();box.hidden=false;const label=document.createElement('span');label.textContent='Write file: ';const name=document.createElement('code');name.textContent=this.buffer.path;const button=document.createElement('button');button.textContent='Confirm · Enter';button.onclick=()=>this.save();const cancel=document.createElement('button');cancel.textContent='Cancel';cancel.onclick=()=>this.cancelQuestion();box.append(label,name,button,cancel);button.focus();}
 requestExit(){if(!this.buffer.dirty){this.exit();return;}const box=this.element.querySelector('.nano-question');box.replaceChildren();box.hidden=false;const label=document.createElement('span');label.textContent='Save changes before closing?';box.append(label);for(const [text,action]of [['Yes',()=>this.writePrompt(true)],['No',()=>this.exit()],['Cancel',()=>this.cancelQuestion()]]){const b=document.createElement('button');b.textContent=text;b.onclick=action;box.append(b);}box.onkeydown=event=>{if(event.ctrlKey||event.altKey)return;const key=event.key.toLowerCase();if(['y','n','escape'].includes(key)){event.preventDefault();if(key==='y')this.writePrompt(true);else if(key==='n')this.exit();else this.cancelQuestion();}};box.querySelector('button').focus();}
 exit(){this.destroy();this.onExit();}
 destroy(){this.element.remove();}
}
