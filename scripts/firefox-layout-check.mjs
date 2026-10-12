import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const port=4449,base='http://127.0.0.1:'+port,logs=[],driver=spawn('/snap/bin/geckodriver',['--port',String(port),'--profile-root','/home/mari0/Desktop/ROS_COURSE_2627/.worktrees/ros2-basics-lab-analysis/artifacts'],{stdio:['ignore','pipe','pipe']});
driver.stdout.on('data',b=>logs.push(String(b)));driver.stderr.on('data',b=>logs.push(String(b)));let session;
async function request(path,body,method=body===undefined?'GET':'POST') {const r=await fetch(base+path,{method,headers:{'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})});const json=await r.json();if(!r.ok||json.value?.error)throw Error(JSON.stringify(json));return json.value;}
const wait=ms=>new Promise(r=>setTimeout(r,ms));
try{
 for(let i=0;i<100;i++){try{await request('/status');break;}catch{await wait(100);}}
 session=(await request('/session',{capabilities:{alwaysMatch:{browserName:'firefox','moz:firefoxOptions':{args:['-headless']}}}})).sessionId;
 const execute=script=>request('/session/'+session+'/execute/sync',{script,args:[]});
 await request('/session/'+session+'/url',{url:process.env.LAB_URL||'http://127.0.0.1:8033/ros2-basics-lab/'});
 for(let i=0;i<100;i++){if(await execute('return !!document.querySelector("#start")&&!document.querySelector("#start").disabled'))break;await wait(100);}
 await execute('document.querySelector("#start").click()');
 for(let i=0;i<200;i++){if(await execute('return !!document.querySelector(".xterm")'))break;await wait(100);}
 await execute('document.querySelector("[data-index=\\"7\\"]").click()');
 const results=[];await mkdir('artifacts/screenshots',{recursive:true});
 for(const width of [1440,899,650,390]){
  await request('/session/'+session+'/window/rect',{width,height:1000});await wait(200);
  const result=await execute(`return {width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth+1,figures:[...document.querySelectorAll('.playground-streams figure')].map(f=>{const c=f.querySelector('figcaption'),b=f.querySelector('button'),v=f.querySelector('canvas');return {caption:c.getBoundingClientRect().width,scroll:c.scrollWidth,right:c.getBoundingClientRect().right,button:b.getBoundingClientRect().x,canvas:v.getBoundingClientRect().width}})}`);
  assert.equal(result.figures.length,3);assert(!result.overflow);for(const f of result.figures){assert(f.canvas>=260);assert(f.scroll<=f.caption+1);assert(f.right<=f.button+1);}results.push(result);
  if(width===899){const png=await request('/session/'+session+'/screenshot');await writeFile('artifacts/screenshots/playground-firefox-899.png',Buffer.from(png,'base64'));}
 }
 await execute('document.querySelector("#playground-start").click()');await wait(300);assert.match(await execute('return document.querySelector("#playground-status").textContent'),/Live/);await execute('document.querySelector("#playground-stop").click()');
 await writeFile('artifacts/audit/firefox-layout.json',JSON.stringify(results,null,2));console.log('PASS native Firefox simulator layout at four widths and sensor start/stop');
}catch(error){console.error(logs.join('').slice(-5000));throw error;}finally{if(session)await request('/session/'+session,undefined,'DELETE').catch(()=>{});driver.kill('SIGTERM');}
