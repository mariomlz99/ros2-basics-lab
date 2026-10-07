import{setup,cmake,manifest}from'./workspace.js';
export const pythonTalker=`import rclpy
from rclpy.node import Node
from std_msgs.msg import String

class Talker(Node):
    def __init__(self):
        super().__init__('talker')
        self.publisher = self.create_publisher(String, 'topic', 10)
        self.count = 0
        self.timer = self.create_timer(0.5, self.publish_message)

    def publish_message(self):
        message = String()
        message.data = f'Hello World: {self.count}'
        self.publisher.publish(message)
        self.get_logger().info(f'Publishing: "{message.data}"')
        self.count += 1

def main(args=None):
    rclpy.init(args=args)
    node = Talker()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()

if __name__ == '__main__':
    main()
`;
export const pythonListener=`import rclpy
from rclpy.node import Node
from std_msgs.msg import String

class Listener(Node):
    def __init__(self):
        super().__init__('listener')
        self.subscription = self.create_subscription(String, 'topic', self.receive, 10)

    def receive(self, message):
        self.get_logger().info(f'I heard: "{message.data}"')

def main(args=None):
    rclpy.init(args=args)
    node = Listener()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()

if __name__ == '__main__':
    main()
`;
export const cppTalker=`#include <chrono>
#include <memory>
#include <rclcpp/rclcpp.hpp>
#include <std_msgs/msg/string.hpp>
using namespace std::chrono_literals;

class Talker : public rclcpp::Node {
public:
  Talker() : Node("talker") {
    publisher_ = create_publisher<std_msgs::msg::String>("topic", 10);
    timer_ = create_wall_timer(500ms, [this]() {
      std_msgs::msg::String message;
      message.data = "Hello World: " + std::to_string(count_++);
      publisher_->publish(message);
      RCLCPP_INFO(get_logger(), "Publishing: \\"%s\\"", message.data.c_str());
    });
  }
private:
  rclcpp::Publisher<std_msgs::msg::String>::SharedPtr publisher_;
  rclcpp::TimerBase::SharedPtr timer_;
  int count_ = 0;
};
int main(int argc, char **argv) {
  rclcpp::init(argc, argv);
  rclcpp::spin(std::make_shared<Talker>());
  rclcpp::shutdown();
  return 0;
}
`.replaceAll('\\\\"','\\"');
export const cppListener=`#include <memory>
#include <rclcpp/rclcpp.hpp>
#include <std_msgs/msg/string.hpp>

class Listener : public rclcpp::Node {
public:
  Listener() : Node("listener") {
    subscription_ = create_subscription<std_msgs::msg::String>("topic", 10,
      [this](std_msgs::msg::String::SharedPtr message) {
        RCLCPP_INFO(get_logger(), "I heard: \\"%s\\"", message->data.c_str());
      });
  }
private:
  rclcpp::Subscription<std_msgs::msg::String>::SharedPtr subscription_;
};
int main(int argc, char **argv) {
  rclcpp::init(argc, argv);
  rclcpp::spin(std::make_shared<Listener>());
  rclcpp::shutdown();
  return 0;
}
`.replaceAll('\\\\"','\\"');
export function pubsubFiles(language){const py=language==='python',name=py?'py_pubsub':'cpp_pubsub';return py?{[name+'/publisher.py']:pythonTalker,[name+'/subscriber.py']:pythonListener,'setup.py':setup(name,[`talker = ${name}.publisher:main`,`listener = ${name}.subscriber:main`])}:{'src/publisher.cpp':cppTalker,'src/subscriber.cpp':cppListener,'CMakeLists.txt':cmake(name,{talker:'src/publisher.cpp',listener:'src/subscriber.cpp'},['rclcpp','std_msgs'])};}
export const parameterTalker=pythonTalker.replace("self.count = 0","self.declare_parameter('message_prefix', 'Hello World')\n        self.declare_parameter('publish_rate', 2.0)\n        self.count = 0\n        self.elapsed = 0.0").replace('self.create_timer(0.5,','self.create_timer(0.05,').replace('        message = String()',"        self.elapsed += 0.05\n        rate = self.get_parameter('publish_rate').value\n        if self.elapsed < 1.0 / rate:\n            return\n        self.elapsed = 0.0\n        message = String()").replace("message.data = f'Hello World: {self.count}'","prefix = self.get_parameter('message_prefix').value\n        message.data = f'{prefix}: {self.count}'");
export const cppParameterTalker=cppTalker.replace('publisher_ = create_publisher',`declare_parameter<std::string>("message_prefix", "Hello World");\n    declare_parameter<double>("publish_rate", 2.0);\n    publisher_ = create_publisher`).replace('500ms','50ms').replace('      std_msgs::msg::String message;',`      elapsed_ += 0.05;\n      if (elapsed_ < 1.0 / get_parameter("publish_rate").as_double()) return;\n      elapsed_ = 0;\n      std_msgs::msg::String message;`).replace('"Hello World: " +',`get_parameter("message_prefix").as_string() + ": " +`).replace('int count_ = 0;','int count_ = 0;\n  double elapsed_ = 0;');
export function launchSource(name){return `from launch import LaunchDescription
from launch_ros.actions import Node

def generate_launch_description():
    return LaunchDescription([
        Node(package='${name}', executable='talker', name='talker',
             parameters=[{'message_prefix': 'Launched'}],
             remappings=[('topic', 'conversation')]),
        Node(package='${name}', executable='listener', name='listener',
             remappings=[('topic', 'conversation')]),
    ])
`;}
