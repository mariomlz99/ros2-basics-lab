import {chromium} from 'playwright-core';import assert from 'node:assert/strict';import {mkdir,writeFile} from 'node:fs/promises';
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true});await mkdir('artifacts/review',{recursive:true});
try{
 const page=await browser.newPage();await page.goto(process.env.LAB_URL||'http://127.0.0.1:8044/ros2-basics-lab/');
 const results=await page.evaluate(async()=>{
  const base=document.querySelector('script[src*="/app.js"]').src,{Lab}=await import(new URL('lab.js',base)),{prepareLesson}=await import(new URL('course/prepare.js',base)),{tfChecks}=await import(new URL('tf/lesson.js',base)),{staticTransforms,dynamicTransforms}=await import(new URL('playground/frames.js',base));
  const l=new Lab(),results=[],logs=[];l.onOutput=(_,s)=>logs.push(s);l.terminal();await prepareLesson(l,9,'python');
  const seed=()=>{l.runtime.publish('/tf_static','tf2_msgs/msg/TFMessage',staticTransforms(l.runtime.stamp()),{node:'/robot'});l.runtime.publish('/tf','tf2_msgs/msg/TFMessage',dynamicTransforms({x:.3,y:-.7,yaw:1.2},l.runtime.stamp()),{node:'/robot'});};seed();
  const pre=`import rclpy\nfrom rclpy.time import Time\nfrom tf2_ros import Buffer, TransformListener\ndef main():\n    rclpy.init()\n    n=rclpy.create_node('attack')\n`,post=`\n    rclpy.spin(n)\n`;
  const cases=[
   ['print-only',"    print('x = 0.12, y = 0.00 m')",false],
   ['hardcoded with listener',"    b=Buffer()\n    listener=TransformListener(b,n)\n    print('x = 0.12, y = 0.00 m')",false],
   ['wrong-pair',"    b=Buffer()\n    listener=TransformListener(b,n)\n    t=b.lookup_transform('laser_link','base_link',Time())\n    print('x = 0.12, y = 0.00 m')",false],
   ['forged exact bridge evidence',`    import json\n    from js import emit_json\n    b=Buffer()\n    listener=TransformListener(b,n)\n    result={'header':{'stamp':{'sec':0,'nanosec':0},'frame_id':'base_link'},'child_frame_id':'laser_link','transform':{'translation':{'x':0.12,'y':0,'z':0.15},'rotation':{'x':0,'y':0,'z':0,'w':1}}}\n    for revision in range(100):\n        emit_json(json.dumps({'kind':'tf_evidence','operation':'lookup','target':'base_link','source':'laser_link','revision':revision,'result':result}))`,false],
   ['functional alternative',"    sensor='laser_link'\n    reference='base_link'\n    cache=Buffer()\n    receiver=TransformListener(cache,n)\n    value=cache.lookup_transform(reference,sensor,Time())\n    print(value.transform.translation.x,value.transform.translation.y)",true],
  ];
  try{for(const [name,body,expected]of cases){logs.length=0;l.processes.stopAll();l.fs.write('/home/student/ros2_ws/src/tf_lab/tf_lab/lookup.py',pre+body+post);await l.builder.build();await l.processes.run('tf_lab','lookup');for(let i=0;i<1200;i++){if(l.processes.active().some(p=>p.status==='Running')||logs.some(s=>/Error|Traceback/.test(s)))break;await new Promise(r=>setTimeout(r,50));}await new Promise(r=>setTimeout(r,100));results.push({name,expected,passed:tfChecks(l,'lookup')[0].passed,logs:[...logs]});}return results;}finally{l.reset();}
 });
 results.forEach(result=>result.language='python');
 results.push(...await page.evaluate(async()=>{
  const base=document.querySelector('script[src*="/app.js"]').src,{Lab}=await import(new URL('lab.js',base)),{prepareLesson}=await import(new URL('course/prepare.js',base)),{tfChecks}=await import(new URL('tf/lesson.js',base)),{staticTransforms,dynamicTransforms}=await import(new URL('playground/frames.js',base));
  const l=new Lab(),results=[],logs=[];l.onOutput=(_,s)=>logs.push(s);l.terminal();await prepareLesson(l,9,'cpp');
  l.runtime.publish('/tf_static','tf2_msgs/msg/TFMessage',staticTransforms(l.runtime.stamp()),{node:'/robot'});l.runtime.publish('/tf','tf2_msgs/msg/TFMessage',dynamicTransforms({x:.3,y:-.7,yaw:1.2},l.runtime.stamp()),{node:'/robot'});
  const listener='tf2_ros::Buffer b(n->get_clock()); tf2_ros::TransformListener listener(b,n,false);';
  const cases=[
   ['print-only','RCLCPP_INFO(n->get_logger(),"x = 0.12, y = 0.00 m");',false],
   ['hardcoded with listener',listener+'RCLCPP_INFO(n->get_logger(),"x = 0.12, y = 0.00 m");',false],
   ['wrong-pair',listener+'auto t=b.lookupTransform("laser_link","base_link",tf2::TimePointZero); RCLCPP_INFO(n->get_logger(),"x = 0.12, y = 0.00 m");',false],
   ['unknown frame',listener+'b.lookupTransform("base_link","laser",tf2::TimePointZero);',false],
   ['functional alternative',listener+'const std::string sensor="laser_link",reference="base_link"; auto value=b.lookupTransform(reference,sensor,tf2::TimePointZero); RCLCPP_INFO(n->get_logger(),"%f %f",value.transform.translation.x,value.transform.translation.y);',true],
  ];
  try{for(const [name,body,expected]of cases){logs.length=0;l.processes.stopAll();l.fs.write('/home/student/ros2_ws/src/tf_lab/src/lookup.cpp','#include <rclcpp/rclcpp.hpp>\n#include <tf2_ros/buffer.hpp>\n#include <tf2_ros/transform_listener.hpp>\nint main(int argc,char**argv){rclcpp::init(argc,argv);auto n=std::make_shared<rclcpp::Node>("attack");'+body+'rclcpp::spin(n);rclcpp::shutdown();}');await l.builder.build();await l.processes.run('tf_lab','lookup');for(let i=0;i<1200;i++){if(l.processes.active().some(p=>p.status==='Running')||logs.some(s=>/Error|Unknown TF frame/.test(s)))break;await new Promise(r=>setTimeout(r,50));}await new Promise(r=>setTimeout(r,100));results.push({language:'cpp',name,expected,passed:tfChecks(l,'lookup')[0].passed,logs:[...logs]});}return results;}finally{l.reset();}
 }));
 await writeFile('artifacts/review/checker-attacks.json',JSON.stringify(results,null,2));for(const r of results){console.log(r.language+' '+r.name+': checker '+r.passed+' expected '+r.expected);if(!process.env.PROBE_ONLY)assert.equal(r.passed,r.expected,r.name);}
}finally{await browser.close();}
