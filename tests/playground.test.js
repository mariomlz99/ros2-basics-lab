import test from 'node:test';import assert from 'node:assert/strict';
import {renderCamera} from '../src/playground/camera.js';import {laserScan,TRAINING_WORLD,collides} from '../src/playground/lidar.js';import {SENSORS,ROBOT_RADIUS} from '../src/playground/sensors.js';import {Robot} from '../src/playground/robot.js';import {Playground} from '../src/playground/playground.js';
const stamp={sec:0,nanosec:0};
function brownPixels(image){const xs=[];for(let i=0;i<image.data.length;i+=3){const [r,g,b]=image.data.slice(i,i+3);if(r>g&&g>b)xs.push(i/3%image.width);}return xs;}
test('camera and LiDAR see the same obstacle, occlusion and room walls',()=>{
 const robot=new Robot(),scan=laserScan(robot,TRAINING_WORLD,stamp);assert(Math.abs(scan.ranges[60]-2.88)<1e-9);assert.equal(scan.scan_time,.5);assert(SENSORS.lidar.x<ROBOT_RADIUS);
 const image=renderCamera(robot),brown=brownPixels(image);assert(brown.length>0);assert(Math.abs(brown.reduce((a,b)=>a+b,0)/brown.length-159.5)<1);
 for(let i=0;i<image.data.length;i+=3)assert(!(image.data[i+2]>180&&image.data[i]<100),'No phantom blue target');
 const empty={...TRAINING_WORLD,obstacles:[]};assert.equal(brownPixels(renderCamera(robot,empty)).length,0);assert.equal(laserScan(robot,empty,stamp).ranges[60],7.88);
 const left={bounds:TRAINING_WORLD.bounds,obstacles:[{...TRAINING_WORLD.obstacles[0],y:1}]};const pixels=brownPixels(renderCamera(robot,left));assert(pixels.length&&pixels.reduce((a,b)=>a+b,0)/pixels.length<160,'A left obstacle appears left in the camera');assert(laserScan(robot,left,stamp).ranges[68]<4,'LiDAR sees the same left obstacle');
 robot.x=1;assert(Math.abs(laserScan(robot,TRAINING_WORLD,stamp).ranges[60]-1.88)<1e-9);assert(brownPixels(renderCamera(robot)).length>brown.length,'Obstacle grows as the robot approaches');
 robot.yaw=Math.PI;assert.equal(brownPixels(renderCamera(robot)).length,0,'The obstacle behind the camera disappears');assert(Math.abs(laserScan(robot,TRAINING_WORLD,stamp).ranges[60]-2.88)<1e-9,'Facing backwards sees the west wall');
});
test('collision stops motion before contact and messages match the displayed camera frame',()=>{
 const sent=[],context=new Proxy({putImageData(image){this.image=image;}},{get(target,key){return target[key]??(()=>{});}});const canvas=()=>({width:400,height:320,getContext:()=>context});
 const prior=globalThis.ImageData;globalThis.ImageData=class{constructor(data,width,height){Object.assign(this,{data,width,height});}};
 try{const scene=new Playground({publish:(topic,type,message)=>sent.push({topic,type,message})},canvas(),canvas(),canvas());
  for(let i=0;i<100;i++){scene.robot.command(2,0);scene.step();assert(!collides(scene.robot,TRAINING_WORLD));}
  assert(scene.robot.x<=3-ROBOT_RADIUS);assert(scene.robot.x>2.7);assert(scene.robot.x+SENSORS.lidar.x<3);
  const image=sent.filter(s=>s.topic==='/camera/image_raw').at(-1).message;assert.equal(image.data.length,image.step*image.height);assert.deepEqual(image.data,Array.from(renderCamera(scene.robot).data));
  const scan=sent.filter(s=>s.topic==='/scan').at(-1).message;assert.equal(scan.scan_time,.5);assert(scan.ranges[60]>.05&&scan.ranges[60]<.2);
 }finally{globalThis.ImageData=prior;}
});
