import {Robot} from '../src/playground/robot.js';
import {dynamicTransforms,staticTransforms,odometry} from '../src/playground/frames.js';
import {laserScan,TRAINING_WORLD} from '../src/playground/lidar.js';
import {renderCamera} from '../src/playground/camera.js';
import {playgroundExercises} from '../src/playground/lessons.js';
export function playgroundSamples(){
 const robot=new Robot();robot.x=1;robot.yaw=.6;robot.command(.2,.4);
 const stamp={sec:123,nanosec:500000000},image=renderCamera(robot),scan=laserScan(robot,TRAINING_WORLD,stamp);
 scan.ranges=scan.ranges.map(v=>Number.isFinite(v)?v:scan.range_max);
 return {
  '/odom':{type:'nav_msgs/msg/Odometry',message:odometry(robot,stamp)},
  '/tf':{type:'tf2_msgs/msg/TFMessage',message:dynamicTransforms(robot,stamp)},
  '/tf_static':{type:'tf2_msgs/msg/TFMessage',message:staticTransforms(stamp),durability:'transient_local'},
  '/scan':{type:'sensor_msgs/msg/LaserScan',message:scan},
  '/camera/image_raw':{type:'sensor_msgs/msg/Image',message:{header:{stamp,frame_id:'camera_optical_frame'},width:image.width,height:image.height,encoding:image.encoding,step:image.step,is_bigendian:0,data:Array.from(image.data)}}
 };
}
export const inspectionCommands=[...new Set(playgroundExercises('python').flatMap(e=>e.steps.flatMap(s=>s.kind==='commands'?s.commands:[])).filter(c=>/^ros2 (topic (echo|type)|interface show)/.test(c)))];
