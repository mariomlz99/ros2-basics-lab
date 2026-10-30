import {sensorFiles,sensorSkeletons} from './examples.js';
const text=body=>({kind:'text',body});
const commands=(terminal,...commands)=>({kind:'commands',terminal,commands});
const stop={kind:'terminal-action',terminal:1,action:'ctrl-c'};
const move="ros2 topic pub --rate 5 /cmd_vel geometry_msgs/msg/Twist '{linear: {x: 0.2}}'";
const halt="ros2 topic pub --once /cmd_vel geometry_msgs/msg/Twist '{}'";
const reset={kind:'simulator-action',action:'reset',body:'Start playground if it is stopped. Stop any velocity publisher with Ctrl+C, then choose Reset robot pose. This simulator control puts the robot at x = 0, y = 0, facing +x; it does not delete files.'};

export function playgroundExercises(language){const py=language==='python';return [
 {id:'intro',title:'Introduction to the simulator',steps:[
  text('Optional robotics practice. The world is viewed from above; the camera and LiDAR are mounted on the robot. All three views describe the same room. The robot has a body, two drive wheels, a front marker and sensors. Each floor square is 1 m × 1 m, as with a one-metre grid in RViz2. The room is 10 m × 8 m. World +x points right and +y points up. Robot +x points forward, +y left and +z up; positive angular.z turns left.'),
  {kind:'simulator-action',action:'start',body:'Choose Start playground above. Preview pictures alone do not mean ROS publishers are running. Open a second terminal with + Terminal for observations while Terminal 1 commands motion.'},
  commands(1,'ros2 node list','ros2 topic list -t','ros2 node info /playground'),
  text('Find /cmd_vel (commands), /odom (pose and velocity), /tf and /tf_static (frame relationships), /scan and /camera/image_raw (sensors). These are standard ROS 2 messages. This browser simulates the robot and its sensors; it does not run Gazebo or a physical robot.'),
  commands(1,move),
  text('Watch the robot move forward. The publisher keeps Terminal 1 busy; use Terminal 2 to inspect topics. Press Ctrl+C in Terminal 1 before entering the stop command below. Stopping a publisher does not itself send a zero velocity; this robot also has a two-second command timeout. Its differential drive uses linear.x and angular.z; other Twist components do not move it. Commands are limited to ±2 m/s and ±3 rad/s.'),stop,commands(1,halt),
  text('Check: the robot stops, but sensor messages continue while the simulator is running. Stop playground ends its publishers. The four mini-exercises can be revisited in any order; reset the pose first for repeatable observations.')
 ]},
 {id:'odom',title:'1. Odometry | where is the robot?',steps:[reset,
  text('Odometry describes pose and velocity. Here pose is expressed in odom; velocity is expressed in base_link. This simulator publishes its ideal pose with zero covariance. Real odometry is an estimate and can drift; zero covariance here is not a claim about real sensor accuracy.'),
  commands(1,'ros2 topic type /odom','ros2 topic echo /odom --once --field header','ros2 topic echo /odom --once --field child_frame_id','ros2 topic echo /odom --once --field pose.pose'),
  text('Expect frame_id: odom, child_frame_id: base_link, zero position and orientation w: 1.0 after resetting. --once prints the next sample and exits. --field selects part of a message, so you can focus on one idea.'),commands(1,move),
  commands(2,'ros2 topic echo /odom --once --field twist.twist','ros2 topic echo /odom --once --field pose.pose.position'),stop,commands(1,halt),
  text('Explain: which position changes while driving straight? Why is linear.x about 0.2 while linear.y stays zero? Try moving again and compare the change in x after roughly two seconds: it should be about 0.4 m before a collision. Command timing and when you sample affect the exact value.')
 ]},
 {id:'tf',title:'2. TF | how do frames connect?',steps:[reset,
  text('A frame is a coordinate system, not a ROS node. TF publishes relationships between frames. The moving transform says where base_link is in odom; fixed transforms describe sensor mounts on the robot. left_wheel_link is on the positive-y side and right_wheel_link on the negative-y side of base_link. Their mounts stay in place, but rolling changes their orientation, so both wheel transforms are dynamic on /tf. A topic name such as /scan is not a frame name.'),
  {kind:'frame-tree'},
  commands(1,'ros2 interface show tf2_msgs/msg/TFMessage','ros2 topic echo /tf --once','ros2 topic echo /tf_static --once --qos-durability transient_local --qos-reliability reliable'),
  text('Read header.frame_id as the parent and child_frame_id as the child. The laser is 0.12 m in front of base_link; the camera is 0.10 m in front. Static transforms are retained while their publisher is alive: transient_local lets a late subscriber receive them. The rotation uses a quaternion (x, y, z, w), not four angles.'),
  commands(1,"ros2 topic pub --rate 5 /cmd_vel geometry_msgs/msg/Twist '{angular: {z: 0.4}}'"),commands(2,'ros2 topic echo /tf --once','ros2 topic echo /odom --once --field pose.pose.orientation'),stop,commands(1,halt),
  text('Explain: rotation in odom → base_link changes as the robot turns. Why do base_link → laser_link and base_link → camera_link stay fixed? The odometry orientation and odom → base_link transform describe the same pose; samples taken at different times can differ. camera_optical_frame has +x right, +y down, +z forward, matching image conventions.')
 ]},
 {id:'lidar',title:'3. LiDAR | measure the room',steps:[reset,
  text('A LaserScan contains distances in metres, measured from its header.frame_id. Each range belongs to an angle: angle_min + index × angle_increment. Angles are radians, counter-clockwise around +z. The LiDAR view is centred on laser_link: forward is up and left is left.'),
  commands(1,'ros2 topic type /scan','ros2 topic echo /scan --once --field header','ros2 topic echo /scan --once'),
  text('Here 120 rays cover a full turn. Index 0 looks backwards; index 60 looks forwards. At the reset pose the front range is about 2.88 m; the wall behind is closer, about 2.12 m. The closest return is not necessarily in front! This bounded simulator uses range_max for a ray with no return; real sensors can also report infinity or NaN.'),
  commands(1,move),commands(2,'ros2 topic echo /scan --once'),stop,commands(1,halt),
  text('Compare: the front return gets shorter as the robot approaches the brown obstacle. It measures from the laser mount, not the centre of base_link. Turn left a little and inspect again: the obstacle moves to a different angle. Can you explain that using TF?')
 ]},
 {id:'camera',title:'4. Camera | understand an image',steps:[reset,
  text('The camera view displays the RGB image published on /camera/image_raw. Inspect metadata first: echoing every pixel would bury the useful information. An image describes appearance, not a distance measurement.'),
  commands(1,'ros2 topic type /camera/image_raw','ros2 topic echo /camera/image_raw --once --field header','ros2 topic echo /camera/image_raw --once --field width','ros2 topic echo /camera/image_raw --once --field height','ros2 topic echo /camera/image_raw --once --field encoding','ros2 topic echo /camera/image_raw --once --field step'),
  text('Expect camera_optical_frame, 320 × 240 pixels, rgb8, and step = 960 bytes per row (320 × 3 colour channels). The header timestamp describes image acquisition. The optical frame points forward along +z; image right is +x and image down is +y.'),commands(1,move),
  text('Watch the camera while the robot approaches. The obstacle grows in the image while its front LiDAR distance decreases. Press Ctrl+C after a short movement, then send zero velocity.'),stop,commands(1,halt),
  text('Explain: why can the same object occupy different numbers of pixels without changing its physical size? Try a left turn: the object shifts right in the image. Compare camera and LiDAR; an ordinary RGB image has no range field.')
 ]},
 {id:'readers',title:'Optional | write a sensor reader',steps:[
  text('After the short experiments, reuse package → build → source → run to subscribe from your own code. Start playground first. These readers only print measurements; they do not drive the robot. Choose Add starter skeleton to write the callback yourself. The skeleton already subscribes to the correct sensor topic. Use message.ranges for LiDAR, or message.width, message.height and message.encoding for the image (message->field in C++). Show reference solution reveals a working example; Add file or Replace with example applies it explicitly.'),
  commands(1,'mkdir -p ~/ros2_ws/src','cd ~/ros2_ws/src',`ros2 pkg create --build-type ${py?'ament_python':'ament_cmake'} --license Apache-2.0 sensor_lab --dependencies ${py?'rclpy':'rclcpp'} sensor_msgs`),
  {kind:'files',pkg:'sensor_lab',items:sensorFiles(language),starters:sensorSkeletons(language)},
  commands(1,'cd ~/ros2_ws','colcon build --packages-select sensor_lab','source install/setup.bash','ros2 run sensor_lab lidar'),
  text('Leave the LiDAR reader running; in Terminal 2, source the same workspace and start the camera reader.'),commands(2,'source ~/ros2_ws/install/setup.bash','ros2 run sensor_lab camera'),
  text('Compare the front/nearest LiDAR values and image dimensions with your earlier terminal observations. Stop each reader with Ctrl+C. A useful mistake to investigate: ros2 run cannot find sensor_lab in a new terminal until you source its install overlay.')
 ]}
];}
export function playgroundLesson(language){return playgroundExercises(language).flatMap(({id,title,steps})=>[{kind:'section',id,title},...steps]);}
