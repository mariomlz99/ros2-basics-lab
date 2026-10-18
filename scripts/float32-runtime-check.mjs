import {chromium,firefox} from 'playwright-core';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const programs={python:`import rclpy
from rclpy.node import Node
from std_msgs.msg import Float32, Float64MultiArray
from sensor_msgs.msg import LaserScan
class Probe(Node):
    def __init__(self):
        super().__init__('precision_probe')
        self.out = self.create_publisher(Float64MultiArray, '/observed', 10)
        self.a = self.create_subscription(Float32, '/scalar', self.scalar, 10)
        self.b = self.create_subscription(LaserScan, '/scan', self.scan, 10)
    def scalar(self, m):
        out = Float64MultiArray()
        out.data = [m.data]
        self.out.publish(out)
    def scan(self, m):
        out = Float64MultiArray()
        out.data = [m.angle_min, m.ranges[0], m.time_increment]
        self.out.publish(out)
def main():
    rclpy.init()
    node = Probe()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()
`,cpp:`#include <rclcpp/rclcpp.hpp>
#include <std_msgs/msg/float32.hpp>
#include <std_msgs/msg/float64_multi_array.hpp>
#include <sensor_msgs/msg/laser_scan.hpp>
class Probe : public rclcpp::Node {
 rclcpp::Publisher<std_msgs::msg::Float64MultiArray>::SharedPtr out;
 rclcpp::Subscription<std_msgs::msg::Float32>::SharedPtr a;
 rclcpp::Subscription<sensor_msgs::msg::LaserScan>::SharedPtr b;
public:
 Probe():Node("precision_probe"){
  out=create_publisher<std_msgs::msg::Float64MultiArray>("/observed",10);
  a=create_subscription<std_msgs::msg::Float32>("/scalar",10,[this](std_msgs::msg::Float32::SharedPtr m){std_msgs::msg::Float64MultiArray result;result.data={m->data};out->publish(result);});
  b=create_subscription<sensor_msgs::msg::LaserScan>("/scan",10,[this](sensor_msgs::msg::LaserScan::SharedPtr m){std_msgs::msg::Float64MultiArray result;result.data={m->angle_min,m->ranges[0],m->time_increment};out->publish(result);});
 }
};
int main(int argc,char**argv){rclcpp::init(argc,argv);rclcpp::spin(std::make_shared<Probe>());rclcpp::shutdown();}
`};
const results=[];
for(const [engineName,engine]of [['chrome',chromium],['firefox',firefox]]){
 const browser=await engine.launch({headless:true,...(engineName==='chrome'?{executablePath:'/usr/bin/google-chrome'}:{})});
 try{
  const page=await browser.newPage();await page.goto(process.env.LAB_URL);
  for(const language of ['python','cpp']){
   const result=await page.evaluate(async({language,code})=>{
    const base=document.querySelector('script[src*="/app.js"]').src,{Lab}=await import(new URL('lab.js',base)),{ROOT}=await import(new URL('workspace.js',base));
    const lab=new Lab(),t=lab.terminal(),received=[],output=[];t.output=s=>output.push(s);
    const until=async fn=>{for(let i=0;i<2400;i++){if(fn())return;await new Promise(r=>setTimeout(r,50));}throw Error(output.join('\n'));};
    try{
     await t.execute('mkdir -p ~/ros2_ws/src');await t.execute('cd ~/ros2_ws/src');
     await t.execute('ros2 pkg create precision_pkg --build-type '+(language==='python'?'ament_python':'ament_cmake')+' --node-name probe --dependencies '+(language==='python'?'rclpy':'rclcpp')+' std_msgs sensor_msgs');
     lab.fs.write(ROOT+'/src/precision_pkg/'+(language==='python'?'precision_pkg/probe.py':'src/probe.cpp'),code);
     await t.execute('cd ..');await t.execute('colcon build');await t.execute('source install/setup.bash');await t.execute('ros2 run precision_pkg probe');
     await until(()=>lab.runtime.topics.get('/scan')?.subscribers.size&&lab.runtime.topics.get('/scalar')?.subscribers.size);
     const dispose=lab.runtime.subscribe('/observed','/inspector',m=>received.push(m.data),{type:'std_msgs/msg/Float64MultiArray'});
     lab.runtime.publish('/scalar','std_msgs/msg/Float32',{data:.1},{node:'/fixture'});
     lab.runtime.publish('/scan','sensor_msgs/msg/LaserScan',lab.runtime.registry.complete('sensor_msgs/msg/LaserScan',{angle_min:-.1,time_increment:1e-45,ranges:[2.88]}),{node:'/fixture'});
     await until(()=>received.length===2);dispose();lab.stop(t.id);
     if(lab.runtime.nodes.size||lab.runtime.listeners.size||lab.processes.active().length)throw Error('Precision probe leaked');
     return {received,asset:base};
    }finally{lab.reset();}
   },{language,code:programs[language]});
   assert.deepEqual(result.received.find(v=>v.length===1),[.10000000149011612]);
   assert.deepEqual(result.received.find(v=>v.length===3),[-.10000000149011612,2.880000114440918,1.401298464324817e-45]);
   results.push({browser:engineName,version:browser.version(),language,...result});console.log('PASS '+engineName+' '+language+' exact native float32 scalar/array/subnormal values and cleanup');
  }
 }finally{await browser.close();}
}
await mkdir('artifacts/stabilization',{recursive:true});await writeFile('artifacts/stabilization/float32-runtime.json',JSON.stringify(results,null,2)+'\n');
