import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {nestedPrograms} from './runtime-behavior-fixtures.mjs';
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true});
const reports=[];
try{
 const page=await browser.newPage();await page.goto(process.env.LAB_URL||'http://127.0.0.1:8033/ros2-basics-lab/');
 for(const language of (process.env.LAB_LANGUAGE||'python,cpp').split(',')){
  const result=await page.evaluate(async({language,code})=>{
   const base=document.querySelector('script[type=module]').src,{Lab}=await import(new URL('lab.js',base)),{ROOT}=await import(new URL('workspace.js',base));
   const l=new Lab(),t=l.terminal(),inspect=l.terminal(),output=[];t.output=s=>output.push(s);
   const until=async(fn,label)=>{for(let i=0;i<1200;i++){if(fn())return;await new Promise(r=>setTimeout(r,100));}throw Error(label+' '+output.slice(-8).join('\n'));};
   try{
    await t.execute('mkdir -p ~/ros2_ws/src');await t.execute('cd ~/ros2_ws/src');
    await t.execute('ros2 pkg create nested_pkg --build-type '+(language==='python'?'ament_python':'ament_cmake')+' --node-name probe --dependencies '+(language==='python'?'rclpy':'rclcpp')+' nav_msgs geometry_msgs');
    l.fs.write(ROOT+'/src/nested_pkg/'+(language==='python'?'nested_pkg/probe.py':'src/probe.cpp'),code);
    await t.execute('cd ..');await t.execute('colcon build');await t.execute('source install/setup.bash');await t.execute('ros2 run nested_pkg probe');
    await until(()=>output.some(x=>x.includes('NESTED_MESSAGE_OK'))&&output.some(x=>x.includes('NESTED_SERVICE_OK')),'Nested types');
    const before=await inspect.execute('ros2 service type /plan');
    await inspect.execute('ros2 param set /nested_probe phase 1');await until(()=>output.includes('CLEANUP_OK'),'Cleanup');
    await until(()=>!l.runtime.services.size&&!l.runtime.listeners.size&&!l.runtime.jobs.size,'Service/timer/subscription leaks');
    const count=output.filter(x=>x.includes('NESTED_MESSAGE_OK')).length;await new Promise(r=>setTimeout(r,700));
    if(output.filter(x=>x.includes('NESTED_MESSAGE_OK')).length!==count)throw Error('Callback after cleanup');
    if(l.processes.active().length!==1)throw Error('Cleanup must preserve the live node');
    l.stop(t.id);if(l.runtime.nodes.size||l.runtime.jobs.size||l.runtime.listeners.size||l.runtime.parameters.size)throw Error('Stop leaked resources');
    return {language,passed:true,before,output};
   }finally{l.reset();}
  },{language,code:nestedPrograms[language]});
  reports.push(result);console.log(language,JSON.stringify(result));assert(result.passed);
 }
 await mkdir('artifacts/audit',{recursive:true});
 await writeFile('artifacts/audit/nested-runtime.json',JSON.stringify(reports,null,2));
 for(const [language,code]of Object.entries(nestedPrograms))await writeFile('artifacts/audit/nested-probe.'+(language==='python'?'py':'cpp'),code);
}finally{await browser.close();}
