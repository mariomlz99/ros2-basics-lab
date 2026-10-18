import test from 'node:test';
import assert from 'node:assert/strict';
import {Lab} from '../src/lab.js';

test('topic transport uses native float32 values for scalar, array and nested fields without changing caller data',()=>{
 const lab=new Lab(),r=lab.runtime;
 const deliver=(type,input)=>{let received;const stop=r.subscribe('/probe','/reader',m=>received=m,{type});try{r.publish('/probe',type,input,{node:'/publisher'});return received;}finally{stop();r.removeEmptyTopics();}};
 try{
  // Captured with native Jazzy serialize_message/deserialize_message.
  for(const [input,expected]of [[.1,.10000000149011612],[2.88,2.880000114440918],[-.1,-.10000000149011612],[1e-45,1.401298464324817e-45]]){
   const m={data:input};assert.equal(deliver('std_msgs/msg/Float32',m).data,expected);assert.equal(m.data,input);
   assert.equal(deliver('std_msgs/msg/Float64',m).data,input,'float64 must stay unchanged');
  }
  const cloud=r.registry.complete('sensor_msgs/msg/PointCloud',{points:[{x:.1,y:-.1,z:2.88}],channels:[{name:'intensity',values:[.1,2.88]}]});
  const result=deliver('sensor_msgs/msg/PointCloud',cloud);
  assert.equal(result.points[0].x,.10000000149011612);assert.equal(result.channels[0].values[1],2.880000114440918);assert.equal(cloud.points[0].x,.1);
  const scan=r.registry.complete('sensor_msgs/msg/LaserScan',{angle_min:.1,ranges:[2.88]});
  assert.equal(deliver('sensor_msgs/msg/LaserScan',scan).ranges[0],2.880000114440918);
  assert.throws(()=>deliver('std_msgs/msg/Float32',{data:Infinity}),/finite/);
 }finally{lab.reset();}
});
