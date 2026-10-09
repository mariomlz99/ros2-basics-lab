import {splitType,PRIMITIVES} from './interfaces/registry.js';
export function pythonString(value,bytes=false){
 const quote=value.includes("'")&&!value.includes('"')?'"':"'";
 const escape=c=>{const n=c.codePointAt(0);if(c==='\\'||c===quote)return '\\'+c;if(c==='\n')return '\\n';if(c==='\r')return '\\r';if(c==='\t')return '\\t';if(n<32||n===127||bytes&&n>=127)return '\\x'+n.toString(16).padStart(2,'0');return c;};
 return (bytes?'b':'')+quote+[...value].map(escape).join('')+quote;
}
export function pythonFloat(value){
 if(Object.is(value,-0))return '-0.0';
 let text=value!==0&&(Math.abs(value)<1e-4||Math.abs(value)>=1e16)?value.toExponential():String(value);
 if(text.includes('e'))return text.replace(/e([+-]?)(\d+)$/,(_,sign,n)=>'e'+(sign||'+')+n.padStart(2,'0'));
 return text.includes('.')?text:text+'.0';
}
function numpyArray(values,base){
 let tokens;
 if(base.startsWith('float')){
  const nonzero=values.map(Math.abs).filter(v=>v>0),max=Math.max(...nonzero),min=Math.min(...nonzero);
  const scientific=nonzero.length&&(max>=1e8||min<1e-4||max/min>=1e3);
  const raw=values.map(v=>scientific?v.toExponential(8):v.toFixed(8));
  if(scientific){
   const parts=raw.map(s=>s.split('e')),precision=Math.max(...parts.map(([s])=>(s.split('.')[1]||'').replace(/0+$/,'').length));
   const exponentWidth=Math.max(2,...parts.map(([,e])=>e.replace(/^[+-]/,'').length));
   tokens=values.map(v=>v.toExponential(precision).replace(/e([+-])(\d+)$/,(_,s,n)=>(precision?'':'.')+'e'+s+n.padStart(exponentWidth,'0')));
   const width=Math.max(...tokens.map(s=>s.length));tokens=tokens.map(s=>s.padStart(width));
  }else{
   const parts=raw.map(s=>s.split('.')),decimals=Math.max(...parts.map(([,s])=>s.replace(/0+$/,'').length)),whole=Math.max(...parts.map(([s])=>s.length));
   tokens=parts.map(([a,b])=>a.padStart(whole)+'.'+b.slice(0,decimals).replace(/0+$/,'').padEnd(decimals));
  }
 }else{tokens=values.map(String);const width=Math.max(...tokens.map(s=>s.length));tokens=tokens.map(s=>s.padStart(width));}
 let out='array([',column=7;
 for(let i=0;i<tokens.length;i++){
  const token=tokens[i],separator=i?', ':'';
  if(i&&column+separator.length+token.length+1>75){out+=',\n       ';column=7;}else{out+=separator;column+=separator.length;}
  out+=token;column+=token.length;
 }
 out+=']';column++;
 if(base==='uint8'){const suffix=', dtype=uint8)';out+=column+suffix.length>75?',\n      dtype=uint8)':suffix;}else out+=')';
 return out;
}
export function formatPublishedMessage(registry,type,message){
 const scalar=(base,value)=>{
  if(!PRIMITIVES[base])return formatPublishedMessage(registry,base,value);
  if(base==='string'||base==='wstring')return pythonString(value);
  if(base==='byte')return pythonString(String.fromCharCode(value),true);
  if(base==='bool')return value?'True':'False';
  return base.startsWith('float')?pythonFloat(value):String(value);
 };
 return type.replaceAll('/','.')+'('+registry.get(type).fields.map(field=>{
  const t=splitType(field.type,type);let value=message[field.name];
  if(t.array&&t.base==='float32')value=value.map(Math.fround);
  return field.name+'='+(t.array?(t.length&&['float64','uint8'].includes(t.base)?numpyArray(value,t.base):'['+value.map(item=>scalar(t.base,item)).join(', ')+']'):scalar(t.base,value));
 }).join(', ')+')';
}
function yamlString(value,indent){
 if(/[\x00-\x09\x0b-\x1f\x7f-\x9f]/.test(value)){
  const special={0:'0',7:'a',8:'b',9:'t',10:'n',11:'v',12:'f',13:'r',27:'e',34:'"',92:'\\',133:'N',160:'_',8232:'L',8233:'P'};
  return '"'+[...value].map(c=>{const n=c.codePointAt(0);if(special[n]!==undefined)return '\\'+special[n];if(n<32||n>=127&&n<=159)return '\\'+(n<=255?'x'+n.toString(16).padStart(2,'0'):n<=65535?'u'+n.toString(16).padStart(4,'0'):'U'+n.toString(16).padStart(8,'0')).toUpperCase().replace(/^X/,'x').replace(/^U(?=.{4}$)/,'u');return c;}).join('')+'"';
 }
 const ambiguous=/^(?:~|null|true|false|yes|no|on|off|[-+]?(?:[0-9].*|\.[0-9].*|\.inf|\.nan))$/i.test(value);
 const quote=!value||ambiguous||/^[\s!&*{}\[\],#|>@`"'%]|^[?:-](?:\s|$)|[ \t]$|:\s|\s#|\n/.test(value);
 if(!quote)return value;
 return "'"+value.replaceAll("'","''").replace(/\n+/g,newlines=>newlines+'\n'+' '.repeat(indent+2))+"'";
}
export function formatEchoMessage(registry,type,message){
 const scalar=(base,value,indent)=>{
  if(base==='byte')return yamlString(String.fromCharCode(value),indent);
  if(base==='string'||base==='wstring')return yamlString(value,indent);
  if(base==='bool')return value?'true':'false';
  if(base.startsWith('float'))return pythonFloat(value).replace(/^([^\.e]+)e/,'$1.0e');
  return String(value);
 };
 const mapping=(owner,value,indent)=>{
  const fields=registry.get(owner).fields;if(!fields.length)return ' '.repeat(indent)+'{}';
  return fields.map(field=>{
   const t=splitType(field.type,owner),v=value[field.name],prefix=' '.repeat(indent)+field.name+':';
   if(t.array){
    if(!v.length)return prefix+' []';
    return prefix+'\n'+v.map(item=>{
     if(PRIMITIVES[t.base])return ' '.repeat(indent)+'- '+scalar(t.base,t.base==='float32'?Math.fround(item):item,indent);
     const nested=mapping(t.base,item,indent+2);return ' '.repeat(indent)+'- '+nested.slice(indent+2);
    }).join('\n');
   }
   if(!PRIMITIVES[t.base])return prefix+(registry.get(t.base).fields.length?'\n'+mapping(t.base,v,indent+2):' {}');
   return prefix+' '+scalar(t.base,v,indent);
  }).join('\n');
 };
 return mapping(type,message,0);
}
