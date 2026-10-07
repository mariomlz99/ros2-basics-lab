import {HOME,normalize} from './fs.js';
// Bounded tokenizer: quoted strings and variable expansion, never eval or Bash.
const regexLiteral=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
export function tokenize(input,env={},{redirects=false,patterns=false}={}){
 const result=[];let token='',pattern='',hasPattern=false,quote=null,started=false;
 const add=(s,wild=false)=>{token+=s;pattern+=wild?(s==='*'?'.*':'.'):regexLiteral(s);hasPattern||=wild;started=true;};
 const push=()=>{if(started)result.push(patterns&&hasPattern?{value:token,pattern}:token);token='';pattern='';hasPattern=false;started=false;};
 for(let i=0;i<input.length;i++){
  const c=input[i];if(c==='\\'&&input[i+1]==='\n'&&quote!=="'"){i++;continue;}
  if(c==='`'||(c==='$'&&input[i+1]==='('))throw Error('Command substitution is not supported');
  if(!quote&&c==='>'&&redirects){if(started&&/^\d+$/.test(token))throw Error('File-descriptor redirection is not supported');push();const append=input[i+1]==='>';if(append)i++;result.push({redirect:append?'>>':'>'});continue;}
  if(!quote&&'|&;<>'.includes(c))throw Error('Pipes, input redirects, chaining and job control are not supported');
  if(c==='\\'&&quote!=="'"){if(i+1>=input.length)throw Error('Incomplete escape');add(input[++i]);continue;}
  if(c===quote){quote=null;continue;}if(!quote&&(c==='"'||c==="'")){quote=c;started=true;continue;}
  if(!quote&&/\s/.test(c)){push();continue;}
  if(c==='$'&&quote!=="'"){const m=/^[A-Za-z_][A-Za-z_0-9]*/.exec(input.slice(i+1));if(m){add(env[m[0]]??'');i+=m[0].length;continue;}}
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
 constructor(fs,id,{output=()=>{},dispatch=null}={}){this.fs=fs;this.id=id;this.cwd=HOME;this.env={HOME,USER:'learner',SHELL:'/bin/bash',ROS_DISTRO:'jazzy',PATH:'/opt/ros/jazzy/bin:/usr/bin:/bin'};this.overlays=new Set();this.history=[];this.output=output;this.dispatch=dispatch;this.stopTask=null;this.busy=false;}
 path(p){return normalize(p,this.cwd);}
 stop(){this.stopTask?.();this.stopTask=null;this.busy=false;}
 async execute(line){if(this.busy)throw Error('Terminal has a running process. Use Ctrl+C or Stop first.');if(!line.trim())return '';this.history.push(line);const words=tokenize(line,this.env,{redirects:true,patterns:true}).flatMap(word=>expandPattern(word,this.fs,this.cwd));if(!words.length)return '';
  const redirects=words.flatMap((word,index)=>typeof word==='object'?[index]:[]);let redirect;
  if(redirects.length){const at=redirects[0];if(redirects.length!==1||at!==words.length-2||typeof words[at+1]!=='string'||!words[at+1])throw Error('Use echo text > filename or echo text >> filename');if(words[0]!=='echo')throw Error('Output redirection currently supports echo only');redirect={append:words[at].redirect==='>>',path:this.path(words[at+1])};words.splice(at);}
  const [cmd,...args]=words;
  const options=new Set(args.filter(a=>a.startsWith('-')).flatMap(a=>a.slice(1).split(''))),paths=args.filter(a=>!a.startsWith('-'));
  const flags=allowed=>{for(const f of options)if(!allowed.includes(f))throw Error(cmd+': unsupported option -'+f);};
  const count=(min,max=Infinity)=>{if(paths.length<min||paths.length>max)throw Error(cmd+': expected '+(min===max?min:`${min} or more`)+' operand(s)');};
  switch(cmd){
   case 'nano':case 'gedit':{if(args.length===1&&['-h','--help'].includes(args[0]))return cmd==='nano'?'nano <file> — Ctrl+O, Enter to save; Ctrl+X to exit.':'gedit <file> — opens the workspace editor; Save or Ctrl+S writes the file.';flags('');count(1,1);const path=this.path(paths[0]);this.fs.dir(path.slice(0,path.lastIndexOf('/'))||'/');if(this.fs.exists(path))this.fs.read(path);if(!this.editFile)throw Error('Open this editor in a browser terminal.');await this.editFile(cmd,path);return '';}
   case 'vim':case 'vi':throw Error('Vim is not implemented in this lab. Use nano <file> or gedit <file>.');
   case 'pwd':flags('');count(0,0);return this.cwd;
   case 'cd':flags('');count(0,1);{const p=this.path(paths[0]||'~');this.fs.dir(p);this.cwd=p;return '';}
   case 'ls':flags('la');{const list=(paths.length?paths:['.']).flatMap(p=>{const full=this.path(p);return this.fs.entry(full).kind==='dir'?[...(options.has('a')?[{name:'.',kind:'dir'},{name:'..',kind:'dir'}]:[]),...this.fs.list(full)]:[{name:p,...this.fs.entry(full)}];}).filter(e=>options.has('a')||!e.name.startsWith('.'));return list.map(e=>(options.has('l')?(e.kind==='dir'?'drwxr-xr-x':'-rw-r--r--')+' learner '+String(e.content?.length??0).padStart(5)+' ':'')+e.name+(e.kind==='dir'?'/':'')).join(options.has('l')?'\n':'  ');}
   case 'mkdir':flags('p');count(1);for(const p of paths)this.fs.mkdir(this.path(p),options.has('p'));return '';
   case 'touch':flags('');count(1);for(const p of paths)this.fs.touch(this.path(p));return '';
   case 'cat':flags('');count(1);return paths.map(p=>this.fs.read(this.path(p))).join('');
   case 'cp':flags('r');count(2,2);this.fs.copy(this.path(paths[0]),this.path(paths[1]),{recursive:options.has('r')});return '';
   case 'mv':flags('');count(2,2);this.fs.move(this.path(paths[0]),this.path(paths[1]));return '';
   case 'rm':flags('rf');if(!options.has('f'))count(1);for(const p of paths)this.fs.remove(this.path(p),{recursive:options.has('r'),force:options.has('f')});return '';
   case 'tree':flags('');count(0,1);return (paths[0]||'.')+'\n'+this.fs.tree(this.path(paths[0]||'.'));
   case 'echo':{const noNewline=args[0]==='-n',text=(noNewline?args.slice(1):args).join(' ');if(!redirect)return text;const previous=redirect.append&&this.fs.exists(redirect.path)?this.fs.read(redirect.path):'';this.fs.write(redirect.path,previous+text+(noNewline?'':'\n'));return '';}
   case 'history':flags('');count(0,0);return this.history.map((s,i)=>`${i+1}  ${s}`).join('\n');
   case 'clear':flags('');count(0,0);return '\x1bc';
   case 'printenv':flags('');count(0,1);return paths.length?(this.env[paths[0]]??''):Object.entries(this.env).map(([k,v])=>k+'='+v).join('\n');
   case 'which':flags('');count(1);return paths.map(p=>p==='ros2'?'/opt/ros/jazzy/bin/ros2':p==='colcon'?'/usr/bin/colcon':['python3','nano','gedit','ls','mkdir','cat','touch','cp','mv','rm','echo','pwd','printenv','which','tree'].includes(p)?'/usr/bin/'+p:'').filter(Boolean).join('\n');
   default:if(this.dispatch&&['ros2','colcon','source','python3'].includes(cmd))return await this.dispatch(this,words);throw Error(cmd+': command not supported in this browser lab');
  }
 }
}
