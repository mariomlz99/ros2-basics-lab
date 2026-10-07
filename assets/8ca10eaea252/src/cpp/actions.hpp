#pragma once
#include <rclcpp/rclcpp.hpp>
extern "C" __attribute__((import_module("kinenest"),import_name("action_available"))) int kn_action_available(const char*,int);
namespace kinenest {
inline std::map<int,std::function<void()>> action_handlers;
inline std::map<int,std::function<void()>> action_servers;
inline void action_reply(const std::string& token,const std::string& event,const std::string& payload){emit("{\"kind\":\"action_server_reply\",\"token\":"+quote(token)+",\"event\":"+quote(event)+",\"payload\":"+payload+"}");}
}
namespace rclcpp_action {
using GoalUUID=std::array<uint8_t,16>;
enum class GoalResponse {REJECT,ACCEPT_AND_EXECUTE};
enum class CancelResponse {REJECT,ACCEPT};
enum class ResultCode {UNKNOWN=0,SUCCEEDED=4,CANCELED=5,ABORTED=6};
struct CancelResult {std::vector<int> goals_canceling;};
template<class A> class ServerGoalHandle {
 std::string token_;std::shared_ptr<const typename A::Goal> goal_;bool cancel_=false;
public:
 using SharedPtr=std::shared_ptr<ServerGoalHandle<A>>;
 ServerGoalHandle(std::string token,typename A::Goal goal):token_(token),goal_(std::make_shared<typename A::Goal>(goal)){}
 std::shared_ptr<const typename A::Goal> get_goal()const{return goal_;}
 bool is_canceling()const{return cancel_;}
 void mark_canceling(){cancel_=true;}
 void publish_feedback(std::shared_ptr<typename A::Feedback> feedback){kinenest::action_reply(token_,"feedback",kinenest::MessageTraits<typename A::Feedback>::encode(*feedback));}
 void finish(std::shared_ptr<typename A::Result> result,int status){kinenest::action_reply(token_,"result","{\"status\":"+std::to_string(status)+",\"result\":"+kinenest::MessageTraits<typename A::Result>::encode(*result)+"}");}
 void succeed(std::shared_ptr<typename A::Result> result){finish(result,4);}
 void canceled(std::shared_ptr<typename A::Result> result){if(!cancel_)kinenest::fail("Goal has not been canceled");finish(result,5);}
 void abort(std::shared_ptr<typename A::Result> result){finish(result,6);}
};
template<class A> class Server {
public:
 using SharedPtr=std::shared_ptr<Server<A>>;
 std::map<std::string,std::weak_ptr<ServerGoalHandle<A>>> goals;
 int id;
 ~Server(){kinenest::action_servers.erase(id);}
};
template<class A,class N,class G,class C,class H> typename Server<A>::SharedPtr create_server(N* node,const std::string& name,G goal_callback,C cancel_callback,H accepted_callback){
 auto server=std::make_shared<Server<A>>();server->id=++kinenest::next_id;std::weak_ptr<Server<A>> weak=server;
 kinenest::action_servers[server->id]=[weak,goal_callback,cancel_callback,accepted_callback](){auto server=weak.lock();if(!server)return;auto token=kinenest::field_string("token"),event=kinenest::field_string("event");
  if(event=="goal"){
   auto goal=std::make_shared<typename A::Goal>(kinenest::MessageTraits<typename A::Goal>::decode("request."));
   bool accepted=goal_callback(GoalUUID{},goal)==GoalResponse::ACCEPT_AND_EXECUTE;
   kinenest::action_reply(token,"accepted",accepted?"{\"accepted\":true}":"{\"accepted\":false}");
   if(accepted){auto handle=std::make_shared<ServerGoalHandle<A>>(token,*goal);server->goals[token]=handle;accepted_callback(handle);}
  }else if(event=="cancel"){
   auto found=server->goals.find(token);auto handle=found==server->goals.end()?nullptr:found->second.lock();
   bool accepted=handle&&cancel_callback(handle)==CancelResponse::ACCEPT;
   if(accepted)handle->mark_canceling();kinenest::action_reply(token,"cancel",accepted?"{\"accepted\":true}":"{\"accepted\":false}");
  }
  for(auto it=server->goals.begin();it!=server->goals.end();)if(it->second.expired())it=server->goals.erase(it);else ++it;
 };
 kinenest::emit("{\"kind\":\"action_server\",\"node\":"+kinenest::quote(node->get_name())+",\"name\":"+kinenest::quote(name)+",\"type\":"+kinenest::quote(kinenest::MessageTraits<typename A::Goal>::type())+",\"id\":"+std::to_string(server->id)+"}");return server;
}
template<class A> class ClientGoalHandle {
public:
 using SharedPtr=std::shared_ptr<ClientGoalHandle<A>>;
 struct WrappedResult {ResultCode code;typename A::Result::SharedPtr result;};
 int id;explicit ClientGoalHandle(int value):id(value){}
};
template<class A> class Client {
 std::string node_,name_;
public:
 using SharedPtr=std::shared_ptr<Client<A>>;
 using Handle=ClientGoalHandle<A>;
 struct SendGoalOptions {
  std::function<void(typename Handle::SharedPtr)> goal_response_callback;
  std::function<void(typename Handle::SharedPtr,typename A::Feedback::ConstSharedPtr)> feedback_callback;
  std::function<void(const typename Handle::WrappedResult&)> result_callback;
 };
 Client(std::string node,std::string name):node_(node),name_(name){kinenest::emit("{\"kind\":\"action_client\",\"node\":"+kinenest::quote(node)+",\"name\":"+kinenest::quote(name)+",\"type\":"+kinenest::quote(kinenest::MessageTraits<typename A::Goal>::type())+"}");}
 template<class Rep,class Period> bool wait_for_action_server(std::chrono::duration<Rep,Period>){if(!kn_action_available(name_.data(),name_.size()))kinenest::fail("Start the action server, then rerun this client. Blocking waits are not supported.");return true;}
 int async_send_goal(const typename A::Goal& goal,const SendGoalOptions& options={}){
  int id=++kinenest::next_id;auto handle=std::make_shared<Handle>(id);
  kinenest::action_handlers[id]=[handle,options,id](){auto event=kinenest::field_string("event");
   if(event=="accepted"){bool accepted=kinenest::field_bool("payload.accepted");if(options.goal_response_callback)options.goal_response_callback(accepted?handle:nullptr);if(!accepted)kinenest::action_handlers.erase(id);}
   else if(event=="feedback"){if(options.feedback_callback)options.feedback_callback(handle,std::make_shared<typename A::Feedback>(kinenest::MessageTraits<typename A::Feedback>::decode("payload.feedback.")));}
   else if(event=="result"){typename Handle::WrappedResult wrapped{static_cast<ResultCode>(int(kinenest::field_number("payload.status"))),std::make_shared<typename A::Result>(kinenest::MessageTraits<typename A::Result>::decode("payload.result."))};kinenest::action_handlers.erase(id);if(options.result_callback)options.result_callback(wrapped);}
  };
  kinenest::emit("{\"kind\":\"action_goal\",\"node\":"+kinenest::quote(node_)+",\"name\":"+kinenest::quote(name_)+",\"type\":"+kinenest::quote(kinenest::MessageTraits<typename A::Goal>::type())+",\"id\":"+std::to_string(id)+",\"goal\":"+kinenest::MessageTraits<typename A::Goal>::encode(goal)+"}");return id;
 }
 template<class Callback> int async_cancel_goal(typename Handle::SharedPtr handle,Callback callback){
  int request=++kinenest::next_id;kinenest::action_handlers[request]=[callback,request](){auto response=std::make_shared<CancelResult>();int n=kn_field_length("payload.goals_canceling",sizeof("payload.goals_canceling")-1);for(int i=0;i<n;i++)response->goals_canceling.push_back(i);kinenest::action_handlers.erase(request);callback(response);};
  kinenest::emit("{\"kind\":\"action_cancel\",\"id\":"+std::to_string(handle->id)+",\"request\":"+std::to_string(request)+"}");return request;
 }
};
template<class A,class N> typename Client<A>::SharedPtr create_client(N* node,const std::string& name){return std::make_shared<Client<A>>(node->get_name(),name);}
template<class A,class N> typename Client<A>::SharedPtr create_client(std::shared_ptr<N> node,const std::string& name){return create_client<A>(node.get(),name);}
}
extern "C" __attribute__((export_name("kn_action_event"))) void kn_action_event(int id){auto found=kinenest::action_handlers.find(id);if(found!=kinenest::action_handlers.end()){auto callback=found->second;callback();}}
extern "C" __attribute__((export_name("kn_action_server_event"))) void kn_action_server_event(int id){auto found=kinenest::action_servers.find(id);if(found!=kinenest::action_servers.end()){auto callback=found->second;callback();}}
