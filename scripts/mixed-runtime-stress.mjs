import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {nestedPrograms} from './runtime-behavior-fixtures.mjs';
const cycleCount=Number(process.env.STRESS_CYCLES||16),dwellMs=Number(process.env.STRESS_DWELL_MS||250);
assert(Number.isInteger(cycleCount)&&cycleCount>=1&&cycleCount<=256,'STRESS_CYCLES must be 1..256');
assert(Number.isInteger(dwellMs)&&dwellMs>=250&&dwellMs<=30000,'STRESS_DWELL_MS must be 250..30000');
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true});
try{
 const page=await browser.newPage();await page.goto(process.env.LAB_URL||'http://127.0.0.1:8033/ros2-basics-lab/');
 await page.exposeFunction('auditProgress',s=>console.log(s));
 const report=await page.evaluate(async({programs,cycleCount,dwellMs})=>{
  const base=document.querySelector('script[type=module]').src,{Lab}=await import(new URL('lab.js',base)),{ROOT}=await import(new URL('workspace.js',base)),{Playground}=await import(new URL('playground/playground.js',base));
  const OriginalWorker=window.Worker,workers=new Set();let started=0,maximum=0;
  window.Worker=class extends OriginalWorker{constructor(...args){super(...args);workers.add(this);started++;maximum=Math.max(maximum,workers.size);}terminate(){workers.delete(this);return super.terminate();}};
  const l=new Lab(),build=l.terminal(),scene=new Playground(l.runtime,...Array.from({length:3},()=>document.createElement('canvas'))),cycles=[];
  const until=async(fn,label)=>{for(let i=0;i<1200;i++){if(fn())return;await new Promise(r=>setTimeout(r,50));}throw Error('Timeout '+label);};
  try{
   await build.execute('mkdir -p ~/ros2_ws/src');await build.execute('cd ~/ros2_ws/src');
   for(const language of ['python','cpp']){
    await build.execute('ros2 pkg create stress_'+language+' --build-type '+(language==='python'?'ament_python':'ament_cmake')+' --node-name probe --dependencies '+(language==='python'?'rclpy':'rclcpp')+' nav_msgs geometry_msgs');
    let code=programs[language].replaceAll('nested_probe',language+'_probe');
    for(const topic of ['plan','path','pose'])for(const quote of ["'",'"'])code=code.replaceAll(quote+'/'+topic+quote,quote+'/'+language+'/'+topic+quote);
    l.fs.write(ROOT+'/src/stress_'+language+'/'+(language==='python'?'stress_python/probe.py':'src/probe.cpp'),code);
   }
   await build.execute('cd ..');await build.execute('colcon build');
   for(let cycle=0;cycle<cycleCount;cycle++){
    const terminals=[];scene.start();
    for(const language of ['python','cpp']){
     const t=l.terminal(),output=[];t.output=s=>output.push(s);terminals.push({t,output});
     await t.execute('source ~/ros2_ws/install/setup.bash');
     await t.execute('ros2 run stress_'+language+' probe');
    }
    if(cycle%4!==0){
     await until(()=>terminals.every(({output})=>output.some(s=>s.includes('NESTED_SERVICE_OK'))&&output.some(s=>s.includes('NESTED_MESSAGE_OK'))),'mixed callbacks');
     const cli=l.terminal();terminals.push({t:cli,output:[]});
     await cli.execute('ros2 topic echo /scan sensor_msgs/msg/LaserScan');
     await new Promise(r=>setTimeout(r,dwellMs));
    }
    for(const {t}of terminals)l.close(t.id);scene.stop();
    await new Promise(r=>setTimeout(r,100));
    const state={cycle,workers:workers.size,nodes:l.runtime.nodes.size,listeners:l.runtime.listeners.size,timers:l.runtime.jobs.size,services:l.runtime.services.size,parameters:l.runtime.parameters.size,processes:l.processes.active().length};
    if(Object.entries(state).some(([k,v])=>k!=='cycle'&&v!==0))throw Error('Leak '+JSON.stringify(state));
    if(l.runtime.samples.size>100||l.runtime.programPublications.size>100||l.runtime.programDeliveries.length>200)throw Error('Unbounded runtime evidence');
    cycles.push(state);await window.auditProgress('PASS mixed cycle '+cycle+(cycle%4===0?' (close during startup)':''));
   }
   // Reset while both runtime adapters are still loading, then allow late tasks.
   const t=l.terminal();await t.execute('source ~/ros2_ws/install/setup.bash');const pending=t.execute('ros2 run stress_python probe').catch(e=>{if(!e.message.includes('closed'))throw e;});l.reset();await pending;await new Promise(r=>setTimeout(r,300));
   if(workers.size||l.runtime.nodes.size||l.processes.active().length)throw Error('Late state after Reset');
   return {passed:true,cycleCount,dwellMs,url:location.href,cycles,workersStarted:started,maxSimultaneousWorkers:maximum,resetDuringStartup:true};
  }finally{scene.stop();l.reset();window.Worker=OriginalWorker;}
 },{programs:nestedPrograms,cycleCount,dwellMs});
 await mkdir('artifacts/audit',{recursive:true});await writeFile('artifacts/audit/mixed-stress'+(cycleCount===16&&dwellMs===250?'':'-'+cycleCount+'x'+dwellMs)+'.json',JSON.stringify(report,null,2));assert(report.passed);console.log('PASS mixed Python/C++/sensor stress, closed terminals, startup interruption, bounded evidence and worker cleanup');
}finally{await browser.close();}
