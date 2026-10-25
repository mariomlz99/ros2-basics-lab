import {odometryExercise} from '../playground/odometry-lesson.js';
import {setup,cmake} from '../workspace.js';
import {programOwners} from '../runtime/program-evidence.js';
import {TF_TARGET} from './target.js';

export const TF_TITLE='TF & Odometry';
export const TF_PACKAGE='tf_lab';
export {TF_TARGET};
export const tfDependencies=language=>[language==='python'?'rclpy':'rclcpp','geometry_msgs','tf2_ros','tf2_geometry_msgs',...(language==='python'?[]:['tf2'])];
const text=body=>({kind:'text',body});
const commands=(...commands)=>({kind:'commands',terminal:1,commands});
const reflection=(question,answer)=>({kind:'tf-reflection',question,answer});
const build=executable=>commands('cd ~/ros2_ws','colcon build --packages-select tf_lab','source install/setup.bash','ros2 run tf_lab '+executable);

function pythonProgram(exercise,starter){
 const point=exercise==='point';
 const body=point?(starter?`            # TODO: express target in base_link with self.buffer.transform.
            # Print the result's point.x and point.y.
            self.get_logger().info('Target is ready in odom')`:`            result = self.buffer.transform(target, 'base_link')
            self.get_logger().info(f'x = {result.point.x:.2f}, y = {result.point.y:.2f} m')`):`            transform = self.buffer.lookup_transform('base_link', '${starter?'laser':'laser_link'}', Time())
            self.get_logger().info(f'x = {transform.transform.translation.x:.2f}, y = {transform.transform.translation.y:.2f} m')`;
 return `import rclpy
from rclpy.node import Node
from rclpy.time import Time
from tf2_ros import Buffer, TransformListener, TransformException
${point?`from geometry_msgs.msg import PointStamped
import tf2_geometry_msgs  # Registers PointStamped with TF.
`:''}
class FrameReader(Node):
    def __init__(self):
        super().__init__('tf_${exercise}')
        self.buffer = Buffer()
        self.listener = TransformListener(self.buffer, self)
        self.timer = self.create_timer(0.5, self.observe)

    def observe(self):
${point?`        target = PointStamped()
        target.header.frame_id = 'odom'
        target.point.x = ${TF_TARGET.x.toFixed(1)}
        target.point.y = ${TF_TARGET.y.toFixed(1)}
`:''}        try:
${body}
        except TransformException as error:
            self.get_logger().info(f'TF lookup failed: {error}')

def main(args=None):
    rclpy.init(args=args)
    node = FrameReader()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()
`;
}

function cppProgram(exercise,starter){
 const point=exercise==='point';
 const body=point?(starter?`    // TODO: express target in base_link with buffer.transform.
    // Print the result's point.x and point.y.
    RCLCPP_INFO(node->get_logger(), "Target is ready in odom");`:`    auto result = buffer.transform(target, "base_link");
    RCLCPP_INFO(node->get_logger(), "x = %.2f, y = %.2f m", result.point.x, result.point.y);`):`    auto transform = buffer.lookupTransform("base_link", source_frame, tf2::TimePointZero);
    RCLCPP_INFO(node->get_logger(), "x = %.2f, y = %.2f m",
      transform.transform.translation.x, transform.transform.translation.y);`;
 return `#include <chrono>
#include <memory>
#include <rclcpp/rclcpp.hpp>
#include <tf2_ros/buffer.h>
#include <tf2_ros/transform_listener.h>
${point?'#include <tf2_geometry_msgs/tf2_geometry_msgs.hpp>\n':''}
int main(int argc, char **argv) {
  rclcpp::init(argc, argv);
  auto node = std::make_shared<rclcpp::Node>("tf_${exercise}");
  tf2_ros::Buffer buffer(node->get_clock());
  tf2_ros::TransformListener listener(buffer, node, false);
  auto timer = node->create_wall_timer(std::chrono::milliseconds(500), [&]() {
${point?`    geometry_msgs::msg::PointStamped target;
    target.header.frame_id = "odom";
    target.point.x = ${TF_TARGET.x.toFixed(1)};
    target.point.y = ${TF_TARGET.y.toFixed(1)};
`:''}
    const std::string source_frame = "${point?'odom':starter?'laser':'laser_link'}";
    std::string error;
    if (!buffer.canTransform("base_link", source_frame, tf2::TimePointZero, tf2::Duration::zero(), &error)) {
      RCLCPP_INFO(node->get_logger(), "TF lookup failed: %s", error.c_str());
      return;
    }
${body}
  });
  rclcpp::spin(node);
  rclcpp::shutdown();
  return 0;
}
`;
}

// Prepare both sources once. Per-exercise file cards share the same package
// metadata so adding a reference never unregisters the other executable.
export function tfFiles(language,exercise='all',{starter=false}={}){
 const ids=exercise==='all'?['lookup','point']:[exercise];
 if(ids.some(id=>!['lookup','point'].includes(id)))throw Error('Unknown TF coding exercise: '+exercise);
 const py=language==='python',files={};
 for(const id of ids)files[py?`${TF_PACKAGE}/${id}.py`:`src/${id}.cpp`]=(py?pythonProgram:cppProgram)(id,starter);
 if(py)files['setup.py']=setup(TF_PACKAGE,['lookup = tf_lab.lookup:main','point = tf_lab.point:main']);
 else files['CMakeLists.txt']=cmake(TF_PACKAGE,{lookup:'src/lookup.cpp',point:'src/point.cpp'},tfDependencies(language));
 return files;
}

export function tfExercises(language){const py=language==='python';return [
 {id:'frames',title:'1. Frames | one point, different coordinates',steps:[
  text('A frame is a coordinate system with an origin and an orientation. A transform describes the relationship between two frames. A TF tree connects those relationships so ROS can express a point in another frame.'),
  text('Start the simulator in the TF view. Select odom, then base_link, then laser_link. The robot body uses base_link: +x points forward and +y points left. The laser has its own origin at its mount. Red axes show +x; green axes show +y. Labels and axis letters identify each frame too.'),
  text('odom stays fixed in this simulated room; base_link moves with the robot. Robots use several frames because measurements belong to sensors while movement is described relative to the robot or its surroundings. The same physical point can have different coordinates in each frame.'),
  commands('ros2 topic list','ros2 topic type /tf','ros2 topic type /tf_static','ros2 topic echo /tf --once'),
  text('Both TF topics carry tf2_msgs/msg/TFMessage, a list of TransformStamped messages. --once prints one sample and returns to the prompt. Read header.frame_id as the parent and child_frame_id as the child.'),
  reflection('Which frame stays fixed when the robot moves? Which frames travel with it?','odom stays fixed here. base_link, laser_link, camera_link, camera_optical_frame and both wheel frames travel with the robot. A frame is a coordinate system; it is not a topic or a ROS node.')
 ]},
 {id:'tree',title:'2. Tree | fixed mounts, moving robot',steps:[
  text('Select odom → base_link in the tree. Use Move forward, then Turn left, and watch the moving relationship beside the fixed laser mount. The robot position and heading change in odom. base_link → laser_link stays x = 0.12 m, y = 0.00 m, yaw = 0.00 rad because the sensor is bolted to the body. Use Stop motion to stop.'),
  text('A static transform stays constant: the laser mount, camera mount and camera optical frame. A dynamic transform can change: odom → base_link and the wheels. The wheel centres stay at their mounts, but the wheels roll, so their orientation changes. The tree labels these edges static or dynamic.'),
  commands('ros2 topic echo /tf_static --once --qos-durability transient_local --qos-reliability reliable'),
  text('This command asks for the retained static sample, even after its original publication. /tf carries changing relationships; /tf_static carries fixed relationships. A chain through the tree connects laser_link to odom through base_link. The inspector emphasizes x, y and yaw; ROS message details shows the quaternion fields ROS uses for orientation.'),
  reflection('Does a static laser transform mean the laser stays still in the room?','No. laser_link stays fixed relative to base_link, and both move relative to odom. “Static” describes a relationship between frames. Select odom → laser_link to see that combined relationship change.')
 ]},
 {id:'lookup',title:'3. Lookup | ask TF from your code',steps:[
  text('Prepare this unit to create the small tf_lab package and starter files. Keep the simulator running. The listener receives TF into a Buffer; a timer lets incoming transforms arrive before each lookup. This program prints twice per second. If TF is unavailable it reports the missing frame and waits; starting or restarting the simulator resumes readings. Ctrl+C or Stop ends the reader.'),
  text(py?"lookup_transform('base_link', 'laser_link', Time()) asks for laser_link expressed in base_link: target frame first, source frame second. Time() requests the latest available transform.":'lookupTransform("base_link", "laser_link", tf2::TimePointZero) asks for laser_link expressed in base_link: target frame first, source frame second. TimePointZero requests the latest available transform.'),
  {kind:'files',pkg:TF_PACKAGE,items:tfFiles(language,'lookup'),starters:tfFiles(language,'lookup',{starter:true})},
  text('Run the starter unchanged once. It deliberately asks for laser, which is not a frame in this tree. Expect a clear TF lookup failure.'+' The reader keeps waiting; stop it before editing.'+' Inspect the tree and change laser to laser_link. Save, rebuild, source and run again using the commands below. Expect x = 0.12, y = 0.00 m.'),
  build('lookup'),
  text('The result is a TransformStamped. transform.translation.x and .y locate the laser origin in base_link. Reading the live transform is the task; printing copied numbers does not pass. Frame names must match the TF tree.'),
  {kind:'tf-check',exercise:'lookup'}
 ]},
 {id:'point',title:'4. Apply | the target from the robot',steps:[
  text('The marked target stays at x = 1.00 m, y = 1.00 m in odom. Move the robot in the TF view and watch the arrow from base_link to the same point. Its coordinates relative to the robot change while the physical target stays put.'),
  text('Stop the lookup program. Open the point starter: it already creates a PointStamped with header.frame_id = odom and the target coordinates. Complete the TODO: use the Buffer to express that point in base_link, then print the resulting point.x and point.y. The zero timestamp requests the latest available transform.'),
  {kind:'files',pkg:TF_PACKAGE,items:tfFiles(language,'point'),starters:tfFiles(language,'point',{starter:true})},
  text(py?"Use self.buffer.transform(target, 'base_link'). Importing tf2_geometry_msgs registers PointStamped so the Buffer knows how to transform it.":'Use buffer.transform(target, "base_link"). The tf2_geometry_msgs header supplies the PointStamped transform support.'),
  build('point'),
  text('Compare the printed x/y with the target’s base_link coordinates in the view. Reset pose gives (1.00, 1.00); move again and both readings change together. Positive x means ahead of the robot; positive y means to its left. TF handles the translation and rotation for you. No driving algorithm is needed.'),
  {kind:'tf-check',exercise:'point'},
  reflection('Why transform a measurement or target into another frame?','It lets values described by different coordinate systems be compared. Here TF expresses a room target relative to the robot; the same idea lets a robot interpret a sensor measurement relative to its body.')
 ]},odometryExercise(language)
];}
export function tfLesson(language){return tfExercises(language).flatMap(({id,title,steps})=>[{kind:'section',id,title},...steps]);}

const near=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=1e-8;
const pointMatches=(a,b)=>a&&b&&['x','y','z'].every(key=>near(a[key],b[key]));
const finitePoint=point=>point&&['x','y','z'].every(key=>Number.isFinite(point[key]));
// Bridge-verified TF events belong to a current installed program and its latest
// run. Terminal inspection, source text, copied output and old runs are not proof.
export function tfChecks(lab,exercise){
 if(exercise==='frames'||exercise==='tree')return [];
 const owners=programOwners(lab),events=(lab.runtime.tfEvidence??[]).filter(event=>owners.has(event.owner));
 const lookup=events.some(event=>event.operation==='lookup'&&event.target==='base_link'&&event.source==='laser_link'&&event.result?.header?.frame_id==='base_link'&&event.result?.child_frame_id==='laser_link'&&finitePoint(event.result?.transform?.translation)&&event.outputMatches===true);
 const point=events.some(event=>event.operation==='point'&&event.target==='base_link'&&event.source==='odom'&&event.input?.header?.frame_id==='odom'&&pointMatches(event.input?.point,TF_TARGET)&&event.result?.header?.frame_id==='base_link'&&finitePoint(event.result?.point)&&event.outputMatches===true);
 const checks={lookup:{label:'Your current program looked up laser_link in base_link and printed matching x/y',passed:lookup},point:{label:'Your current program expressed the odom target in base_link and printed matching x/y',passed:point}};
 return exercise?[checks[exercise]].filter(Boolean):[checks.lookup,checks.point];
}
