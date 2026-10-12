// Native-compatible programs also run unchanged in the browser workers.
export const nestedPrograms={python:`import rclpy
from rclpy.node import Node
from nav_msgs.msg import Path
from nav_msgs.srv import GetPlan
from geometry_msgs.msg import PoseStamped

class Probe(Node):
    def __init__(self):
        super().__init__('nested_probe')
        self.declare_parameter('phase', 0)
        self.path_pub = self.create_publisher(Path, '/path', 10)
        self.pose_pub = self.create_publisher(PoseStamped, '/pose', 10)
        self.sub = self.create_subscription(Path, '/path', self.receive, 10)
        self.server = self.create_service(GetPlan, '/plan', self.plan)
        self.client = self.create_client(GetPlan, '/plan')
        self.timer = self.create_timer(0.25, self.tick)
        self.cleanup = self.create_timer(0.1, self.check_cleanup)
    def receive(self, message):
        assert isinstance(message.poses[0], PoseStamped)
        self.pose_pub.publish(message.poses[0])
        print('NESTED_MESSAGE_OK')
    def plan(self, request, response):
        assert isinstance(request.start, PoseStamped)
        response.plan = Path(poses=[request.start, request.goal])
        return response
    def done(self, future):
        response = future.result()
        assert isinstance(response.plan, Path)
        assert isinstance(response.plan.poses[0], PoseStamped)
        assert response.plan.poses[0].pose.position.x == 3.0
        print('NESTED_SERVICE_OK')
    def tick(self):
        pose = PoseStamped()
        pose.pose.position.x = 3.0
        self.path_pub.publish(Path(poses=[pose]))
        self.client.call_async(GetPlan.Request(start=pose, goal=pose)).add_done_callback(self.done)
    def check_cleanup(self):
        if self.get_parameter('phase').value == 1:
            assert self.destroy_timer(self.timer)
            assert self.destroy_service(self.server)
            assert self.destroy_subscription(self.sub)
            assert self.destroy_timer(self.cleanup)
            print('CLEANUP_OK')

def main():
    rclpy.init()
    node = Probe()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()

if __name__ == '__main__':
    main()
`,cpp:`#include <rclcpp/rclcpp.hpp>
#include <nav_msgs/msg/path.hpp>
#include <nav_msgs/srv/get_plan.hpp>
#include <geometry_msgs/msg/pose_stamped.hpp>
#include <iostream>
class Probe : public rclcpp::Node {
  rclcpp::Publisher<nav_msgs::msg::Path>::SharedPtr path_pub;
  rclcpp::Publisher<geometry_msgs::msg::PoseStamped>::SharedPtr pose_pub;
  rclcpp::Subscription<nav_msgs::msg::Path>::SharedPtr sub;
  rclcpp::Service<nav_msgs::srv::GetPlan>::SharedPtr server;
  rclcpp::Client<nav_msgs::srv::GetPlan>::SharedPtr client;
  rclcpp::TimerBase::SharedPtr timer, cleanup;
public:
  Probe():Node("nested_probe") {
    declare_parameter("phase",0);
    path_pub=create_publisher<nav_msgs::msg::Path>("/path",10);
    pose_pub=create_publisher<geometry_msgs::msg::PoseStamped>("/pose",10);
    sub=create_subscription<nav_msgs::msg::Path>("/path",10,[this](nav_msgs::msg::Path::SharedPtr message){
      pose_pub->publish(message->poses.at(0));std::cout<<"NESTED_MESSAGE_OK"<<std::endl;
    });
    server=create_service<nav_msgs::srv::GetPlan>("/plan",[](nav_msgs::srv::GetPlan::Request::SharedPtr request,nav_msgs::srv::GetPlan::Response::SharedPtr response){response->plan.poses={request->start,request->goal};});
    client=create_client<nav_msgs::srv::GetPlan>("/plan");
    timer=create_wall_timer(std::chrono::milliseconds(250),[this](){
      geometry_msgs::msg::PoseStamped pose;pose.pose.position.x=3.0;
      nav_msgs::msg::Path path;path.poses={pose};path_pub->publish(path);
      auto request=std::make_shared<nav_msgs::srv::GetPlan::Request>();request->start=pose;request->goal=pose;
      client->async_send_request(request,[](rclcpp::Client<nav_msgs::srv::GetPlan>::SharedFuture future){
        if(future.get()->plan.poses.at(0).pose.position.x==3.0)std::cout<<"NESTED_SERVICE_OK"<<std::endl;
      });
    });
    cleanup=create_wall_timer(std::chrono::milliseconds(100),[this](){
      if(get_parameter("phase").as_int()==1){timer.reset();server.reset();sub.reset();cleanup->cancel();std::cout<<"CLEANUP_OK"<<std::endl;}
    });
  }
};
int main(int argc,char**argv){rclcpp::init(argc,argv);rclcpp::spin(std::make_shared<Probe>());rclcpp::shutdown();}
`};
