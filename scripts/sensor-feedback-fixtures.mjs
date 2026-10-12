export const feedbackPrograms={python:`import rclpy
from rclpy.node import Node
from sensor_msgs.msg import Image, LaserScan
from geometry_msgs.msg import Twist

class Feedback(Node):
    def __init__(self):
        super().__init__('sensor_feedback')
        self.front = 0.0
        self.scan_stamp = -1.0
        self.pub = self.create_publisher(Twist, '/cmd_vel', 10)
        self.scan_sub = self.create_subscription(LaserScan, '/scan', self.scan, 10)
        self.image_sub = self.create_subscription(Image, '/camera/image_raw', self.image, 10)

    def scan(self, msg):
        middle = round(-msg.angle_min / msg.angle_increment)
        self.front = min(msg.ranges[middle-2:middle+3])
        self.scan_stamp = msg.header.stamp.sec + msg.header.stamp.nanosec * 1e-9

    def image(self, msg):
        command = Twist()
        stamp = msg.header.stamp.sec + msg.header.stamp.nanosec * 1e-9
        if msg.encoding != 'rgb8' or msg.step != msg.width * 3 or len(msg.data) != msg.step * msg.height or abs(stamp-self.scan_stamp) > 0.5:
            self.pub.publish(command)
            print('REJECT_FRAME', flush=True)
            return
        total = 0.0
        count = 0
        for y in range(0, msg.height, 4):
            for x in range(0, msg.width, 4):
                i = y * msg.step + x * 3
                red, green, blue = msg.data[i:i+3]
                if red > green + 10 and green > blue + 5:
                    total += x
                    count += 1
        cx = total / count if count else -1.0
        if count:
            error = (msg.width/2-cx)/(msg.width/2)
            command.angular.z = max(-0.8, min(0.8, error * 1.4))
            if self.front > 0.7 and abs(error) < 0.12:
                command.linear.x = 0.6
        self.pub.publish(command)
        print('FRAME', stamp, count, cx, self.front, command.angular.z, command.linear.x, flush=True)

rclpy.init()
node = Feedback()
rclpy.spin(node)
node.destroy_node()
rclpy.shutdown()
`,cpp:`#include <algorithm>
#include <cmath>
#include <iostream>
#include "rclcpp/rclcpp.hpp"
#include "sensor_msgs/msg/image.hpp"
#include "sensor_msgs/msg/laser_scan.hpp"
#include "geometry_msgs/msg/twist.hpp"

class Feedback : public rclcpp::Node {
  double front_ = 0.0, scan_stamp_ = -1.0;
  rclcpp::Publisher<geometry_msgs::msg::Twist>::SharedPtr pub_;
  rclcpp::Subscription<sensor_msgs::msg::LaserScan>::SharedPtr scan_;
  rclcpp::Subscription<sensor_msgs::msg::Image>::SharedPtr image_;
public:
  Feedback() : Node("sensor_feedback") {
    pub_ = create_publisher<geometry_msgs::msg::Twist>("/cmd_vel", 10);
    scan_ = create_subscription<sensor_msgs::msg::LaserScan>("/scan", 10,
      [this](sensor_msgs::msg::LaserScan::SharedPtr msg) {
        int middle = std::lround(-msg->angle_min / msg->angle_increment);
        front_ = *std::min_element(msg->ranges.begin()+middle-2, msg->ranges.begin()+middle+3);
        scan_stamp_ = msg->header.stamp.sec + msg->header.stamp.nanosec * 1e-9;
      });
    image_ = create_subscription<sensor_msgs::msg::Image>("/camera/image_raw", 10,
      [this](sensor_msgs::msg::Image::SharedPtr msg) {
        geometry_msgs::msg::Twist command;
        double stamp = msg->header.stamp.sec + msg->header.stamp.nanosec * 1e-9;
        if (msg->encoding != "rgb8" || msg->step != msg->width*3 || msg->data.size() != msg->step*msg->height || std::abs(stamp-scan_stamp_) > 0.5) {
          pub_->publish(command); std::cout << "REJECT_FRAME" << std::endl; return;
        }
        double total=0; int count=0;
        for (unsigned y=0; y<msg->height; y+=4) for (unsigned x=0; x<msg->width; x+=4) {
          unsigned i=y*msg->step+x*3;
          if (msg->data[i]>msg->data[i+1]+10 && msg->data[i+1]>msg->data[i+2]+5) { total+=x; count++; }
        }
        double cx=count?total/count:-1;
        if (count) {
          double error=(msg->width/2.0-cx)/(msg->width/2.0);
          command.angular.z=std::max(-0.8,std::min(0.8,error*1.4));
          if (front_>0.7 && std::abs(error)<0.12) command.linear.x=0.6;
        }
        pub_->publish(command);
        std::cout.precision(16);
        std::cout << "FRAME " << stamp << " " << count << " " << cx << " " << front_ << " " << command.angular.z << " " << command.linear.x << std::endl;
      });
  }
};
int main(int argc,char**argv) { rclcpp::init(argc,argv);rclcpp::spin(std::make_shared<Feedback>());rclcpp::shutdown(); }
`};
