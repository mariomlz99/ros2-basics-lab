// Modified for ROS 2 Basics Lab: lean Python status.
import {RuntimeAdapter} from '../runtime/adapter.js';

// Pyodide owns execution; endpoints, evidence and lifecycle use the common bridge.
export class PythonBridge extends RuntimeAdapter {
  releaseWorker(worker){
    if(!worker.executing||worker.finished){worker.terminate();return;}
    // Detach graph endpoints immediately, but let the interrupted Python stack
    // run its finally/with cleanup. Retired workers cannot publish or recreate nodes.
    const deadline=setTimeout(()=>worker.terminate(),1000);
    worker.onmessage=({data})=>{
      if(data.kind==='shutdown'||data.kind==='error'){if(data.kind==='error'&&!this.worker)this.output(data.text);clearTimeout(deadline);worker.terminate();return;}
      if(!this.worker&&(data.kind==='stdout'||data.kind==='log'))this.output(data.text);
    };
    worker.onerror=()=>{clearTimeout(deadline);worker.terminate();};
    worker.postMessage({kind:'interrupt'});
  }
  run(code){
    this.stop();this.processed.clear();this.reports.clear();
    const worker=new Worker(new URL('./worker.js',import.meta.url));this.worker=worker;this.attachTransforms();
    worker.onmessage=event=>{if(this.worker!==worker)return;try{if(event.data.kind==='executing')worker.executing=true;if(event.data.kind==='shutdown'||event.data.kind==='error')worker.finished=true;this.handle(event.data);}catch(error){this.output('Error: '+error.message);this.stop();}};
    worker.onerror=event=>{if(this.worker!==worker)return;this.output('Python worker error: '+(event.message||'Runtime worker failed to load. Save your session, reload the page and retry.'));this.stop();};
    this.status('Loading real Python… first load requires internet.');
    this.watchdog(120000,'Python download timed out. Check your connection and try Run again.');
    this.parameterListener=(node,name,value)=>{if(this.nodes.has(node))worker.postMessage({kind:'parameter_update',node:this.sourceNames.get(node)??node,name,value});};this.runtime.parameterListeners.add(this.parameterListener);
    worker.postMessage(typeof code==='string'?{kind:'start',code}:{kind:'start',...code});
  }
}
