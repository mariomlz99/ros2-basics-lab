import {CPP_RUNTIME_HEADERS} from '../runtime-catalog.js';
// Modified from KineNest (Apache-2.0): generic registry-backed transport and built artifacts.
import {loadToolchain} from './toolchain.js';
import {InterfaceRegistry} from '../interfaces/registry.js';
import {numberField,stringField,boolField,arrayLength,readField} from './protocol.js';
let app,tool,currentPayload,chain=Promise.resolve(),stdout='',count=0,since=0;
const decoder=new TextDecoder(),encoder=new TextEncoder(),SPIN={};
const textAt=(p,n)=>decoder.decode(new Uint8Array(app.exports.memory.buffer,p,n));
function output(s){stdout+=s;while(stdout.includes('\n')){const at=stdout.indexOf('\n'),line=stdout.slice(0,at);stdout=stdout.slice(at+1);if(Date.now()-since>1000){since=Date.now();count=0;}if(count++<40)postMessage({kind:'stdout',text:line.slice(0,4000)});}}
const flush=()=>{if(stdout)output('\n');};
async function handle(data){
 if(data.kind==='start'||data.kind==='build'){
  tool=await loadToolchain({output,stage:text=>postMessage({kind:'stage',text})});
  const headers={...new InterfaceRegistry(data.schema).cppHeaders()};
  for(const [path,file]of Object.entries(CPP_RUNTIME_HEADERS)){const response=await fetch(new URL(file,import.meta.url));if(!response.ok)throw Error('Header load failed');headers[path]=await response.text();}
  const module=data.module??await tool.compile(data.code,headers);
  if(data.kind==='build'){postMessage({kind:'build_ok',module,bytes:tool.compiledBytes,metrics:tool.metrics});return;}
  const imports={kinenest:{service_available:(p,n)=>{const name=textAt(p,n);return (data.services??[]).some(s=>s===name||s==='/'+name)?1:0;},emit:(p,n)=>postMessage(JSON.parse(textAt(p,n))),spin:()=>{throw SPIN;},fail:(p,n)=>{throw Error(textAt(p,n));},field_length:(p,n)=>arrayLength(currentPayload,textAt(p,n)),field_kind:(p,n)=>({boolean:1,number:2,string:3}[typeof readField(currentPayload,textAt(p,n))]??0),field_bool:(p,n)=>boolField(currentPayload,textAt(p,n))?1:0,field_number:(p,n)=>numberField(currentPayload,textAt(p,n)),field_string_size:(p,n)=>encoder.encode(stringField(currentPayload,textAt(p,n))).length,field_string_copy:(p,n,dest,size)=>{const bytes=encoder.encode(stringField(currentPayload,textAt(p,n)));if(bytes.length>size)throw Error('String buffer too small');new Uint8Array(app.exports.memory.buffer,dest,bytes.length).set(bytes);return bytes.length;}}};
  app=await tool.instantiate(module,imports);postMessage({kind:'executing'});let spinning=false;try{app.exports._start();}catch(e){if(e===SPIN)spinning=true;else if(e.code!==0)throw e;}flush();postMessage({kind:'metrics',metrics:tool.metrics});postMessage({kind:spinning?'ready':'shutdown'});
 }else if(data.kind==='message'){currentPayload=data.message;try{app.exports.kn_receive_message(data.subscription);postMessage({kind:'message_processed',sample:data.sample});flush();}finally{currentPayload=null;postMessage({kind:'frame_done',subscription:data.subscription});}}
 else if(data.kind==='timer'){try{app.exports.kn_tick(data.id);flush();}finally{postMessage({kind:'frame_done',subscription:'timer-'+data.id});}}
 else if(data.kind==='service_request'){currentPayload=data;try{app.exports.kn_service_request(data.id);flush();}finally{currentPayload=null;}}
 else if(data.kind==='service_response'){if(data.response.error)throw Error(data.response.error);currentPayload=data.response;try{app.exports.kn_service_response(data.id);flush();}finally{currentPayload=null;}}
 else if(data.kind==='parameter_update'){currentPayload=data;try{app.exports.kn_parameter_update();}finally{currentPayload=null;}}
}
onmessage=({data})=>{chain=chain.then(()=>handle(data)).catch(e=>{flush();postMessage({kind:'error',text:'C++: '+(e.message??e)});});};
