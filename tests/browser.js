import{Lab}from'../src/lab.js';import{ROOT}from'../src/workspace.js';import{pubsubFiles}from'../src/examples.js';
const out=document.querySelector('#result'),lab=new Lab();let log=[];lab.onOutput=(id,s)=>{log.push([id,s]);};const wait=ms=>new Promise(r=>setTimeout(r,ms));const assert=(v,s)=>{if(!v)throw Error(s);};
async function until(fn,label,seconds=180){for(let i=0;i<seconds*10;i++){if(fn())return;await wait(100);}throw Error('Timeout '+label+' '+JSON.stringify(log.slice(-15)));}
async function report(s){out.textContent+='\n'+s;await fetch('/progress',{method:'POST',body:s});}
const a=lab.terminal(),b=lab.terminal(),c=lab.terminal();
try{
 await a.execute('mkdir -p ~/ros2_ws/src');await a.execute('cd ~/ros2_ws/src');
 for(const language of ['python','cpp']){const name=language==='python'?'py_pubsub':'cpp_pubsub';await a.execute(`ros2 pkg create --build-type ${language==='python'?'ament_python':'ament_cmake'} --license Apache-2.0 ${name} --dependencies ${language==='python'?'rclpy':'rclcpp'} std_msgs`);for(const[path,source]of Object.entries(pubsubFiles(language)))lab.fs.write(ROOT+'/src/'+name+'/'+path,source);await a.execute('cd ~/ros2_ws');await a.execute('colcon build --packages-select '+name);await report('PASS real '+language+' build');await a.execute('cd src');}
 await a.execute('cd ~/ros2_ws');let failed=false;try{await a.execute('ros2 run py_pubsub talker');}catch(e){failed=/not found/.test(e.message);}assert(failed,'Unsourced package must fail');for(const t of[a,b,c])await t.execute('source ~/ros2_ws/install/setup.bash');
 await a.execute('ros2 run py_pubsub talker');await b.execute('ros2 run cpp_pubsub listener');await until(()=>log.some(([id,s])=>id===b.id&&s.includes('I heard:')),'Python to C++');await report('PASS Python → C++ actual pub/sub');
 lab.stop(a.id);lab.stop(b.id);assert(lab.runtime.nodes.size===0,'Stop removes nodes');log=[];
 await a.execute('ros2 run cpp_pubsub talker');await b.execute('ros2 run py_pubsub listener');await until(()=>log.some(([id,s])=>id===b.id&&s.includes('I heard:')),'C++ to Python');await report('PASS C++ → Python actual pub/sub');await c.execute('ros2 topic echo /topic');assert(lab.runtime.topics.get('/topic').subscribers.size===2,'echo subscription');lab.stop(c.id);assert(lab.runtime.topics.get('/topic').subscribers.size===1,'echo cleanup');lab.stop(a.id);lab.stop(b.id);assert(lab.runtime.jobs.size===0,'Timer cleanup');
 await report('PASS stop, echo, timer cleanup');out.textContent='PASS real runtime suite';await fetch('/done',{method:'POST',body:out.textContent});
}catch(e){out.textContent='FAIL '+e.stack+'\n'+JSON.stringify(log.slice(-10));await fetch('/done',{method:'POST',body:out.textContent});}finally{lab.reset();}
