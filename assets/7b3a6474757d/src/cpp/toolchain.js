// Modified for ROS 2 Basics Lab: independent cache namespace.
import {API} from './vendor/wasm-clang.js';
export const TOOLCHAIN={revision:'648c4a89997a351eef75cdaec3ef5b89d4937dec',base:'https://raw.githubusercontent.com/binji/wasm-clang/648c4a89997a351eef75cdaec3ef5b89d4937dec/',files:{clang:31214472,lld:19490094,memfs:345442,'sysroot.tar':9297920}};
export async function loadToolchain({output=()=>{},stage=()=>{}}={}){
 const metrics={downloadBytes:0,cacheBytes:0,loadMs:0,compileMs:0,linkMs:0,peakLinearMemoryBytes:0};const started=performance.now();
 const readBuffer=async name=>{
  const url=TOOLCHAIN.base+name,expected=TOOLCHAIN.files[name];let cache,response;
  try{cache=await caches.open('ros2lab-clang-'+TOOLCHAIN.revision);response=await cache.match(url);}catch{}
  if(response){
   try{const bytes=await response.arrayBuffer();if(bytes.byteLength===expected){metrics.cacheBytes+=bytes.byteLength;return bytes;}}catch{}
   // An incomplete cached response must not poison every subsequent Run.
   try{await cache?.delete?.(url);}catch{}
  }
  let bytes;
  try{
   response=await fetch(url,{signal:AbortSignal.timeout(90000)});
   if(!response.ok)throw Error('HTTP '+response.status);
   bytes=await response.arrayBuffer();
   if(bytes.byteLength!==expected)throw Error('Incomplete asset: expected '+expected+' bytes, received '+bytes.byteLength);
  }catch(error){throw Error('C++ toolchain '+name+' could not load: '+error.message+'. Check your connection and run again. Your code is preserved.');}
  // Cache only a complete verified-size asset; browser storage failure is optional.
  try{await cache?.put(url,new Response(bytes,{headers:{'Content-Type':'application/octet-stream'}}));}catch{}
  metrics.downloadBytes+=bytes.byteLength;return bytes;
 };
 stage('Loading C++ toolchain…');const api=new API({readBuffer,compileStreaming:async name=>WebAssembly.compile(await readBuffer(name)),hostWrite:output});api.hostLog=()=>{};api.hostLogAsync=async(_message,promise)=>promise;api.run=async(module,...args)=>{const app=new API.App(module,api.memfs,...args);await app.ready;try{return await app.run()?app:null;}finally{metrics.peakLinearMemoryBytes=Math.max(metrics.peakLinearMemoryBytes,app.exports.memory.buffer.byteLength+api.memfs.exports.memory.buffer.byteLength);}};await api.ready;
 // Warm compiler/linker once, in the worker. Python never imports this module.
 await api.getModule('clang');await api.getModule('lld');metrics.loadMs=performance.now()-started;
 return {api,metrics,async compile(code,headers={}){const dirs=new Set(['include']);for(const [path,content]of Object.entries(headers)){const parts=path.split('/').filter(Boolean);let dir='';for(const part of parts.slice(0,-1)){dir+=(dir?'/':'')+part;if(!dirs.has(dir)){api.memfs.addDirectory(dir);dirs.add(dir);}}api.memfs.addFile(path.replace(/^\//,''),new TextEncoder().encode(content));}
  const start=performance.now();stage('Compiling C++…');api.clangCommonArgs.push('-fno-threadsafe-statics','-std=c++17','-D_LIBCPP_CONFIG_SITE','-D_LIBCPP_ABI_VERSION=2','-D_LIBCPP_HAS_MUSL_LIBC','-D_LIBCPP_HAS_NO_THREADS');await api.compile({input:'controller.cpp',obj:'controller.o',contents:new TextEncoder().encode(code)});metrics.compileMs=performance.now()-start;
  const link=performance.now();stage('Linking WebAssembly…');const lld=await api.getModule('lld');await api.run(lld,'wasm-ld','--no-threads','--export-dynamic','--allow-undefined','-z','stack-size=1048576','-Llib/wasm32-wasi','lib/wasm32-wasi/crt1.o','controller.o','-lc','-lc++','-lc++abi','-o','controller.wasm');metrics.linkMs=performance.now()-link;
  const bytes=api.memfs.getFileContents('controller.wasm').slice();this.compiledBytes=bytes;metrics.moduleBytes=bytes.length;return WebAssembly.compile(bytes);
 },async instantiate(module,imports){api.memfs.extraImports=imports;const app=new API.App(module,api.memfs,'controller.wasm');await app.ready;metrics.programMemoryBytes=app.exports.memory.buffer.byteLength;metrics.filesystemMemoryBytes=api.memfs.exports.memory.buffer.byteLength;return app;}};
}
