// Modified for ROS 2 Basics Lab: lean CPython load and finite program lifecycle.
let pyodide, chain=Promise.resolve(),tfClient,tfSnapshot,tfClientReady;
const INDEX='https://cdn.jsdelivr.net/pyodide/v0.28.3/full/';
let outputCount=0, outputTime=0;
// Main-thread mailboxes bound timer/topic traffic. Bound service/action traffic
// here too; never let a suspended program accumulate an unbounded event queue.
let events=[], waiting=null, interrupted=false;
self.next_ros_event=()=>{
  if(interrupted)return Promise.resolve({kind:'interrupt'});
  if(events.length)return Promise.resolve(events.shift());
  return new Promise(resolve=>{waiting=resolve;});
};
function enqueue(event){
  if(event.kind==='interrupt'){interrupted=true;events=[];}
  else if(interrupted)return;
  if(event.kind==='message')event={...event,negative_zeros:negativeZeroPaths(event.message)};
  if(waiting){const resolve=waiting;waiting=null;resolve(event);}
  else if(events.length<256)events.push(event);
  else{events=[{kind:'executor_error',text:'Python executor queue exceeded 256 events; stopped.'}];}
}
self.emit_json=text=>emit(JSON.parse(text));
// Bound stdout and ROS logs before they enter the main-thread message queue.
function emit(message){if(message.kind==='stdout'||message.kind==='log'){const now=Date.now();if(now-outputTime>1000){outputTime=now;outputCount=0;}if(outputCount++>=40)return;message={...message,text:String(message.text).slice(0,4000)};}postMessage(message);}
function output(text){emit({kind:'stdout',text});}
// Pyodide converts integral JS numbers to Python ints, which loses -0's sign.
// Carry only its field paths alongside the normal structured message conversion.
function negativeZeroPaths(value,path=[],paths=[]){
  if(ArrayBuffer.isView(value)){
    // Integer image buffers cannot contain -0. Enumerating every byte here
    // creates hundreds of thousands of arrays before each camera callback.
    if(value instanceof Float32Array||value instanceof Float64Array)
      for(let i=0;i<value.length;i++)if(Object.is(value[i],-0))paths.push([...path,i]);
    return paths;
  }
  if(Object.is(value,-0))paths.push(path);
  else if(Array.isArray(value))value.forEach((item,index)=>negativeZeroPaths(item,[...path,index],paths));
  else if(value&&typeof value==='object')for(const [key,item]of Object.entries(value))negativeZeroPaths(item,[...path,key],paths);
  return paths;
}
async function teachingAPI(){
  const url=new URL('./compat.py',self.location.href);
  for(let attempt=0;attempt<3;attempt++){
    try{const response=await fetch(url,{signal:AbortSignal.timeout(15000)});if(!response.ok)throw Error('HTTP '+response.status);return await response.text();}
    catch(error){if(attempt===2)throw Error('Python teaching API failed to load: '+url.pathname+' ('+error.message+'). Reload the page and try again.');await new Promise(resolve=>setTimeout(resolve,500*(attempt+1)));}
  }
}
async function prepareTransforms(){
  await tfClientReady;
  self.tf_request_json=text=>{try{return JSON.stringify({result:tfClient.request(JSON.parse(text))});}catch(error){return JSON.stringify({error:error.message});}};
}
async function preparePython(){
  postMessage({kind:'loading',text:'Loading Python runtime…'});
  const source=await teachingAPI();
  importScripts(INDEX+'pyodide.js');
  pyodide=await loadPyodide({indexURL:INDEX,stdout:output,stderr:output});
  await pyodide.runPythonAsync(source);
}
function installFiles(files){
  pyodide.FS.mkdirTree('/workspace');
  for(const [path,content] of Object.entries(files)){
    if(path.includes('..')||path.startsWith('/'))throw Error('Invalid package path: '+path);
    const full='/workspace/'+path,dir=full.slice(0,full.lastIndexOf('/'));
    pyodide.FS.mkdirTree(dir);pyodide.FS.writeFile(full,content);
  }
  pyodide.runPython("import sys\nsys.path.insert(0, '/workspace')");
}
async function handle(data){
  if(data.kind==='start'||data.kind==='build'){
    await preparePython();
    pyodide.globals.set('available_json',JSON.stringify(data.services??[]));pyodide.runPython('_available_services = set(json.loads(available_json))');
    if(data.schema){pyodide.globals.set("schema_json",JSON.stringify(data.schema));pyodide.runPython("_install_interfaces(json.loads(schema_json))");}
    if(data.kind==='build'){
      pyodide.globals.set('bridge_files',data.files);
      pyodide.globals.set('bridge_name',data.name);
      const imports=pyodide.runPython(`import ast, json\n_imports = set()\nfor _path, _source in bridge_files.to_py().items():\n    if _path.endswith('.py'):\n        _tree = ast.parse(_source, filename=_path)\n        compile(_tree, _path, 'exec')\n        for _node in ast.walk(_tree):\n            if not _path.startswith(bridge_name + '/'):\n                continue\n            if isinstance(_node, ast.Import):\n                _imports.update(_alias.name for _alias in _node.names)\n            elif isinstance(_node, ast.ImportFrom) and _node.module and _node.level == 0:\n                _imports.add(_node.module)\njson.dumps(sorted(_imports))`);
      postMessage({kind:'build_ok',imports:JSON.parse(imports)});return;
    }
    await prepareTransforms();
    // Packaging checks compile source without importing or executing it.
    // setup.py is build metadata, not a runtime dependency of the executable.
    const sources=data.files?Object.entries(data.files).filter(([path])=>path.endsWith('.py')&&path!=='setup.py').map(([,source])=>source).join('\n'):(data.code??'');
    await pyodide.loadPackagesFromImports(sources,{messageCallback:output,errorCallback:output});
    if(data.files&&data.entry){
      installFiles(data.files);
      const {module, function:callable}=data.entry;
      pyodide.globals.set('student_source',`from ${module} import ${callable} as _bridge_main\n_bridge_main()`);
    }else pyodide.globals.set('student_source',data.code);
    postMessage({kind:'executing'});
    await pyodide.runPythonAsync('_run_student(student_source)');
    postMessage({kind:'shutdown'});
  }
}

onmessage=event=>{if(event.data.kind==='tf_snapshot'){tfSnapshot=event.data.snapshot;if(!tfClientReady){const proof=event.data.proof;tfClientReady=import('../runtime/tf.js').then(({TransformClient})=>{tfClient=new TransformClient(emit,proof);tfClient.update(tfSnapshot);});}else tfClient?.update(tfSnapshot);return;}if(event.data.kind!=='start'&&event.data.kind!=='build'){enqueue(event.data);return;}chain=chain.then(()=>handle(event.data)).catch(error=>postMessage({kind:'error',text:String(error)}));};
