import {ROOT} from '../workspace.js';
import {lesson} from '../course.js';

// Prerequisite source state is taken from the same visible course examples.
// Existing packages are left untouched: preparing must never erase student work.
export async function prepareLesson(lab,index,language,report=()=>{}){
 if(index<1||index>7)throw Error('Choose a later lesson to prepare.');
 if(lab.builder.controller||[...lab.terminals.values()].some(t=>t.busy))throw Error('Stop running commands before preparing a lesson.');
 if(index===1)return [];
 lab.fs.mkdir(ROOT+'/src',true);
 const specs=new Map();
 // Lesson 3 teaches package creation itself; lesson 4 only needs the workspace.
 // Later lessons receive the final source state of the earlier lessons.
 for(let i=1;i<Math.min(index===7?1:index,6);i++)for(const step of lesson(i,language)){
  if(step.kind==='commands')for(const command of step.commands){
   if(!command.startsWith('ros2 pkg create '))continue;
   const words=command.split(' '),type=words[words.indexOf('--build-type')+1],node=words.includes('--node-name')?words[words.indexOf('--node-name')+1]:null;
   const nameIndex=node?words.indexOf('--node-name')+2:words.indexOf('--license')+2;
   const name=words[nameIndex],dependencies=words.includes('--dependencies')?words.slice(words.indexOf('--dependencies')+1):[];
   specs.set(name,{name,type,node,dependencies,files:{}});
  }
  if(step.kind==='files')Object.assign(specs.get(step.pkg)?.files??{},step.items);
 }
 const names=[];
 for(const spec of specs.values()){
  const base=ROOT+'/src/'+spec.name;
  if(!lab.fs.exists(base)){
   lab.workspace.create(spec.name,spec.type,{node:spec.node,dependencies:spec.dependencies});
   for(const [path,source]of Object.entries(spec.files)){const full=base+'/'+path;lab.fs.mkdir(full.slice(0,full.lastIndexOf('/')),true);lab.fs.write(full,source);}
  }
  names.push(spec.name);
 }
 if(names.length){
  for(const terminal of lab.terminals.values()){terminal.busy=true;terminal.stopTask=()=>lab.builder.cancel();}
  try{await lab.builder.build(names,report,ROOT);}finally{for(const terminal of lab.terminals.values()){terminal.busy=false;terminal.stopTask=null;}}
 }
 for(const terminal of lab.terminals.values()){
  terminal.cwd=ROOT;
  if(names.length)await terminal.execute('source '+ROOT+'/install/setup.bash');
 }
 return names;
}
