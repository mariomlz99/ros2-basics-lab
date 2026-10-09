// Modified for ROS 2 Basics Lab: accept compiled installed modules.
import {RuntimeAdapter} from '../runtime/adapter.js';
export class CppBridge extends RuntimeAdapter {
 constructor(runtime,options={}){super(runtime,{...options,language:'C++'});this.metrics=options.metrics??(()=>{});}
 run(code){
  this.stop();this.processed.clear();this.reports.clear();const worker=new Worker(new URL('./worker.js',import.meta.url),{type:'module'});this.worker=worker;
  worker.onmessage=event=>{if(this.worker!==worker)return;try{const data=event.data;if(data.kind==='stage'){this.status(data.text);this.watchdog(120000,'C++ toolchain timed out. Check your connection and run again.');}else if(data.kind==='metrics')this.metrics(data.metrics);else this.handle(data);}catch(error){this.output('C++: '+error.message);this.stop();}};
  worker.onerror=event=>{if(this.worker!==worker)return;this.output('C++ worker: '+(event.message||'Runtime worker failed to load. Save your session, reload the page and retry.'));this.stop();};this.status('Loading C++ toolchain…');this.watchdog(120000,'C++ toolchain timed out. Check your connection and run again.');this.parameterListener=(node,name,value)=>{if(this.worker===worker&&this.nodes.has(node))worker.postMessage({kind:'parameter_update',node:this.sourceNames.get(node)??node,name,value});};this.runtime.parameterListeners.add(this.parameterListener);worker.postMessage(typeof code==='string'?{kind:'start',code}:{kind:'start',...code});
 }
}
