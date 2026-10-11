import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import vm from 'node:vm';

const workerSource=readFileSync(new URL('../src/python/worker.js',import.meta.url),'utf8');
async function build(files){
 const messages=[],globals=new Map();
 const python={globals:{set:(key,value)=>globals.set(key,value)},runPythonAsync:async()=>{},runPython(code){
  if(!code.startsWith('import ast, json'))return;
  // Execute the worker's actual validation code in native CPython, with the
  // same JS-to-Python bridge values. No dependency imports may occur here.
  const values=JSON.stringify(Object.fromEntries(globals));
  const result=execFileSync('python3',['-c',`import json\nclass Proxy:\n def __init__(self, value): self.value = value\n def to_py(self): return self.value\n_values = json.loads(${JSON.stringify(values)})\nbridge_files = Proxy(_values['bridge_files'])\nbridge_name = _values['bridge_name']\n${code}\nprint(json.dumps(sorted(_imports)))`],{encoding:'utf8',stdio:['ignore','pipe','pipe']});
  return result.trim();
 },loadPackagesFromImports(){throw Error('Build must not load runtime dependencies');}};
 const context=vm.createContext({URL,AbortSignal,Date,setTimeout,postMessage:m=>messages.push(m),self:{location:{href:'http://localhost/src/python/worker.js'}},fetch:async()=>({ok:true,text:async()=>''}),importScripts(){},loadPyodide:async()=>python});
 vm.runInContext(workerSource,context);
 await vm.runInContext(`handle(${JSON.stringify({kind:'build',name:'demo',files,entries:[{module:'demo.hello',function:'main'}]})})`,context);
 return messages;
}
test('Python packaging checks syntax without importing entry points or dependencies',async()=>{
 const messages=await build({'setup.py':'from setuptools import setup','demo/__init__.py':'raise RuntimeError("must not import")','demo/hello.py':'import numpy as np\nimport absent_runtime_dependency\nprint("%d", 1)\nraise RuntimeError("must not execute")\ndef main():\n np.concatenate()\n'});
 assert.deepEqual(messages.filter(m=>m.kind==='stdout'),[]);
 assert.deepEqual(JSON.parse(JSON.stringify(messages.at(-1))),{kind:'build_ok',imports:['absent_runtime_dependency','numpy']});
});
test('Python packaging still catches invalid syntax with the source filename',async()=>{
 await assert.rejects(()=>build({'demo/hello.py':'def main(:\n pass'}),/demo\/hello.py[\s\S]*SyntaxError/);
});
