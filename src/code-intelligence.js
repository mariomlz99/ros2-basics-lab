import {BUILTIN} from './interfaces/builtin.js';
import {PYTHON_COMPLETIONS} from './python-completion-data.js';
const ident='[A-Za-z_][A-Za-z_0-9]*';
const snake=name=>name.replace(/([A-Z]+)([A-Z][a-z])/g,'$1_$2').replace(/([a-z0-9])([A-Z])/g,'$1_$2').toLowerCase();
const normalize=s=>s.replace(/->|::/g,'.');
const definitions=value=>value instanceof Map?value:new Map(Object.entries(value||BUILTIN));
const partType=(field,owner)=>{const base=field.replace(/\[.*\]$/,'');return base.includes('/')?(base.split('/').length===2?base.replace('/','/msg/'):base):owner.split('/')[0]+'/msg/'+base;};
function environment(source,language,schemas){
 const types=new Map(),variables=new Map(),locals=new Map();
 for(const [name,record] of schemas){types.set(name.replaceAll('/','.'),name);for(const [section,key]of [['Request','fields'],['Response','response'],['Goal','fields'],['Result','response'],['Feedback','feedback']])if((name.includes('/srv/')&&['Request','Response'].includes(section)||name.includes('/action/')&&['Goal','Result','Feedback'].includes(section))&&record[key])types.set(name.replaceAll('/','.')+'.'+section,name+'#'+key);}
 if(language==='python'){
  for(const m of source.matchAll(/^\s*import\s+([\w.]+)(?:\s+as\s+(\w+))?/gm)){variables.set(m[2]||m[1].split('.')[0],m[2]?m[1]:m[1].split('.')[0]);}
  for(const m of source.matchAll(/^\s*from\s+([\w.]+)\s+import\s+([^\n#]+)/gm))for(const item of m[2].split(',')){const match=/^\s*(\w+)(?:\s+as\s+(\w+))?\s*$/.exec(item);if(!match)continue;const full=m[1]+'.'+match[1],alias=match[2]||match[1];if(types.has(full)){types.set(alias,types.get(full));for(const [key,type]of [...types])if(key.startsWith(full+'.'))types.set(alias+key.slice(full.length),type);}else variables.set(alias,full);}
  for(const m of source.matchAll(/\bdef\s+(\w+)\s*\(([^)]*)\)/g))locals.set(m[1],{label:m[1],type:'function',signature:m[1]+'('+m[2]+')',doc:'Function defined in this file'});
  for(const m of source.matchAll(/(?:^|\n)\s*([\w.]+)\s*(?::[^=\n]+)?=\s*([\w.]+)\s*\(/g)){const type=types.get(m[2]),module=resolve(m[2],variables,types,schemas);variables.set(m[1],type||(module&&schemas.has(module.split('#')[0])?module:null)||(/^(numpy\.)(array|asarray|arange|linspace|zeros|ones|empty|full|concatenate|stack|reshape|eye)$/.test(module||'')?'ndarray':null));}
  for(const m of source.matchAll(/\b(\w+)\s*:\s*([\w.]+)/g))if(types.has(m[2]))variables.set(m[1],types.get(m[2]));
 }else{
  for(const m of source.matchAll(/\busing\s+(\w+)\s*=\s*([\w:]+)/g)){const type=types.get(normalize(m[2]));if(type)types.set(m[1],type);}
  for(const m of source.matchAll(/\b([A-Za-z_]\w*(?:::\w+)*)\s*(?:[&*]\s*)?(\w+)\s*(?=[;=,){])/g)){const raw=normalize(m[1]).replace(/\.(?:ConstSharedPtr|SharedPtr)$/,''),type=types.get(raw);if(type)variables.set(m[2],type);}
  for(const m of source.matchAll(/\bauto\s+(\w+)\s*=\s*std::make_shared<([\w:]+)>/g)){const type=types.get(normalize(m[2]));if(type)variables.set(m[1],type);}
  for(const m of source.matchAll(/\bauto\s+(\w+)\s*=\s*([\w:]+)\s*[({]/g)){const type=types.get(normalize(m[2]));if(type)variables.set(m[1],type);}
 }
 for(const [name]of variables)if(!name.includes('.'))locals.set(name,{label:name,type:'variable',signature:name,doc:'Name in this file'});
 for(const [name,type]of types)if(!name.includes('.'))locals.set(name,typeOption(name,type,schemas));
 return {types,variables,locals};
}
function fields(type,schemas){const [owner,section='fields']=type.split('#');return schemas.get(owner)?.[section]||[];}
function resolve(expression,variables,types,schemas){
 expression=normalize(expression);if(types.has(expression))return types.get(expression);if(variables.has(expression))return variables.get(expression);
 const at=expression.lastIndexOf('.');if(at<0)return null;const parent=resolve(expression.slice(0,at),variables,types,schemas),key=expression.slice(at+1);if(!parent)return null;
 if(types.has(parent+'.'+key))return types.get(parent+'.'+key);
 if(parent==='numpy'||parent==='numpy.linalg')return parent+'.'+key;
 if([...types.keys()].some(name=>name.startsWith(parent+'.'+key+'.')))return parent+'.'+key;
 const field=fields(parent,schemas).find(f=>f.name===key);return field?partType(field.type,parent.split('#')[0]):null;
}
function typeOption(label,type,schemas){const fs=fields(type,schemas);return {label,type:'class',signature:label+'('+fs.map(f=>f.name+': '+f.type).join(', ')+')',doc:'ROS 2 '+type.replace('#fields',type.includes('/action/')?'.Goal':'.Request').replace('#response',type.includes('/action/')?'.Result':'.Response').replace('#feedback','.Feedback')+'\n'+fs.map(f=>f.name+': '+f.type).join('\n')};}
function namespaceOptions(prefix,schemas,language){const separator=language==='cpp'?'::':'.',names=new Map();for(const [type]of schemas){const full=type.replaceAll('/',separator);if(!full.startsWith(prefix))continue;const rest=full.slice(prefix.length),label=rest.split(separator)[0];names.set(label,rest.includes(separator)?{label,type:'namespace',signature:label,doc:'ROS 2 namespace'}:typeOption(label,type,schemas));}return [...names.values()];}
export function codeCompletions(source,pos,language,registry){
 const schemas=definitions(registry),before=source.slice(0,pos),line=before.slice(before.lastIndexOf('\n')+1),env=environment(before,language,schemas);
 if(language==='cpp'){
  const include=/^\s*#\s*include\s*[<"]([\w/]*)$/.exec(line);if(include)return {from:pos-include[1].length,options:[...schemas.keys()].map(type=>{const parts=type.split('/');return {label:parts.slice(0,2).join('/')+'/'+snake(parts[2])+'.hpp',type:'text',doc:'ROS 2 interface header'};}),validFor:/[\w/]*/};
 }
 if(language==='python'){
  const imported=/\bfrom\s+([\w.]+)\s+import\s+(\w*)$/.exec(line);if(imported){const module=imported[1];return {from:pos-imported[2].length,options:PYTHON_COMPLETIONS[module]||namespaceOptions(module+'.',schemas,language),validFor:/\w*/};}
 }
 const member=/([\w]+(?:(?:\.|::|->)[\w]+)*)(\.|::|->)(\w*)$/.exec(before);
 if(member){
  const expression=member[1],type=resolve(expression,env.variables,env.types,schemas);let options=PYTHON_COMPLETIONS[type];
  if(!options&&type&&schemas.has(type.split('#')[0])){options=fields(type,schemas).map(f=>({label:f.name,type:'property',signature:f.name+': '+f.type,doc:'Field of '+type}));const record=schemas.get(type.split('#')[0]);options.push(...(type.endsWith('#response')?record.responseConstants??[]:record.constants??[]).map(c=>({label:c.name,type:'constant',signature:c.name+' = '+c.value,doc:'ROS 2 '+c.type+' constant'})));if(!type.includes('#')&&!type.includes('/msg/')){const record=schemas.get(type);options=type.includes('/srv/')?['Request','Response'].map((n,i)=>typeOption(n,type+'#'+(i?'response':'fields'),schemas)):['Goal','Result','Feedback'].filter((_,i)=>record[['fields','response','feedback'][i]]).map((n,i)=>typeOption(n,type+'#'+['fields','response','feedback'][i],schemas));}}
  if(!options){const children=[...env.variables.keys()].filter(name=>name.startsWith(expression+'.')).map(name=>name.slice(expression.length+1).split('.')[0]);if(children.length)options=[...new Set(children)].map(label=>({label,type:'variable',signature:label,doc:'Attribute assigned in this file'}));}
  if(!options)options=namespaceOptions((type&&!type.includes('/')?type:expression).replaceAll('.',language==='cpp'?'::':'.')+member[2],schemas,language);
  return {from:pos-member[3].length,options,validFor:/\w*/};
 }
 const word=/\w*$/.exec(before)[0],options=[...env.locals.values()];
 if(language==='python')options.push(...PYTHON_COMPLETIONS.builtins);else options.push(...namespaceOptions('',schemas,language));
 return {from:pos-word.length,options:[...new Map(options.map(o=>[o.label,o])).values()],validFor:/\w*/};
}
export function callSignature(source,pos,language,registry){
 // Ignore brackets inside quoted literals and comments; walk to the open call.
 const stack=[];let quote=null,escape=false,comment=false;
 for(let i=0;i<pos;i++){const c=source[i];if(comment){if(c==='\n')comment=false;continue;}if(quote){if(escape){escape=false;continue;}if(c==='\\'){escape=true;continue;}if(c===quote)quote=null;continue;}if(c==='"'||c==="'"){quote=c;continue;}if(language==='python'&&c==='#'||language==='cpp'&&c==='/'&&source[i+1]==='/'){comment=true;continue;}if('([{'.includes(c))stack.push({c,pos:i});if(')]}'.includes(c))stack.pop();}
 const call=[...stack].reverse().find(s=>s.c==='(');if(!call)return null;
 const match=/([\w]+(?:(?:\.|::|->)\w+)*)\s*$/.exec(source.slice(0,call.pos));if(!match)return null;
 const schemas=definitions(registry),env=environment(source.slice(0,call.pos),language,schemas),name=match[1],resolved=resolve(name,env.variables,env.types,schemas);
 let record;if(resolved&&schemas.has(resolved.split('#')[0]))record=typeOption(name,resolved,schemas);
 else if(resolved?.includes('.')){const at=resolved.lastIndexOf('.');record=PYTHON_COMPLETIONS[resolved.slice(0,at)]?.find(r=>r.label===resolved.slice(at+1));}
 if(!record)record=env.locals.get(name)?.type==='function'?env.locals.get(name):language==='python'?PYTHON_COMPLETIONS.builtins.find(r=>r.label===name):null;
 return record?{...record,pos:call.pos+1}:null;
}
