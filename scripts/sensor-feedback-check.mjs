import {chromium,firefox} from 'playwright-core';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {feedbackPrograms} from './sensor-feedback-fixtures.mjs';
const browser=await (process.env.BROWSER==='firefox'?firefox:chromium).launch({headless:true,...(process.env.BROWSER==='firefox'?{}:{executablePath:'/usr/bin/google-chrome'})}),reports=[];
try{
 const page=await browser.newPage();await page.goto(process.env.LAB_URL||'http://127.0.0.1:8033/ros2-basics-lab/');await page.exposeFunction('feedbackProgress',s=>console.log(s));
 for(const language of (process.env.LAB_LANGUAGE||'python,cpp').split(',')){
  const result=await page.evaluate(async({language,code})=>{
   const base=document.querySelector('script[type=module]').src,{Lab}=await import(new URL('lab.js',base)),{ROOT}=await import(new URL('workspace.js',base)),{Playground}=await import(new URL('playground/playground.js',base)),{TRAINING_WORLD,collides}=await import(new URL('playground/lidar.js',base));
   const l=new Lab(),t=l.terminal(),canvases=Array.from({length:3},()=>document.createElement('canvas')),scene=new Playground(l.runtime,...canvases),output=[],frames=[],captures=[];t.output=s=>{output.push(s);if(s.startsWith('FRAME ')){const [stamp,count,cx,front,angular,linear]=s.slice(6).split(' ').map(Number);frames.push({stamp,count,cx,front,angular,linear,latencyMs:Date.now()-stamp*1000});}};
   const sleep=ms=>new Promise(r=>setTimeout(r,ms));const until=async(fn,label,timeout=60000)=>{const start=Date.now();while(Date.now()-start<timeout){if(fn())return;await sleep(50);}throw Error(label+' '+output.slice(-5).join('\n'));};
   const state=()=>({x:scene.robot.x,y:scene.robot.y,yaw:scene.robot.yaw,linear:scene.robot.linear,angular:scene.robot.angular});
   try{
    await t.execute('mkdir -p ~/ros2_ws/src');await t.execute('cd ~/ros2_ws/src');await t.execute('ros2 pkg create feedback_pkg --build-type '+(language==='python'?'ament_python':'ament_cmake')+' --node-name feedback --dependencies '+(language==='python'?'rclpy':'rclcpp')+' sensor_msgs geometry_msgs');
    const path=ROOT+'/src/feedback_pkg/'+(language==='python'?'feedback_pkg/feedback.py':'src/feedback.cpp');l.fs.write(path,code);await t.execute('cd ..');await t.execute('colcon build');await t.execute('source install/setup.bash');
    // The control program observes only messages. Harness pose perturbations
    // test whether later pixels, callbacks, commands and motion all agree.
    scene.robot.yaw=.35;scene.start();await t.execute('ros2 run feedback_pkg feedback');await until(()=>frames.length>=3,'real image callbacks');
    if(!frames.some(f=>f.count>0&&f.cx>170&&f.angular<0))throw Error('Image must cause rightward correction');
    await until(()=>Math.abs(scene.robot.yaw)<.10&&scene.robot.x>.25,'camera steering convergence',15000);
    const at=frames.length;scene.robot.yaw=-.3;await until(()=>frames.slice(at).some(f=>f.cx<150&&f.angular>0),'opposite image correction');
    await until(()=>scene.robot.x>1.8&&frames.at(-1)?.front<=.7&&scene.robot.linear===0,'LiDAR stopping distance',18000);
    const stopped=state();if(stopped.x>2.5||frames.at(-1).front<.4)throw Error('Image/command latency missed the stopping distance: '+JSON.stringify({stopped,frame:frames.at(-1)}));if(collides(scene.robot,TRAINING_WORLD))throw Error('Controller collided');await sleep(700);if(Math.hypot(scene.robot.x-stopped.x,scene.robot.y-stopped.y)>.05)throw Error('Stopping did not hold');
    // Compare every RGB byte that was displayed with the actual published image.
    const latest=[...l.runtime.samples.values()].filter(s=>s.topic==='/camera/image_raw').at(-1).message,rgba=canvases[1].getContext('2d').getImageData(0,0,latest.width,latest.height).data;
    if(latest.data.length!==320*240*3||latest.encoding!=='rgb8'||latest.header.frame_id!=='camera_optical_frame')throw Error('Invalid camera metadata');
    for(let i=0;i<latest.data.length;i++)if(latest.data[i]!==rgba[Math.floor(i/3)*4+i%3])throw Error('Displayed and published image differ at '+i);
    const latencies=frames.map(f=>f.latencyMs).sort((a,b)=>a-b),latency={medianMs:latencies[Math.floor(latencies.length/2)],p95Ms:latencies[Math.floor(latencies.length*.95)],maxMs:latencies.at(-1)};if(latency.p95Ms>100)throw Error('Image feedback p95 exceeds 100 ms: '+JSON.stringify(latency));captures.push({pose:stopped,frame:frames.at(-1),latency,bytesMatched:latest.data.length});
    await window.feedbackProgress(language+': opposite camera corrections, LiDAR stop and displayed RGB bytes PASS');
    // Rotate away from the obstacle: pixels vanish and the program sends zero.
    scene.robot.yaw=Math.PI;const away=frames.length;await until(()=>frames.length>away+2,'new rear-facing frames');if(frames.at(-1).count!==0||frames.at(-1).linear!==0||frames.at(-1).angular!==0)throw Error('No-target image must stop');
    // Stop the sensor source: no queued images/callbacks keep arriving.
    const atStop=frames.length;scene.stop();const adapter=l.processes.active().find(p=>p.language!=='cli').adapter;await until(()=>adapter.mailbox.inFlight.size===0&&adapter.mailbox.latest.size===0,'bounded sensor queue drain',5000);if(frames.length-atStop>2)throw Error('Image queue exceeded one running and one pending callback');const quiet=frames.length;await sleep(700);if(frames.length!==quiet)throw Error('Stale frames after sensor queue drained');
    const rejects=output.filter(s=>s==='REJECT_FRAME').length;
    l.runtime.publish('/camera/image_raw','sensor_msgs/msg/Image',{...latest,header:{...latest.header,stamp:{sec:0,nanosec:0}}},{node:'/test_stale_frame'});await until(()=>output.filter(s=>s==='REJECT_FRAME').length>rejects,'stale image rejection');
    l.stop(t.id);if(l.runtime.nodes.size||l.runtime.listeners.size||l.runtime.jobs.size)throw Error('Feedback Stop leaked');
    // Wrong topic code executes but never sees an image and cannot move the robot.
    l.fs.write(path,code.replaceAll('/camera/image_raw','/camera/wrong_topic'));await t.execute('colcon build');scene.resetPose();scene.start();const before=frames.length;await t.execute('ros2 run feedback_pkg feedback');await sleep(1800);if(frames.length!==before||scene.robot.distance!==0)throw Error('Wrong image topic must not control the robot');
    l.stop(t.id);scene.stop();l.fs.write(path,code);await t.execute('colcon build');
    // Recover without reloading the browser, then stop commands while sensing continues.
    scene.resetPose();scene.start();await t.execute('ros2 run feedback_pkg feedback');await until(()=>scene.robot.distance>.15,'recovery after wrong topic');l.stop(t.id);await sleep(2300);if(scene.robot.linear||scene.robot.angular)throw Error('Velocity watchdog after stopped controller');
    scene.stop();l.reset();if(l.runtime.nodes.size||l.runtime.jobs.size||l.runtime.listeners.size)throw Error('Final cleanup');
    return {language,passed:true,frames:frames.length,oppositeCorrections:true,stop:stopped,displayedImageMatches:true,staleFrameRejected:true,wrongTopicNoMotion:true,recovery:true,watchdog:true,captures};
   }finally{scene.stop();l.reset();}
  },{language,code:feedbackPrograms[language]});
  reports.push(result);assert(result.passed);console.log(JSON.stringify(result));await mkdir('artifacts/audit',{recursive:true});await writeFile('artifacts/audit/sensor-feedback-'+language+'.json',JSON.stringify(result,null,2));
 }
 await mkdir('artifacts/audit',{recursive:true});await writeFile('artifacts/audit/sensor-feedback.json',JSON.stringify(reports,null,2));
}finally{await browser.close();}
