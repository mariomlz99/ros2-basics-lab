import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {feedbackPrograms} from './sensor-feedback-fixtures.mjs';
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true}),reports=[];
try{
 const page=await browser.newPage();await page.goto(process.env.LAB_URL||'http://127.0.0.1:8033/ros2-basics-lab/');await page.exposeFunction('targetProgress',s=>console.log(s));
 for(const language of (process.env.LAB_LANGUAGE||'python,cpp').split(',')){
  const result=await page.evaluate(async({language,code})=>{
   const base=document.querySelector('script[type=module]').src,{Lab}=await import(new URL('lab.js',base)),{ROOT}=await import(new URL('workspace.js',base)),{Playground}=await import(new URL('playground/playground.js',base)),{TRAINING_WORLD}=await import(new URL('playground/lidar.js',base));
   const WorkerClass=window.Worker,workers=new Set();window.Worker=class extends WorkerClass{constructor(...args){super(...args);workers.add(this);}terminate(){workers.delete(this);return super.terminate();}};
   const l=new Lab(),build=l.terminal(),canvases=Array.from({length:3},()=>document.createElement('canvas')),scene=new Playground(l.runtime,...canvases),original=structuredClone(TRAINING_WORLD.obstacles),frames=[],logs=[],cycles=[];let terminal;
   const sleep=ms=>new Promise(r=>setTimeout(r,ms));const until=async(fn,label,timeout=20000)=>{const start=Date.now();while(Date.now()-start<timeout){if(fn())return;await sleep(30);}throw Error(label+' '+logs.slice(-5).join('\n'));};
   const listen=t=>t.output=s=>{logs.push(s);if(s.startsWith('FRAME ')){const [stamp,count,cx,front,angular,linear]=s.slice(6).split(' ').map(Number);frames.push({stamp,count,cx,front,angular,linear,latency:Date.now()-stamp*1000});}};
   const cases=[
    {name:'center',yaw:0,targetY:-.6,visible:true},
    {name:'left',yaw:0,targetY:.5,visible:true,turn:1},
    {name:'right',yaw:0,targetY:-1.7,visible:true,turn:-1},
    {name:'turned-away',yaw:Math.PI,targetY:-.6,visible:false},
    {name:'removed',yaw:0,empty:true,visible:false},
    {name:'occluded',yaw:0,targetY:-.6,occluded:true,visible:false},
   ];
   const assertClean=label=>{const values={workers:workers.size,nodes:l.runtime.nodes.size,services:l.runtime.services.size,parameters:l.runtime.parameters.size,listeners:l.runtime.listeners.size,timers:l.runtime.jobs.size,processes:l.processes.active().length};if(Object.values(values).some(Boolean))throw Error(label+' '+JSON.stringify(values));return values;};
   try{
    await build.execute('mkdir -p ~/ros2_ws/src');await build.execute('cd ~/ros2_ws/src');await build.execute('ros2 pkg create feedback_pkg --build-type '+(language==='python'?'ament_python':'ament_cmake')+' --node-name feedback --dependencies '+(language==='python'?'rclpy':'rclcpp')+' sensor_msgs geometry_msgs');
    l.fs.write(ROOT+'/src/feedback_pkg/'+(language==='python'?'feedback_pkg/feedback.py':'src/feedback.cpp'),code);await build.execute('cd ..');await build.execute('colcon build');
    for(let cycle=0;cycle<18;cycle++){
     const config=cases[cycle%cases.length],first=frames.length;
     TRAINING_WORLD.obstacles=config.empty?[]:[{...original[0],y:config.targetY}];
     if(config.occluded)TRAINING_WORLD.obstacles.push({x:1.5,y:-1,w:.3,h:8,height:2,color:[100,140,160]});
     scene.resetPose();scene.robot.yaw=config.yaw;scene.start();scene.start();
     terminal=l.terminal();listen(terminal);await terminal.execute('source ~/ros2_ws/install/setup.bash');await terminal.execute('ros2 run feedback_pkg feedback');
     await until(()=>frames.length>=first+5,config.name+' new callbacks');
     let recent=frames.slice(first);
     if(config.visible){if(!recent.some(f=>f.count>0))throw Error(config.name+' invisible target');if(config.turn&&!recent.some(f=>f.angular*config.turn>.1))throw Error(config.name+' wrong steering sign');}
     else if(recent.some(f=>f.count!==0||f.linear!==0||f.angular!==0)||scene.robot.distance!==0)throw Error(config.name+' false target or motion');
     // Retarget a live process and demand a response from new pixels, then
     // remove the target and demand an explicit zero command.
     if(cycle%3===0){
      TRAINING_WORLD.obstacles=[{...original[0],y:.7}];scene.resetPose();const moved=frames.length;await until(()=>frames.slice(moved).some(f=>f.count>0&&f.angular>.1),'moved target correction');
      TRAINING_WORLD.obstacles=[];const removed=frames.length;await until(()=>frames.length>=removed+3,'removed target frames');if(frames.at(-1).count||scene.robot.linear||scene.robot.angular)throw Error('Removed target did not stop');
     }
     const sample=[...l.runtime.samples.values()].filter(s=>s.topic==='/camera/image_raw').at(-1).message,rgba=canvases[1].getContext('2d').getImageData(0,0,320,240).data;
     for(let i=0;i<sample.data.length;i++)if(sample.data[i]!==rgba[Math.floor(i/3)*4+i%3])throw Error('Displayed image differs from callback source');
     let stoppedFrames;
     if(cycle%2===0){l.close(terminal.id);stoppedFrames=frames.length;await sleep(300);if(frames.length!==stoppedFrames)throw Error('Callbacks after terminal close');scene.stop();}
     else{
      // Stopping only the source permits at most two already offered images.
      const count=frames.length,adapter=l.processes.active()[0].adapter;scene.stop();scene.stop();await until(()=>!adapter.mailbox.inFlight.size&&!adapter.mailbox.latest.size,'source queue drain',5000);if(frames.length-count>2)throw Error('Unbounded image queue');stoppedFrames=frames.length;await sleep(150);if(frames.length!==stoppedFrames)throw Error('New frames after source stop');
      // Restart the source while the same student program is still alive.
      scene.start();await until(()=>frames.length>=stoppedFrames+3,'source restart fresh frames');l.stop(terminal.id);stoppedFrames=frames.length;await sleep(250);if(frames.length!==stoppedFrames)throw Error('Callbacks after process Stop');scene.stop();l.close(terminal.id);
     }
     // Rapid sensor toggles must be idempotent and clean.
     for(let n=0;n<3;n++){scene.start();scene.start();scene.stop();scene.stop();}
     const clean=assertClean(config.name),latencies=frames.slice(first).map(f=>f.latency).sort((a,b)=>a-b),p95=latencies[Math.floor(latencies.length*.95)];if(p95>100)throw Error(config.name+' image p95 '+p95+' ms');
     cycles.push({cycle,target:config.name,frames:frames.length-first,p95Ms:p95,clean});await window.targetProgress(language+' target '+cycle+' '+config.name+': PASS '+p95+' ms p95');
    }
    // Cancel process startup repeatedly; no worker may arrive after close/reset.
    for(let i=0;i<8;i++){
     const t=l.terminal();await t.execute('source ~/ros2_ws/install/setup.bash');const pending=t.execute('ros2 run feedback_pkg feedback').catch(e=>{if(!/closed|cancelled|interrupted/.test(e.message))throw e;});if(i===7)l.reset();else l.close(t.id);await pending;await sleep(100);assertClean('startup cancellation');
    }
    return {language,passed:true,cycles,startupCancellations:8,displayedImageMatched:true};
   }finally{scene.stop();l.reset();TRAINING_WORLD.obstacles=original;window.Worker=WorkerClass;}
  },{language,code:feedbackPrograms[language]});
  assert(result.passed);reports.push(result);await mkdir('artifacts/audit',{recursive:true});await writeFile('artifacts/audit/target-lifecycle-'+language+'.json',JSON.stringify(result,null,2));
 }
 await writeFile('artifacts/audit/target-lifecycle.json',JSON.stringify(reports,null,2));
}finally{await browser.close();}
