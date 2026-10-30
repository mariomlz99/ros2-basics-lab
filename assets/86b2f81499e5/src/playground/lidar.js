import {SENSORS,ROBOT_RADIUS,sensorPose} from './sensors.js';
export {ROBOT_RADIUS} from './sensors.js';
export const BEAMS=120, RANGE_MAX=10, LASER_OFFSET=SENSORS.lidar.x;
export const TRAINING_WORLD={bounds:{minX:-2,maxX:8,minY:-4,maxY:4},obstacles:[{x:3,y:-.6,w:.6,h:1.2,height:1,color:[172,129,112]}]};
export function worldSurfaces(world){const surfaces=[...(world?.obstacles??[])];if(world?.bounds){const b=world.bounds;surfaces.push({x:b.minX,y:b.minY,w:b.maxX-b.minX,h:b.maxY-b.minY,height:2,color:[108,130,135]});}return surfaces;}
export function rayBox(x,y,dx,dy,box){
  let near=-Infinity,far=Infinity;
  for(const [origin,direction,min,max]of [[x,dx,box.x,box.x+box.w],[y,dy,box.y,box.y+box.h]]){
    if(Math.abs(direction)<1e-12){if(origin<min||origin>max)return Infinity;continue;}
    let a=(min-origin)/direction,b=(max-origin)/direction;if(a>b)[a,b]=[b,a];near=Math.max(near,a);far=Math.min(far,b);
  }
  if(far<Math.max(near,0))return Infinity;return near>=0?near:far;
}
export function laserScan(robot,world,stamp){
  const {x,y,yaw}=sensorPose(robot,'lidar'),ranges=[];
  const objects=worldSurfaces(world);
  for(let i=0;i<BEAMS;i++){const a=yaw-Math.PI+i*2*Math.PI/BEAMS;let distance=Infinity;for(const box of objects)distance=Math.min(distance,rayBox(x,y,Math.cos(a),Math.sin(a),box));ranges.push(distance<=RANGE_MAX?Math.max(.05,distance):Infinity);}
  return {header:{stamp,frame_id:SENSORS.lidar.frame},angle_min:-Math.PI,angle_max:Math.PI-2*Math.PI/BEAMS,angle_increment:2*Math.PI/BEAMS,time_increment:0,scan_time:SENSORS.lidar.period,range_min:.05,range_max:RANGE_MAX,ranges,intensities:[]};
}
export function collides(robot,world){
  if(!world)return false;const {x,y}=robot,b=world.bounds,r=ROBOT_RADIUS;
  if(b&&(x-r<b.minX||x+r>b.maxX||y-r<b.minY||y+r>b.maxY))return true;
  return (world.obstacles??[]).some(o=>Math.hypot(x-Math.max(o.x,Math.min(x,o.x+o.w)),y-Math.max(o.y,Math.min(y,o.y+o.h)))<r);
}
