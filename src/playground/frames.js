import {SENSORS} from './sensors.js';
export const yawQuaternion=yaw=>({x:0,y:0,z:Math.sin(yaw/2),w:Math.cos(yaw/2)});
const vector=(x=0,y=0,z=0)=>({x,y,z});
const transform=(stamp,parent,child,translation,rotation)=>({header:{stamp,frame_id:parent},child_frame_id:child,transform:{translation,rotation}});
export function dynamicTransforms(robot,stamp){
 return {transforms:[transform(stamp,'odom','base_link',vector(robot.x,robot.y),yawQuaternion(robot.yaw))]};
}
export function staticTransforms(stamp){
 return {transforms:[
  ...Object.values(SENSORS).map(sensor=>transform(stamp,'base_link',sensor.frame,vector(sensor.x,sensor.y,sensor.z),yawQuaternion(sensor.yaw))),
  // REP 103 optical axes: image right +x, image down +y, forward +z.
  transform(stamp,'camera_link','camera_optical_frame',vector(),{x:-.5,y:.5,z:-.5,w:.5})
 ]};
}
export function odometry(robot,stamp){
 return {header:{stamp,frame_id:'odom'},child_frame_id:'base_link',
  pose:{pose:{position:vector(robot.x,robot.y),orientation:yawQuaternion(robot.yaw)},covariance:Array(36).fill(0)},
  twist:{twist:{linear:vector(robot.linear),angular:vector(0,0,robot.angular)},covariance:Array(36).fill(0)}};
}
