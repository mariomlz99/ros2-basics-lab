import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true});
try{
 const page=await browser.newPage();await page.goto(process.env.LAB_URL||'http://127.0.0.1:8033/ros2-basics-lab/');
 await page.exposeFunction('auditProgress',s=>console.log(s));
 const reports=[];
 for(const language of ['python','cpp']){
  const result=await page.evaluate(async language=>{
   const base=document.querySelector('script[type=module]').src,{Lab}=await import(new URL('lab.js',base)),{ROOT,setup,cmake}=await import(new URL('workspace.js',base));
   const l=new Lab(),t=l.terminal(),other=l.terminal(),output=[],checks=[];t.output=s=>output.push(s);
   const ok=(value,label)=>{if(!value)throw Error(label+' '+output.slice(-5).join('\n'));checks.push(label);};
   const fail=async(line,pattern)=>{try{await t.execute(line);}catch(e){ok(pattern.test(e.message),'reject '+line);return e.message;}throw Error('Unexpected success '+line);};
   const wait=async fn=>{for(let i=0;i<1200;i++){if(fn())return;await new Promise(r=>setTimeout(r,100));}throw Error('Timeout '+output.slice(-8).join('\n'));};
   const run=async expected=>{output.length=0;await t.execute('ros2 run causality probe');await wait(()=>!l.processes.active().length);l.stop(t.id);ok(output.some(x=>x.includes(expected)),'run installed '+expected);};
   const source=label=>language==='python'?`def main():\n    print('${label}')\n`:`#include <iostream>\nint main(){std::cout<<"${label}"<<std::endl;}\n`;
   try{
    await t.execute('mkdir -p ~/ros2_ws/src');await t.execute('cd ~/ros2_ws/src');
    await t.execute('ros2 pkg create causality --build-type '+(language==='python'?'ament_python':'ament_cmake')+' --node-name probe');
    const path=ROOT+'/src/causality/'+(language==='python'?'causality/probe.py':'src/probe.cpp');l.fs.write(path,source('OLD'));
    await t.execute('colcon build');ok(l.fs.exists(ROOT+'/src/install/causality/package.xml')===false&&l.fs.exists(ROOT+'/src/install/causality/share/causality/package.xml'),'wrong-directory build installs in actual cwd');
    await fail('ros2 run causality probe',/not found/);await t.execute('source install/setup.bash');await run('OLD');
    await t.execute('cd ..');await t.execute('rm -r src/build src/install src/log');
    await t.execute('unset AMENT_PREFIX_PATH COLCON_PREFIX_PATH');await t.execute('source /opt/ros/jazzy/setup.bash');
    await t.execute('colcon build');await t.execute('source install/setup.bash');
    l.fs.write(path,source('NEW'));await run('OLD');
    l.fs.write(path,language==='python'?'def main(:':'int main(){invalid_cpp;}');await fail('colcon build',/SyntaxError|error:/);await run('OLD');
    l.fs.write(path,source('NEW'));await t.execute('colcon build --packages-select causality');await run('NEW');
    for(const dir of ['build','log']){await t.execute('rm -rf '+dir);await run('NEW');await t.execute('colcon build --packages-select causality');ok(l.fs.exists(ROOT+'/'+dir),'recreate '+dir);}
    await t.execute('cp -r src/causality src/duplicate');await fail('colcon build',/Duplicate package name/);await t.execute('rm -r src/duplicate');
    await fail('colcon build --packages-select causality --merge-install',/Supported: colcon/);
    if(language==='python'){
     const cfg=ROOT+'/src/causality/setup.cfg';l.fs.write(cfg,l.fs.read(cfg).replaceAll('=$base',' = $base'));
     l.fs.write(ROOT+'/src/causality/setup.py',setup('causality',['probe = causality.absent:main']));await t.execute('colcon build');
     output.length=0;await t.execute('ros2 run causality probe');await wait(()=>!l.processes.active().length);l.stop(t.id);ok(output.some(x=>x.includes('ModuleNotFoundError')),'missing entry module fails at execution');
     l.fs.write(ROOT+'/src/causality/setup.py',setup('causality',[]));await t.execute('colcon build');await fail('ros2 run causality probe',/executable/i);
     l.fs.write(ROOT+'/src/causality/setup.py',setup('causality',['probe = causality.probe:main']));
    }else{
     l.fs.write(ROOT+'/src/causality/CMakeLists.txt',cmake('causality',{probe:'src/probe.cpp'}).replace('install(TARGETS probe DESTINATION lib/${PROJECT_NAME})',''));await t.execute('colcon build');await fail('ros2 run causality probe',/executable/i);
     l.fs.write(ROOT+'/src/causality/CMakeLists.txt',cmake('causality',{probe:'src/probe.cpp'}));
    }
    await t.execute('colcon build');await run('NEW');
    await t.execute('rm -r install');
    let rejected=false;try{await other.execute('source ~/ros2_ws/install/setup.bash');}catch{rejected=true;}ok(rejected,'deleted install cannot be sourced in new terminal');
    await fail('ros2 run causality probe',/not found/);await t.execute('colcon build');await t.execute('source install/setup.bash');await run('NEW');
    await t.execute('rm -r src');await run('NEW');ok((await t.execute('colcon build')).includes('0 packages finished'),'deleted source is not rediscovered');
    await t.execute('mkdir src');ok(l.fs.exists(ROOT+'/src'),'recreate source directory');
    return {language,passed:true,checks};
   }catch(error){return {language,passed:false,checks,error:error.message};}finally{l.reset();}
  },language);
  reports.push(result);console.log(JSON.stringify(result));
 }
 await mkdir('artifacts/audit',{recursive:true});await writeFile('artifacts/audit/build-causality.json',JSON.stringify(reports,null,2));assert(reports.every(r=>r.passed));
}finally{await browser.close();}
