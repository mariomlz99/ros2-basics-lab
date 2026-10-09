import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true});
try{
 const page=await browser.newPage();await page.goto(process.env.LAB_URL||'http://127.0.0.1:8017/ros2-basics-lab/');
 const result=await page.evaluate(async()=>{
  const base=document.querySelector('script[type="module"]').src,{Lab}=await import(new URL('lab.js',base));
  let course;try{course=await import(new URL('course.js',base));}catch{course=await import(new URL('units.js',base));}const lesson=course.lesson||course.unit;
  const sleep=ms=>new Promise(r=>setTimeout(r,ms)),until=async check=>{const end=Date.now()+180000;while(!check()){if(Date.now()>end)throw Error('Timed out waiting for package output');await sleep(100);}};
  const results=[];
  for(const language of ['python','cpp']){
   const logs=[],lab=new Lab(),t=lab.terminal();t.output=s=>logs.push(s);
   const command=async line=>{try{const out=await t.execute(line);if(out)logs.push(out);}catch(e){if(line==='ros2 run my_first_package hello'&&!t.env.AMENT_PREFIX_PATH.includes('/home/student/ros2_ws/install')){logs.push(e.message);return;}throw e;}};
   const files=step=>{for(const [path,source]of Object.entries(step.items)){const target=lab.workspace.sourcePath(step.pkg)+'/'+path;lab.fs.mkdir(target.slice(0,target.lastIndexOf('/')),true);lab.fs.write(target,source);}};
   try{
    for(const step of lesson(2,language)){
     if(step.kind==='files')files(step);
     if(step.kind==='commands')for(const line of step.commands){await command(line);if(line==='ros2 run my_first_package hello'&&t.busy){await until(()=>logs.includes('Hi from my_first_package.'));lab.stop(t.id);}}
    }
    if(!logs.includes('Hi from my_first_package.'))throw Error(language+' greeting mismatch');
    for(const step of lesson(3,language)){
     if(step.kind==='files')files(step);
     if(step.kind==='commands')for(const line of step.commands){if(line.startsWith('ros2 run '))break;await command(line);}
     if(step.kind==='commands'&&step.commands.some(line=>line.startsWith('ros2 run ')))break;
    }
    const executables=await t.execute('ros2 pkg executables my_first_package');if(executables.includes('hello'))throw Error('Stale hello executable survived');
    if(!executables.includes('talker')||!executables.includes('listener'))throw Error(executables);
    const subscriber=lab.terminal();subscriber.output=s=>logs.push(s);await subscriber.execute('source ~/ros2_ws/install/setup.bash');await subscriber.execute('ros2 run my_first_package listener');await t.execute('ros2 run my_first_package talker');await until(()=>logs.some(s=>s.includes('I heard:')));lab.stop(t.id);lab.stop(subscriber.id);
    if(language==='python'){
     const path=lab.workspace.sourcePath('my_first_package')+'/my_first_package/talker.py',source='import numpy as np\ndef main():\n    print(np.concatenate(([1, 2], [3, 4])))\n';
     lab.fs.write(path,source);await command('colcon build');await command('ros2 run my_first_package talker');await until(()=>logs.some(s=>s.includes('[1 2 3 4]')));lab.stop(t.id);
     lab.fs.write(path,source.replace('np.concatenate(([1, 2], [3, 4]))','np.concatenate()'));await command('colcon build');await command('ros2 run my_first_package talker');await until(()=>logs.some(s=>s.includes('TypeError')&&s.includes('concatenate')));lab.stop(t.id);
    }
    results.push({language,greeting:'Hi from my_first_package.',executables,numpy:language==='python'?logs.filter(s=>s.includes('[1 2 3 4]')||s.includes('TypeError')):undefined});
   }finally{lab.reset();}
  }return results;
 });
 assert.equal(result.length,2);console.log('PASS browser lesson 3 greeting, lesson 4 same-package recreation and real pub/sub, NumPy success/error:',JSON.stringify(result));
}finally{await browser.close();}
