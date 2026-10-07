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
export function pubsubFiles(language){const py=language==='python',name=py?'py_pubsub':'cpp_pubsub';return py?{[name+'/talker.py']:pythonTalker,[name+'/listener.py']:pythonListener,'setup.py':setup(name,[`talker = ${name}.talker:main`,`listener = ${name}.listener:main`])}:{'src/publisher_member_function.cpp':cppTalker,'src/subscriber_member_function.cpp':cppListener,'CMakeLists.txt':cmake(name,{talker:'src/publisher_member_function.cpp',listener:'src/subscriber_member_function.cpp'},['rclcpp','std_msgs'])};}
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

export function customFiles(){return {
 'msg/Status.msg':'string name\nint32 counter\nbool ready\n',
 'package.xml':manifest('tutorial_interfaces','ament_cmake',['rosidl_default_generators','rosidl_default_runtime']).replace('  <export>','  <member_of_group>rosidl_interface_packages</member_of_group>\n  <export>'),
 'CMakeLists.txt':'cmake_minimum_required(VERSION 3.8)\nproject(tutorial_interfaces)\nfind_package(ament_cmake REQUIRED)\nfind_package(rosidl_default_generators REQUIRED)\nrosidl_generate_interfaces(${PROJECT_NAME} "msg/Status.msg")\nament_package()\n'
};}
export function statusFiles(language){const py=language==='python',pkg=py?'py_pubsub':'cpp_pubsub';const publisher=py?pythonTalker.replace('from std_msgs.msg import String','from tutorial_interfaces.msg import Status').replaceAll('String','Status').replace("'topic'","'status'").replace("message.data = f'Hello World: {self.count}'","message.name = 'Ada'\n        message.counter = self.count\n        message.ready = True").replace('f\'Publishing: "{message.data}"\'',"f'{message.name}: {message.counter}, ready={message.ready}'"):
 cppTalker.replace('#include <std_msgs/msg/string.hpp>','#include <tutorial_interfaces/msg/status.hpp>').replaceAll('std_msgs::msg::String','tutorial_interfaces::msg::Status').replace('"topic"','"status"').replace('message.data = "Hello World: " + std::to_string(count_++);','message.name = "Ada"; message.counter = count_++; message.ready = true;').replace('message.data.c_str()','message.name.c_str()');
 return {[py?pkg+'/status_publisher.py':'src/status_publisher.cpp']:publisher,'package.xml':manifest(pkg,py?'ament_python':'ament_cmake',[py?'rclpy':'rclcpp','std_msgs','tutorial_interfaces']),[py?'setup.py':'CMakeLists.txt']:py?setup(pkg,[`talker = ${pkg}.talker:main`,`listener = ${pkg}.listener:main`,`status = ${pkg}.status_publisher:main`]):cmake(pkg,{talker:'src/publisher_member_function.cpp',listener:'src/subscriber_member_function.cpp',status:'src/status_publisher.cpp'},['rclcpp','std_msgs','tutorial_interfaces'])};}
export const pythonServer=`import rclpy
from rclpy.node import Node
from example_interfaces.srv import AddTwoInts

class Adder(Node):
    def __init__(self):
        super().__init__('adder')
        self.service = self.create_service(AddTwoInts, 'add_two_ints', self.add)

    def add(self, request, response):
        response.sum = request.a + request.b
        self.get_logger().info(f'{request.a} + {request.b} = {response.sum}')
        return response

def main(args=None):
    rclpy.init(args=args)
    node = Adder()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()
`;
export const pythonClient=`import rclpy
from rclpy.node import Node
from example_interfaces.srv import AddTwoInts

class Client(Node):
    def __init__(self):
        super().__init__('addition_client')
        self.client = self.create_client(AddTwoInts, 'add_two_ints')
        self.client.wait_for_service(timeout_sec=5.0)
        request = AddTwoInts.Request()
        request.a = 2
        request.b = 3
        self.future = self.client.call_async(request)
        self.future.add_done_callback(self.received)

    def received(self, future):
        self.get_logger().info(f'Sum: {future.result().sum}')
        self.destroy_node()
        rclpy.shutdown()

def main(args=None):
    rclpy.init(args=args)
    node = Client()
    rclpy.spin(node)
`;
export const cppServer=`#include <memory>
#include <rclcpp/rclcpp.hpp>
#include <example_interfaces/srv/add_two_ints.hpp>
using Add = example_interfaces::srv::AddTwoInts;
int main(int argc, char **argv) {
  rclcpp::init(argc, argv);
  auto node = std::make_shared<rclcpp::Node>("adder");
  auto service = node->create_service<Add>("add_two_ints",
    [node](Add::Request::SharedPtr request, Add::Response::SharedPtr response) {
      response->sum = request->a + request->b;
      RCLCPP_INFO(node->get_logger(), "Sum: %lld", (long long)response->sum);
    });
  rclcpp::spin(node);
  rclcpp::shutdown();
  return 0;
}
`;
export const cppClient=`#include <memory>
#include <rclcpp/rclcpp.hpp>
#include <example_interfaces/srv/add_two_ints.hpp>
using Add = example_interfaces::srv::AddTwoInts;
int main(int argc, char **argv) {
  rclcpp::init(argc, argv);
  auto node = std::make_shared<rclcpp::Node>("addition_client");
  auto client = node->create_client<Add>("add_two_ints");
  if (!client->wait_for_service(std::chrono::seconds(5))) return 1;
  auto request = std::make_shared<Add::Request>();
  request->a = 2; request->b = 3;
  client->async_send_request(request, [node](rclcpp::Client<Add>::SharedFuture future) {
    RCLCPP_INFO(node->get_logger(), "Sum: %lld", (long long)future.get()->sum);
    rclcpp::shutdown();
  });
  rclcpp::spin(node);
  return 0;
}
`;
export function serviceFiles(language){const py=language==='python',pkg=py?'py_service':'cpp_service';return py?{[pkg+'/server.py']:pythonServer,[pkg+'/client.py']:pythonClient,'setup.py':setup(pkg,[`server = ${pkg}.server:main`,`client = ${pkg}.client:main`])}:{'src/server.cpp':cppServer,'src/client.cpp':cppClient,'CMakeLists.txt':cmake(pkg,{server:'src/server.cpp',client:'src/client.cpp'},['rclcpp','example_interfaces'])};}
