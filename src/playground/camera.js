import {SENSORS,sensorPose} from './sensors.js';
import {rayBox} from './lidar.js';
export const CAMERA_WIDTH=SENSORS.camera.width, CAMERA_HEIGHT=SENSORS.camera.height, CAMERA_PERIOD=SENSORS.camera.period;

// A tiny pinhole camera: +yaw turns left, so a target to the left has a smaller image x.
export function renderCamera(robot, targets=[{x:5,y:0,color:[235,45,45]},{x:6,y:-2,color:[40,85,230]}],world=null) {
  robot=sensorPose(robot,'camera');
  const width=CAMERA_WIDTH,height=CAMERA_HEIGHT,data=new Uint8Array(width*height*3);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++) {
    const i=(y*width+x)*3;data[i]=y<120?75:65;data[i+1]=y<120?104:73;data[i+2]=y<120?127:66;
  }
  const depths=new Float32Array(width*height).fill(Infinity);
  const projected=targets.map(target=>{
    const dx=target.x-robot.x,dy=target.y-robot.y;
    const depth=dx*Math.cos(robot.yaw)+dy*Math.sin(robot.yaw);
    const lateral=-dx*Math.sin(robot.yaw)+dy*Math.cos(robot.yaw);
    let surfaceDepth=depth;
    // A beacon placed inside a collision box is mounted on its front face.
    // A target beyond a separate obstacle remains occluded by that obstacle.
    for(const box of world?.obstacles??[])if(target.x>=box.x&&target.x<=box.x+box.w&&target.y>=box.y&&target.y<=box.y+box.h){
      const distance=Math.hypot(dx,dy),range=rayBox(robot.x,robot.y,dx/distance,dy/distance,box);
      if(Number.isFinite(range))surfaceDepth=Math.min(surfaceDepth,range*depth/distance-.001);
    }
    return {...target,depth:surfaceDepth,cx:160-160*lateral/depth,size:200/Math.max(surfaceDepth,.05)};
  }).filter(t=>t.depth>.05).sort((a,b)=>b.depth-a.depth);
  for(const target of projected) {
    const left=Math.max(0,Math.floor(target.cx-target.size/2)),right=Math.min(width,Math.ceil(target.cx+target.size/2));
    const top=Math.max(0,Math.floor(120-target.size/2)),bottom=Math.min(height,Math.ceil(120+target.size/2));
    for(let y=top;y<bottom;y++)for(let x=left;x<right;x++){const pixel=y*width+x;data.set(target.color,pixel*3);depths[pixel]=target.depth;}
  }
  // The same boxes used by the LiDAR occupy the camera view. Cast one ray per
  // image column so nearby walls grow naturally and clip at the image edges.
  for(let x=0;x<width;x++){
    const lateral=(160-x-.5)/160,angle=robot.yaw+Math.atan(lateral);
    let range=Infinity;
    for(const box of world?.obstacles??[])range=Math.min(range,rayBox(robot.x,robot.y,Math.cos(angle),Math.sin(angle),box));
    const depth=range/Math.sqrt(1+lateral*lateral);
    if(!Number.isFinite(depth))continue;
    const halfHeight=100/Math.max(depth,.05);
    for(let y=Math.max(0,Math.floor(120-halfHeight));y<Math.min(height,Math.ceil(120+halfHeight));y++){
      const pixel=y*width+x;if(depth>=depths[pixel])continue;
      const shade=Math.max(85,Math.round(155-Math.min(depth,8)*6));
      const offset=pixel*3;data[offset]=shade;data[offset+1]=shade;data[offset+2]=shade;depths[pixel]=depth;
    }
  }
  return {height,width,encoding:'rgb8',is_bigendian:0,step:width*3,data};
}

// Kept in the simulator/checker, never attached to the student Image message.
export function inspectPixels(image) {
  let count=0,sumX=0;const sums=[0,0,0];
  for(let i=0;i<image.data.length;i+=3){const r=image.data[i],g=image.data[i+1],b=image.data[i+2];sums[0]+=r;sums[1]+=g;sums[2]+=b;if(r>180&&g<100&&b<100){count++;sumX+=(i/3)%image.width;}}
  return {visible:count>500,cx:count?sumX/count:null,count,means:sums.map(s=>s/(image.width*image.height))};
}
