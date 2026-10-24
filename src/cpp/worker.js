import {CPP_RUNTIME_HEADERS} from '../runtime-catalog.js';
import {TransformClient} from '../runtime/tf.js';
// Modified from KineNest (Apache-2.0): generic registry-backed transport and built artifacts.
import {loadToolchain} from './toolchain.js';
import {InterfaceRegistry} from '../interfaces/registry.js';
import {numberField,stringField,boolField,arrayLength,readField,copyByteField} from './protocol.js';
let app,tool,currentPayload,chain=Promise.resolve(),stdout='',count=0,since=0;
const decoder=new TextDecoder(),encoder=new TextEncoder(),SPIN={};
const tfClient=new TransformClient(emit);
let previousTfPayload;
const textAt=(p,n)=>decoder.decode(new Uint8Array(app.exports.memory.buffer,p,n));
// Apply one budget to stdout and ROS logs, before posting to the main thread.
function emit(message){if(message.kind==='stdout'||message.kind==='log'){const now=Date.now();if(now-since>1000){since=now;count=0;}if(count++>=40)return;message={...message,text:String(message.text).slice(0,4000)};}postMessage(message);}
function output(s){s=String(s);let start=0;while(start<s.length){const end=s.indexOf('\n',start),stop=end===-1?s.length:end;stdout+=s.slice(start,Math.min(stop,start+Math.max(0,4000-stdout.length)));if(end===-1)break;emit({kind:'stdout',text:stdout});stdout='';start=end+1;}}
const flush=()=>{if(stdout)output('\n');};
async function handle(data){
 if(data.kind==='start'||data.kind==='build'){
  tool=await loadToolchain({output,stage:text=>postMessage({kind:'stage',text}),compiler:!data.module});
  let module=data.module;
  if(!module){
  const headers={...new InterfaceRegistry(data.schema).cppHeaders()};
  for(const [path,file]of Object.entries(CPP_RUNTIME_HEADERS)){const response=await fetch(new URL(file,import.meta.url));if(!response.ok)throw Error('Header load failed');headers[path]=await response.text();}
  module=await tool.compile(data.code,headers);
  }
  if(data.kind==='build'){postMessage({kind:'build_ok',module,bytes:tool.compiledBytes,metrics:tool.metrics});return;}
  const imports={kinenest:{tf_can:(p,n)=>{previousTfPayload=currentPayload;const {target,source}=JSON.parse(textAt(p,n));try{tfClient.store.lookup(target,source);currentPayload={error:''};return 1;}catch(error){currentPayload={error:error.message};return 0;}},tf_request:(p,n)=>{previousTfPayload=currentPayload;currentPayload=tfClient.request(JSON.parse(textAt(p,n)));},tf_done:()=>{currentPayload=previousTfPayload;previousTfPayload=undefined;},service_available:(p,n)=>{const name=textAt(p,n);return (data.services??[]).some(s=>s===name||s==='/'+name)?1:0;},emit:(p,n)=>emit(JSON.parse(textAt(p,n))),spin:()=>{throw SPIN;},fail:(p,n)=>{throw Error(textAt(p,n));},field_length:(p,n)=>arrayLength(currentPayload,textAt(p,n)),field_kind:(p,n)=>({boolean:1,number:2,string:3}[typeof readField(currentPayload,textAt(p,n))]??0),field_bool:(p,n)=>boolField(currentPayload,textAt(p,n))?1:0,field_number:(p,n)=>numberField(currentPayload,textAt(p,n)),field_bytes_copy:(p,n,dest,size)=>copyByteField(currentPayload,textAt(p,n),app.exports.memory.buffer,dest,size),field_string_size:(p,n)=>encoder.encode(stringField(currentPayload,textAt(p,n))).length,field_string_copy:(p,n,dest,size)=>{const bytes=encoder.encode(stringField(currentPayload,textAt(p,n)));if(bytes.length>size)throw Error('String buffer too small');new Uint8Array(app.exports.memory.buffer,dest,bytes.length).set(bytes);return bytes.length;}}};
  app=await tool.instantiate(module,imports);postMessage({kind:'executing'});let spinning=false;try{app.exports._start();}catch(e){if(e===SPIN)spinning=true;else if(e.code!==0)throw e;}flush();postMessage({kind:'metrics',metrics:tool.metrics});postMessage({kind:spinning?'ready':'shutdown'});
 }else if(data.kind==='message'){currentPayload=data.message;try{app.exports.kn_receive_message(data.subscription);postMessage({kind:'message_processed',sample:data.sample});flush();}finally{currentPayload=null;postMessage({kind:'frame_done',subscription:data.subscription});}}
 else if(data.kind==='timer'){try{app.exports.kn_tick(data.id);flush();}finally{postMessage({kind:'frame_done',subscription:'timer-'+data.id});}}
 else if(data.kind==='service_request'){currentPayload=data;try{app.exports.kn_service_request(data.id);flush();}finally{currentPayload=null;}}
 else if(data.kind==='service_response'){if(data.response.error)throw Error(data.response.error);currentPayload=data.response;try{app.exports.kn_service_response(data.id);flush();}finally{currentPayload=null;}}
 else if(data.kind==='parameter_update'){currentPayload=data;try{app.exports.kn_parameter_update();}finally{currentPayload=null;}}
}
onmessage=({data})=>{if(data.kind==='tf_snapshot'){tfClient.authorize(data.proof);tfClient.update(data.snapshot);return;}chain=chain.then(()=>handle(data)).catch(e=>{flush();postMessage({kind:'error',text:'C++: '+(e.message??e)});});};
