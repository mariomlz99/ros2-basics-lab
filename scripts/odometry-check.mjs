import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true});
const standalone=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8')).name==='ros2-basics-lab';
const url=process.env.LAB_URL||(standalone?'http://127.0.0.1:8017/ros2-basics-lab/':'http://127.0.0.1:8017/basics.html');
await mkdir('artifacts/odometry',{recursive:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1050}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
 await page.goto(url);
 await page.evaluate(async()=>{const base=document.querySelector('script[src*="/app.js"]').src,{Playground}=await import(new URL('playground/playground.js',base)),start=Playground.prototype.start;Playground.prototype.start=function(){window.odomScene=this;return start.call(this);};});
 await page.locator('#start').click();await page.locator('.xterm').waitFor();
 const tf=await page.locator('#exercise-nav button[data-index="9"]').count();
 await page.locator(`#exercise-nav button[data-index="${tf?9:7}"]`).click();
 await page.locator('[data-exercise="odometry"]').click();
 await page.locator(tf?'#tf-start':'#playground-start').click();
 const notebook=page.locator('.odom-notebook:visible');
 const advance=async(v,w,ticks=40)=>page.evaluate(async({v,w,ticks})=>{const s=window.odomScene;clearInterval(s.timer);s.robot.command(v,w);for(let i=0;i<ticks;i++){s.step();if(i%5===4)await new Promise(requestAnimationFrame);}s.robot.command(0,0);s.timer=setInterval(()=>s.step(),50);}, {v,w,ticks});
 await notebook.locator('[data-odom="distance"]').filter({hasText:'0.000'}).waitFor();
 await advance(.2,0);await page.waitForTimeout(100);assert.match(await notebook.locator('[data-odom="distance"]').textContent(),/0.400/);
 await advance(-.2,0);await page.waitForTimeout(100);assert.match(await notebook.locator('[data-odom="distance"]').textContent(),/0.800/);assert.match(await notebook.locator('[data-odom="displacement"]').textContent(),/0.000/);
 await advance(0,Math.PI/4);await page.waitForTimeout(100);assert.match(await notebook.locator('[data-odom="yaw"]').textContent(),/90.0/);
 await advance(.2,.4,30);await page.waitForTimeout(100);
 await notebook.screenshot({path:'artifacts/odometry/notebook-desktop.png'});
 await page.evaluate(()=>{const r=window.odomScene.runtime;for(let i=0;i<150;i++)r.publish('/rosout','rcl_interfaces/msg/Log',r.registry.defaultMessage('rcl_interfaces/msg/Log'),{node:'/gap_probe'});});
 await notebook.locator('.odom-status').filter({hasText:'sample gap'}).waitFor();
 await notebook.locator('.odom-mark').click();assert.match(await notebook.locator('[data-odom="distance"]').textContent(),/0.000/);
 await page.locator(tf?'#tf-reset-pose':'#playground-reset').click();await page.waitForTimeout(150);assert.match(await notebook.locator('[data-odom="pose"]').textContent(),/x 0.000 · y 0.000/);
 for(const width of [1440,820,390,320]){await page.setViewportSize({width,height:1050});await page.waitForTimeout(150);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Overflow at '+width);}
 await notebook.screenshot({path:'artifacts/odometry/notebook-mobile.png'});
 for(const locale of await page.locator('#locale option').evaluateAll(options=>options.map(o=>o.value).filter(v=>v!=='en'))){await page.locator('#locale').selectOption(locale);await page.waitForTimeout(80);assert.notEqual(await notebook.locator('h2').textContent(),'How far is “back where you started”?');assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Localized overflow: '+locale);}
 await page.locator('#locale').selectOption('en');
 await page.locator('#theme').selectOption('dark');await notebook.screenshot({path:'artifacts/odometry/notebook-dark.png'});
 await page.locator(tf?'#tf-stop':'#playground-stop').click();await page.waitForTimeout(100);assert.match(await notebook.locator('.odom-status').textContent(),/Paused/);
 await page.locator('#nav button').first().click();assert.equal(await page.evaluate(()=>window.odomScene.runtime.listeners.size),0);
 console.log('PASS visible odometry notebook, out/back, turn, arc, mark/reset, four widths and cleanup');
 await page.exposeFunction('odomProgress',text=>console.log(text));
 const result=await page.evaluate(async()=>{
  const base=document.querySelector('script[src*="/app.js"]').src;
  const {ROOT}=await import(new URL('workspace.js',base)),{Lab}=await import(new URL('lab.js',base)),{Playground}=await import(new URL('playground/playground.js',base)),{odometryExercise,odometryFiles}=await import(new URL('playground/odometry-lesson.js',base));
  const cases=[],assert=(ok,msg)=>{if(!ok)throw Error(msg);};
  const until=async(fn,label)=>{for(let i=0;i<2400;i++){if(fn())return;await new Promise(r=>setTimeout(r,50));}throw Error(label);};
  for(const language of ['python','cpp']){
   const output=[],lab=new Lab({onOutput:(id,text)=>output.push(text)}),terminals=[lab.terminal(),lab.terminal()];
   const scene=new Playground(lab.runtime,document.createElement('canvas'),document.createElement('canvas'));
   try{
    scene.start();
    const fail=async(command,pattern)=>{try{await terminals[1].execute(command);throw Error('Unexpected success: '+command);}catch(e){assert(pattern.test(e.message),command+': '+e.message);}};
    await fail('ros2 topic echo /odom --once --field pose.position',/Invalid field/);
    for(const step of odometryExercise(language).steps){
     if(step.kind==='terminal-action')lab.stop(terminals[step.terminal-1].id);
     if(step.kind==='files')for(const [path,source]of Object.entries(step.items)){const full=ROOT+'/src/odom_lab/'+path;lab.fs.mkdir(full.slice(0,full.lastIndexOf('/')),true);lab.fs.write(full,source);}
     if(step.kind==='commands')for(const command of step.commands){
      const terminal=terminals[step.terminal-1];await terminal.execute(command);
      if(command.includes('pub --rate'))await new Promise(r=>setTimeout(r,150));
      else if(command.startsWith('ros2 run ')){await until(()=>output.some(s=>/x=.*y=.*yaw=.*v=/.test(s)),language+' reader output: '+output.slice(-10));}
      else await until(()=>!terminal.busy,command);
     }
    }
    await fail('ros2 run odom_lab reader',/not found/);
    scene.stop();await terminals[0].execute('ros2 run odom_lab reader');
    const known=lab.runtime.registry.complete('nav_msgs/msg/Odometry',{header:{frame_id:'odom'},child_frame_id:'base_link',pose:{pose:{position:{x:.4,y:-.2},orientation:{z:Math.SQRT1_2,w:Math.SQRT1_2}}},twist:{twist:{linear:{x:.2}}}});
    await until(()=>{lab.runtime.publish('/odom','nav_msgs/msg/Odometry',known,{node:'/native_parity_fixture'});return output.some(s=>s.includes('x=0.400 y=-0.200 yaw=1.571 v=0.200'));},language+' numerical native parity');lab.stop(terminals[0].id);
    const path=ROOT+'/src/odom_lab/'+(language==='python'?'odom_lab/reader.py':'src/reader.cpp');
    assert(lab.fs.exists(ROOT+'/install/odom_lab/share/odom_lab/package.xml'),'Missing workspace installation');
    assert(!lab.fs.exists('/opt/ros/jazzy/share/odom_lab/package.xml'),'Student package leaked into underlay');
    assert(lab.fs.read(path)===odometryFiles(language)[path.split('/odom_lab/').slice(1).join('/odom_lab/')],'Source changed');
    // Preserve the native consequence of building from src, in a fresh lab.
    const wrong=new Lab(),w=wrong.terminal();try{
     await w.execute('mkdir -p ~/ros2_ws/src');await w.execute('cd ~/ros2_ws/src');
     await w.execute(`ros2 pkg create --build-type ${language==='python'?'ament_python':'ament_cmake'} --license Apache-2.0 odom_lab --dependencies ${language==='python'?'rclpy':'rclcpp'} nav_msgs`);
     for(const [path,source]of Object.entries(odometryFiles(language)))wrong.fs.write(ROOT+'/src/odom_lab/'+path,source);
     await w.execute('colcon build --packages-select odom_lab');assert(wrong.fs.exists(ROOT+'/src/install/setup.bash'),'Wrong-directory install missing');assert(!wrong.fs.exists(ROOT+'/install/setup.bash'),'Wrong-directory build moved itself');
    }finally{wrong.reset();}
    cases.push({language,commands:odometryExercise(language).steps.filter(s=>s.kind==='commands').flatMap(s=>s.commands),output:output.filter(s=>/x=.*y=.*yaw=.*v=/.test(s)).slice(-3)});
    await window.odomProgress('PASS '+language+' all odometry lesson commands, real build/reader, nested-field and overlay failures');
   }finally{scene.stop();lab.reset();}
  }
  return cases;
 });
 assert.deepEqual(errors,[]);await writeFile('artifacts/odometry/browser.json',JSON.stringify(result,null,2));
}finally{await browser.close();}
