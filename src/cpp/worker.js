import {loadToolchain} from './toolchain.js';
import {numberField,stringField,boolField,arrayLength,readField,associateReport} from './protocol.js';
let app,tool,rangeAccess=false,chain=Promise.resolve(),stdout='',outputCount=0,outputSince=0;
let currentPayload=null,currentSample=null,currentFrame=null,failed=false;
const subscriptions=new Map(),decoder=new TextDecoder(),encoder=new TextEncoder();
const imageAccess=new Set();let imageStarted;
const SPIN={kind:'spin'};
function textAt(ptr,length){return decoder.decode(new Uint8Array(app.exports.memory.buffer,ptr,length));}
function output(text){stdout+=String(text).replace(/\x1b\[[0-9;]*m/g,'');while(stdout.includes('\n')||stdout.length>4000){const end=stdout.includes('\n')?stdout.indexOf('\n'):4000,line=stdout.slice(0,Math.min(end,4000));stdout=stdout.slice(end+1);const now=performance.now();if(now-outputSince>1000){outputSince=now;outputCount=0;}if(outputCount++<40)postMessage({kind:'stdout',text:line});}}
function flush(){if(stdout)output('\n');}
function emit(ptr,length){
 const data=JSON.parse(textAt(ptr,length));
 if(data.kind==='subscribe')subscriptions.set(data.id,{type:data.type,node:data.node});
 if(data.kind==='unsubscribe')subscriptions.delete(data.id);
 if(data.kind==='destroy')for(const [id,sub]of subscriptions)if(sub.node===data.node)subscriptions.delete(id);
 postMessage(['course_report','detection','image_stats'].includes(data.kind)?associateReport(data,{sample:currentSample,frame:currentFrame}):data);
}
async function handle(data){
 if(failed)return;
 if(data.kind==='start'||data.kind==='build'){
  tool=await loadToolchain({output,stage:text=>postMessage({kind:'stage',text})});
  const response=await fetch(new URL('./compat.hpp',import.meta.url),{signal:AbortSignal.timeout(15000)});if(!response.ok)throw Error('C++ compatibility header: HTTP '+response.status);const header=await response.text();
  const headers={'/include/kinenest.hpp':header};
  for(const path of ['rclcpp/rclcpp.hpp','geometry_msgs/msg/twist.hpp','sensor_msgs/msg/laser_scan.hpp','sensor_msgs/msg/image.hpp','std_msgs/msg/string.hpp','kinenest/reports.hpp','std_srvs/srv/trigger.hpp','ros2learn_interfaces/msg/target_info.hpp','nav_msgs/msg/odometry.hpp','geometry_msgs/msg/quaternion.hpp','tf2/utils.h','tf2/utils.hpp','tf2/time.h','tf2/time.hpp','tf2_ros/buffer.h','tf2_ros/buffer.hpp','tf2_ros/transform_listener.h','tf2_ros/transform_listener.hpp','geometry_msgs/msg/transform_stamped.hpp','tf2_msgs/msg/tf_message.hpp','rclcpp_action/rclcpp_action.hpp','ros2learn_interfaces/action/drive_distance.hpp'])headers['/include/'+path]='#include <kinenest.hpp>';
  const module=await tool.compile(data.code,headers);
  if(data.kind==='build'){postMessage({kind:'build_ok',metrics:tool.metrics});return;}
  const imports={kinenest:{
   image_access:(frame,field)=>{if(frame===currentFrame){const name={1:'width',2:'height',3:'data'}[field];if(name)imageAccess.add(name);}},
   emit,spin:()=>{throw SPIN;},range_access:sample=>{if(sample===currentSample)rangeAccess=true;},
   fail:(ptr,length)=>{throw Error(textAt(ptr,length));},
   field_length:(ptr,length)=>arrayLength(currentPayload,textAt(ptr,length)),
   field_kind:(ptr,length)=>({boolean:1,number:2,string:3}[typeof readField(currentPayload,textAt(ptr,length))]??0),
   field_bool:(ptr,length)=>boolField(currentPayload,textAt(ptr,length))?1:0,
   field_number:(ptr,length)=>numberField(currentPayload,textAt(ptr,length)),
   field_string_size:(ptr,length)=>encoder.encode(stringField(currentPayload,textAt(ptr,length))).length,
   field_string_copy:(ptr,length,dest,capacity)=>{const bytes=encoder.encode(stringField(currentPayload,textAt(ptr,length)));if(bytes.length>capacity)throw Error('C++ string buffer is too small');new Uint8Array(app.exports.memory.buffer,dest,bytes.length).set(bytes);return bytes.length;}
  }};
  app=await tool.instantiate(module,imports);postMessage({kind:'executing'});
  try{app.exports._start();}catch(error){if(error!==SPIN&&error.code!==0)throw error;}
  flush();postMessage({kind:'metrics',metrics:tool.metrics});postMessage({kind:'ready'});
 }else if(data.kind==='message'){
  if(!subscriptions.has(data.subscription)){postMessage({kind:'frame_done',subscription:data.subscription});return;}
  currentPayload=data.message;currentSample=data.sample;rangeAccess=false;let ptr;
  try{
   if(subscriptions.get(data.subscription).type==='sensor_msgs/msg/LaserScan'){
    const m=data.message,bytes=new Float32Array(m.ranges);ptr=app.exports.kn_alloc(bytes.byteLength);
    if(!ptr&&bytes.byteLength)throw Error('C++ sensor buffer allocation failed');
    new Float32Array(app.exports.memory.buffer,ptr,bytes.length).set(bytes);
    app.exports.kn_receive_scan(data.subscription,ptr,bytes.length,m.angle_min,m.angle_max,m.angle_increment,m.range_min,m.range_max,m.header.stamp.sec,m.header.stamp.nanosec,m.scan_time,data.sample);
   }else app.exports.kn_receive_message(data.subscription);
   postMessage({kind:'message_processed',sample:data.sample,access:rangeAccess?['ranges']:[]});flush();
  }finally{if(ptr!==undefined)app.exports.kn_free(ptr);currentPayload=null;currentSample=null;postMessage({kind:'frame_done',subscription:data.subscription});}
 }else if(data.kind==='image'){
  if(!subscriptions.has(data.subscription)){postMessage({kind:'frame_done',subscription:data.subscription});return;}
  const {meta,bytes,frame}=data;
  if(!(bytes instanceof Uint8Array)||meta.encoding!=='rgb8'||!Number.isSafeInteger(meta.width)||!Number.isSafeInteger(meta.height)||!Number.isSafeInteger(meta.step)||meta.width<=0||meta.height<=0||meta.step<meta.width*3||bytes.byteLength!==meta.height*meta.step||bytes.byteLength>16*1024*1024)throw Error('Invalid rgb8 Image payload');
  currentPayload=meta;currentFrame=frame;imageAccess.clear();
  const began=performance.now();imageStarted??=began;
  try{
   const ptr=app.exports.kn_image_prepare(bytes.byteLength,frame);
   if(!ptr)throw Error('C++ image buffer allocation failed');
   new Uint8Array(app.exports.memory.buffer,ptr,bytes.byteLength).set(bytes);
   app.exports.kn_receive_image(data.subscription);
   postMessage({kind:'processed',frame,access:[...imageAccess]});
   const elapsed=performance.now()-began;
   tool.metrics.imageFrames=(tool.metrics.imageFrames??0)+1;
   tool.metrics.imageBytes=(tool.metrics.imageBytes??0)+bytes.byteLength;
   tool.metrics.imageCallbackMs=(tool.metrics.imageCallbackMs??0)+elapsed;
   tool.metrics.imageMaxCallbackMs=Math.max(tool.metrics.imageMaxCallbackMs??0,elapsed);
   tool.metrics.imageElapsedMs=performance.now()-imageStarted;
   tool.metrics.programMemoryBytes=app.exports.memory.buffer.byteLength;
   postMessage({kind:'metrics',metrics:tool.metrics});flush();
  }finally{currentPayload=null;currentFrame=null;imageAccess.clear();postMessage({kind:'frame_done',subscription:data.subscription});}
 }else if(data.kind==='action_event'){
  currentPayload=data;try{app.exports.kn_action_event();flush();}finally{currentPayload=null;}
 }else if(data.kind==='parameter_update'){
  currentPayload=data;try{app.exports.kn_parameter_update();}finally{currentPayload=null;}
 }else if(data.kind==='service_response'){
  if(data.response?.error)throw Error('Service request failed: '+data.response.error);
  currentPayload=data.response;
  try{app.exports.kn_service_response(data.id);flush();}finally{currentPayload=null;}
 }else if(data.kind==='timer'){
  try{app.exports.kn_tick(data.id);postMessage({kind:'timer_processed'});flush();}finally{postMessage({kind:'frame_done',subscription:'timer-'+data.id});}
 }
}
onmessage=event=>{chain=chain.then(()=>handle(event.data)).catch(error=>{failed=true;flush();postMessage({kind:'error',text:'C++: '+(error.message??String(error))});});};
