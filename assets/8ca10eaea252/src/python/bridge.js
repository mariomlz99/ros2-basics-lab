// Modified for KineNest BASICS: lean Python status.
import {RuntimeAdapter} from '../runtime/adapter.js';

// Pyodide owns execution; endpoints, evidence and lifecycle use the common bridge.
export class PythonBridge extends RuntimeAdapter {
  run(code){
    this.stop();this.processed.clear();this.reports.clear();
    const worker=new Worker(new URL('./worker.js',import.meta.url));this.worker=worker;
    worker.onmessage=event=>{if(this.worker!==worker)return;try{this.handle(event.data);}catch(error){this.output('Error: '+error.message);this.stop();}};
    worker.onerror=event=>{if(this.worker!==worker)return;this.output('Python worker error: '+event.message);this.stop();};
    this.status('Loading real Python… first load requires internet.');
    this.watchdog(120000,'Python download timed out. Check your connection and try Run again.');
    this.parameterListener=(node,name,value)=>{if(this.nodes.has(node))worker.postMessage({kind:'parameter_update',node:this.sourceNames.get(node)??node,name,value});};this.runtime.parameterListeners.add(this.parameterListener);
    worker.postMessage(typeof code==='string'?{kind:'start',code}:{kind:'start',...code});
  }
}
