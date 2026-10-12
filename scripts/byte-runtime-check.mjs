import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const programs={python:`import rclpy
from rclpy.node import Node
from sensor_msgs.msg import Image
from std_msgs.msg import UInt8MultiArray
from unique_identifier_msgs.msg import UUID

class Bytes(Node):
    def __init__(self):
        super().__init__('bytes_probe')
        self.out_uuid = self.create_publisher(UUID, '/uuid_out', 10)
        self.out_bytes = self.create_publisher(UInt8MultiArray, '/bytes_out', 10)
        self.a = self.create_subscription(UUID, '/uuid_in', self.uuid, 10)
        self.b = self.create_subscription(UInt8MultiArray, '/bytes_in', self.bytes, 10)
        self.c = self.create_subscription(Image, '/image_in', self.image, 10)
    def uuid(self, message):
        assert list(message.uuid) == [i*17 for i in range(16)]
        self.out_uuid.publish(message)
    def bytes(self, message):
        assert list(message.data) in ([], [0, 1, 127, 128, 254, 255])
        self.out_bytes.publish(message)
    def image(self, message):
        assert len(message.data) == 230400
        assert all(value == index%256 for index, value in enumerate(message.data))
        assert message.header.frame_id == 'byte_test'
        print('ALL_IMAGE_BYTES_OK', flush=True)

def main():
    rclpy.init()
    node = Bytes()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()
`,cpp:`#include <rclcpp/rclcpp.hpp>
#include <sensor_msgs/msg/image.hpp>
#include <std_msgs/msg/u_int8_multi_array.hpp>
#include <unique_identifier_msgs/msg/uuid.hpp>
#include <iostream>
#include <cassert>
class Bytes : public rclcpp::Node {
 rclcpp::Publisher<unique_identifier_msgs::msg::UUID>::SharedPtr uuid_out;
 rclcpp::Publisher<std_msgs::msg::UInt8MultiArray>::SharedPtr bytes_out;
 rclcpp::Subscription<unique_identifier_msgs::msg::UUID>::SharedPtr a;
 rclcpp::Subscription<std_msgs::msg::UInt8MultiArray>::SharedPtr b;
 rclcpp::Subscription<sensor_msgs::msg::Image>::SharedPtr c;
public:
 Bytes():Node("bytes_probe") {
  std::cout << "WALL_MS " << std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count() << std::endl;
  uuid_out=create_publisher<unique_identifier_msgs::msg::UUID>("/uuid_out",10);
  bytes_out=create_publisher<std_msgs::msg::UInt8MultiArray>("/bytes_out",10);
  a=create_subscription<unique_identifier_msgs::msg::UUID>("/uuid_in",10,[this](unique_identifier_msgs::msg::UUID::SharedPtr m){
   for(unsigned i=0;i<16;i++)assert(m->uuid[i]==i*17);uuid_out->publish(*m);
  });
  b=create_subscription<std_msgs::msg::UInt8MultiArray>("/bytes_in",10,[this](std_msgs::msg::UInt8MultiArray::SharedPtr m){
   const std::vector<uint8_t> expected{0,1,127,128,254,255};assert(m->data.empty()||m->data==expected);bytes_out->publish(*m);
  });
  c=create_subscription<sensor_msgs::msg::Image>("/image_in",10,[](sensor_msgs::msg::Image::SharedPtr m){
   assert(m->data.size()==230400&&m->header.frame_id=="byte_test");
   for(unsigned i=0;i<m->data.size();i++)assert(m->data[i]==i%256);
   std::cout << "ALL_IMAGE_BYTES_OK" << std::endl;
  });
 }
};
int main(int argc,char**argv){rclcpp::init(argc,argv);rclcpp::spin(std::make_shared<Bytes>());rclcpp::shutdown();}
`};
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true}),reports=[];
try{
 const page=await browser.newPage();await page.goto(process.env.LAB_URL||'http://127.0.0.1:8033/ros2-basics-lab/');
 for(const language of (process.env.LAB_LANGUAGE||'python,cpp').split(',')){
  const result=await page.evaluate(async({language,code})=>{
   const base=document.querySelector('script[type=module]').src,{Lab}=await import(new URL('lab.js',base)),{ROOT}=await import(new URL('workspace.js',base));
   const lab=new Lab(),t=lab.terminal(),output=[],received=[];t.output=s=>output.push(s);
   const until=async(fn,label)=>{for(let i=0;i<1200;i++){if(fn())return;await new Promise(r=>setTimeout(r,50));}throw Error(label+' '+output.slice(-6).join('\n'));};
   try{
    await t.execute('mkdir -p ~/ros2_ws/src');await t.execute('cd ~/ros2_ws/src');await t.execute('ros2 pkg create bytes_pkg --build-type '+(language==='python'?'ament_python':'ament_cmake')+' --node-name probe --dependencies '+(language==='python'?'rclpy':'rclcpp')+' sensor_msgs std_msgs unique_identifier_msgs');
    lab.fs.write(ROOT+'/src/bytes_pkg/'+(language==='python'?'bytes_pkg/probe.py':'src/probe.cpp'),code);await t.execute('cd ..');await t.execute('colcon build');await t.execute('source install/setup.bash');
    const wallBefore=Date.now();await t.execute('ros2 run bytes_pkg probe');await until(()=>lab.runtime.topics.get('/image_in')?.subscribers.size,'subscriptions');
    if(language==='cpp'){
     const wall=Number(output.find(s=>s.startsWith('WALL_MS '))?.slice(8));if(!(wall>=wallBefore&&wall<=Date.now()))throw Error('Invalid C++ system_clock timestamp '+wall);
    }
    const uuid=Uint8Array.from({length:16},(_,i)=>i*17),bytes=new Uint8Array([0,1,127,128,254,255]),stops=[];
    stops.push(lab.runtime.subscribe('/uuid_out','/inspector',m=>received.push({uuid:m.uuid}),{type:'unique_identifier_msgs/msg/UUID'}));
    stops.push(lab.runtime.subscribe('/bytes_out','/inspector',m=>received.push({data:m.data}),{type:'std_msgs/msg/UInt8MultiArray'}));
    lab.runtime.publish('/uuid_in','unique_identifier_msgs/msg/UUID',{uuid},{node:'/input'});
    lab.runtime.publish('/bytes_in','std_msgs/msg/UInt8MultiArray',{layout:{dim:[],data_offset:0},data:bytes},{node:'/input'});
    await until(()=>received.length===2,'byte round trip');
    if(JSON.stringify(received.find(m=>m.uuid)?.uuid)!==JSON.stringify([...uuid])||JSON.stringify(received.find(m=>m.data)?.data)!==JSON.stringify([...bytes]))throw Error('Round-trip bytes changed');
    lab.runtime.publish('/bytes_in','std_msgs/msg/UInt8MultiArray',{layout:{dim:[],data_offset:0},data:new Uint8Array()},{node:'/input'});await until(()=>received.some(m=>m.data?.length===0),'empty array');
    const image=lab.workspace.registry.defaultMessage('sensor_msgs/msg/Image');Object.assign(image,{header:{stamp:{sec:12,nanosec:34},frame_id:'byte_test'},height:240,width:320,encoding:'rgb8',step:960,data:Uint8Array.from({length:230400},(_,i)=>i%256)});
    lab.runtime.publish('/image_in','sensor_msgs/msg/Image',image,{node:'/input'});await until(()=>output.includes('ALL_IMAGE_BYTES_OK'),'full image decode');
    let rejected=0;for(const data of [[-1],[256]])try{lab.runtime.publish('/image_in','sensor_msgs/msg/Image',{...image,data},{node:'/input'});}catch{rejected++;}
    try{lab.runtime.publish('/uuid_in','unique_identifier_msgs/msg/UUID',{uuid:new Uint8Array(15)},{node:'/input'});}catch{rejected++;}
    if(rejected!==3)throw Error('Invalid byte fields accepted');
    for(const stop of stops)stop();lab.stop(t.id);if(lab.runtime.nodes.size||lab.runtime.listeners.size||lab.runtime.jobs.size)throw Error('Byte program leaked');
    return {language,passed:true,fixedAndDynamicRoundTrip:true,emptyArray:true,exactImageBytes:230400,invalidFieldsRejected:rejected,systemClock:language==='cpp'};
   }finally{lab.reset();}
  },{language,code:programs[language]});
  reports.push(result);assert(result.passed);console.log(JSON.stringify(result));
 }
 await mkdir('artifacts/audit',{recursive:true});await writeFile('artifacts/audit/byte-runtime.json',JSON.stringify(reports,null,2));
}finally{await browser.close();}
