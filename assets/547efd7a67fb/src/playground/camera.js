import {SENSORS,sensorPose} from './sensors.js';
import {rayBox,worldSurfaces,TRAINING_WORLD} from './lidar.js';
export const CAMERA_WIDTH=SENSORS.camera.width, CAMERA_HEIGHT=SENSORS.camera.height, CAMERA_PERIOD=SENSORS.camera.period;

// Pinhole view of exactly the surfaces used by the map, LiDAR and collisions.
// Camera optical centre is at half the height of a one-metre obstacle.
export function renderCamera(robot,world=TRAINING_WORLD){
 const pose=sensorPose(robot,'camera'),width=CAMERA_WIDTH,height=CAMERA_HEIGHT,focal=width/2,horizon=height/2;
 const data=new Uint8Array(width*height*3),surfaces=worldSurfaces(world);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++)data.set(y<horizon?[75,104,127]:[65,73,66],(y*width+x)*3);
 for(let x=0;x<width;x++){
  const lateral=(focal-x-.5)/focal,angle=pose.yaw+Math.atan(lateral);let range=Infinity,hit;
  for(const surface of surfaces){const distance=rayBox(pose.x,pose.y,Math.cos(angle),Math.sin(angle),surface);if(distance<range){range=distance;hit=surface;}}
  if(!hit)continue;
  const depth=Math.max(.02,range/Math.sqrt(1+lateral*lateral));
  const top=Math.max(0,Math.floor(horizon-focal*((hit.height??1)-.5)/depth)),bottom=Math.min(height,Math.ceil(horizon+focal*.5/depth));
  const shade=Math.max(.45,1-depth*.035),color=(hit.color??[108,130,135]).map(value=>Math.round(value*shade));
  for(let y=top;y<bottom;y++)data.set(color,(y*width+x)*3);
 }
 return {height,width,encoding:'rgb8',is_bigendian:0,step:width*3,data};
}
