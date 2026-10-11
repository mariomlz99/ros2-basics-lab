import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const {cases}=JSON.parse(readFileSync(new URL('../tests/fixtures/native-cmake-templates.json',import.meta.url)));
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true});
try{
 const page=await browser.newPage();await page.goto(process.env.LAB_URL||'http://127.0.0.1:8031/ros2-basics-lab/');
 for(const sample of cases){
  const result=await page.evaluate(async sample=>{
   const base=document.querySelector('script[type="module"]').src,{Lab}=await import(new URL('lab.js',base));
   const lab=new Lab(),terminal=lab.terminal(),output=[];terminal.output=line=>output.push(line);
   try{
    await terminal.execute('mkdir -p ~/ros2_ws/src');await terminal.execute('cd ~/ros2_ws/src');
    await terminal.execute(sample.command);
    const cmake=lab.fs.read(terminal.cwd+'/'+sample.name+'/CMakeLists.txt');
    const build=await terminal.execute('colcon build');await terminal.execute('cd ..');
    let wrongSetup=false;try{await terminal.execute('source install/setup.bash');}catch{wrongSetup=true;}
    await terminal.execute('source src/install/setup.bash');
    if(sample.node){
     await terminal.execute('ros2 run '+sample.name+' hello');
     const deadline=Date.now()+120000;
     while(!output.join('\n').includes('hello world '+sample.name+' package')){
      if(Date.now()>deadline)throw Error(output.join('\n'));await new Promise(resolve=>setTimeout(resolve,100));
     }
    }
    return {cmake,build,wrongSetup};
   }finally{lab.reset();}
  },sample);
  assert.equal(result.cmake,sample.cmake);assert.match(result.build,/1 package finished/);assert(result.wrongSetup);
  console.log('PASS browser native template, build/install/source'+(sample.node?' and real C++ hello':'')+': '+sample.name);
 }
}finally{await browser.close();}
