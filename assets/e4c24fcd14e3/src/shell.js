import {baseEnvironment,sourceBase} from './ros-installation.js';
import {HOME,normalize} from './fs.js';
// Bounded tokenizer: quoted strings and variable expansion, never eval or Bash.
const regexLiteral=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
export function tokenize(input,env={},{redirects=false,patterns=false}={}){
 const result=[];let token='',pattern='',hasPattern=false,quote=null,started=false;
 const add=(s,wild=false)=>{token+=s;pattern+=wild?(s==='*'?'.*':'.'):regexLiteral(s);hasPattern||=wild;started=true;};
 const push=()=>{if(started)result.push(patterns&&hasPattern?{value:token,pattern}:token);token='';pattern='';hasPattern=false;started=false;};
 for(let i=0;i<input.length;i++){
  const c=input[i];if(!quote&&c==='#'&&!started)break;if(c==='\\'&&input[i+1]==='\n'&&quote!=="'"){i++;continue;}
  if(c==='`'||(c==='$'&&input[i+1]==='('))throw Error('Command substitution is not supported');
  if(!quote&&c==='>'&&redirects){if(started&&/^\d+$/.test(token))throw Error('File-descriptor redirection is not supported');push();const append=input[i+1]==='>';if(append)i++;result.push({redirect:append?'>>':'>'});continue;}
  if(!quote&&'|&;<>'.includes(c))throw Error('Pipes, input redirects, chaining and job control are not supported');
  if(c==='\\'&&quote!=="'"){if(i+1>=input.length)throw Error('Incomplete escape');add(input[++i]);continue;}
  if(c===quote){quote=null;continue;}if(!quote&&(c==='"'||c==="'")){quote=c;started=true;continue;}
  if(!quote&&/\s/.test(c)){push();continue;}
  if(c==='$'&&quote!=="'"){if(input[i+1]==='{'){const end=input.indexOf('}',i+2),name=input.slice(i+2,end);if(end<0||!/^[A-Za-z_][A-Za-z_0-9]*$/.test(name))throw Error('Unsupported parameter expansion');add(env[name]??'');i=end;continue;}const m=/^[A-Za-z_][A-Za-z_0-9]*/.exec(input.slice(i+1));if(m){add(env[m[0]]??'');i+=m[0].length;continue;}}
  add(c,!quote&&(c==='*'||c==='?'));
 }
 if(quote)throw Error('Unclosed quote');push();return result;
}
function expandPattern(word,fs,cwd){
 if(!word?.pattern)return [word];
 const parts=word.value.split('/'),patterns=word.pattern.split('/');let paths=[''];
 if(parts[0]===''||parts[0]==='~'){paths=[parts.shift()===''?'/':'~'];patterns.shift();}
 for(let i=0;i<parts.length;i++){
  const part=parts[i],expression=patterns[i],next=[];
  for(const base of paths){
   const join=name=>base?(base.endsWith('/')?base:base+'/')+name:name;
   // A quoted wildcard is escaped in the pattern and remains literal.
   if(expression!==regexLiteral(part)){
    try{for(const entry of fs.list(normalize(base||'.',cwd)))if((part.startsWith('.')||!entry.name.startsWith('.'))&&new RegExp('^'+expression+'$').test(entry.name))next.push(join(entry.name));}catch{}
   }else{const name=join(part);if(fs.exists(normalize(name||'.',cwd)))next.push(name);}
  }
  paths=next;
 }
 return paths.length?paths:[word.value];
}
export class Terminal{
 constructor(fs,id,{output=()=>{},dispatch=null,startup=true}={}){this.fs=fs;this.id=id;this.cwd=HOME;this.env=baseEnvironment(HOME);this.overlays=new Set();this.history=[];this.output=output;this.dispatch=dispatch;this.stopTask=null;this.busy=false;this.vars={};this.sourceStack=[];this.jobs=new Map();this.nextJob=0;this.currentJob=null;this.ready=startup?this.startup():Promise.resolve();}
 registerJob(control){const job={command:this.history.at(-1),state:'Running',...control};this.currentJob=job;return job;}
 finishJob(job){if(job.id)this.jobs.delete(job.id);if(this.currentJob===job){this.currentJob=null;this.finishForeground();}}
 suspend(){
  if(!this.busy)return '';
  const job=this.currentJob;if(!job)throw Error('Suspension is currently supported for ros2 topic pub, echo and hz. Use Ctrl+C to stop this command.');
  job.pause();job.state='Stopped';job.id??=++this.nextJob;this.jobs.set(job.id,job);this.currentJob=null;this.busy=false;this.foreground=null;this.stopTask=null;
  return '['+job.id+']+  Stopped                 '+job.command;
 }
 jobCommand(cmd,args){
  if(cmd==='jobs'){if(args.length)throw Error('Usage: jobs');return [...this.jobs.values()].map(job=>'['+job.id+']'+(job.id===Math.max(...this.jobs.keys())?'+':'-')+'  '+job.state.padEnd(24)+job.command).join('\n');}
  if(args.length>1)throw Error('Usage: '+cmd+' [%job]');
  const id=args.length?Number(args[0].replace(/^%/,'')):Math.max(...this.jobs.keys()),job=this.jobs.get(id);
  if(!job)throw Error('bash: '+cmd+': '+(args[0]||'current')+': no such job');
  if(cmd==='kill'){job.stop();this.jobs.delete(id);return '';}
  job.state='Running';if(cmd==='fg'){this.currentJob=job;this.busy=true;this.foreground='process';this.stopTask=job.stop;this.output(job.command);}else this.output('['+id+']+ '+job.command+' &');
  job.resume();return '';
 }
 finishForeground(){this.busy=false;this.foreground=null;this.stopTask=null;this.onForegroundEnd?.();}
 path(p){return normalize(p,this.cwd);}
 formatEntry(name,entry){return this.color&&(entry.kind==='dir'||entry.executable)?'\x1b[1;'+(entry.kind==='dir'?'34':'32')+'m'+name+'\x1b[0m':name;}
 stop(){this.stopTask?.();this.stopTask=null;this.busy=false;}
 async startup(){if(this.fs.exists(HOME+'/.bashrc'))try{await this.sourceFile(HOME+'/.bashrc');}catch(error){this.output('bash: '+error.message);}}
 findFile(name,{executable=false}={}){
  const pathValue=this.vars.PATH??this.env.PATH;
  const candidates=name.includes('/')?[this.path(name)]:(pathValue===undefined?[]:pathValue.split(':').map(dir=>normalize(name,normalize(dir||'.',this.cwd))));
  return candidates.find(path=>this.fs.exists(path)&&this.fs.entry(path).kind==='file'&&(!executable||this.fs.entry(path).executable));
 }
 async sourceFile(name){
  const path=name.includes('/')?this.path(name):(this.findFile(name)||this.path(name));
  const source=this.fs.read(path);
  if(this.sourceStack.includes(path)||this.sourceStack.length>=32)throw Error('Recursive source: '+path);
  this.sourceStack.push(path);
  let lastError=null;
  try{
   for(const line of source.replace(/\\\n/g,'').split('\n')){
    if(!line.trim()||line.trimStart().startsWith('#'))continue;
    try{const output=await this.execute(line,{internal:true,recordHistory:false});lastError=null;if(output)this.output(output);}
    catch(error){lastError=error;this.output('bash: '+path+': '+error.message);}
   }
  }finally{this.sourceStack.pop();}
  if(lastError)throw lastError;return '';
 }
 async runScript(path,args=[],command=null){
  if(args.length)throw Error('Script positional arguments are not implemented');
  const output=[],child=new Terminal(this.fs,this.id,{startup:false,dispatch:this.dispatch,output:text=>output.push(text)});
  child.cwd=this.cwd;child.env={...this.env};child.overlays=new Set(this.overlays);
  if(path)await child.sourceFile(path);else{const result=await child.execute(command);if(result)output.push(result);}
  if(child.busy){this.busy=true;this.foreground=child.foreground;this.stopTask=()=>child.stop();child.output=text=>this.output(text);}
  return output.join('\n');
 }
 async execute(line,{internal=false,recordHistory=true}={}){
  if(!internal)await this.ready;
  if(this.busy)throw Error('Terminal has a running process. Use Ctrl+C or Stop first.');
  if(!line.trim())return '';if(recordHistory)this.history.push(line);
  const words=tokenize(line,{...this.env,...this.vars},{redirects:true,patterns:true}).flatMap(word=>expandPattern(word,this.fs,this.cwd));if(!words.length)return '';
  if(words.every(word=>typeof word==='string'&&/^[A-Za-z_][A-Za-z_0-9]*=/.test(word))){for(const word of words){const at=word.indexOf('='),key=word.slice(0,at),value=word.slice(at+1);if(Object.hasOwn(this.env,key))this.env[key]=value;else this.vars[key]=value;}return '';}
  const builtins=new Set(['cd','pwd','echo','history','source','.','export','unset','jobs','fg','bg','kill']);
  const requested=words[0];
  if(!builtins.has(requested)){
   const path=this.findFile(requested,{executable:true});
   if(!path){if(requested.includes('/')&&this.fs.exists(this.path(requested)))throw Error(requested+': Permission denied');throw Error(requested+': command not found');}
   const entry=this.fs.entry(path);
   if(entry.nativeExecutable)throw Error(requested+': installed native executable (inspection only); execution is not implemented in this browser lab.');
   if(entry.package&&entry.program&&this.dispatch)return this.dispatch(this,['__installed__',path,...words.slice(1)]);
   if(entry.command)words[0]=entry.command;
   else if(/^#!.*(?:bash|\/sh)(?:\s|$)/.test(entry.content))return this.runScript(path,words.slice(1));
   else if(/^#!.*python3(?:\s|$)/.test(entry.content)&&this.dispatch)return this.dispatch(this,['python3',path,...words.slice(1)]);
   else throw Error(requested+': executable format is not supported in this browser terminal');
  }
  const redirects=words.flatMap((word,index)=>typeof word==='object'?[index]:[]);let redirect;
  if(redirects.length){const at=redirects[0];if(redirects.length!==1||at!==words.length-2||typeof words[at+1]!=='string'||!words[at+1])throw Error('Use echo text > filename or echo text >> filename');if(words[0]!=='echo')throw Error('Output redirection currently supports echo only');redirect={append:words[at].redirect==='>>',path:this.path(words[at+1])};words.splice(at);}
  const [cmd,...args]=words;
  const options=new Set(args.filter(a=>a.startsWith('-')).flatMap(a=>a.slice(1).split(''))),paths=args.filter(a=>!a.startsWith('-'));
  const flags=allowed=>{for(const f of options)if(!allowed.includes(f))throw Error(cmd+': unsupported option -'+f);};
  const count=(min,max=Infinity)=>{if(paths.length<min||paths.length>max)throw Error(cmd+': expected '+(min===max?min:`${min} or more`)+' operand(s)');};
  switch(cmd){
   case 'jobs':case 'fg':case 'bg':case 'kill':return this.jobCommand(cmd,args);
   case 'export':{for(const arg of args){const match=/^([A-Za-z_][A-Za-z_0-9]*)(?:=(.*))?$/s.exec(arg);if(!match)throw Error('export: invalid identifier '+arg);const key=match[1];this.env[key]=match[2]??this.vars[key]??this.env[key]??'';delete this.vars[key];}return args.length?'':Object.entries(this.env).map(([key,value])=>'declare -x '+key+'='+JSON.stringify(value)).join('\n');}
   case 'unset':{for(const key of args){if(!/^[A-Za-z_][A-Za-z_0-9]*$/.test(key))throw Error('unset: invalid identifier '+key);delete this.env[key];delete this.vars[key];}return '';}
   case 'source':case '.':{if(args.length!==1)throw Error('Usage: source <file>');if(this.dispatch)return this.dispatch(this,words);const p=this.path(args[0]);this.fs.read(p);if(/^\/opt\/ros\/jazzy\/(?:local_)?setup\.(?:bash|sh)$/.test(p)){sourceBase(this.env,this.vars);return '';}return this.sourceFile(args[0]);}
   case 'bash':{if(args[0]==='-c'&&args.length===2)return this.runScript(null,[],args[1]);if(args.length===1&&!args[0].startsWith('-'))return this.runScript(this.path(args[0]));throw Error('Supported: bash <script> or bash -c "command". Use + Terminal for a new interactive shell.');}
   case 'chmod':{if(args.length!==2||!['+x','-x','u+x','u-x','755','644'].includes(args[0]))throw Error('Supported: chmod +x|-x|755|644 <file>');const entry=this.fs.entry(this.path(args[1]));if(entry.kind!=='file')throw Error('chmod: expected a file');entry.executable=['+x','u+x','755'].includes(args[0]);this.fs.changed(this.path(args[1]));return '';}
   case 'nano':case 'gedit':{if(args.length===1&&['-h','--help'].includes(args[0]))return cmd==='nano'?'nano <file> — Ctrl+O, Enter to save; Ctrl+X to exit.':'gedit <file> — opens the workspace editor; Save or Ctrl+S writes the file.';flags('');count(1,1);const path=this.path(paths[0]);this.fs.dir(path.slice(0,path.lastIndexOf('/'))||'/');if(this.fs.exists(path))this.fs.read(path);if(!this.editFile)throw Error('Open this editor in a browser terminal.');await this.editFile(cmd,path);return '';}
   case 'vim':case 'vi':throw Error('Vim is not implemented in this lab. Use nano <file> or gedit <file>.');
   case 'pwd':flags('');count(0,0);return this.cwd;
   case 'cd':flags('');count(0,1);{const p=this.path(paths[0]||'~');this.fs.dir(p);this.env.OLDPWD=this.cwd;this.cwd=p;this.env.PWD=p;return '';}
   case 'ls':flags('la');{const list=(paths.length?paths:['.']).flatMap(p=>{const full=this.path(p);return this.fs.entry(full).kind==='dir'?[...(options.has('a')?[{name:'.',kind:'dir'},{name:'..',kind:'dir'}]:[]),...this.fs.list(full)]:[{name:p,...this.fs.entry(full)}];}).filter(e=>options.has('a')||!e.name.startsWith('.'));return list.map(e=>(options.has('l')?(e.kind==='dir'?'drwxr-xr-x':e.executable?'-rwxr-xr-x':'-rw-r--r--')+' student '+String(e.nativeSize??e.content?.length??0).padStart(5)+' ':'')+this.formatEntry(e.name,e)).join(options.has('l')?'\n':'  ');}
   case 'mkdir':flags('p');count(1);for(const p of paths)this.fs.mkdir(this.path(p),options.has('p'));return '';
   case 'touch':flags('');count(1);for(const p of paths)this.fs.touch(this.path(p));return '';
   case 'cat':flags('');count(1);return paths.map(p=>this.fs.read(this.path(p))).join('');
   case 'cp':flags('r');count(2,2);this.fs.copy(this.path(paths[0]),this.path(paths[1]),{recursive:options.has('r')});return '';
   case 'mv':flags('');count(2,2);this.fs.move(this.path(paths[0]),this.path(paths[1]));return '';
   case 'rm':flags('rf');if(!options.has('f'))count(1);for(const p of paths)this.fs.remove(this.path(p),{recursive:options.has('r'),force:options.has('f')});return '';
   case 'tree':flags('');count(0,1);return this.fs.tree(this.path(paths[0]||'.'),{label:paths[0]||'.',format:(name,entry)=>this.formatEntry(name,entry)});
   case 'echo':{const noNewline=args[0]==='-n',text=(noNewline?args.slice(1):args).join(' ');if(!redirect)return text;const previous=redirect.append&&this.fs.exists(redirect.path)?this.fs.read(redirect.path):'';this.fs.write(redirect.path,previous+text+(noNewline?'':'\n'));return '';}
   case 'history':flags('');count(0,0);return this.history.map((s,i)=>`${i+1}  ${s}`).join('\n');
   case 'clear':flags('');count(0,0);return '\x1bc';
   case 'printenv':flags('');count(0,1);return paths.length?(this.env[paths[0]]??''):Object.entries(this.env).map(([k,v])=>k+'='+v).join('\n');
   case 'which':flags('');count(1);return paths.map(name=>this.findFile(name,{executable:true})||'').filter(Boolean).join('\n');
   default:if(this.dispatch&&['ros2','colcon','source','.','python3'].includes(cmd))return await this.dispatch(this,words);throw Error(cmd+': command not supported in this browser lab');
  }
 }
}
