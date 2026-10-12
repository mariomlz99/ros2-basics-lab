// Real worker flood/recovery regression, including C++ output without newlines.
import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const programs={python:`import rclpy
from rclpy.node import Node

def main():
    rclpy.init()
    node = Node('output_probe')
    for i in range(160):
        node.get_logger().info('FLOOD %d %s' % (i, 'x' * 8000))
    node.create_timer(1.2, lambda: node.get_logger().info('RECOVERY'))
    rclpy.spin(node)
`,cpp:`#include <rclcpp/rclcpp.hpp>
#include <iostream>
#include <string>
#include <chrono>
int main(int argc,char **argv){
 rclcpp::init(argc,argv);
 auto node=std::make_shared<rclcpp::Node>("output_probe");
 std::string block(8192,'x');
 for(int i=0;i<1024;i++)std::cout<<block<<std::flush;
 std::cout<<std::endl;
 for(int i=0;i<160;i++)RCLCPP_INFO(node->get_logger(),"FLOOD %d %s",i,block.c_str());
 auto timer=node->create_wall_timer(std::chrono::milliseconds(1200),[node](){RCLCPP_INFO(node->get_logger(),"RECOVERY");});
 rclcpp::spin(node);
}`};
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true}),reports=[];
try{
 const page=await browser.newPage();await page.goto(process.env.LAB_URL||'http://127.0.0.1:8033/ros2-basics-lab/');
 for(const language of (process.env.LAB_LANGUAGE||'python,cpp').split(',')){
  const result=await page.evaluate(async({language,source})=>{
   const base=document.querySelector('script[type=module]').src,{Lab}=await import(new URL('lab.js',base)),{ROOT}=await import(new URL('workspace.js',base));
   const lab=new Lab(),t=lab.terminal(),logs=[];let outputCount=0,maxLength=0;
   const sleep=ms=>new Promise(r=>setTimeout(r,ms));
   t.output=s=>logs.push(s);
   try{
    await t.execute('mkdir -p ~/ros2_ws/src');await t.execute('cd ~/ros2_ws/src');
    await t.execute('ros2 pkg create output_probe --build-type '+(language==='python'?'ament_python':'ament_cmake')+' --node-name probe --dependencies '+(language==='python'?'rclpy':'rclcpp'));
    lab.fs.write(ROOT+'/src/output_probe/'+(language==='python'?'output_probe/probe.py':'src/probe.cpp'),source);
    await t.execute('cd ..');await t.execute('colcon build');await t.execute('source install/setup.bash');
    if(!lab.workspace.current('output_probe'))throw Error('Build failed '+logs.slice(-8).join('\n'));
    logs.length=0;t.output=s=>{outputCount++;maxLength=Math.max(maxLength,s.length);logs.push(s);};
    await t.execute('ros2 run output_probe probe');
    for(let i=0;i<2400&&!logs.some(s=>s.endsWith('RECOVERY'));i++)await sleep(50);
    if(!logs.some(s=>s.endsWith('RECOVERY')))throw Error('No timer/logger recovery '+logs.map(s=>s.slice(0,100)).join('\n'));
    const flood=logs.filter(s=>s.includes('FLOOD ')),raw=logs.filter(s=>s.startsWith('xxxxxxxx'));
    if(!flood.length||flood.length>40)throw Error('Unbounded logger events: '+flood.length);
    if(flood.some(s=>s.length>4030))throw Error('Unbounded log line');
    if(language==='cpp'&&(raw.length!==1||raw[0].length!==4000))throw Error('Incorrect no-newline output bound '+JSON.stringify({raw:raw.map(s=>s.length),logs:logs.map(s=>({length:s.length,prefix:s.slice(0,45)}))}));
    if(!lab.runtime.nodes.size)throw Error('Output throttle discarded graph lifecycle messages');
    lab.stop(t.id);const stopped=outputCount;await sleep(1350);
    if(outputCount!==stopped)throw Error('Late log output after Stop');
    const clean={processes:lab.processes.active().length,nodes:lab.runtime.nodes.size,listeners:lab.runtime.listeners.size,timers:lab.runtime.jobs.size};
    if(Object.values(clean).some(Boolean))throw Error('Leaked lifecycle '+JSON.stringify(clean));
    return {language,passed:true,floodLines:flood.length,maxLength,unterminatedBytes:language==='cpp'?8388608:0,recovered:true,clean};
   }finally{lab.reset();}
  },{language,source:programs[language]});
  assert(result.passed);reports.push(result);console.log('PASS bounded worker output '+JSON.stringify(result));
  await mkdir('artifacts/audit',{recursive:true});await writeFile('artifacts/audit/worker-output'+(process.env.LAB_LANGUAGE?'-'+process.env.LAB_LANGUAGE:'')+'.json',JSON.stringify(reports,null,2));
 }
}finally{await browser.close();}
