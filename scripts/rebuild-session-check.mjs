import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {cp,mkdir,mkdtemp,readFile,appendFile,rm} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import http from 'node:http';
import path from 'node:path';
const project=process.cwd(),kinenest=process.argv.includes('--kinenest');
await mkdir('artifacts',{recursive:true});const fixture=await mkdtemp(path.join(project,'artifacts/rebuild-'));
let browser,server;
try{
 for(const name of ['src','docs','LICENSE','NOTICE','index.html',...(kinenest?['basics.html','linux.html','licences.html','public','legacy-assets','_redirects']:[])])await cp(name,path.join(fixture,name),{recursive:true});
 const build=()=>execFileSync(process.execPath,[path.join(project,'scripts/build.mjs'),...(kinenest?[]:['--public'])],{cwd:fixture,stdio:'pipe'});
 build();const before=JSON.parse(await readFile(path.join(fixture,'dist/build-info.json'),'utf8'));
 server=http.createServer(async(req,res)=>{
  try{
   const name=new URL(req.url,'http://localhost').pathname.replace(/^\/ros2-basics-lab\//,'/');
   const file=path.resolve(fixture,'dist','.'+(name.endsWith('/')?name+'index.html':name));
   if(!file.startsWith(fixture+'/dist/'))throw Error('Invalid path');
   const data=await readFile(file);res.setHeader('Content-Type',({'.js':'text/javascript','.html':'text/html','.css':'text/css','.json':'application/json'})[path.extname(file)]||'text/plain');res.end(data);
  }catch{res.writeHead(404);res.end();}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true});
 const page=await browser.newPage(),failed=[];page.on('requestfailed',r=>failed.push(r.url()));
 const url='http://127.0.0.1:'+server.address().port+(kinenest?'/basics.html':'/ros2-basics-lab/');
 await page.goto(url);
 await page.evaluate(async()=>{
  const base=document.querySelector('script[type="module"]').src;
  const [{Lab},{pubsubFiles}]=await Promise.all([import(new URL('lab.js',base)),import(new URL('examples.js',base))]);
  const lab=new Lab(),terminal=lab.terminal();window.rebuildLab=lab;window.rebuildTerminal=terminal;window.rebuildLogs=[];
  terminal.output=line=>window.rebuildLogs.push(line);
  await terminal.execute('mkdir -p ~/ros2_ws/src');await terminal.execute('cd ~/ros2_ws/src');
  await terminal.execute('ros2 pkg create --build-type ament_cmake demo --dependencies rclcpp std_msgs');
  for(const [name,content]of Object.entries(pubsubFiles('cpp','demo')))lab.fs.write(terminal.cwd+'/demo/'+name,content);
  await terminal.execute('cd ..');await terminal.execute('colcon build');
 });
 // A real second build changes the asset hash while this tab remains open.
 await appendFile(path.join(fixture,'src/style.css'),'\n/* rebuild session regression */\n');build();
 const after=JSON.parse(await readFile(path.join(fixture,'dist/build-info.json'),'utf8'));
 assert.notEqual(before.assetVersion,after.assetVersion);
 assert.equal((await readFile(path.join(fixture,'dist/assets',before.assetVersion,'src/cpp/worker.js'))).length>0,true);
 await page.evaluate(async()=>{
  const lab=window.rebuildLab,talker=window.rebuildTerminal,listener=lab.terminal();
  listener.output=line=>window.rebuildLogs.push(line);
  await talker.execute('source install/setup.bash');await talker.execute('ros2 run demo talker');
  await listener.execute('source ~/ros2_ws/install/setup.bash');await listener.execute('ros2 run demo listener');
 });
 await page.waitForFunction(()=>window.rebuildLogs.some(line=>line.includes('I heard:')),{},{timeout:120000});
 const logs=await page.evaluate(()=>{window.rebuildLab.reset();return window.rebuildLogs.join('\n');});
 assert.doesNotMatch(logs,/worker.*(failed|error)|Runtime worker failed/i);assert.deepEqual(failed,[]);
 const fresh=await browser.newPage();await fresh.goto(url);
 assert((await fresh.locator('script[type="module"]').getAttribute('src')).includes(after.assetVersion));
 console.log('PASS open C++ session builds two executables, survives a new asset version, then runs talker/listener without reloading; fresh tabs use the new version');
}finally{await browser?.close();if(server)await new Promise(resolve=>server.close(resolve));await rm(fixture,{recursive:true,force:true});}
