// Capture signatures from the same NumPy/Python distribution used by the lab.
import {chromium} from 'playwright-core';import {readFile,writeFile} from 'node:fs/promises';
const source=await readFile('scripts/capture-editor-catalog.py','utf8'),worker=await readFile('src/python/worker.js','utf8'),index=/const INDEX='([^']+)'/.exec(worker)[1];
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true});
try{
 const page=await browser.newPage();await page.goto(process.env.LAB_URL||'http://127.0.0.1:8017/ros2-basics-lab/');
 const captured=await page.evaluate(({source,index})=>new Promise((resolve,reject)=>{
  const code=`onmessage=async({data})=>{try{importScripts(data.index+'pyodide.js');const py=await loadPyodide({indexURL:data.index});await py.loadPackage('numpy');postMessage({result:py.runPython(data.source)});}catch(e){postMessage({error:String(e)});}}`,url=URL.createObjectURL(new Blob([code],{type:'text/javascript'})),worker=new Worker(url);
  const timer=setTimeout(()=>{worker.terminate();URL.revokeObjectURL(url);reject(Error('NumPy capture timed out'));},180000);
  worker.onmessage=({data})=>{clearTimeout(timer);worker.terminate();URL.revokeObjectURL(url);data.error?reject(Error(data.error)):resolve(JSON.parse(data.result));};worker.postMessage({source,index});
 }),{source,index});
 await writeFile('src/python-completion-data.js','// Captured from the lab browser runtime: NumPy '+captured.numpyVersion+'. Suggestions require no runtime or network.\nexport const PYTHON_COMPLETIONS='+JSON.stringify(captured.data,null,1)+';\n');console.log('Captured browser NumPy '+captured.numpyVersion+' suggestions');
}finally{await browser.close();}
