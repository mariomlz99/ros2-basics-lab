import {chromium} from 'playwright-core';
import {mkdir,writeFile} from 'node:fs/promises';
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true});
try{
 const page=await browser.newPage();await page.goto(process.env.LAB_URL||'http://127.0.0.1:8033/ros2-basics-lab/');
 const results=await page.evaluate(()=>new Promise((resolve,reject)=>{
  const source=`onmessage=async()=>{try{importScripts('https://cdn.jsdelivr.net/pyodide/v0.28.3/full/pyodide.js');const py=await loadPyodide({indexURL:'https://cdn.jsdelivr.net/pyodide/v0.28.3/full/'}),message={width:320,height:240,step:960,encoding:'rgb8',header:{stamp:{sec:1,nanosec:2},frame_id:'camera_optical_frame'},data:Array.from({length:230400},(_,i)=>i%256)},results={};py.runPython('import json');for(const method of ['json-replacer','json','object','bytes']){const times=[];for(let n=0;n<25;n++){const start=performance.now();if(method.startsWith('json')){py.globals.set('payload',method==='json-replacer'?JSON.stringify(message,(_,v)=>v===Infinity?'Infinity':v):JSON.stringify(message));py.runPython('_decoded=json.loads(payload)');}else if(method==='object'){py.globals.set('payload',message);py.runPython('_decoded=payload.to_py()');}else{py.globals.set('payload',JSON.stringify({...message,data:[]}));py.globals.set('pixels',new Uint8Array(message.data));py.runPython('_decoded=json.loads(payload);_decoded["data"]=pixels.to_py().tolist()');}if(n>0)times.push(performance.now()-start);}times.sort((a,b)=>a-b);results[method]={median:times[12],p95:times[22],max:times[23]};}postMessage(results);}catch(e){postMessage({error:String(e)});}}`;
  const url=URL.createObjectURL(new Blob([source],{type:'text/javascript'})),worker=new Worker(url);worker.onmessage=event=>{worker.terminate();URL.revokeObjectURL(url);event.data.error?reject(Error(event.data.error)):resolve(event.data);};worker.onerror=e=>{worker.terminate();reject(Error(e.message));};worker.postMessage({});
 }));
 await mkdir('artifacts/audit',{recursive:true});await writeFile('artifacts/audit/image-decode-benchmark.json',JSON.stringify(results,null,2));console.log(results);
}finally{await browser.close();}
