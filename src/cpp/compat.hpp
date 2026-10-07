// Modified from KineNest (Apache-2.0): registry types and beginner-only rclcpp API.
#pragma once
#include <lab_types.hpp>
namespace rclcpp {
class Node;
inline bool initialized=false;
class Logger{std::string name_;public:explicit Logger(std::string name):name_(name){}const char* get_name()const{return name_.c_str();}};
template<class... Args> inline void log(const Logger& logger,int level,const char* format,Args... args){char text[4096];std::snprintf(text,sizeof(text),format,args...);kinenest::emit("{\"kind\":\"log\",\"node\":"+kinenest::quote(logger.get_name())+",\"level\":"+std::to_string(level)+",\"text\":"+kinenest::quote(text)+"}");}
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

template<class T> class Subscription{
 int id_;
public:using SharedPtr=std::shared_ptr<Subscription<T>>;explicit Subscription(int id):id_(id){}
 ~Subscription(){kinenest::subscriptions.erase(id_);kinenest::emit("{\"kind\":\"unsubscribe\",\"id\":"+std::to_string(id_)+"}");}
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

template<class T> class Service {
 int id_;
public:using SharedPtr=std::shared_ptr<Service<T>>;explicit Service(int id):id_(id){}~Service(){kinenest::service_handlers.erase(id_);}
};
template<class T> class Client{
 std::string node_,name_;
public:
 using SharedPtr=std::shared_ptr<Client<T>>;
 class SharedFuture{typename T::Response::SharedPtr value_;public:explicit SharedFuture(typename T::Response::SharedPtr v):value_(v){}typename T::Response::SharedPtr get(){return value_;}};
 Client(std::string node,std::string name):node_(node),name_(name){}
 template<class Rep,class Period> bool wait_for_service(std::chrono::duration<Rep,Period>)const{if(!kn_service_available(name_.data(),name_.size()))kinenest::fail("Start the service server, then rerun this client. Blocking waits are not supported.");return true;}
 template<class Callback> int async_send_request(typename T::Request::SharedPtr request,Callback callback){
  const int id=++kinenest::next_id;
  kinenest::service_responses[id]=[callback](){callback(SharedFuture(std::make_shared<typename T::Response>(kinenest::MessageTraits<typename T::Response>::decode())));};
  kinenest::emit("{\"kind\":\"service_call\",\"id\":"+std::to_string(id)+",\"node\":"+kinenest::quote(node_)+",\"name\":"+kinenest::quote(name_)+",\"type\":"+kinenest::quote(kinenest::MessageTraits<typename T::Request>::type())+",\"request\":"+kinenest::MessageTraits<typename T::Request>::encode(*request)+"}");return id;
 }
};

class Node:public std::enable_shared_from_this<Node> {
 std::string name_;

public:
 using SharedPtr=std::shared_ptr<Node>;
 explicit Node(std::string name):name_(name.size()&&name[0]=='/'?name:"/"+name){kinenest::emit("{\"kind\":\"node\",\"node\":"+kinenest::quote(name_)+"}");}
 virtual ~Node(){parameters.erase(name_);kinenest::emit("{\"kind\":\"destroy\",\"node\":"+kinenest::quote(name_)+"}");}

 Logger get_logger()const{return Logger(name_);}const char* get_name()const{return name_.c_str();}

 template<class T> T declare_parameter(const std::string& name,T value){
  auto& params=parameters[name_];if(params.count(name))kinenest::fail("Parameter already declared: "+name);
  Parameter parameter(value);params.emplace(name,parameter);
  kinenest::emit("{\"kind\":\"parameter_declare\",\"node\":"+kinenest::quote(name_)+",\"name\":"+kinenest::quote(name)+",\"value\":"+parameter.json()+",\"value_type\":"+std::to_string(std::is_same<T,bool>::value?1:std::is_integral<T>::value?2:std::is_floating_point<T>::value?3:4)+"}");return value;
 }
 Parameter get_parameter(const std::string& name)const{
  auto node=parameters.find(name_);if(node==parameters.end()||!node->second.count(name))kinenest::fail("Parameter not declared: "+name);
  const auto parameter=node->second.at(name);
  kinenest::emit("{\"kind\":\"parameter_read\",\"node\":"+kinenest::quote(name_)+",\"name\":"+kinenest::quote(name)+",\"value\":"+parameter.json()+"}");return parameter;
 }
 template<class T> bool get_parameter(const std::string& name,T& value)const{value=get_parameter(name).template value<T>();return true;}



 template<class T> typename Client<T>::SharedPtr create_client(const std::string& name){return std::make_shared<Client<T>>(name_,name);}
 template<class T,class Callback> typename Service<T>::SharedPtr create_service(const std::string& name,Callback callback){
  const int id=++kinenest::next_id;
  kinenest::service_handlers[id]=[callback](const std::string& token){auto request=std::make_shared<typename T::Request>(kinenest::MessageTraits<typename T::Request>::decode("request."));auto response=std::make_shared<typename T::Response>();callback(request,response);kinenest::emit("{\"kind\":\"service_result\",\"token\":"+kinenest::quote(token)+",\"response\":"+kinenest::MessageTraits<typename T::Response>::encode(*response)+"}");};
  kinenest::emit("{\"kind\":\"service\",\"id\":"+std::to_string(id)+",\"node\":"+kinenest::quote(name_)+",\"name\":"+kinenest::quote(name)+",\"type\":"+kinenest::quote(kinenest::MessageTraits<typename T::Request>::type())+"}");return std::make_shared<Service<T>>(id);
 }
 template<class T> typename Publisher<T>::SharedPtr create_publisher(const std::string& topic,int){return std::make_shared<Publisher<T>>(name_,topic);}
 template<class T,class Callback> typename Subscription<T>::SharedPtr create_subscription(const std::string& topic,int,Callback callback){
  const int id=++kinenest::next_id;
  kinenest::subscriptions[id]=[callback](){callback(std::make_shared<T>(kinenest::MessageTraits<T>::decode()));};
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
#define RCLCPP_INFO(logger, ...) ::rclcpp::log(logger, 20, __VA_ARGS__)
#define RCLCPP_WARN(logger, ...) ::rclcpp::log(logger, 30, __VA_ARGS__)
#define RCLCPP_ERROR(logger, ...) ::rclcpp::log(logger, 40, __VA_ARGS__)

extern "C" __attribute__((export_name("kn_receive_message"))) void kn_receive_message(int id){auto it=kinenest::subscriptions.find(id);if(it!=kinenest::subscriptions.end()){auto fn=it->second;fn();}}
extern "C" __attribute__((export_name("kn_tick"))) void kn_tick(int id){auto it=kinenest::timers.find(id);if(it!=kinenest::timers.end()){auto fn=it->second;fn();}}
extern "C" __attribute__((export_name("kn_parameter_update"))) void kn_parameter_update(){
 const auto node=kinenest::field_string("node"),name=kinenest::field_string("name");
 auto found=rclcpp::parameters.find(node);if(found==rclcpp::parameters.end()||!found->second.count(name))return;
 found->second[name]=rclcpp::Parameter::incoming("value");
}

extern "C" __attribute__((export_name("kn_service_request"))) void kn_service_request(int id){auto it=kinenest::service_handlers.find(id);if(it!=kinenest::service_handlers.end())it->second(kinenest::field_string("token"));}
extern "C" __attribute__((export_name("kn_service_response"))) void kn_service_response(int id){auto it=kinenest::service_responses.find(id);if(it!=kinenest::service_responses.end()){auto fn=it->second;kinenest::service_responses.erase(it);fn();}}
