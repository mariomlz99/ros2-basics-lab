// ROS-shaped latest-time TF subset; transport/math are shared with the live graph.
#ifndef KINENEST_TF_RUNTIME_HPP
#define KINENEST_TF_RUNTIME_HPP
#include <rclcpp/rclcpp.hpp>
#include <geometry_msgs/msg/transform_stamped.hpp>
#include <geometry_msgs/msg/point_stamped.hpp>
extern "C" {
__attribute__((import_module("kinenest"),import_name("tf_request"))) void kn_tf_request(const char*,int);
__attribute__((import_module("kinenest"),import_name("tf_done"))) void kn_tf_done();
}
namespace tf2 {
using TimePoint=std::chrono::time_point<std::chrono::system_clock,std::chrono::nanoseconds>;
inline const TimePoint TimePointZero=TimePoint(std::chrono::nanoseconds::zero());
}
namespace tf2_ros {
class Buffer {
 unsigned listening_=0;
 void ready()const{if(!listening_)kinenest::fail("Create a TransformListener before looking up TF.");}
 template<class T> T request(const std::string& request)const{kn_tf_request(request.data(),request.size());auto result=kinenest::MessageTraits<T>::decode();kn_tf_done();return result;}
 friend class TransformListener;
public:
 explicit Buffer(rclcpp::Clock::SharedPtr){}
 geometry_msgs::msg::TransformStamped lookupTransform(const std::string& target,const std::string& source,const tf2::TimePoint& time)const{
  ready();if(time!=tf2::TimePointZero)kinenest::fail("This lab supports latest TF only: use tf2::TimePointZero.");
  return request<geometry_msgs::msg::TransformStamped>("{\"operation\":\"lookup\",\"target\":"+kinenest::quote(target)+",\"source\":"+kinenest::quote(source)+"}");
 }
 geometry_msgs::msg::PointStamped transform(const geometry_msgs::msg::PointStamped& point,const std::string& target)const{
  ready();if(point.header.stamp.sec||point.header.stamp.nanosec)kinenest::fail("This lab supports latest TF only: leave the PointStamped stamp zero.");
  return request<geometry_msgs::msg::PointStamped>("{\"operation\":\"point\",\"target\":"+kinenest::quote(target)+",\"input\":"+kinenest::MessageTraits<geometry_msgs::msg::PointStamped>::encode(point)+"}");
 }
};
class TransformListener {
 Buffer& buffer_;int id_;
public:
 TransformListener(Buffer& buffer,rclcpp::Node::SharedPtr node,bool spin_thread=false):buffer_(buffer),id_(++kinenest::next_id){
  if(spin_thread)kinenest::fail("Use the existing node executor: spin_thread is not supported.");
  ++buffer_.listening_;kinenest::emit("{\"kind\":\"tf_listener\",\"node\":"+kinenest::quote(node->get_name())+",\"id\":"+std::to_string(id_)+"}");
 }
 TransformListener(const TransformListener&)=delete;
 TransformListener& operator=(const TransformListener&)=delete;
 ~TransformListener(){--buffer_.listening_;kinenest::emit("{\"kind\":\"tf_unlistener\",\"id\":"+std::to_string(id_)+"}");}
};
}

#endif
