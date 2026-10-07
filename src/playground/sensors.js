// Metres/radians relative to base_link. Shared by TF, rendering and ray casting.
export const ROBOT_RADIUS=0.18;
export const SENSORS=Object.freeze({
  lidar:Object.freeze({frame:'laser_link',x:0.12,y:0,yaw:0,period:0.50}),
  camera:Object.freeze({frame:'camera_link',x:0.10,y:0,yaw:0,period:0.50,width:320,height:240})
});
export function sensorPose(robot,name){
  const mount=SENSORS[name];if(!mount)throw Error('Unknown sensor: '+name);
  const c=Math.cos(robot.yaw),s=Math.sin(robot.yaw);
  return {x:robot.x+c*mount.x-s*mount.y,y:robot.y+s*mount.x+c*mount.y,yaw:robot.yaw+mount.yaw};
}
