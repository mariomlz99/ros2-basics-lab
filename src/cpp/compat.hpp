// KineNest educational C++ API. This is not the ROS rclcpp implementation.
#pragma once
#include <memory>
#include <functional>
#include <vector>
#include <map>
#include <string>
#include <chrono>
#include <cstdio>
#include <cstdlib>
#include <cstdarg>
#include <type_traits>
#include <cmath>
#include <array>
#include <cstdint>
#include <limits>

extern "C" {
__attribute__((import_module("kinenest"),import_name("emit"))) void kn_emit(const char*,int);
__attribute__((import_module("kinenest"),import_name("spin"))) void kn_spin();
__attribute__((import_module("kinenest"),import_name("range_access"))) void kn_range_access(int);
__attribute__((import_module("kinenest"),import_name("image_access"))) void kn_image_access(int,int);
__attribute__((import_module("kinenest"),import_name("fail"))) void kn_fail(const char*,int);
__attribute__((import_module("kinenest"),import_name("field_length"))) int kn_field_length(const char*,int);
__attribute__((import_module("kinenest"),import_name("field_kind"))) int kn_field_kind(const char*,int);
__attribute__((import_module("kinenest"),import_name("field_bool"))) int kn_field_bool(const char*,int);
__attribute__((import_module("kinenest"),import_name("field_number"))) double kn_field_number(const char*,int);
__attribute__((import_module("kinenest"),import_name("field_string_size"))) int kn_field_string_size(const char*,int);
__attribute__((import_module("kinenest"),import_name("field_string_copy"))) int kn_field_string_copy(const char*,int,char*,int);
}
namespace kinenest {
inline std::string quote(const std::string& s){std::string out="\"";for(unsigned char c:s){if(c=='"'||c=='\\'){out+='\\';out+=c;}else if(c<32){char b[7];std::snprintf(b,7,"\\u%04x",c);out+=b;}else out+=c;}return out+'"';}
inline void emit(const std::string& s){kn_emit(s.data(),static_cast<int>(s.size()));}
inline int next_id=0;
inline void fail(const std::string& text){kn_fail(text.data(),static_cast<int>(text.size()));}
inline std::string number(double value,const char* field="Value"){
 if(!std::isfinite(value))fail(std::string(field)+" must be a finite number");
 char text[32];std::snprintf(text,sizeof(text),"%.17g",value);return text;
}
inline bool field_bool(const std::string& path){return kn_field_bool(path.data(),path.size())!=0;}
inline double field_number(const std::string& path){return kn_field_number(path.data(),path.size());}
inline std::string field_string(const std::string& path){
 const int size=kn_field_string_size(path.data(),path.size());
 std::string value(size,'\0');if(size)kn_field_string_copy(path.data(),path.size(),&value[0],size);return value;
}
// Learning hooks: the worker supplies the actual callback sample, not the student.
inline void report_range(double value){emit("{\"kind\":\"course_report\",\"report\":\"range\",\"values\":["+number(value,"Range")+"]}");}
inline void report_sectors(double front,double left,double right){emit("{\"kind\":\"course_report\",\"report\":\"sectors\",\"values\":["+number(front,"Front sector")+","+number(left,"Left sector")+","+number(right,"Right sector")+"]}");}
// Vector-shaped sensor buffers retain sample provenance, including ordinary
// std::vector copies. Composition prevents a derived-to-base conversion from
// silently bypassing access tracking.
template<class T,int Kind> class SampleVector {
 using Base=std::vector<T>;
 Base values_;
 void accessed()const{if constexpr(Kind==1)kn_range_access(sample);else kn_image_access(sample,3);}
public:
 using value_type=T;using size_type=typename Base::size_type;
 using iterator=typename Base::iterator;using const_iterator=typename Base::const_iterator;
 using reverse_iterator=typename Base::reverse_iterator;using const_reverse_iterator=typename Base::const_reverse_iterator;
 int sample=0;
 SampleVector()=default;
 explicit SampleVector(size_t count):values_(count){}
 SampleVector(std::initializer_list<T> values):values_(values){}
 SampleVector(const SampleVector& other):values_(other.values_),sample(other.sample){other.accessed();}
 SampleVector(SampleVector&&)=default;
 SampleVector& operator=(const SampleVector& other){if(this!=&other){other.accessed();values_=other.values_;sample=other.sample;}return *this;}
 SampleVector& operator=(SampleVector&&)=default;
 operator Base&(){accessed();return values_;}
 operator const Base&()const{accessed();return values_;}
 size_t size()const{accessed();return values_.size();}
 bool empty()const{accessed();return values_.empty();}
 T& operator[](size_t i){accessed();return values_[i];}
 const T& operator[](size_t i)const{accessed();return values_[i];}
 T& at(size_t i){accessed();return values_.at(i);}
 const T& at(size_t i)const{accessed();return values_.at(i);}
 iterator begin(){accessed();return values_.begin();}
 iterator end(){accessed();return values_.end();}
 const_iterator begin()const{accessed();return values_.begin();}
 const_iterator end()const{accessed();return values_.end();}
 const_iterator cbegin()const{accessed();return values_.cbegin();}
 const_iterator cend()const{accessed();return values_.cend();}
 reverse_iterator rbegin(){accessed();return values_.rbegin();}
 reverse_iterator rend(){accessed();return values_.rend();}
 const_reverse_iterator rbegin()const{accessed();return values_.rbegin();}
 const_reverse_iterator rend()const{accessed();return values_.rend();}
 const_reverse_iterator crbegin()const{accessed();return values_.crbegin();}
 const_reverse_iterator crend()const{accessed();return values_.crend();}
 T* data(){accessed();return values_.data();}
 const T* data()const{accessed();return values_.data();}
 T& front(){accessed();return values_.front();}
 const T& front()const{accessed();return values_.front();}
 T& back(){accessed();return values_.back();}
 const T& back()const{accessed();return values_.back();}
 template<class Iterator>void assign(Iterator first,Iterator last){values_.assign(first,last);}
 void resize(size_t count){values_.resize(count);}
 // Worker-only preparation avoids crediting pixel reads before the callback.
 T* prepare(size_t count,int id){values_.resize(count);sample=id;return values_.data();}
};
using Ranges=SampleVector<float,1>;

template<class T> struct ImageField {
 T value{};int frame=0,field=0;
 operator T()const{kn_image_access(frame,field);return value;}
 void assign(T next,int sample,int kind){value=next;frame=sample;field=kind;}
};
template<class T> inline T log_value(T value){return value;}
template<class T> inline T log_value(const ImageField<T>& value){return static_cast<T>(value);}
using ImageBytes=SampleVector<uint8_t,2>;

inline void report_detection(bool visible){emit(std::string("{\"kind\":\"detection\",\"visible\":")+(visible?"true":"false")+",\"cx\":null}");}
inline void report_detection(bool visible,double cx){emit(std::string("{\"kind\":\"detection\",\"visible\":")+(visible?"true":"false")+",\"cx\":"+number(cx,"Centroid")+"}");}
inline void report_image_stats(std::array<int,3> shape,std::array<double,3> means){
 emit("{\"kind\":\"image_stats\",\"shape\":["+number(shape[0])+","+number(shape[1])+","+number(shape[2])+"],\"means\":["+number(means[0])+","+number(means[1])+","+number(means[2])+"]}");
}

struct Stamp{int sec=0;unsigned int nanosec=0;};
struct Header{Stamp stamp;std::string frame_id;};
}
namespace geometry_msgs {namespace msg {
struct Vector3{double x=0,y=0,z=0;};
struct Twist{using SharedPtr=std::shared_ptr<Twist>;using ConstSharedPtr=std::shared_ptr<const Twist>;Vector3 linear,angular;};
}}

namespace geometry_msgs {namespace msg {
struct Quaternion{double x=0,y=0,z=0,w=1;};
struct Point{double x=0,y=0,z=0;};
struct Pose{Point position;Quaternion orientation;};
struct PoseWithCovariance{Pose pose;};
struct TwistWithCovariance{Twist twist;};
}}
namespace nav_msgs {namespace msg {
struct Odometry{using SharedPtr=std::shared_ptr<Odometry>;using ConstSharedPtr=std::shared_ptr<const Odometry>;kinenest::Header header;std::string child_frame_id;geometry_msgs::msg::PoseWithCovariance pose;geometry_msgs::msg::TwistWithCovariance twist;};
}}
namespace tf2 {
// Matches tf2 yaw semantics for finite, nonzero quaternions, including nonunit
// inputs and the upstream near-pitch-singularity convention. The TF graph is planar.
// Yaw formulas adapted from ros2/geometry2, tf2/include/tf2/impl/utils.hpp.
// Copyright 2014 Open Source Robotics Foundation, Inc. Licensed Apache-2.0.
// Modified for this educational header; see NOTICE and LICENSE.
inline double getYaw(const geometry_msgs::msg::Quaternion& q){
 const double norm2=q.x*q.x+q.y*q.y+q.z*q.z+q.w*q.w;
 const double pitchSine=2*(q.w*q.y-q.x*q.z)/norm2;
 if(pitchSine>=0.99999)return 2*std::atan2(q.y,q.x);
 if(pitchSine<=-0.99999)return -2*std::atan2(q.y,q.x);
 return std::atan2(2*(q.w*q.z+q.x*q.y),q.w*q.w+q.x*q.x-q.y*q.y-q.z*q.z);
}
}

namespace std_msgs {namespace msg {
struct String{using SharedPtr=std::shared_ptr<String>;using ConstSharedPtr=std::shared_ptr<const String>;std::string data;};
}}

namespace geometry_msgs {namespace msg {
struct Transform{Vector3 translation;Quaternion rotation;};
struct TransformStamped{using SharedPtr=std::shared_ptr<TransformStamped>;kinenest::Header header;std::string child_frame_id;Transform transform;};
}}
namespace tf2_msgs {namespace msg {
struct TFMessage{using SharedPtr=std::shared_ptr<TFMessage>;using ConstSharedPtr=std::shared_ptr<const TFMessage>;std::vector<geometry_msgs::msg::TransformStamped> transforms;};
}}
namespace tf2 {struct TimePoint{};inline constexpr TimePoint TimePointZero{};}

namespace std_srvs {namespace srv {
struct Trigger {
 struct Request{using SharedPtr=std::shared_ptr<Request>;};
 struct Response{using SharedPtr=std::shared_ptr<Response>;bool success=false;std::string message;};
};
}}

namespace ros2learn_interfaces {namespace msg {
struct TargetInfo{using SharedPtr=std::shared_ptr<TargetInfo>;using ConstSharedPtr=std::shared_ptr<const TargetInfo>;bool visible=false;std::string position;float confidence=0;};
}}

namespace sensor_msgs {namespace msg {
struct Image{using SharedPtr=std::shared_ptr<Image>;using ConstSharedPtr=std::shared_ptr<const Image>;kinenest::Header header;kinenest::ImageField<uint32_t> height,width;std::string encoding="rgb8";uint8_t is_bigendian=0;uint32_t step=0;kinenest::ImageBytes data;};
struct LaserScan{using SharedPtr=std::shared_ptr<LaserScan>;using ConstSharedPtr=std::shared_ptr<const LaserScan>;kinenest::Header header;float angle_min=0,angle_max=0,angle_increment=0,time_increment=0,scan_time=.2,range_min=.05,range_max=10;kinenest::Ranges ranges;std::vector<float> intensities;};
}}
namespace kinenest {
template<class T> struct ServiceTraits;
template<> struct ServiceTraits<std_srvs::srv::Trigger>{
 static const char* type(){return "std_srvs/srv/Trigger";}
 static std_srvs::srv::Trigger::Response::SharedPtr response(){
  auto result=std::make_shared<std_srvs::srv::Trigger::Response>();
  result->success=field_bool("success");result->message=field_string("message");return result;
 }
};
inline std::map<int,std::function<void()>> service_responses;
template<class T> struct MessageTraits;

template<> struct MessageTraits<ros2learn_interfaces::msg::TargetInfo>{
 static const char* type(){return "ros2learn_interfaces/msg/TargetInfo";}
 static ros2learn_interfaces::msg::TargetInfo decode(){
  ros2learn_interfaces::msg::TargetInfo msg;msg.visible=field_bool("visible");msg.position=field_string("position");msg.confidence=field_number("confidence");return msg;
 }
 static std::string encode(const ros2learn_interfaces::msg::TargetInfo& msg){
  return std::string("{\"visible\":")+(msg.visible?"true":"false")+",\"position\":"+quote(msg.position)+",\"confidence\":"+number(msg.confidence,"TargetInfo.confidence")+"}";
 }
};


inline Header header_field(const std::string& path){
 Header h;h.frame_id=field_string(path+".frame_id");h.stamp.sec=field_number(path+".stamp.sec");h.stamp.nanosec=field_number(path+".stamp.nanosec");return h;
}
inline geometry_msgs::msg::Vector3 vector_field(const std::string& path){return {field_number(path+".x"),field_number(path+".y"),field_number(path+".z")};}
inline geometry_msgs::msg::Quaternion quaternion_field(const std::string& path){return {field_number(path+".x"),field_number(path+".y"),field_number(path+".z"),field_number(path+".w")};}
template<> struct MessageTraits<nav_msgs::msg::Odometry>{
 static const char* type(){return "nav_msgs/msg/Odometry";}
 static nav_msgs::msg::Odometry decode(){
  nav_msgs::msg::Odometry m;m.header=header_field("header");m.child_frame_id=field_string("child_frame_id");
  auto p=vector_field("pose.pose.position");m.pose.pose.position={p.x,p.y,p.z};m.pose.pose.orientation=quaternion_field("pose.pose.orientation");
  m.twist.twist.linear=vector_field("twist.twist.linear");m.twist.twist.angular=vector_field("twist.twist.angular");return m;
 }
};
inline void report_pose(double x,double y,double yaw){
 emit("{\"kind\":\"course_report\",\"report\":\"pose\",\"values\":["+number(x,"Pose.x")+","+number(y,"Pose.y")+","+number(yaw,"Pose.yaw")+"]}");
}
inline void report_position(double x,double y){
 emit("{\"kind\":\"course_report\",\"report\":\"position\",\"values\":["+number(x,"Position.x")+","+number(y,"Position.y")+"]}");
}


template<> struct MessageTraits<tf2_msgs::msg::TFMessage>{
 static const char* type(){return "tf2_msgs/msg/TFMessage";}
 static tf2_msgs::msg::TFMessage decode(){
  tf2_msgs::msg::TFMessage m;const std::string path="transforms";const int count=kn_field_length(path.data(),path.size());
  for(int i=0;i<count;i++){
   const auto p=path+"."+std::to_string(i);geometry_msgs::msg::TransformStamped t;
   t.header=header_field(p+".header");t.child_frame_id=field_string(p+".child_frame_id");
   t.transform.translation=vector_field(p+".transform.translation");t.transform.rotation=quaternion_field(p+".transform.rotation");m.transforms.push_back(t);
  }return m;
 }
};
inline void report_transform(double x,double y){emit("{\"kind\":\"course_report\",\"report\":\"transform\",\"values\":["+number(x)+","+number(y)+"]}");}
inline void report_relative(double x,double y){emit("{\"kind\":\"course_report\",\"report\":\"relative\",\"values\":["+number(x)+","+number(y)+"]}");}

template<> struct MessageTraits<std_msgs::msg::String>{
 static const char* type(){return "std_msgs/msg/String";}
 static std_msgs::msg::String decode(){std_msgs::msg::String msg;msg.data=field_string("data");return msg;}
 static std::string encode(const std_msgs::msg::String& msg){return "{\"data\":"+quote(msg.data)+"}";}
};
inline std::string vector_json(const geometry_msgs::msg::Vector3& v,const std::string& field){
 return "{\"x\":"+number(v.x,(field+".x").c_str())+",\"y\":"+number(v.y,(field+".y").c_str())+",\"z\":"+number(v.z,(field+".z").c_str())+"}";
}
template<> struct MessageTraits<geometry_msgs::msg::Twist>{
 static const char* type(){return "geometry_msgs/msg/Twist";}
 static geometry_msgs::msg::Twist decode(){geometry_msgs::msg::Twist msg;
  msg.linear={field_number("linear.x"),field_number("linear.y"),field_number("linear.z")};
  msg.angular={field_number("angular.x"),field_number("angular.y"),field_number("angular.z")};return msg;
 }
 static std::string encode(const geometry_msgs::msg::Twist& msg){return "{\"linear\":"+vector_json(msg.linear,"Twist.linear")+",\"angular\":"+vector_json(msg.angular,"Twist.angular")+"}";}
};
template<> struct MessageTraits<sensor_msgs::msg::Image>{static const char* type(){return "sensor_msgs/msg/Image";}};
inline sensor_msgs::msg::Image::SharedPtr incoming_image;
inline std::map<int,std::function<void(sensor_msgs::msg::Image::SharedPtr)>> images;
template<> struct MessageTraits<sensor_msgs::msg::LaserScan>{
 static const char* type(){return "sensor_msgs/msg/LaserScan";}
};
inline std::map<int,std::function<void(sensor_msgs::msg::LaserScan::SharedPtr)>> scans;
inline std::map<int,std::function<void()>> subscriptions;
inline std::map<int,std::function<void()>> timers;
}
namespace rclcpp {
class Node;
inline bool initialized=false;
inline void init(int argc=0,char** argv=nullptr);
class Logger{std::string name_;public:explicit Logger(std::string name):name_(name){}const char* get_name()const{return name_.c_str();}};
template<class... Args> inline void log(const Logger& logger,const char* format,Args... args){std::printf("[%s] ",logger.get_name());std::printf(format,kinenest::log_value(args)...);std::printf("\n");std::fflush(stdout);}
// The callback receives an already-completed result. No blocking future/wait API.
template<class T> class Client {
 std::string node_,name_;std::map<int,bool> pending_;
public:
 using SharedPtr=std::shared_ptr<Client<T>>;
 class SharedFuture {
  typename T::Response::SharedPtr response_;
 public:
  explicit SharedFuture(typename T::Response::SharedPtr value):response_(value){}
  typename T::Response::SharedPtr get()const{return response_;}
 };
 Client(std::string node,std::string name):node_(node),name_(name){
  kinenest::emit("{\"kind\":\"client\",\"node\":"+kinenest::quote(node_)+",\"name\":"+kinenest::quote(name_)+",\"type\":"+kinenest::quote(kinenest::ServiceTraits<T>::type())+"}");
 }
 ~Client(){for(const auto& entry:pending_)kinenest::service_responses.erase(entry.first);}
 template<class Callback> int async_send_request(typename T::Request::SharedPtr,Callback callback){
  const int id=++kinenest::next_id;pending_[id]=true;
  kinenest::service_responses[id]=[this,id,callback](){
   pending_.erase(id);
   auto response=kinenest::ServiceTraits<T>::response();
   callback(SharedFuture(response));
   kinenest::emit(std::string("{\"kind\":\"response_received\",\"success\":")+(response->success?"true":"false")+"}");
  };
  kinenest::emit("{\"kind\":\"service_call\",\"id\":"+std::to_string(id)+",\"node\":"+kinenest::quote(node_)+",\"name\":"+kinenest::quote(name_)+",\"request\":{}}");
  return id;
 }
};
template<class T> class Publisher {
 std::string node_,topic_;
public:
 using SharedPtr=std::shared_ptr<Publisher<T>>;
 Publisher(std::string node,std::string topic):node_(node),topic_(topic){
  kinenest::emit("{\"kind\":\"publisher\",\"node\":"+kinenest::quote(node_)+",\"topic\":"+kinenest::quote(topic_)+",\"type\":"+kinenest::quote(kinenest::MessageTraits<T>::type())+"}");
 }
 void publish(const T& msg){
  const auto payload=kinenest::MessageTraits<T>::encode(msg);
  kinenest::emit("{\"kind\":\"publish\",\"node\":"+kinenest::quote(node_)+",\"topic\":"+kinenest::quote(topic_)+",\"type\":"+kinenest::quote(kinenest::MessageTraits<T>::type())+",\"message\":"+payload+"}");
 }
};
template<class T> class Subscription {
 int id_;
public:
 using SharedPtr=std::shared_ptr<Subscription<T>>;
 explicit Subscription(int id):id_(id){}
 ~Subscription(){kinenest::images.erase(id_);kinenest::subscriptions.erase(id_);kinenest::scans.erase(id_);kinenest::emit("{\"kind\":\"unsubscribe\",\"id\":"+std::to_string(id_)+"}");}
};
class TimerBase {
 int id_;
public:
 using SharedPtr=std::shared_ptr<TimerBase>;explicit TimerBase(int id):id_(id){}
 void cancel(){kinenest::timers.erase(id_);kinenest::emit("{\"kind\":\"timer_cancel\",\"id\":"+std::to_string(id_)+"}");}
 ~TimerBase(){cancel();}
};

class Parameter {
 enum Kind{Boolean,Number,String};Kind kind_=Number;double number_=0;bool bool_=false;std::string string_;
public:
 Parameter()=default;
 template<class T> explicit Parameter(T value){
  if constexpr(std::is_same<T,bool>::value){kind_=Boolean;bool_=value;}
  else if constexpr(std::is_arithmetic<T>::value){
   // Validate the original integer before converting to the JS-number transport.
   if constexpr(std::is_integral<T>::value){
    constexpr int64_t safe=9007199254740991LL;
    if constexpr(std::is_signed<T>::value){if(value<-safe||value>safe)kinenest::fail("Integer parameter exceeds the JavaScript safe integer range [-9007199254740991, 9007199254740991]");}
    else if(value>static_cast<uint64_t>(safe))kinenest::fail("Integer parameter exceeds the JavaScript safe integer range [0, 9007199254740991]");
   }
   kind_=Number;number_=value;if(!std::isfinite(number_))kinenest::fail("Parameter must be finite");
  }
  else {kind_=String;string_=value;}
 }
 double as_double()const{if(kind_!=Number)kinenest::fail("Parameter is not numeric");return number_;}
 int64_t as_int()const{const double v=as_double();if(std::trunc(v)!=v||v<-9007199254740991.0||v>9007199254740991.0)kinenest::fail("Parameter is not an exactly representable integer");return static_cast<int64_t>(v);}
 bool as_bool()const{if(kind_!=Boolean)kinenest::fail("Parameter is not boolean");return bool_;}
 std::string as_string()const{if(kind_!=String)kinenest::fail("Parameter is not a string");return string_;}
 template<class T>T value()const{
  if constexpr(std::is_same<T,bool>::value)return as_bool();
  else if constexpr(std::is_integral<T>::value){
   const int64_t value=as_int();
   const double wide=static_cast<double>(value);
   if(wide<static_cast<double>(std::numeric_limits<T>::lowest())||wide>static_cast<double>(std::numeric_limits<T>::max()))kinenest::fail("Parameter integer does not fit the requested C++ type");
   return static_cast<T>(value);
  }
  else if constexpr(std::is_floating_point<T>::value){
   const double value=as_double();
   const double wide=static_cast<double>(value);
   if(wide<static_cast<double>(std::numeric_limits<T>::lowest())||wide>static_cast<double>(std::numeric_limits<T>::max()))kinenest::fail("Parameter number does not fit the requested C++ type");
   return static_cast<T>(value);
  }
  else return as_string();
 }
 std::string json()const{if(kind_==Boolean)return bool_?"true":"false";if(kind_==Number)return kinenest::number(number_,"Parameter");return kinenest::quote(string_);}
 static Parameter incoming(const std::string& path){
  switch(kn_field_kind(path.data(),path.size())){
   case 1:return Parameter(kinenest::field_bool(path));
   case 2:return Parameter(kinenest::field_number(path));
   case 3:return Parameter(kinenest::field_string(path));
   default:kinenest::fail("Parameter must be a scalar");return Parameter();
  }
 }
};
inline std::map<std::string,std::map<std::string,Parameter>> parameters;

class Clock {public:using SharedPtr=std::shared_ptr<Clock>;};
class Node:public std::enable_shared_from_this<Node> {
 std::string name_;
 Clock::SharedPtr clock_=std::make_shared<Clock>();
public:
 using SharedPtr=std::shared_ptr<Node>;
 explicit Node(std::string name):name_(name.size()&&name[0]=='/'?name:"/"+name){kinenest::emit("{\"kind\":\"node\",\"node\":"+kinenest::quote(name_)+"}");}
 virtual ~Node(){parameters.erase(name_);kinenest::emit("{\"kind\":\"destroy\",\"node\":"+kinenest::quote(name_)+"}");}
 Clock::SharedPtr get_clock()const{return clock_;}
 Logger get_logger()const{return Logger(name_);}const char* get_name()const{return name_.c_str();}

 template<class T> T declare_parameter(const std::string& name,T value){
  auto& params=parameters[name_];if(params.count(name))kinenest::fail("Parameter already declared: "+name);
  Parameter parameter(value);params.emplace(name,parameter);
  kinenest::emit("{\"kind\":\"parameter_declare\",\"node\":"+kinenest::quote(name_)+",\"name\":"+kinenest::quote(name)+",\"value\":"+parameter.json()+"}");return value;
 }
 Parameter get_parameter(const std::string& name)const{
  auto node=parameters.find(name_);if(node==parameters.end()||!node->second.count(name))kinenest::fail("Parameter not declared: "+name);
  const auto parameter=node->second.at(name);
  kinenest::emit("{\"kind\":\"parameter_read\",\"node\":"+kinenest::quote(name_)+",\"name\":"+kinenest::quote(name)+",\"value\":"+parameter.json()+"}");return parameter;
 }
 template<class T> bool get_parameter(const std::string& name,T& value)const{value=get_parameter(name).template value<T>();return true;}

 template<class T> typename Client<T>::SharedPtr create_client(const std::string& name){return std::make_shared<Client<T>>(name_,name);}
 template<class T> typename Publisher<T>::SharedPtr create_publisher(const std::string& topic,int){return std::make_shared<Publisher<T>>(name_,topic);}
 template<class T,class Callback> typename Subscription<T>::SharedPtr create_subscription(const std::string& topic,int,Callback callback){
  const int id=++kinenest::next_id;
  if constexpr(std::is_same<T,sensor_msgs::msg::LaserScan>::value)kinenest::scans[id]=callback;
  else if constexpr(std::is_same<T,sensor_msgs::msg::Image>::value)kinenest::images[id]=callback;
  else kinenest::subscriptions[id]=[callback](){callback(std::make_shared<T>(kinenest::MessageTraits<T>::decode()));};
  kinenest::emit("{\"kind\":\"subscribe\",\"node\":"+kinenest::quote(name_)+",\"topic\":"+kinenest::quote(topic)+",\"type\":"+kinenest::quote(kinenest::MessageTraits<T>::type())+",\"id\":"+std::to_string(id)+"}");return std::make_shared<Subscription<T>>(id);
 }
 template<class Rep,class Period,class Callback> TimerBase::SharedPtr create_wall_timer(std::chrono::duration<Rep,Period> period,Callback callback){const int id=++kinenest::next_id;const double seconds=std::chrono::duration<double>(period).count();kinenest::timers[id]=callback;kinenest::emit("{\"kind\":\"timer\",\"node\":"+kinenest::quote(name_)+",\"id\":"+std::to_string(id)+",\"period\":"+kinenest::number(seconds)+"}");return std::make_shared<TimerBase>(id);}
};
inline void init(int,char**){initialized=true;}
inline bool ok(){return initialized;}
inline void shutdown(){initialized=false;kinenest::emit("{\"kind\":\"shutdown\"}");}
inline std::vector<Node::SharedPtr> spinning;
inline void spin(Node::SharedPtr node){spinning.push_back(node);kn_spin();}
}
#define RCLCPP_INFO(logger, ...) ::rclcpp::log(logger, __VA_ARGS__)
#define RCLCPP_WARN(logger, ...) ::rclcpp::log(logger, __VA_ARGS__)
#define RCLCPP_ERROR(logger, ...) ::rclcpp::log(logger, __VA_ARGS__)

extern "C" __attribute__((export_name("kn_receive_scan"))) void kn_receive_scan(int id,const float* data,int count,float angle_min,float angle_max,float increment,float range_min,float range_max,int sec,unsigned int nanosec,float scan_time,int sample){
 auto callback=kinenest::scans.find(id);if(callback==kinenest::scans.end())return;auto msg=std::make_shared<sensor_msgs::msg::LaserScan>();msg->header.frame_id="laser_link";msg->header.stamp={sec,nanosec};msg->angle_min=angle_min;msg->angle_max=angle_max;msg->angle_increment=increment;msg->range_min=range_min;msg->range_max=range_max;msg->scan_time=scan_time;msg->ranges.assign(data,data+count);msg->ranges.sample=sample;auto invoke=callback->second;invoke(msg);
}
extern "C" __attribute__((export_name("kn_receive_message"))) void kn_receive_message(int id){
 auto found=kinenest::subscriptions.find(id);if(found!=kinenest::subscriptions.end()){auto invoke=found->second;invoke();}
}
extern "C" __attribute__((export_name("kn_tick"))) void kn_tick(int id){auto callback=kinenest::timers.find(id);if(callback!=kinenest::timers.end()){auto invoke=callback->second;invoke();}}
extern "C" __attribute__((export_name("kn_alloc"))) void* kn_alloc(int bytes){return std::malloc(bytes);}
extern "C" __attribute__((export_name("kn_free"))) void kn_free(void* data){std::free(data);}

extern "C" __attribute__((export_name("kn_image_prepare"))) uint8_t* kn_image_prepare(int bytes,int frame){
 auto msg=std::make_shared<sensor_msgs::msg::Image>();
 msg->width.assign(static_cast<uint32_t>(kinenest::field_number("width")),frame,1);
 msg->height.assign(static_cast<uint32_t>(kinenest::field_number("height")),frame,2);
 msg->step=kinenest::field_number("step");msg->encoding=kinenest::field_string("encoding");
 msg->header.frame_id=kinenest::field_string("header.frame_id");
 msg->header.stamp.sec=kinenest::field_number("header.stamp.sec");
 msg->header.stamp.nanosec=kinenest::field_number("header.stamp.nanosec");
 auto* data=msg->data.prepare(bytes,frame);kinenest::incoming_image=msg;
 return data;
}
extern "C" __attribute__((export_name("kn_receive_image"))) void kn_receive_image(int id){
 auto msg=std::move(kinenest::incoming_image);auto found=kinenest::images.find(id);
 if(found!=kinenest::images.end()){auto invoke=found->second;invoke(msg);}
}

extern "C" __attribute__((export_name("kn_service_response"))) void kn_service_response(int id){
 auto found=kinenest::service_responses.find(id);if(found==kinenest::service_responses.end())return;
 auto invoke=std::move(found->second);kinenest::service_responses.erase(found);invoke();
}

extern "C" __attribute__((export_name("kn_parameter_update"))) void kn_parameter_update(){
 const auto node=kinenest::field_string("node"),name=kinenest::field_string("name");
 auto found=rclcpp::parameters.find(node);if(found==rclcpp::parameters.end()||!found->second.count(name))return;
 found->second[name]=rclcpp::Parameter::incoming("value");
}

// Latest planar snapshots of the published /tf edges; no history or native tf2.
namespace tf2_ros {
class Buffer {
 std::vector<geometry_msgs::msg::TransformStamped> transforms_;
 struct Edge{std::string frame;double x=0,y=0,yaw=0;};
 bool find(const std::string& target,const std::string& source,Edge& result)const{
  std::map<std::string,std::vector<Edge>> edges;
  for(const auto& t:transforms_){
   const auto parent=t.header.frame_id,child=t.child_frame_id;
   const auto p=t.transform.translation;const double a=tf2::getYaw(t.transform.rotation),c=std::cos(a),s=std::sin(a);
   edges[child].push_back({parent,p.x,p.y,a});
   edges[parent].push_back({child,-c*p.x-s*p.y,s*p.x-c*p.y,-a});
  }
  if(!edges.count(target)||!edges.count(source))return false;
  std::vector<Edge> queue{{source,0,0,0}};std::map<std::string,bool> visited;
  for(size_t i=0;i<queue.size();i++){
   const auto current=queue[i];if(current.frame==target){result=current;return true;}
   if(visited[current.frame])continue;visited[current.frame]=true;
   for(const auto& edge:edges[current.frame])if(!visited[edge.frame]){
    const double c=std::cos(edge.yaw),s=std::sin(edge.yaw);
    queue.push_back({edge.frame,edge.x+c*current.x-s*current.y,edge.y+s*current.x+c*current.y,edge.yaw+current.yaw});
   }
  }return false;
 }
public:
 Buffer()=default;explicit Buffer(rclcpp::Clock::SharedPtr){}
 void setSnapshot(const tf2_msgs::msg::TFMessage& value){transforms_=value.transforms;}
 bool canTransform(const std::string& target,const std::string& source,tf2::TimePoint = tf2::TimePointZero)const{Edge value;return find(target,source,value);}
 geometry_msgs::msg::TransformStamped lookupTransform(const std::string& target,const std::string& source,tf2::TimePoint = tf2::TimePointZero)const{
  Edge value;if(!find(target,source,value))kinenest::fail("TF lookup failed: "+source+" -> "+target+". Check frame names and canTransform().");
  geometry_msgs::msg::TransformStamped result;result.header.frame_id=target;result.child_frame_id=source;
  if(!transforms_.empty())result.header.stamp=transforms_[0].header.stamp;
  result.transform.translation={value.x,value.y,0};result.transform.rotation={0,0,std::sin(value.yaw/2),std::cos(value.yaw/2)};
  kinenest::emit("{\"kind\":\"tf_lookup\",\"target\":"+kinenest::quote(target)+",\"source\":"+kinenest::quote(source)+"}");return result;
 }
};
class TransformListener {
 rclcpp::Subscription<tf2_msgs::msg::TFMessage>::SharedPtr subscription_;
public:
 TransformListener(Buffer& buffer,rclcpp::Node::SharedPtr node){
  subscription_=node->create_subscription<tf2_msgs::msg::TFMessage>("/tf",10,[&buffer](tf2_msgs::msg::TFMessage::SharedPtr msg){buffer.setSnapshot(*msg);});
 }
};
}

// Callback-based educational action client.
// Real compiled C++; this is not native rclcpp_action and has no blocking futures.
// Callback-based calls return an educational request id, not std::shared_future.
namespace ros2learn_interfaces { namespace action {
struct DriveDistance {
 struct Goal { using SharedPtr=std::shared_ptr<Goal>; float distance=0; };
 struct Result { using SharedPtr=std::shared_ptr<Result>; bool success=false; float final_distance=0; };
 struct Feedback { using SharedPtr=std::shared_ptr<Feedback>; using ConstSharedPtr=std::shared_ptr<const Feedback>; float distance_travelled=0; };
};
}}
namespace kinenest {
inline std::map<int,std::function<void()>> action_events;
inline int field_length(const std::string& path){return kn_field_length(path.data(),static_cast<int>(path.size()));}
}
namespace rclcpp_action {
enum class ResultCode:int8_t { UNKNOWN=0, SUCCEEDED=4, CANCELED=5, ABORTED=6 };
// Numeric ids are educational runtime handles, not native 128-bit GoalUUIDs.
struct CancelResponse {
 using SharedPtr=std::shared_ptr<CancelResponse>;
 static constexpr int8_t ERROR_NONE=0, ERROR_REJECTED=1, ERROR_UNKNOWN_GOAL_ID=2, ERROR_GOAL_TERMINATED=3;
 int8_t return_code=ERROR_NONE;
 std::vector<int> goals_canceling;
};
template<class Action> class Client;
template<class Action> class ClientGoalHandle {
 friend class Client<Action>;
 int id_=0;int8_t status_=0;bool accepted_=false,terminal_=false;
 std::weak_ptr<void> owner_;
public:
 using SharedPtr=std::shared_ptr<ClientGoalHandle<Action>>;
 struct WrappedResult { ResultCode code=ResultCode::UNKNOWN; typename Action::Result::SharedPtr result; };
 int8_t get_status()const{return status_;}
};
template<class Action> class Client {
 static_assert(std::is_same<Action,ros2learn_interfaces::action::DriveDistance>::value,"Only DriveDistance is supported by this educational action client");
public:
 using SharedPtr=std::shared_ptr<Client<Action>>;
 using GoalHandle=ClientGoalHandle<Action>;
 using GoalResponseCallback=std::function<void(typename GoalHandle::SharedPtr)>;
 using FeedbackCallback=std::function<void(typename GoalHandle::SharedPtr,typename Action::Feedback::ConstSharedPtr)>;
 using ResultCallback=std::function<void(const typename GoalHandle::WrappedResult&)>;
 using CancelResponse=rclcpp_action::CancelResponse;
 using CancelCallback=std::function<void(typename CancelResponse::SharedPtr)>;
 struct SendGoalOptions { GoalResponseCallback goal_response_callback; FeedbackCallback feedback_callback; ResultCallback result_callback; };
private:
 struct PendingGoal { typename GoalHandle::SharedPtr handle; SendGoalOptions options; bool acceptance_received=false; };
 struct State {
  bool alive=true;std::string node,name;
  std::map<int,PendingGoal> goals;
  std::map<int,CancelCallback> cancellations;
 };
 std::shared_ptr<State> state_;
 static void dispatch_goal(const std::weak_ptr<State>& weak,int id){
  auto state=weak.lock();if(!state||!state->alive)return;
  auto found=state->goals.find(id);if(found==state->goals.end())return;
  const auto event=kinenest::field_string("event");
  if(event=="accepted"){
   if(found->second.acceptance_received)return;
   found->second.acceptance_received=true;
   const bool accepted=kinenest::field_bool("payload.accepted");
   auto handle=found->second.handle;handle->accepted_=accepted;handle->status_=accepted?2:0;
   auto callback=std::move(found->second.options.goal_response_callback);
   // A rejected goal has no later feedback/result. Remove it before student code.
   if(!accepted){handle->terminal_=true;state->goals.erase(found);kinenest::action_events.erase(id);}
   if(callback)callback(accepted?handle:nullptr);
   return;
  }
  if(!found->second.acceptance_received||!found->second.handle->accepted_)return;
  if(event=="feedback"){
   auto callback=found->second.options.feedback_callback;auto handle=found->second.handle;
   if(!callback)return;
   auto feedback=std::make_shared<typename Action::Feedback>();
   feedback->distance_travelled=static_cast<float>(kinenest::field_number("payload.distance_travelled"));
   callback(handle,feedback);
   kinenest::emit("{\"kind\":\"action_observed\",\"event\":\"feedback\"}");
   return;
  }
  if(event=="result"){
   const int status=static_cast<int>(kinenest::field_number("payload.status"));
   if(status!=4&&status!=5&&status!=6)return;
   auto handle=found->second.handle;handle->terminal_=true;handle->status_=static_cast<int8_t>(status);
   typename GoalHandle::WrappedResult wrapped;
   wrapped.code=static_cast<ResultCode>(status);wrapped.result=std::make_shared<typename Action::Result>();
   wrapped.result->success=kinenest::field_bool("payload.result.success");
   wrapped.result->final_distance=static_cast<float>(kinenest::field_number("payload.result.final_distance"));
   auto callback=std::move(found->second.options.result_callback);
   // A result may arrive before a cancellation response. Do not discard separate cancel requests.
   state->goals.erase(found);kinenest::action_events.erase(id);
   if(callback){callback(wrapped);kinenest::emit("{\"kind\":\"action_observed\",\"event\":\"result\",\"status\":"+std::to_string(status)+"}");}
  }
 }
 static void dispatch_cancel(const std::weak_ptr<State>& weak,int request){
  auto state=weak.lock();if(!state||!state->alive)return;
  auto found=state->cancellations.find(request);if(found==state->cancellations.end())return;
  if(kinenest::field_string("event")!="cancel")return;
  auto response=std::make_shared<CancelResponse>();
  const int count=kinenest::field_length("payload.goals_canceling");
  if(count<0||count>128){kinenest::fail("Malformed action cancellation response");return;}
  for(int i=0;i<count;++i)response->goals_canceling.push_back(static_cast<int>(kinenest::field_number("payload.goals_canceling."+std::to_string(i))));
  response->return_code=count?CancelResponse::ERROR_NONE:CancelResponse::ERROR_REJECTED;
  auto callback=std::move(found->second);
  state->cancellations.erase(found);kinenest::action_events.erase(request);
  if(callback)callback(response);
 }
public:
 Client(std::string node,std::string name):state_(std::make_shared<State>()){
  state_->node=std::move(node);state_->name=std::move(name);
  kinenest::emit("{\"kind\":\"action_client\",\"node\":"+kinenest::quote(state_->node)+",\"name\":"+kinenest::quote(state_->name)+"}");
 }
 Client(const Client&)=delete;Client& operator=(const Client&)=delete;
 ~Client(){dispose();}
 void dispose(){
  if(!state_||!state_->alive)return;state_->alive=false;
  for(const auto& goal:state_->goals)kinenest::action_events.erase(goal.first);
  for(const auto& request:state_->cancellations)kinenest::action_events.erase(request.first);
  state_->goals.clear();state_->cancellations.clear();
 }
 int async_send_goal(const typename Action::Goal& goal,const SendGoalOptions& options=SendGoalOptions()){
  if(!state_->alive){kinenest::fail("Action client has been disposed");return 0;}
  const std::string distance=kinenest::number(goal.distance,"Goal distance");
  const int id=++kinenest::next_id;
  auto handle=std::make_shared<GoalHandle>();handle->id_=id;handle->owner_=state_;
  state_->goals.emplace(id,PendingGoal{handle,options,false});
  std::weak_ptr<State> weak=state_;
  kinenest::action_events[id]=[weak,id](){dispatch_goal(weak,id);};
  kinenest::emit("{\"kind\":\"action_goal\",\"node\":"+kinenest::quote(state_->node)+",\"name\":"+kinenest::quote(state_->name)+",\"id\":"+std::to_string(id)+",\"goal\":{\"distance\":"+distance+"}}");
  return id;
 }
 int async_cancel_goal(typename GoalHandle::SharedPtr handle,CancelCallback callback=CancelCallback()){
  if(!state_->alive){kinenest::fail("Action client has been disposed");return 0;}
  if(!handle||handle->owner_.lock().get()!=state_.get()||!handle->accepted_){kinenest::fail("Cancel requires an accepted goal from this action client");return 0;}
  // Retained terminal handles can be queried without sending a stale command.
  if(handle->terminal_){auto response=std::make_shared<CancelResponse>();response->return_code=CancelResponse::ERROR_GOAL_TERMINATED;if(callback)callback(response);return 0;}
  const int request=++kinenest::next_id;state_->cancellations.emplace(request,std::move(callback));
  std::weak_ptr<State> weak=state_;
  kinenest::action_events[request]=[weak,request](){dispatch_cancel(weak,request);};
  kinenest::emit("{\"kind\":\"action_cancel\",\"id\":"+std::to_string(handle->id_)+",\"request\":"+std::to_string(request)+"}");
  return request;
 }
};
template<class Action,class NodeT> typename Client<Action>::SharedPtr create_client(NodeT* node,const std::string& name){
 if(!node){kinenest::fail("An action client requires a node");return nullptr;}
 return std::make_shared<Client<Action>>(node->get_name(),name);
}
template<class Action,class NodeT> typename Client<Action>::SharedPtr create_client(const std::shared_ptr<NodeT>& node,const std::string& name){return create_client<Action>(node.get(),name);}
}
extern "C" __attribute__((export_name("kn_action_event"))) void kn_action_event(){
 const int id=static_cast<int>(kinenest::field_number("id"));
 auto found=kinenest::action_events.find(id);if(found==kinenest::action_events.end())return;
 // Own a copy: student callbacks may erase this registry entry or destroy the client.
 auto invoke=found->second;invoke();
}
