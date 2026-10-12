// Exercise the visible Free Lab terminal while real sensor callbacks flood logs.
import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';

const programs={python:`import rclpy
from rclpy.node import Node
from sensor_msgs.msg import Image

def main():
    rclpy.init()
    node = Node('ui_output_probe')
    frames = [0]
    def image(msg):
        if len(msg.data) == 230400:
            frames[0] += 1
    def tick():
        for i in range(100):
            node.get_logger().info('UI_FLOOD frames=%d %s' % (frames[0], 'x' * 5000))
    node.create_subscription(Image, '/camera/image_raw', image, 10)
    node.create_timer(0.05, tick)
    rclpy.spin(node)
`,cpp:`#include <rclcpp/rclcpp.hpp>
#include <sensor_msgs/msg/image.hpp>
#include <chrono>
#include <string>
int main(int argc,char **argv){
 rclcpp::init(argc,argv);
 auto node=std::make_shared<rclcpp::Node>("ui_output_probe");
 int frames=0;std::string text(5000,'x');
 auto sub=node->create_subscription<sensor_msgs::msg::Image>("/camera/image_raw",10,[&](sensor_msgs::msg::Image::SharedPtr msg){if(msg->data.size()==230400)frames++;});
 auto timer=node->create_wall_timer(std::chrono::milliseconds(50),[&](){for(int i=0;i<100;i++)RCLCPP_INFO(node->get_logger(),"UI_FLOOD frames=%d %s",frames,text.c_str());});
 rclcpp::spin(node);
}`};
const url=process.env.LAB_URL||'http://127.0.0.1:8031/ros2-basics-lab/';
const durationMs=Number(process.env.STRESS_DURATION_MS||30000);
assert(durationMs>=10000&&durationMs<=300000);
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true}),reports=[];
try{
 for(const language of (process.env.LAB_LANGUAGE||'python,cpp').split(',')){
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
  await page.goto(url);
  const observe=()=>page.evaluate(async()=>{
   const base=document.querySelector('script[type=module]').src;
   const {Lab}=await import(new URL('lab.js',base)),{TerminalView}=await import(new URL('terminal-view.js',base));
   const terminal=Lab.prototype.terminal,output=TerminalView.prototype.output,Worker=window.Worker;
   window.auditWorkers=new Set();window.auditViews=[];
   window.Worker=class extends Worker{constructor(...args){super(...args);window.auditWorkers.add(this);}terminate(){window.auditWorkers.delete(this);return super.terminate();}};
   Lab.prototype.terminal=function(...args){window.auditLab=this;return terminal.apply(this,args);};
   TerminalView.prototype.output=function(...args){if(!window.auditViews.includes(this))window.auditViews.push(this);return output.apply(this,args);};
   window.flood={count:0,maxLength:0,frames:0};
   document.addEventListener('lab-diagnostic',e=>{const text=e.detail.text,match=/UI_FLOOD frames=(\d+)/.exec(text);if(match){const f=window.flood;f.count++;f.maxLength=Math.max(f.maxLength,text.length);f.frames=Math.max(f.frames,Number(match[1]));}});
  });
  await observe();await page.locator('#start').click();await page.locator('.xterm').first().waitFor();
  const command=async(line,index=0)=>{await page.locator('.xterm-helper-textarea').nth(index).focus();await page.keyboard.insertText(line);await page.keyboard.press('Enter');await page.waitForTimeout(100);};
  const idle=()=>page.waitForFunction(()=>[...document.querySelectorAll('.terminal-state')].every(e=>/^(Jazzy|ROS environment)/.test(e.textContent)),null,{timeout:180000});
  await command('echo preserved > course_marker');await idle();
  const progress=await page.locator('#progress').textContent();
  await page.locator('[data-index="8"]').click();await page.locator('#language').selectOption(language);
  assert.equal(await page.locator('.complete').count(),0);
  for(const line of ['cd ~/ros2_ws/src','ros2 pkg create ui_probe --build-type '+(language==='python'?'ament_python':'ament_cmake')+' --node-name probe --dependencies '+(language==='python'?'rclpy':'rclcpp')+' sensor_msgs']){await command(line);await idle();}
  await page.evaluate(async({language,source})=>{const {ROOT}=await import(new URL('workspace.js',document.querySelector('script[type=module]').src));window.auditLab.fs.write(ROOT+'/src/ui_probe/'+(language==='python'?'ui_probe/probe.py':'src/probe.cpp'),source);},{language,source:programs[language]});
  for(const line of ['cd ..','colcon build','source install/setup.bash']){await command(line);await idle();}
  assert(await page.evaluate(()=>!!window.auditLab.workspace.current('ui_probe')),'Real package build must succeed');
  await page.locator('#free-robot').click();await page.locator('#playground-start').click();
  await command('ros2 run ui_probe probe');
  await page.waitForFunction(()=>window.flood.frames>0,null,{timeout:180000});
  const started=Date.now(),initial=await page.evaluate(()=>({...window.flood}));let iterations=0,maxTranscript=0,maxScrollback=0;
  while(Date.now()-started<durationMs){
   await page.locator('#theme').selectOption(iterations%2?'light':'dark');
   await page.setViewportSize({width:iterations%2?1440:900,height:1000});
   const state=await page.evaluate(()=>({flood:{...window.flood},transcript:document.querySelector('.terminal-transcript pre').textContent.length,views:window.auditViews.filter(v=>!v.disposed).map(v=>({length:v.xterm.buffer.active.length,rows:v.xterm.rows})),processes:window.auditLab.processes.active().length}));
   assert(state.processes>0);assert(state.transcript<=80000);assert(state.flood.maxLength<=4030);
   assert(state.views.every(v=>v.length<=2000+v.rows));
   maxTranscript=Math.max(maxTranscript,state.transcript);maxScrollback=Math.max(maxScrollback,...state.views.map(v=>v.length));
   iterations++;await page.waitForTimeout(1000);
  }
  const activeMs=Date.now()-started,final=await page.evaluate(()=>({...window.flood}));
  assert(final.count-initial.count>=200,'Sustained real logger output must reach the visible terminal');
  assert(final.count-initial.count<=40*(Math.ceil(activeMs/1000)+2),'Worker output budget must remain bounded');
  assert(final.frames-initial.frames>=30,'Full image callbacks must continue under logger load');
  assert.equal(maxTranscript,80000,'Exercise the transcript truncation path');
  await page.locator('.terminal-card .stop').first().click();
  const stopped=await page.evaluate(()=>window.flood.count);await page.waitForTimeout(1200);assert.equal(await page.evaluate(()=>window.flood.count),stopped);
  await page.locator('#playground-stop').click();
  const clean=()=>page.evaluate(()=>{const l=window.auditLab;return {workers:window.auditWorkers.size,processes:l.processes.active().length,nodes:l.runtime.nodes.size,listeners:l.runtime.listeners.size,timers:l.runtime.jobs.size,services:l.runtime.services.size,parameters:l.runtime.parameters.size};});
  assert(Object.values(await clean()).every(v=>v===0));
  await page.locator('#playground-start').click();await command('ros2 run ui_probe probe');
  await page.waitForFunction(n=>window.flood.count>n,stopped,{timeout:180000});
  await page.locator('#add-terminal').click();await page.locator('.terminal-card .close').first().click();await page.locator('#playground-stop').click();
  assert(Object.values(await clean()).every(v=>v===0));
  await page.locator('#save-session').click();await page.waitForTimeout(500);await page.reload();await observe();await page.locator('#start').click();await page.locator('.xterm').first().waitFor();
  assert(Object.values(await clean()).every(v=>v===0));
  assert(await page.evaluate(()=>!!window.auditLab.workspace.installed.get('ui_probe')));
  await page.locator('#reset').click();assert.equal(await page.evaluate(()=>window.auditLab.workspace.installed.size),0);
  await page.locator('[data-index="0"]').click();await command('cat course_marker');await idle();
  assert.match(await page.locator('.terminal-transcript pre').textContent(),/preserved/);assert.equal(await page.locator('#progress').textContent(),progress);
  assert.deepEqual(errors,[]);
  const result={language,passed:true,activeMs,uiChanges:iterations,loggerEvents:final.count-initial.count,imageCallbacks:final.frames-initial.frames,maxLine:final.maxLength,maxTranscript,maxScrollback,stop:true,close:true,reload:true,resetIsolation:true,clean:await clean()};
  reports.push(result);console.log('PASS visible Free Lab output stress '+JSON.stringify(result));
  await mkdir('artifacts/audit',{recursive:true});await writeFile('artifacts/audit/free-lab-output-stress.json',JSON.stringify({url,reports},null,2));await page.close();
 }
}finally{await browser.close();}
