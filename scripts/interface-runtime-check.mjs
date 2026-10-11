// All registered message/service bindings, exercised in the actual workers.
import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {writeFile,mkdir} from 'node:fs/promises';
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true});
try{
 const page=await browser.newPage();await page.goto(process.env.LAB_URL||'http://127.0.0.1:8033/ros2-basics-lab/');
 await page.exposeFunction('auditProgress',s=>console.log(s));
 const result=await page.evaluate(async()=>{
  const base=document.querySelector('script[type=module]').src,{Lab}=await import(new URL('lab.js',base)),{ROOT,setup,cmake}=await import(new URL('workspace.js',base));
  const lab=new Lab(),t=lab.terminal(),schema=lab.workspace.registry.schema(),interfaces=Object.entries(schema).filter(([n])=>!n.includes('/action/')),logs=[];t.output=s=>logs.push(s);
  const until=async fn=>{for(let i=0;i<1800;i++){if(fn())return;await new Promise(r=>setTimeout(r,100));}throw Error('Timeout: '+logs.slice(-10).join('\n'));};
  const snake=s=>s.replace(/([A-Z]+)([A-Z][a-z])/g,'$1_$2').replace(/([a-z0-9])([A-Z])/g,'$1_$2').toLowerCase();
  const cpp=interfaces.map(([n])=>{const[p,k,t]=n.split('/');return '#include <'+p+'/'+k+'/'+snake(t)+'.hpp>';}).join('\n')+'\n#include <iostream>\nint main(){\n'+interfaces.map(([n,r],i)=>{const type=n.replaceAll('/','::');return r.response?`${type}::Request request${i}; ${type}::Response response${i};`:`${type} message${i};`;}).join('\n')+'\ngeometry_msgs::msg::Pose pose; if(pose.orientation.w != 1.0) return 1;\nstd::cout << "BINDINGS_OK '+interfaces.length+'" << std::endl;\n}\n';
  const python='import importlib\ndef main():\n'+interfaces.flatMap(([n,r],i)=>{const[p,k,t]=n.split('/');return [`    cls${i} = getattr(importlib.import_module('${p}.${k}'), '${t}')`,...(r.response?[`    cls${i}.Request()`,`    cls${i}.Response()`]:[`    cls${i}()`])];}).join('\n')+`\n    from geometry_msgs.msg import Pose\n    assert Pose().orientation.w == 1.0\n    print('BINDINGS_OK ${interfaces.length}')\n`;
  const results=[];
  try{
   await t.execute('mkdir -p ~/ros2_ws/src');
   for(const language of ['python','cpp']){
    const name='all_'+language,dependencies=[...new Set(interfaces.map(([n])=>n.split('/')[0]))];lab.workspace.create(name,language==='python'?'ament_python':'ament_cmake',{dependencies});
    const code=language==='python'?python:cpp;lab.fs.write(ROOT+'/src/'+name+'/'+(language==='python'?name+'/probe.py':'src/probe.cpp'),code);
    lab.fs.write(ROOT+'/src/'+name+'/'+(language==='python'?'setup.py':'CMakeLists.txt'),language==='python'?setup(name,['probe = '+name+'.probe:main']):cmake(name,{probe:'src/probe.cpp'},dependencies));
    await t.execute('cd ~/ros2_ws');await t.execute('colcon build --packages-select '+name);await t.execute('source install/setup.bash');logs.length=0;
    await t.execute('ros2 run '+name+' probe');await until(()=>lab.processes.active().length===0);lab.stop(t.id);
    if(!logs.some(s=>s.includes('BINDINGS_OK '+interfaces.length)))throw Error(language+': '+logs.join('\n'));
    results.push({language,interfaces:interfaces.length,passed:true});await window.auditProgress('PASS '+language+' imports/types and constructors for '+interfaces.length+' standard message/service interfaces');
   }
   return {results,cpp,python};
  }finally{lab.reset();}
 });
 assert(result.results.every(r=>r.passed));await mkdir('artifacts/audit',{recursive:true});await writeFile('artifacts/audit/all-interfaces.cpp',result.cpp);await writeFile('artifacts/audit/all_interfaces.py',result.python+'\nmain()\n');await writeFile('artifacts/audit/interfaces.json',JSON.stringify(result.results,null,2));
}finally{await browser.close();}
