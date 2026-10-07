import {HOME,normalize} from './fs.js';
// Bounded tokenizer: quoted strings and variable expansion, never eval or Bash.
export function tokenize(input,env={}){
 const result=[];let token='',quote=null,started=false;
 for(let i=0;i<input.length;i++){
  const c=input[i];if(c==='\\'&&input[i+1]==='\n'&&quote!=="'"){i++;continue;}
  if(c==='`'||(c==='$'&&input[i+1]==='('))throw Error('Command substitution is not supported');
  if(!quote&&'|&;<>'.includes(c))throw Error('Pipes, redirects, chaining and job control are not supported');
  if(c==='\\'&&quote!=="'"){if(i+1>=input.length)throw Error('Incomplete escape');token+=input[++i];started=true;continue;}
  if(c===quote){quote=null;continue;}if(!quote&&(c==='"'||c==="'")){quote=c;started=true;continue;}
  if(!quote&&/\s/.test(c)){if(started){result.push(token);token='';started=false;}continue;}
  if(c==='$'&&quote!=="'"){const m=/^[A-Za-z_][A-Za-z_0-9]*/.exec(input.slice(i+1));if(m){token+=env[m[0]]??'';i+=m[0].length;started=true;continue;}}
  token+=c;started=true;
 }
 if(quote)throw Error('Unclosed quote');if(started)result.push(token);return result;
}
export class Terminal{
 constructor(fs,id,{output=()=>{},dispatch=null}={}){this.fs=fs;this.id=id;this.cwd=HOME;this.env={HOME,USER:'student',SHELL:'/bin/bash',ROS_DISTRO:'jazzy',PATH:'/opt/ros/jazzy/bin:/usr/bin:/bin'};this.overlays=new Set();this.history=[];this.output=output;this.dispatch=dispatch;this.stopTask=null;this.busy=false;}
 path(p){return normalize(p,this.cwd);}
 stop(){this.stopTask?.();this.stopTask=null;this.busy=false;}
 async execute(line){if(this.busy)throw Error('Terminal has a running process. Use Ctrl+C or Stop first.');if(!line.trim())return '';this.history.push(line);const words=tokenize(line,this.env);if(!words.length)return '';const [cmd,...args]=words;
  const options=new Set(args.filter(a=>a.startsWith('-')).flatMap(a=>a.slice(1).split(''))),paths=args.filter(a=>!a.startsWith('-'));
  const flags=allowed=>{for(const f of options)if(!allowed.includes(f))throw Error(cmd+': unsupported option -'+f);};
  const count=(min,max=Infinity)=>{if(paths.length<min||paths.length>max)throw Error(cmd+': expected '+(min===max?min:`${min} or more`)+' operand(s)');};
  switch(cmd){
   case 'pwd':flags('');count(0,0);return this.cwd;
   case 'cd':flags('');count(0,1);{const p=this.path(paths[0]||'~');this.fs.dir(p);this.cwd=p;return '';}
   case 'ls':flags('la');{const list=(paths.length?paths:['.']).flatMap(p=>{const full=this.path(p);return this.fs.entry(full).kind==='dir'?this.fs.list(full):[{name:p,...this.fs.entry(full)}];}).filter(e=>options.has('a')||!e.name.startsWith('.'));return list.map(e=>(options.has('l')?(e.kind==='dir'?'drwxr-xr-x':'-rw-r--r--')+' student '+String(e.content?.length??0).padStart(5)+' ':'')+e.name+(e.kind==='dir'?'/':'')).join(options.has('l')?'\n':'  ');}
   case 'mkdir':flags('p');count(1);for(const p of paths)this.fs.mkdir(this.path(p),options.has('p'));return '';
   case 'touch':flags('');count(1);for(const p of paths)this.fs.touch(this.path(p));return '';
   case 'cat':flags('');count(1);return paths.map(p=>this.fs.read(this.path(p))).join('');
   case 'cp':flags('r');count(2,2);this.fs.copy(this.path(paths[0]),this.path(paths[1]),{recursive:options.has('r')});return '';
   case 'mv':flags('');count(2,2);this.fs.move(this.path(paths[0]),this.path(paths[1]));return '';
   case 'rm':flags('rf');if(!options.has('f'))count(1);for(const p of paths)this.fs.remove(this.path(p),{recursive:options.has('r'),force:options.has('f')});return '';
   case 'tree':flags('');count(0,1);return (paths[0]||'.')+'\n'+this.fs.tree(this.path(paths[0]||'.'));
   case 'echo':return args.join(' ');
   case 'history':flags('');count(0,0);return this.history.map((s,i)=>`${i+1}  ${s}`).join('\n');
   case 'clear':flags('');count(0,0);return '\x1bc';
   case 'printenv':flags('');count(0,1);return paths.length?(this.env[paths[0]]??''):Object.entries(this.env).map(([k,v])=>k+'='+v).join('\n');
   case 'which':flags('');count(1);return paths.map(p=>p==='ros2'?'/opt/ros/jazzy/bin/ros2':p==='colcon'?'/usr/bin/colcon':['ls','mkdir','cat','touch','cp','mv','rm','echo','pwd','printenv','which','tree'].includes(p)?'/usr/bin/'+p:'').filter(Boolean).join('\n');
   default:if(this.dispatch&&['ros2','colcon','source'].includes(cmd))return await this.dispatch(this,words);throw Error(cmd+': command not supported in this browser lab');
  }
 }
}
