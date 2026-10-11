import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {chromium} from 'playwright-core';
import {Workspace,ROOT} from '../src/workspace.js';
import {FileSystem} from '../src/fs.js';
const source='import numpy as np\nprint("%d", 1)\ndef main():\n    print("Hi from my_first_package.")\n    np.concatenate()\n';
const commands=['mkdir -p ~/ros2_ws/src','cd ~/ros2_ws/src','ros2 pkg create --build-type ament_python --node-name hello my_first_package','cd ..','colcon build','source install/setup.bash','ros2 run my_first_package hello'];
const fs=new FileSystem();fs.mkdir(ROOT+'/src',true);const workspace=new Workspace(fs);workspace.create('my_first_package','ament_python',{node:'hello'});fs.write(ROOT+'/src/my_first_package/my_first_package/hello.py',source);
const root=mkdtempSync('/tmp/python-build-parity-');
for(const [file,content]of Object.entries(workspace.inspect('my_first_package').files)){const target=path.join(root,'src/my_first_package',file);mkdirSync(path.dirname(target),{recursive:true});writeFileSync(target,content);}
const native=command=>spawnSync('bash',['-c','source /opt/ros/jazzy/setup.bash\n'+command],{cwd:root,encoding:'utf8'});
const built=native('colcon build');assert.equal(built.status,0,built.stdout+built.stderr);assert.doesNotMatch(built.stdout,/%d 1|Hi from/);
const ran=native('source install/setup.bash\nros2 run my_first_package hello');assert.notEqual(ran.status,0);assert.match(ran.stdout,/%d 1\nHi from/);assert.match(ran.stderr,/TypeError:.*concatenate/);
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true});
try{
 const page=await browser.newPage();await page.goto(process.env.LAB_URL||'http://127.0.0.1:8017/ros2-basics-lab/');
 const result=await page.evaluate(async({commands,source})=>{
  const base=document.querySelector('script[type="module"]').src,{Lab}=await import(new URL('lab.js',base));const lab=new Lab(),t=lab.terminal(),logs=[];t.output=s=>logs.push(s);
  try{
   for(const command of commands.slice(0,4))await t.execute(command);
   lab.fs.write('/home/student/ros2_ws/src/my_first_package/my_first_package/hello.py',source);
   const build=await t.execute(commands[4]);const buildLogs=[...logs,build].join('\n');logs.length=0;
   await t.execute(commands[5]);await t.execute(commands[6]);
   const deadline=Date.now()+120000;while(!logs.some(s=>s.includes('TypeError'))){if(Date.now()>deadline)throw Error(logs.join('\n'));await new Promise(r=>setTimeout(r,100));}
   return {build:buildLogs,run:logs.join('\n')};
  }finally{lab.reset();}
 },{commands,source});
 assert.match(result.build,/1 package finished/);assert.doesNotMatch(result.build,/%d 1|Hi from|Loading numpy|Loaded numpy|pyparsing|setuptools/);
 assert.match(result.run,/%d 1\nHi from/);assert.match(result.run,/TypeError:[\s\S]*concatenate/);assert.doesNotMatch(result.run,/pyparsing|setuptools/);
 console.log('PASS native Jazzy and browser: build has no module side effects/dependency loading; run prints once and reports NumPy TypeError.');
 console.log(JSON.stringify(result));
}finally{await browser.close();}
