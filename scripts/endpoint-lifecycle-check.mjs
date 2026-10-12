import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
export const programs={python:`import rclpy
from rclpy.node import Node
from std_msgs.msg import String

class Endpoints(Node):
    def __init__(self):
        super().__init__('endpoints')
        self.declare_parameter('phase', 0)
        self.previous = 0
        self.pubs = [self.create_publisher(String, '/shared', 10) for _ in range(2)]
        self.subs = [self.create_subscription(String, '/shared', lambda m, i=i: print(str(i) + ':' + m.data), 10) for i in range(2)]
        self.timer = self.create_timer(0.25, self.tick)
    def tick(self):
        phase = self.get_parameter('phase').value
        if phase != self.previous:
            self.destroy_publisher(self.pubs.pop(0))
            self.destroy_subscription(self.subs.pop(0))
            self.previous = phase
        for i, pub in enumerate(self.pubs):
            pub.publish(String(data='payload' + str(i)))

def main():
    rclpy.init()
    rclpy.spin(Endpoints())

if __name__ == '__main__':
    main()
`,cpp:`#include <rclcpp/rclcpp.hpp>
#include <std_msgs/msg/string.hpp>
#include <iostream>
#include <vector>
class Endpoints : public rclcpp::Node {
  std::vector<rclcpp::Publisher<std_msgs::msg::String>::SharedPtr> pubs;
  std::vector<rclcpp::Subscription<std_msgs::msg::String>::SharedPtr> subs;
  rclcpp::TimerBase::SharedPtr timer;
  int previous=0;
public:
  Endpoints():Node("endpoints") {
    declare_parameter("phase",0);
    for(int i=0;i<2;i++){
      pubs.push_back(create_publisher<std_msgs::msg::String>("/shared",10));
      subs.push_back(create_subscription<std_msgs::msg::String>("/shared",10,[i](std_msgs::msg::String::SharedPtr m){std::cout<<i<<":"<<m->data<<std::endl;}));
    }
    timer=create_wall_timer(std::chrono::milliseconds(250),[this](){
      int phase=get_parameter("phase").as_int();
      if(phase!=previous){pubs.erase(pubs.begin());subs.erase(subs.begin());previous=phase;}
      for(size_t i=0;i<pubs.size();i++){std_msgs::msg::String m;m.data="payload"+std::to_string(i);pubs[i]->publish(m);}
    });
  }
};
int main(int argc,char**argv){rclcpp::init(argc,argv);rclcpp::spin(std::make_shared<Endpoints>());rclcpp::shutdown();}
`};
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true});
try{
 const page=await browser.newPage();await page.goto(process.env.LAB_URL||'http://127.0.0.1:8033/ros2-basics-lab/');
 for(const language of (process.env.LAB_LANGUAGE||'python,cpp').split(',')){
  const result=await page.evaluate(async({language,code})=>{
   const base=document.querySelector('script[type=module]').src,{Lab}=await import(new URL('lab.js',base)),{ROOT}=await import(new URL('workspace.js',base));
   const l=new Lab(),t=l.terminal(),inspect=l.terminal(),output=[];t.output=s=>output.push(s);
   const until=async(fn,label)=>{for(let i=0;i<1200;i++){if(fn())return;await new Promise(r=>setTimeout(r,100));}throw Error(label+' '+output.slice(-8).join('\n'));};
   try{
    await t.execute('mkdir -p ~/ros2_ws/src');await t.execute('cd ~/ros2_ws/src');
    await t.execute('ros2 pkg create endpoints_pkg --build-type '+(language==='python'?'ament_python':'ament_cmake')+' --node-name endpoints --dependencies '+(language==='python'?'rclpy':'rclcpp')+' std_msgs');
    l.fs.write(ROOT+'/src/endpoints_pkg/'+(language==='python'?'endpoints_pkg/endpoints.py':'src/endpoints.cpp'),code);
    await t.execute('cd ..');await t.execute('colcon build');await t.execute('source install/setup.bash');await t.execute('ros2 run endpoints_pkg endpoints');await until(()=>output.some(x=>x.includes('1:payload')),'No callbacks');
    const initial=await inspect.execute('ros2 topic info /shared');
    if(!initial.includes('Publisher count: 2\nSubscription count: 2'))return {passed:false,initial,output};
    await inspect.execute('ros2 param set /endpoints phase 1');await until(()=>l.runtime.topics.get('/shared')?.publishers.size===1&&l.runtime.topics.get('/shared')?.subscribers.size===1,'Destroy one endpoint');
    output.length=0;await until(()=>output.filter(x=>x.includes('1:payload')).length>=3,'Surviving callback');
    if(output.some(x=>x.includes('0:payload')))throw Error('Destroyed subscription still fires');
    const survivor=await inspect.execute('ros2 topic info /shared');
    await inspect.execute('ros2 param set /endpoints phase 2');await until(()=>!l.runtime.topics.has('/shared'),'Destroyed endpoints still advertised');
    l.stop(t.id);if(l.runtime.nodes.size||l.runtime.jobs.size||l.runtime.listeners.size||l.runtime.parameters.size)throw Error('Lifecycle resources leaked');
    return {passed:true,initial,survivor};
   }finally{l.reset();}
  },{language,code:programs[language]});
  console.log(language,JSON.stringify(result));assert(result.passed);
 }
}finally{await browser.close();}
