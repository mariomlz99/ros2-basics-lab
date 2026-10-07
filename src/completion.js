import {BASE_PACKAGES} from './workspace.js';
const verbs={pkg:['create','list','executables'],node:['list','info'],topic:['list','info','type','echo','hz','pub'],interface:['list','show'],param:['list','get','set'],service:['list','type','call'],run:[],launch:[]};
export function rosCompletions(lab,terminal,prefix){
 const words=prefix.trimStart().split(/\s+/),partial=words.at(-1);
 if(words[0]!=='ros2'||words.length<2)return null;
 const [_,verb,action]=words;let choices=[];
 if(words.length===2)choices=Object.keys(verbs);
 else if(['run','launch'].includes(verb)){
  const visible=lab.workspace.visible(terminal);
  if(words.length===3)choices=visible.filter(name=>{const pkg=lab.workspace.installed.get(name);return verb==='run'?pkg.executables.size:pkg.launch.length;});
  else if(words.length===4&&visible.includes(action)){const pkg=lab.workspace.installed.get(action);choices=verb==='run'?[...pkg.executables.keys()]:pkg.launch.map(path=>path.replace(/^launch\//,''));}
 }else if(words.length===3)choices=verbs[verb]??[];
 else if(words.length===4){
  if(verb==='pkg'&&action==='executables')choices=[...BASE_PACKAGES,...lab.workspace.visible(terminal)];
  if(verb==='node'&&action==='info'||verb==='param'&&['list','get','set'].includes(action))choices=[...lab.runtime.nodes];
  if(verb==='topic'&&['info','type','echo','hz','pub'].includes(action))choices=[...lab.runtime.topics.keys()];
  if(verb==='service'&&['type','call'].includes(action))choices=[...lab.runtime.services.keys()];
  if(verb==='interface'&&action==='show')choices=[...lab.workspace.registry.definitions.keys()].filter(name=>BASE_PACKAGES.includes(name.split('/')[0])||lab.workspace.visible(terminal).includes(name.split('/')[0]));
 }else if(words.length===5&&verb==='param'&&['get','set'].includes(action))choices=[...(lab.runtime.parameters.get(words[3])?.keys()??[])];
 return [...new Set(choices)].filter(value=>value.startsWith(partial)).sort();
}
