import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {feedbackPrograms} from './sensor-feedback-fixtures.mjs';
const programs={
 python:feedbackPrograms.python.replace('import rclpy','import time\nimport rclpy').replace("self.front = 0.0","self.declare_parameter('delay_ms', 0)\n        self.front = 0.0").replace('        command = Twist()',`        delay = self.get_parameter('delay_ms').value / 1000
        until = time.perf_counter() + delay
        while time.perf_counter() < until:
            pass
        command = Twist()`),
 cpp:feedbackPrograms.cpp.replace('    pub_ =', '    declare_parameter("delay_ms", 0);\n    pub_ =').replace('        geometry_msgs::msg::Twist command;',`        const auto delay = std::chrono::milliseconds(get_parameter("delay_ms").as_int());
        const auto until = std::chrono::steady_clock::now() + delay;
        while (std::chrono::steady_clock::now() < until) {}
        geometry_msgs::msg::Twist command;`)
};
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true}),reports=[];
try{
 const page=await browser.newPage();await page.goto(process.env.LAB_URL||'http://127.0.0.1:8033/ros2-basics-lab/');await page.exposeFunction('slowProgress',s=>console.log(s));
 for(const language of (process.env.LAB_LANGUAGE||'python,cpp').split(',')){
  const result=await page.evaluate(async({language,code})=>{
   const base=document.querySelector('script[type=module]').src,{Lab}=await import(new URL('lab.js',base)),{ROOT}=await import(new URL('workspace.js',base)),{Playground}=await import(new URL('playground/playground.js',base));
   const l=new Lab(),build=l.terminal(),inspect=l.terminal(),scene=new Playground(l.runtime,...Array.from({length:3},()=>document.createElement('canvas'))),frames=[],logs=[],cycles=[];
   const sleep=ms=>new Promise(r=>setTimeout(r,ms)),until=async(fn,label)=>{for(let i=0;i<600;i++){if(fn())return;await sleep(50);}throw Error(label+' '+logs.slice(-5).join('\n'));};
   let heartbeat;
   try{
    await build.execute('mkdir -p ~/ros2_ws/src');await build.execute('cd ~/ros2_ws/src');await build.execute('ros2 pkg create slow_pkg --build-type '+(language==='python'?'ament_python':'ament_cmake')+' --node-name probe --dependencies '+(language==='python'?'rclpy':'rclcpp')+' sensor_msgs geometry_msgs');l.fs.write(ROOT+'/src/slow_pkg/'+(language==='python'?'slow_pkg/probe.py':'src/probe.cpp'),code);await build.execute('cd ..');await build.execute('colcon build');
    for(let cycle=0;cycle<4;cycle++){
     const t=l.terminal();t.output=s=>{logs.push(s);if(s.startsWith('FRAME '))frames.push(s);};await t.execute('source ~/ros2_ws/install/setup.bash');scene.resetPose();scene.robot.yaw=Math.PI;scene.start();const first=frames.length;await t.execute('ros2 run slow_pkg probe');await until(()=>frames.length>first+2,'fast callbacks');
     await inspect.execute('ros2 param set /sensor_feedback delay_ms 350');const adapter=l.processes.active()[0].adapter;let maxInFlight=0,maxPending=0,maxHeartbeat=0,last=performance.now();
     heartbeat=setInterval(()=>{const now=performance.now();maxHeartbeat=Math.max(maxHeartbeat,now-last);last=now;maxInFlight=Math.max(maxInFlight,adapter.mailbox.inFlight.size);maxPending=Math.max(maxPending,adapter.mailbox.latest.size);},10);
     const slow=frames.length;await until(()=>frames.length>slow+3,'slow callbacks');clearInterval(heartbeat);heartbeat=null;
     if(maxInFlight>2||maxPending>2)throw Error('Unbounded slow callback queue');if(maxHeartbeat>250)throw Error('Main browser thread blocked '+maxHeartbeat+' ms');
     // Stop while the next deliberately slow callback is in flight.
     if(cycle%2)l.close(t.id);else l.stop(t.id);const stopped=frames.length;await sleep(600);if(frames.length!==stopped)throw Error('Late output after worker interruption');
     if(l.processes.active().length||adapter.worker||adapter.mailbox.inFlight.size||adapter.mailbox.latest.size)throw Error('Stopped slow worker leaked');scene.stop();l.close(t.id);if(l.runtime.nodes.size||l.runtime.listeners.size||l.runtime.jobs.size)throw Error('Slow sensor cleanup leaked');
     cycles.push({cycle,maxInFlight,maxPending,maxHeartbeatMs:maxHeartbeat,stoppedDuringCallback:true});await window.slowProgress(language+' slow callback interruption '+cycle+': PASS');
    }
    return {language,cycles,passed:true};
   }finally{clearInterval(heartbeat);scene.stop();l.reset();}
  },{language,code:programs[language]});
  reports.push(result);assert(result.passed);await mkdir('artifacts/audit',{recursive:true});await writeFile('artifacts/audit/slow-sensor-'+language+'.json',JSON.stringify(result,null,2));
 }
}finally{await browser.close();}
