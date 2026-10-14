import {setup,cmake} from '../workspace.js';
const text=body=>({kind:'text',body});
const commands=(terminal,...commands)=>({kind:'commands',terminal,commands});
const stop={kind:'terminal-action',terminal:1,action:'ctrl-c'};
const halt=commands(1,"ros2 topic pub --once /cmd_vel geometry_msgs/msg/Twist '{}'");
export function odometryFiles(language){
 if(language==='python')return {
  'odom_lab/reader.py':`import math
import rclpy
from rclpy.node import Node
from nav_msgs.msg import Odometry

class OdomReader(Node):
    def __init__(self):
        super().__init__('odom_reader')
        self.subscription = self.create_subscription(Odometry, '/odom', self.observe, 10)

    def observe(self, message):
        p = message.pose.pose.position
        q = message.pose.pose.orientation
        yaw = math.atan2(2.0 * (q.w * q.z + q.x * q.y),
                         1.0 - 2.0 * (q.y * q.y + q.z * q.z))
        v = message.twist.twist.linear.x
        self.get_logger().info(
            f'x={p.x:.3f} y={p.y:.3f} yaw={yaw:.3f} v={v:.3f}')

def main(args=None):
    rclpy.init(args=args)
    node = OdomReader()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()
`,
  'setup.py':setup('odom_lab',['reader = odom_lab.reader:main'])
 };
 return {
  'src/reader.cpp':`#include <cmath>
#include <memory>
#include <rclcpp/rclcpp.hpp>
#include <nav_msgs/msg/odometry.hpp>

int main(int argc, char **argv) {
  rclcpp::init(argc, argv);
  auto node = std::make_shared<rclcpp::Node>("odom_reader");
  auto subscription = node->create_subscription<nav_msgs::msg::Odometry>("/odom", 10,
    [node](nav_msgs::msg::Odometry::SharedPtr message) {
      const auto &p = message->pose.pose.position;
      const auto &q = message->pose.pose.orientation;
      const double yaw = std::atan2(2.0 * (q.w*q.z + q.x*q.y),
                                    1.0 - 2.0 * (q.y*q.y + q.z*q.z));
      RCLCPP_INFO(node->get_logger(), "x=%.3f y=%.3f yaw=%.3f v=%.3f",
        p.x, p.y, yaw, message->twist.twist.linear.x);
    });
  rclcpp::spin(node);
  rclcpp::shutdown();
  return 0;
}
`,
  'CMakeLists.txt':cmake('odom_lab',{reader:'src/reader.cpp'},['rclcpp','nav_msgs'])
 };
}
export function odometryExercise(language){const py=language==='python';return {
 id:'odometry',title:'5. Odometry | motion detective',steps:[
  text('Start the simulator and stop any velocity publisher with Ctrl+C. Reset the robot pose, then choose Mark a new start in the odometry notebook. Open Terminal 2 for observations. The notebook reads published /odom samples; its solid path shows where the robot has been and its dashed line joins the start to the current position.'),
  commands(1,'ros2 topic type /odom','ros2 topic echo /odom --once --field header.frame_id','ros2 topic echo /odom --once --field child_frame_id','ros2 topic echo /odom --once --field pose.pose'),
  text('Read the frames before the numbers: pose is in odom; twist is in base_link. pose.pose contains the position and quaternion, while pose.covariance describes uncertainty. Zero covariance here belongs to an ideal simulation. Real odometry is an estimate and can drift; returning to the same reported pose does not prove a real robot returned exactly.'),
  text('Predict first: drive forward, then reverse along the same line. Will distance from start and path travelled both return to zero? Run forward for about two seconds, inspect in Terminal 2, then stop it with Ctrl+C and send zero velocity.'),
  commands(1,"ros2 topic pub --rate 5 /cmd_vel geometry_msgs/msg/Twist '{linear: {x: 0.2}}'"),
  commands(2,'ros2 topic echo /odom --once --field twist.twist','ros2 topic echo /odom --once --field pose.pose.position'),stop,halt,
  text('Now reverse for about the same time, then stop. Path travelled keeps increasing, including in reverse. Distance from start shrinks as you retrace the line. A sampled path is a sum of short straight segments, so it slightly underestimates curves.'),
  commands(1,"ros2 topic pub --rate 5 /cmd_vel geometry_msgs/msg/Twist '{linear: {x: -0.2}}'"),stop,halt,
  text('Turn in place for roughly two seconds, then stop. Position and path length should barely change while yaw changes. The quaternion z field is not yaw: for a planar rotation, z = sin(yaw/2) and w = cos(yaw/2). Angles are in radians.'),
  commands(1,"ros2 topic pub --rate 5 /cmd_vel geometry_msgs/msg/Twist '{angular: {z: 0.5}}'"),
  commands(2,'ros2 topic echo /odom --once --field pose.pose.orientation'),stop,halt,
  text('Drive forward again after the turn. Body velocity still has positive x and zero y, yet both odom coordinates can change. In this planar example, odom vx = body vx × cos(yaw), and odom vy = body vx × sin(yaw). Compare the two velocity rows. For an arc, combine linear.x and angular.z in the same Twist.'),
  commands(1,"ros2 topic pub --rate 5 /cmd_vel geometry_msgs/msg/Twist '{linear: {x: 0.2}, angular: {z: 0.4}}'"),
  commands(2,'ros2 topic echo /odom --once --field twist.twist'),stop,halt,
  text('Build your own observer. The reader below extracts the nested pose and converts its quaternion to yaw. It only observes; keep the simulator running. Create odom_lab once, add the files, and build from the workspace root.'),
  commands(1,'mkdir -p ~/ros2_ws/src','cd ~/ros2_ws/src',`ros2 pkg create --build-type ${py?'ament_python':'ament_cmake'} --license Apache-2.0 odom_lab --dependencies ${py?'rclpy':'rclcpp'} nav_msgs`),
  {kind:'files',pkg:'odom_lab',items:odometryFiles(language)},
  commands(1,'cd ~/ros2_ws','colcon build --packages-select odom_lab','source install/setup.bash','ros2 run odom_lab reader'),
  text('Compare the reader with the notebook while moving. Samples arrive at different times, so stop motion before comparing exact values. Ctrl+C stops the reader. Try the useful failure cases: pose.position is not a valid echo field; a fresh terminal needs the workspace install/setup.bash before ros2 run can find odom_lab. Building inside src creates a different install overlay.'),
  stop,
  text('Explain the evidence: why can a robot travel a metre and finish near its start? Why can body linear.y stay zero while odom y increases? Why does /odom alone not create a TF relationship? Odometry carries pose and velocity; the simulator separately publishes the matching transform on /tf. Resetting pose is a teaching control, not normal continuous odometry.')
 ]};}
