import{setup,cmake}from'../workspace.js';
export function sensorFiles(language){const py=language==='python',pkg='sensor_lab';const python=(type,topic,body)=>`import rclpy
from rclpy.node import Node
from sensor_msgs.msg import ${type}

class Reader(Node):
    def __init__(self):
        super().__init__('${type.toLowerCase()}_reader')
        self.subscription = self.create_subscription(${type}, '${topic}', self.receive, 10)

    def receive(self, message):
        ${body}

def main(args=None):
    rclpy.init(args=args)
    node = Reader()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()
`;
const cpp=(type,header,topic,body)=>`#include <memory>
#include <algorithm>
#include <rclcpp/rclcpp.hpp>
#include <sensor_msgs/msg/${header}.hpp>
int main(int argc, char **argv) {
  rclcpp::init(argc, argv);
  auto node = std::make_shared<rclcpp::Node>("${header}_reader");
  auto sub = node->create_subscription<sensor_msgs::msg::${type}>("${topic}", 10,
    [node](sensor_msgs::msg::${type}::SharedPtr message) {
      ${body}
    });
  rclcpp::spin(node);
  rclcpp::shutdown();
  return 0;
}
`;
return py?{[pkg+'/lidar.py']:python('LaserScan','/scan',"self.get_logger().info(f'Front: {message.ranges[len(message.ranges)//2]:.2f} m; nearest: {min(message.ranges):.2f} m')"),[pkg+'/camera.py']:python('Image','/camera/image_raw',"self.get_logger().info(f'Image: {message.width} × {message.height}, {message.encoding}')"),'setup.py':setup(pkg,[`lidar = ${pkg}.lidar:main`,`camera = ${pkg}.camera:main`])}:{'src/lidar.cpp':cpp('LaserScan','laser_scan','/scan','RCLCPP_INFO(node->get_logger(), "Front: %.2f m; nearest: %.2f m", message->ranges[message->ranges.size()/2], *std::min_element(message->ranges.begin(), message->ranges.end()));'),'src/camera.cpp':cpp('Image','image','/camera/image_raw','RCLCPP_INFO(node->get_logger(), "Image: %u x %u", message->width, message->height);'),'CMakeLists.txt':cmake(pkg,{lidar:'src/lidar.cpp',camera:'src/camera.cpp'},['rclcpp','sensor_msgs'])};}


// Valid, runnable scaffolds. Sensor processing is left for the student; package
// metadata remains identical to the optional reference implementation.
export function sensorSkeletons(language){
 const files=sensorFiles(language),out={};
 for(const [path,source]of Object.entries(files)){
  if(language==='python'&&path.endsWith('.py')&&path!=='setup.py')out[path]=source.replace(/        self.get_logger\(\).info\([^\n]+/, '        # TODO: inspect the message fields and print your observation.\n        pass');
  if(language==='cpp'&&path.endsWith('.cpp'))out[path]=source.replace(/      RCLCPP_INFO\([^\n]+/, '      // TODO: inspect the message fields and print your observation.\n      (void)message;');
 }
 return out;
}
