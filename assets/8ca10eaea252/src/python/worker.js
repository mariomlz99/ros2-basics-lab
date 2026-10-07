// Modified for KineNest BASICS: lean CPython load and finite program lifecycle.
let pyodide, chain=Promise.resolve();
const INDEX='https://cdn.jsdelivr.net/pyodide/v0.28.3/full/';
let outputCount=0, outputTime=0;
self.emit_json=text=>postMessage(JSON.parse(text));
function output(text){const now=Date.now();if(now-outputTime>1000){outputTime=now;outputCount=0;}if(outputCount++<40)postMessage({kind:'stdout',text:String(text).slice(0,4000)});}
async function teachingAPI(){
  const url=new URL('./compat.py',self.location.href);
  for(let attempt=0;attempt<3;attempt++){
    try{const response=await fetch(url,{signal:AbortSignal.timeout(15000)});if(!response.ok)throw Error('HTTP '+response.status);return await response.text();}
    catch(error){if(attempt===2)throw Error('Python teaching API failed to load: '+url.pathname+' ('+error.message+'). Reload the page and try again.');await new Promise(resolve=>setTimeout(resolve,500*(attempt+1)));}
  }
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
    pyodide.globals.set('actions_json',JSON.stringify(data.actions??[]));pyodide.runPython('_available_actions = set(json.loads(actions_json))');
    pyodide.globals.set('available_json',JSON.stringify(data.services??[]));pyodide.runPython('_available_services = set(json.loads(available_json))');
    if(data.schema){pyodide.globals.set("schema_json",JSON.stringify(data.schema));pyodide.runPython("_install_interfaces(json.loads(schema_json))");}
    const sources=data.files?Object.entries(data.files).filter(([path])=>path.endsWith('.py')).map(([,source])=>source).join('\n'):(data.code??'');
    await pyodide.loadPackagesFromImports(sources,{messageCallback:output,errorCallback:output});
    if(data.kind==='build'){
      installFiles(data.files);
      pyodide.globals.set('bridge_files',data.files);
      pyodide.globals.set('bridge_entries',data.entries);
      pyodide.globals.set('bridge_name',data.name);
      const imports=pyodide.runPython(`import ast, importlib, json\n_imports = set()\nfor _path, _source in bridge_files.to_py().items():\n    if _path.endswith('.py'):\n        _tree = ast.parse(_source, filename=_path)\n        compile(_tree, _path, 'exec')\n        for _node in ast.walk(_tree):\n            if not _path.startswith(bridge_name + '/'):\n                continue\n            if isinstance(_node, ast.Import):\n                _imports.update(_alias.name for _alias in _node.names)\n            elif isinstance(_node, ast.ImportFrom) and _node.module and _node.level == 0:\n                _imports.add(_node.module)\nfor _entry in bridge_entries.to_py():\n    _module = importlib.import_module(_entry['module'])\n    if not callable(getattr(_module, _entry['function'], None)):\n        raise ValueError('Entry point ' + _entry['module'] + ':' + _entry['function'] + ' is not callable')\njson.dumps(sorted(_imports))`);
      postMessage({kind:'build_ok',imports:JSON.parse(imports)});return;
    }
    if(data.files&&data.entry){
      installFiles(data.files);
      const {module, function:callable}=data.entry;
      pyodide.globals.set('learner_source',`from ${module} import ${callable} as _bridge_main\n_bridge_main()`);
    }else pyodide.globals.set('learner_source',data.code);
    postMessage({kind:'executing'});
    pyodide.runPython('_run_learner(learner_source)');
    postMessage({kind:'ready'});
    if(!pyodide.runPython('bool(_nodes)'))postMessage({kind:'shutdown'});
  }else if(data.kind==='image'){
    pyodide.globals.set('image_key',data.subscription);
    pyodide.globals.set('image_meta',JSON.stringify(data.meta));
    pyodide.globals.set('image_bytes',data.bytes);
    pyodide.globals.set('image_frame',data.frame);
    try{pyodide.runPython('_dispatch_image(image_key, image_meta, image_bytes, image_frame)');}
    finally{pyodide.globals.delete('image_bytes');postMessage({kind:'frame_done',subscription:data.subscription});}
  }else if(data.kind==='message'||data.kind==='timer'){
    pyodide.globals.set('event_key',data.subscription??data.id);
    pyodide.globals.set('event_payload',JSON.stringify(data.message,(_,v)=>v===Infinity?'Infinity':v));
    pyodide.globals.set('event_sample',data.sample??0);
    try{pyodide.runPython(data.kind==='timer'?'_dispatch_timer(event_key)':'_dispatch_message(event_key, event_payload, event_sample)');}
    finally{postMessage({kind:'frame_done',subscription:data.subscription??('timer-'+data.id)});}
  }else if(data.kind==='parameter_update'){
    pyodide.globals.set('param_payload',JSON.stringify(data));
    pyodide.runPython('p = json.loads(param_payload); _nodes[p["node"]]._parameters[p["name"]] = p["value"]');
  }else if(data.kind==='action_server_event'){
    pyodide.globals.set('server_event_json',JSON.stringify(data));pyodide.runPython('_server_action_event(json.loads(server_event_json))');
  }else if(data.kind==='action_event'){
    pyodide.globals.set('action_key',data.id);pyodide.globals.set('action_event',data.event);pyodide.globals.set('action_payload',JSON.stringify(data.payload));
    pyodide.runPython('_action_event(action_key, action_event, action_payload)');
  }else if(data.kind==='service_request'){
    pyodide.globals.set('request_key',data.id);pyodide.globals.set('request_token',data.token);pyodide.globals.set('request_payload',JSON.stringify(data.request));
    pyodide.runPython('_service_request(request_key, request_token, request_payload)');
  }else if(data.kind==='service_response'){

    pyodide.globals.set('response_key',data.id);pyodide.globals.set('response_json',JSON.stringify(data.response));
    pyodide.runPython('_service_response(response_key, response_json)');
  }
}
onmessage=event=>{chain=chain.then(()=>handle(event.data)).catch(error=>postMessage({kind:'error',text:String(error)}));};
