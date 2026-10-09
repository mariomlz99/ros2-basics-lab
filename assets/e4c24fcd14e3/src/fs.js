import {attachNativeContent} from './native-installation.js';
import {seedInstallation} from './ros-installation.js';
export const HOME='/home/student';
export function normalize(path,cwd=HOME){
 if(typeof path!=='string'||!path||path.includes('\0'))throw Error('Invalid path');
 if(path==='~')path=HOME;else if(path.startsWith('~/'))path=HOME+path.slice(1);else if(path.startsWith('~'))throw Error('Only the current user home (~) is supported');
 const out=[];for(const part of (path.startsWith('/')?path:cwd+'/'+path).split('/')){if(!part||part==='.')continue;if(part==='..')out.pop();else out.push(part);}return '/'+out.join('/');
}
const parent=p=>p.slice(0,p.lastIndexOf('/'))||'/';
export class FileSystem{
 constructor(){this.entries=new Map([['/',{kind:'dir'}]]);this.revision=0;this.listeners=new Set();for(const p of [HOME,'/opt/ros/jazzy','/tmp','/etc'])this.mkdir(p,true);seedInstallation(this);this.write(HOME+'/.bashrc','# Load ROS 2 in each new interactive terminal.\nsource /opt/ros/jazzy/setup.bash\n');}
 changed(path){this.revision++;for(const fn of this.listeners)fn(path);}
 exists(p){return this.entries.has(normalize(p));}
 entry(p){p=normalize(p);const item=this.entries.get(p);if(!item)throw Error(p+': No such file or directory');return attachNativeContent(item);}
 dir(p){if(this.entry(p).kind!=='dir')throw Error(p+': Not a directory');}
 mkdir(p,parents=false){p=normalize(p);if(this.exists(p)){if(parents){this.dir(p);return;}throw Error(p+': File exists');}if(parents&&!this.exists(parent(p)))this.mkdir(parent(p),true);this.dir(parent(p));this.entries.set(p,{kind:'dir'});this.changed(p);}
 write(p,content){p=normalize(p);this.dir(parent(p));if(this.exists(p)&&this.entry(p).kind==='dir')throw Error(p+': Is a directory');const executable=this.entries.get(p)?.executable??false;this.entries.set(p,{kind:'file',content:String(content),executable});this.changed(p);}
 touch(p){if(this.exists(p)){this.changed(normalize(p));return;}this.write(p,'');}
 read(p){const e=this.entry(p);if(e.kind!=='file')throw Error(p+': Is a directory');return e.content;}
 list(p){p=normalize(p);this.dir(p);return [...this.entries].filter(([key])=>key!==p&&parent(key)===p).map(([path,e])=>({path,name:path.split('/').at(-1),...e})).sort((a,b)=>a.name.localeCompare(b.name));}
 filesUnder(p){p=normalize(p);this.dir(p);return Object.fromEntries([...this.entries].filter(([key,e])=>e.kind==='file'&&key.startsWith(p+'/')).map(([key,e])=>[key.slice(p.length+1),e.content]));}
 remove(p,{recursive=false,force=false}={}){p=normalize(p);if(!this.exists(p)){if(force)return;this.entry(p);}if(p==='/')throw Error('Refusing to remove the virtual root');if(this.entry(p).kind==='dir'&&!recursive)throw Error(p+': Is a directory (use -r)');for(const key of [...this.entries.keys()])if(key===p||key.startsWith(p+'/'))this.entries.delete(key);this.changed(p);}
 copy(from,to,{recursive=false,move=false}={}){
  from=normalize(from);to=normalize(to);const item=this.entry(from);if(this.exists(to)&&this.entry(to).kind==='dir')to=normalize(to+'/'+from.split('/').at(-1));
  if(from==='/'||to===from||to.startsWith(from+'/'))throw Error('Cannot copy or move a path into itself');
  if(item.kind==='dir'&&!recursive)throw Error(from+': Omitting directory (use -r)');this.dir(parent(to));
  if(this.exists(to)&&(this.entry(to).kind!==item.kind||(move&&item.kind==='dir'&&this.list(to).length)))throw Error(to+': Incompatible or nonempty destination');
  const entries=[...this.entries].filter(([p])=>p===from||p.startsWith(from+'/'));
  // Validate collisions before mutation.
  for(const [p,e]of entries){const dest=to+p.slice(from.length);if(this.exists(dest)&&this.entry(dest).kind!==e.kind)throw Error(dest+': Incompatible destination');}
  for(const [p,e]of entries){const dest=to+p.slice(from.length);if(e.kind==='dir')this.mkdir(dest,true);else{this.write(dest,this.read(p));this.entries.set(dest,{...e,content:this.read(p)});}}if(move)this.remove(from,{recursive:true});return to;
 }
 move(from,to){return this.copy(from,to,{recursive:true,move:true});}
 tree(p,{label=p,format=name=>name}={}){
  p=normalize(p);const root=this.entry(p);
  if(root.kind!=='dir')return label+'  [error opening dir]\n\n0 directories, 1 file';
  const lines=[format(label,root)];let directories=0,files=0;
  const walk=(path,prefix)=>{
   const entries=this.list(path).filter(e=>!e.name.startsWith('.'));
   entries.forEach((entry,index)=>{
    const last=index===entries.length-1;
    lines.push(prefix+(last?'└── ':'├── ')+format(entry.name,entry));
    if(entry.kind==='dir'){directories++;walk(entry.path,prefix+(last?'    ':'│   '));}else files++;
   });
  };
  walk(p,'');if(lines.length>1)directories++;
  return lines.join('\n')+'\n\n'+directories+' '+(directories===1?'directory':'directories')+', '+files+' '+(files===1?'file':'files');
 }

}
