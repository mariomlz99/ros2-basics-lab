import assert from 'node:assert/strict';
import {mkdir,readFile,stat,writeFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {resolve,extname,sep} from 'node:path';
import {pathToFileURL} from 'node:url';

const {chromium,firefox}=await import(process.env.PLAYWRIGHT_MODULE||'playwright-core');
const root=resolve(process.env.LAB_ROOT||'.'),out=resolve(process.env.QA_OUTPUT||'artifacts/browser-review');
await mkdir(out,{recursive:true});
let server,url=process.env.LAB_URL;
if(!url){
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
 url='http://127.0.0.1:'+server.address().port+'/';
}
const expected=JSON.parse(await readFile(resolve(root,'build-info.json'),'utf8')).assetVersion;
const results={url,expectedAssetVersion:expected,runs:[]};
try{
 // Pages may still be serving the previous version while its deployment completes.
 for(let attempt=0;;attempt++){
  const response=await fetch(new URL('build-info.json?qa='+Date.now(),url),{cache:'no-store'});
  const actual=response.ok?(await response.json()).assetVersion:null;
  if(actual===expected)break;
  if(!process.env.LAB_URL||attempt>=29)throw Error('Served asset version '+actual+' does not match candidate '+expected);
  await new Promise(done=>setTimeout(done,10000));
 }
 for(const [engine,type]of [['chromium',chromium],['firefox',firefox]]){
  const browser=await type.launch({headless:true,...(engine==='chromium'&&process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{})});
  try{
   for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:320,height:740}]){
    const context=await browser.newContext({viewport,hasTouch:viewport.width<500});
    const page=await context.newPage(),errors=[];
    page.setDefaultTimeout(30000);page.on('pageerror',error=>errors.push(error.message));
    const record={engine,version:browser.version(),viewport,status:'RUNNING'};results.runs.push(record);
    const transcript=page.locator('.terminal-transcript pre').first();
    async function ready(){await page.waitForFunction(()=>document.querySelector('.terminal-state')?.textContent.startsWith('Jazzy'));}
    async function open(){
     await page.goto(url,{waitUntil:'networkidle'});
     if(await page.locator('#start').count())await page.locator('#start').click();
     await page.locator('.xterm').first().waitFor();await ready();
     if(await page.locator('#guide-mode').textContent()==='Lesson overview')await page.locator('#guide-mode').click();
     await page.locator('#lesson .complete').waitFor();
     assert.equal(await page.locator('script[type=module]').getAttribute('src'),'./assets/'+expected+'/src/app.js');
    }
    async function command(line){
     await ready();const before=await transcript.textContent();
     await page.locator('.xterm-helper-textarea').first().focus();
     await page.keyboard.type(line);await page.keyboard.press('Enter');
     await page.waitForFunction(previous=>document.querySelector('.terminal-transcript pre').textContent!==previous,before);
     await ready();
     return (await transcript.textContent()).slice(before.length);
    }
    async function check(expectedPasses){
     await page.locator('#lesson .complete').click();
     const lines=await page.locator('#lesson .checks>p').allTextContents();
     assert.equal(lines.length,3);assert.deepEqual(lines.map(line=>line.startsWith('✓')),expectedPasses);
    }
    async function reset(){page.once('dialog',dialog=>dialog.accept());await page.locator('#reset').click();await ready();await check([false,false,false]);}
    try{
     await open();await check([false,false,false]);
     for(const line of ['/usr/bin/pwd','/usr/bin/printenv ROS_DISTRO','ros2 node list --h'])await command(line);
     await check([true,true,false]);
     await command('touch -- --help');await command('ros2 node list --*');await check([true,true,false]);
     await command('/opt/ros/jazzy/bin/ros2 --use-python-default-buffering node list --no-daemon');
     await check([true,true,true]);
     await command('echo kept_after_reload > ~/review-note.txt');
     await page.locator('#save-session').click();
     await page.waitForFunction(()=>document.querySelector('#session-state').textContent==='Saved in this browser');
     await open();assert.match(await page.locator('#progress').textContent(),/1 \/ 7/);
     await check([true,true,true]);assert.match(await command('cat ~/review-note.txt'),/\nkept_after_reload\n/);
     await reset();
     await command("echo '$ROS_DISTRO'");await command('ros2 node list --invalid');await check([false,false,false]);
     await command('pwd --');await command('printenv');await command('ros2 node list');await check([true,true,true]);
     const input=page.locator('.xterm-helper-textarea').first();
     await input.focus();await page.keyboard.press('Escape');await page.keyboard.press('Tab');
     assert.equal(await input.evaluate(node=>node===document.activeElement),false,'Keyboard can leave terminal');
     const bounds=await page.evaluate(()=>({viewport:innerWidth,document:document.documentElement.scrollWidth}));
     assert(bounds.document<=bounds.viewport+1,'Page must fit responsive viewport: '+JSON.stringify(bounds));
     await page.screenshot({path:resolve(out,engine+'-'+viewport.width+'.png'),fullPage:true});
     assert.deepEqual(errors,[]);record.status='PASS';record.checks=['checker negatives/alternatives','real terminal keyboard input','IndexedDB save/reload','saved file and progress','reset','keyboard focus exit','responsive width'];
    }catch(error){record.status='FAIL';record.error=error.stack;record.consoleErrors=errors;record.transcript=await transcript.textContent().catch(()=>null);await page.screenshot({path:resolve(out,engine+'-'+viewport.width+'-failure.png'),fullPage:true}).catch(()=>{});process.exitCode=1;}
    finally{await context.close();await writeFile(resolve(out,'results.json'),JSON.stringify(results,null,2)+'\n');}
    console.log(engine,viewport.width,record.status,record.error||'');
   }
  }finally{await browser.close();}
 }
}finally{server?.close();await writeFile(resolve(out,'results.json'),JSON.stringify(results,null,2)+'\n');}
