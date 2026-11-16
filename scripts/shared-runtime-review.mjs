// Serve this candidate for real Python/C++ worker regression checks.
import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
const root=resolve(process.env.LAB_ROOT||'.');
const output=resolve(process.env.QA_OUTPUT||'artifacts/shared-runtime-review');
let server;
if(!process.env.LAB_URL){
 const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.wasm':'application/wasm','.svg':'image/svg+xml'};
 server=createServer(async(req,res)=>{
  try{
   const path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
   if(path!==root&&!path.startsWith(root+sep)){res.writeHead(403);res.end();return;}
   const file=(await stat(path)).isDirectory()?resolve(path,'index.html'):path;
   res.setHeader('Content-Type',mime[extname(file)]||'application/octet-stream');
   res.setHeader('Cache-Control','no-store');res.end(await readFile(file));
  }catch{res.writeHead(404);res.end();}
 });
 await new Promise((done,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',done);});
 process.env.LAB_URL='http://127.0.0.1:'+server.address().port+'/';
}
try{
 const expected=JSON.parse(await readFile(resolve(root,'build-info.json'),'utf8')).assetVersion;
 const response=await fetch(new URL('build-info.json',process.env.LAB_URL),{cache:'no-store'});
 if(!response.ok||(await response.json()).assetVersion!==expected)throw Error('Served build does not match the reviewed candidate');
 process.env.QA_OUTPUT=resolve(output,'python-lifecycle');
 await import('./shared-python-worker.mjs');
 if(process.exitCode)throw Error('Python worker lifecycle checks failed; checker tests not started');
 process.env.QA_OUTPUT=resolve(output,'checkers');
 await import('./shared-checker-runtime.mjs');
 if(process.exitCode)throw Error('Checker regressions failed; delivery checks not started');
 process.env.QA_OUTPUT=resolve(output,'delivery-ownership');
 process.env.LAB_BUILD_INFO=resolve(root,'build-info.json');
 process.env.BROWSERS=process.env.BROWSERS||'chromium,firefox';
 await import('./shared-delivery-runtime.mjs');
}finally{server?.close();}
