import {drawScan} from './scan-view.js';
import {drawWorld} from './world-view.js';
import {dynamicTransforms,staticTransforms,odometry} from './frames.js';
import{Robot}from'./robot.js';import{laserScan,TRAINING_WORLD,collides}from'./lidar.js';import{renderCamera}from'./camera.js';
export class Playground{
 constructor(runtime,canvas,camera,scanCanvas){this.scanCanvas=scanCanvas;this.runtime=runtime;this.canvas=canvas;this.camera= camera;this.robot=new Robot();this.elapsed=0;this.disposers=[];this.draw();this.sensorFrame(false);}
 start(){if(this.timer)return;const r=this.runtime;const topics=[['/scan','sensor_msgs/msg/LaserScan'],['/camera/image_raw','sensor_msgs/msg/Image'],['/odom','nav_msgs/msg/Odometry'],['/tf','tf2_msgs/msg/TFMessage'],['/tf_static','tf2_msgs/msg/TFMessage']];
  // Validate before advertising anything: a conflicting topic must not leave a half-started simulator.
  for(const [name,type]of [...topics,['/cmd_vel','geometry_msgs/msg/Twist']])if(r.topics.has(name)&&r.topics.get(name).type!==type)throw Error('Cannot start playground: '+name+' already uses '+r.topics.get(name).type+'. Stop that publisher/subscriber before starting the simulator.');
  if(r.nodes.has('/playground'))throw Error('The playground node is already running.');
  r.addNode('/playground');this.running=true;for(const [n,t]of topics)r.ensureTopic(n,t).publishers.add('/playground');this.disposers.push(r.subscribe('/cmd_vel','/playground',m=>{this.robot.command(Math.max(-2,Math.min(2,m.linear.x)),Math.max(-3,Math.min(3,m.angular.z)));},{type:'geometry_msgs/msg/Twist'}));r.publish('/tf_static','tf2_msgs/msg/TFMessage',staticTransforms(r.stamp()),{node:'/playground',durability:'transient_local'});this.timer=setInterval(()=>this.step(),50);this.step();}
 step(){this.elapsed+=.05;const previous={x:this.robot.x,y:this.robot.y,distance:this.robot.distance,yaw:this.robot.yaw,leftWheel:this.robot.leftWheel,rightWheel:this.robot.rightWheel};this.robot.step(.05);if(collides(this.robot,TRAINING_WORLD)){Object.assign(this.robot,previous);this.robot.command(0,0);}this.draw();if(Math.round(this.elapsed*20)%2!==0)return;const r=this.runtime,stamp=r.stamp();r.publish('/odom','nav_msgs/msg/Odometry',odometry(this.robot,stamp),{node:'/playground'});r.publish('/tf','tf2_msgs/msg/TFMessage',dynamicTransforms(this.robot,stamp),{node:'/playground'});const scan=laserScan(this.robot,TRAINING_WORLD,stamp);scan.ranges=scan.ranges.map(v=>Number.isFinite(v)?v:scan.range_max);r.publish('/scan','sensor_msgs/msg/LaserScan',scan,{node:'/playground'});this.sensorFrame(true,stamp,scan);}
 sensorFrame(publish=false,stamp={sec:0,nanosec:0},scan=laserScan(this.robot,TRAINING_WORLD,stamp)){
  const image=renderCamera(this.robot,TRAINING_WORLD);const message={header:{stamp,frame_id:'camera_optical_frame'},height:image.height,width:image.width,encoding:'rgb8',is_bigendian:0,step:image.width*3,data:Array.from(image.data)};if(publish)this.runtime.publish('/camera/image_raw','sensor_msgs/msg/Image',message,{node:'/playground'});
  this.camera.width=image.width;this.camera.height=image.height;const ctx=this.camera.getContext('2d'),rgba=new Uint8ClampedArray(image.width*image.height*4);for(let i=0;i<image.data.length/3;i++){rgba[i*4]=image.data[i*3];rgba[i*4+1]=image.data[i*3+1];rgba[i*4+2]=image.data[i*3+2];rgba[i*4+3]=255;}ctx.putImageData(new ImageData(rgba,image.width,image.height),0,0);
  if(this.scanCanvas)drawScan(this.scanCanvas,scan);
 }

 draw(){drawWorld(this.canvas,this.robot,this.overview);}
 resetPose(){this.robot.reset();this.draw();this.sensorFrame(false);}
 stop(){if(!this.running)return;this.running=false;clearInterval(this.timer);this.timer=null;this.robot.command(0,0);for(const d of this.disposers)d();this.disposers=[];this.runtime.removeNode('/playground');for(const t of this.runtime.topics.values())t.publishers.delete('/playground');this.runtime.removeEmptyTopics();}
}
