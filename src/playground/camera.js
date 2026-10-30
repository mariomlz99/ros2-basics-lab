import {SENSORS,sensorPose} from './sensors.js';
import {rayBox,worldSurfaces,TRAINING_WORLD} from './lidar.js';
export const CAMERA_WIDTH=SENSORS.camera.width, CAMERA_HEIGHT=SENSORS.camera.height, CAMERA_PERIOD=SENSORS.camera.period;

// Pinhole view of exactly the surfaces used by the map, LiDAR and collisions.
// Camera optical height comes from the same mount published in TF.
export function renderCamera(robot,world=TRAINING_WORLD){
 const pose=sensorPose(robot,'camera'),width=CAMERA_WIDTH,height=CAMERA_HEIGHT,focal=width/2,horizon=height/2,cameraHeight=SENSORS.camera.z;
 const data=new Uint8Array(width*height*3),surfaces=worldSurfaces(world);
 const forward={x:Math.cos(pose.yaw),y:Math.sin(pose.yaw)},left={x:-Math.sin(pose.yaw),y:Math.cos(pose.yaw)};
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  let color;
  if(y<horizon){const light=.85+.15*y/horizon;color=[180,193,199].map(v=>Math.round(v*light));}
  else{
   const depth=cameraHeight*focal/(y+.5-horizon),lateral=(focal-x-.5)/focal;
   const fx=pose.x+depth*(forward.x+lateral*left.x),fy=pose.y+depth*(forward.y+lateral*left.y);
   const tile=(Math.floor(fx)+Math.floor(fy))%2===0,edge=Math.min(fx-Math.floor(fx),fy-Math.floor(fy))<.015;
   const light=Math.max(.62,1-depth*.025)*(edge?.84:1),base=tile?[182,191,193]:[173,184,188];color=base.map(v=>Math.round(v*light));
  }
  data.set(color,(y*width+x)*3);
 }
 for(let x=0;x<width;x++){
  const lateral=(focal-x-.5)/focal,angle=pose.yaw+Math.atan(lateral);
  // Draw far surfaces first: a low nearby obstacle only occludes the pixels
  // within its vertical silhouette, not the taller wall behind it.
  const hits=surfaces.map(hit=>({hit,range:rayBox(pose.x,pose.y,Math.cos(angle),Math.sin(angle),hit)})).filter(hit=>Number.isFinite(hit.range)).sort((a,b)=>b.range-a.range);
  for(const {hit,range}of hits){
  const depth=Math.max(.02,range/Math.sqrt(1+lateral*lateral));
  const top=Math.max(0,Math.ceil(horizon-focal*((hit.height??1)-cameraHeight)/depth-.5)),bottom=Math.min(height,Math.floor(horizon+focal*cameraHeight/depth-.5)+1);
  const hx=pose.x+range*Math.cos(angle),hy=pose.y+range*Math.sin(angle);
  const side=Math.min(Math.abs(hx-hit.x),Math.abs(hx-hit.x-hit.w))<.001;
  const shade=Math.max(.60,1-depth*.025)*(side?.84:1),obstacle=world.obstacles.includes(hit);
  for(let y=top;y<bottom;y++){
   const elevation=cameraHeight+(horizon-y-.5)*depth/focal;
   const seam=obstacle&&Math.abs((side?hy-hit.y:hx-hit.x)-(side?hit.h:hit.w)/2)<.018;
   const trim=!obstacle&&elevation<.10;
   const base=obstacle?(seam?[206,171,133]:hit.color):(trim?[100,120,129]:[188,200,207]);
   data.set(base.map(value=>Math.round(value*shade)),(y*width+x)*3);
  }
  }
 }
 return {height,width,encoding:'rgb8',is_bigendian:0,step:width*3,data};
}
