import{Lab}from'../src/lab.js';import{ROOT,setup,cmake}from'../src/workspace.js';import{pubsubFiles,customFiles,statusFiles,parameterTalker,cppParameterTalker,serviceFiles,launchSource}from'../src/examples.js';
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
 await report('PASS stop, echo, timer cleanup');
 await a.execute('cd ~/ros2_ws/src');await a.execute('ros2 pkg create --build-type ament_cmake tutorial_interfaces');
 for(const[p,source]of Object.entries(customFiles())){const full=ROOT+'/src/tutorial_interfaces/'+p;lab.fs.mkdir(full.slice(0,full.lastIndexOf('/')),true);lab.fs.write(full,source);}
 await a.execute('cd ~/ros2_ws');await a.execute('colcon build --packages-select tutorial_interfaces');
 for(const language of ['python','cpp']){
  const name=language==='python'?'py_pubsub':'cpp_pubsub';for(const[p,source]of Object.entries(statusFiles(language)))lab.fs.write(ROOT+'/src/'+name+'/'+p,source);
  lab.fs.write(ROOT+'/src/'+name+'/'+(language==='python'?name+'/talker.py':'src/publisher_member_function.cpp'),language==='python'?parameterTalker:cppParameterTalker);
  await a.execute('colcon build --packages-select '+name);log=[];await a.execute('ros2 run '+name+' status');await until(()=>lab.runtime.topics.has('/student_status'),'custom '+language);await b.execute('ros2 topic echo /student_status');await until(()=>log.some(([id,s])=>id===b.id&&s.includes('Ada')),'custom message delivery');lab.stop(a.id);lab.stop(b.id);await report('PASS generated '+language+' StudentStatus');
  log=[];await a.execute('ros2 run '+name+' talker');await until(()=>lab.runtime.parameters.get('/talker')?.has('message_prefix'),'parameters');await b.execute('ros2 param set /talker message_prefix Ciao');await until(()=>log.some(([,s])=>s.includes('Ciao')),'live parameter');lab.stop(a.id);await report('PASS live '+language+' parameter');
  await a.execute('cd ~/ros2_ws/src');const pkg=language==='python'?'py_service':'cpp_service';await a.execute(`ros2 pkg create --build-type ${language==='python'?'ament_python':'ament_cmake'} ${pkg} --dependencies ${language==='python'?'rclpy':'rclcpp'} example_interfaces`);for(const[p,source]of Object.entries(serviceFiles(language)))lab.fs.write(ROOT+'/src/'+pkg+'/'+p,source);await a.execute('cd ~/ros2_ws');await a.execute('colcon build --packages-select '+pkg);log=[];await a.execute('ros2 run '+pkg+' server');await until(()=>lab.runtime.services.has('/add_two_ints'),'service server');assert(JSON.parse(await b.execute("ros2 service call /add_two_ints example_interfaces/srv/AddTwoInts '{a: 7, b: 8}'")).sum===15,'CLI sum');await b.execute('ros2 run '+pkg+' client');await until(()=>log.some(([id,s])=>id===b.id&&s.includes('Sum: 5')),'client sum');lab.stop(a.id);lab.stop(b.id);assert(lab.runtime.services.size===0,'Service cleanup');await report('PASS '+language+' service and client');
  lab.fs.mkdir(ROOT+'/src/'+name+'/launch',true);lab.fs.write(ROOT+'/src/'+name+'/launch/system.launch.py',launchSource(name));lab.fs.write(ROOT+'/src/'+name+'/'+(language==='python'?'setup.py':'CMakeLists.txt'),language==='python'?setup(name,[`talker = ${name}.talker:main`,`listener = ${name}.listener:main`],['launch/system.launch.py']):cmake(name,{talker:'src/publisher_member_function.cpp',listener:'src/subscriber_member_function.cpp'},['rclcpp','std_msgs','tutorial_interfaces'],true));await a.execute('colcon build --packages-select '+name);log=[];await a.execute('ros2 launch '+name+' system.launch.py');await until(()=>log.some(([,s])=>s.includes('I heard:')&&s.includes('Launched')),'launch remap and parameter');lab.stop(a.id);assert(lab.runtime.nodes.size===0&&lab.runtime.jobs.size===0,'Launch group cleanup');await report('PASS '+language+' launch processes, remapping, parameters and cleanup');
 }
 // Failed real compilers must never leave runnable packages behind.
 for(const [pkg,file,bad,pattern] of [
  ['py_pubsub','py_pubsub/talker.py','def broken(:\n',/SyntaxError|invalid syntax/],
  ['cpp_pubsub','src/publisher_member_function.cpp','#include <std_msgs/msg/string.hpp>\nint main(){std_msgs::msg::String msg; msg.dtaa = "bad";}\n',/dtaa/],
 ]){
  const path=ROOT+'/src/'+pkg+'/'+file,original=lab.fs.read(path);lab.fs.write(path,bad);
  let error;try{await a.execute('colcon build --packages-select '+pkg);}catch(e){error=e;}
  assert(error&&pattern.test(error.message),'Authentic diagnostic for '+pkg+': '+error);
  assert(!lab.workspace.installed.has(pkg),'Failed build must not install '+pkg);
  lab.fs.write(path,original);await report('PASS real compiler failure leaves '+pkg+' unavailable');
 }
 lab.reset();assert(lab.runtime.nodes.size===0&&lab.runtime.jobs.size===0&&lab.processes.active().length===0,'Reset cleanup');
 await report('PASS workspace reset removes all processes');
 out.textContent='PASS real runtime suite';await fetch('/done',{method:'POST',body:out.textContent});
}catch(e){out.textContent='FAIL '+e.stack+'\n'+JSON.stringify(log.slice(-10));await fetch('/done',{method:'POST',body:out.textContent});}finally{lab.reset();}
