import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true});
try{
 const page=await browser.newPage();await page.goto(process.env.LAB_URL||'http://127.0.0.1:8033/ros2-basics-lab/');
 await page.exposeFunction('auditProgress',s=>console.log(s));
 const results=await page.evaluate(async()=>{
  const base=document.querySelector('script[type=module]').src,{Lab}=await import(new URL('lab.js',base)),{ROOT}=await import(new URL('workspace.js',base)),{pubsubFiles}=await import(new URL('examples.js',base));
  const results=[],wait=ms=>new Promise(r=>setTimeout(r,ms));
  for(const language of ['python','cpp']){
   const lab=new Lab(),a=lab.terminal(),b=lab.terminal(),echo=lab.terminal(),hz=lab.terminal(),log=[],rates=[];
   for(const t of [a,b,echo])t.output=s=>log.push([t.id,s]);hz.output=s=>rates.push(s);
   const until=async fn=>{for(let i=0;i<1200;i++){if(fn())return;await wait(100);}throw Error('Timeout '+JSON.stringify(log.slice(-10)));};
   try{
    await a.execute('mkdir -p ~/ros2_ws/src');await a.execute('cd ~/ros2_ws/src');const name=language==='python'?'py_pubsub':'cpp_pubsub';
    await a.execute(`ros2 pkg create --build-type ${language==='python'?'ament_python':'ament_cmake'} ${name} --dependencies ${language==='python'?'rclpy':'rclcpp'} std_msgs`);
    for(const [path,code] of Object.entries(pubsubFiles(language)))lab.fs.write(ROOT+'/src/'+name+'/'+path,code);
    await a.execute('cd ..');await a.execute('colcon build');for(const t of [a,b])await t.execute('source ~/ros2_ws/install/setup.bash');
    for(let cycle=0;cycle<3;cycle++){
     log.length=0;rates.length=0;await a.execute('ros2 run '+name+' talker');await until(()=>lab.runtime.matchingNodes('/talker').length===1);
     await b.execute('ros2 run '+name+' talker');await until(()=>lab.runtime.topics.get('/topic')?.publishers.size===2);
     await echo.execute('ros2 topic echo /topic');await hz.execute('ros2 topic hz /topic');await wait(3200);
     if(lab.runtime.matchingNodes('/talker').length!==2)throw Error('Missing duplicate node');
     const rate=Number(/average rate: ([\d.]+)/.exec(rates.at(-1))?.[1]);if(!(rate>2.7&&rate<5.3))throw Error('Combined rate '+rate);
     const messages=log.filter(([id])=>id===echo.id).length;if(messages<8)throw Error('Missing duplicate messages: '+messages);
     lab.stop(a.id);if(lab.runtime.topics.get('/topic').publishers.size!==1)throw Error('Stopping one publisher removed its peer');
     const before=log.filter(([id])=>id===echo.id).length;await wait(1100);if(log.filter(([id])=>id===echo.id).length<=before)throw Error('Surviving publisher stopped');
     lab.stop(b.id);lab.stop(echo.id);lab.stop(hz.id);
     for(const [name,count] of Object.entries({nodes:lab.runtime.nodes.size,jobs:lab.runtime.jobs.size,listeners:lab.runtime.listeners.size,parameters:lab.runtime.parameters.size,services:lab.runtime.services.size,processes:lab.processes.active().length}))if(count)throw Error('Leaked '+name+': '+count);
     results.push({language,cycle,rate,messages});
    }
    await window.auditProgress('PASS '+language+': three duplicate-name publisher cycles, combined rates/messages and independent cleanup');
   }finally{lab.reset();}
  }
  return results;
 });
 assert.equal(results.length,6);console.log(JSON.stringify(results));
}finally{await browser.close();}
