// CHECKER-04-003 fixtures and observation oracle. Importing this file does not
// launch a browser or certify any Python/C++ worker or native ROS behavior.
import {createHash} from 'node:crypto';
import {parameterTalker,cppParameterTalker,pythonListener,cppListener,launchSource} from '../src/examples.js';

function replaceOnce(source,needle,replacement){
 if(source.split(needle).length!==2)throw Error('Launch ownership fixture requires exactly one '+needle);
 return source.replace(needle,replacement);
}
const sha=source=>createHash('sha256').update(source).digest('hex');
export function launchOwnershipFixtures(language,pkg='alternate_pkg'){
 if(!['python','cpp'].includes(language))throw Error('Expected python or cpp');
 if(!/^[a-z][a-z0-9_]*$/.test(pkg))throw Error('Expected a package identifier');
 const py=language==='python';
 let publisher=py?parameterTalker:cppParameterTalker;
 if(py){
  publisher=replaceOnce(publisher,"        self.publisher = self.create_publisher(String, 'topic', 10)","        self.publisher = self.create_publisher(String, 'topic', 10)\n        self.self_subscription = self.create_subscription(String, 'topic', self.receive_own, 10)");
  publisher=replaceOnce(publisher,'    def publish_message(self):',"    def receive_own(self, message):\n        self.get_logger().info('SELF_RECEIVED')\n\n    def publish_message(self):");
 }else{
  publisher=replaceOnce(publisher,'    publisher_ = create_publisher<std_msgs::msg::String>("topic", 10);','    publisher_ = create_publisher<std_msgs::msg::String>("topic", 10);\n    self_subscription_ = create_subscription<std_msgs::msg::String>("topic", 10,\n      [this](std_msgs::msg::String::SharedPtr message) { RCLCPP_INFO(get_logger(), "SELF_RECEIVED"); });');
  publisher=replaceOnce(publisher,'  rclcpp::TimerBase::SharedPtr timer_;','  rclcpp::Subscription<std_msgs::msg::String>::SharedPtr self_subscription_;\n  rclcpp::TimerBase::SharedPtr timer_;');
 }
 const correct=py?pythonListener:cppListener;
 const wrong=replaceOnce(correct,py?"'topic'":'"topic"',py?"'unrelated_launch_topic'":'"unrelated_launch_topic"');
 const launch=launchSource(pkg).replace("name='talker'","name='launch_sender'").replace("name='listener'","name='launch_receiver'").replaceAll("'conversation'","'launch_exchange'");
 return [false,true].map(peerExpected=>{
  const sources={publisher,listener:peerExpected?correct:wrong,launch};
  return {id:peerExpected?'peer-repaired':'self-only',language,pkg,peerExpected,topic:'/launch_exchange',peerTopic:peerExpected?'/launch_exchange':'/unrelated_launch_topic',publisherNode:'/launch_sender',peerNode:'/launch_receiver',sources,sourceSHA256:Object.fromEntries(Object.entries(sources).map(([key,value])=>[key,sha(value)]))};
 });
}

function counter(data){
 const match=typeof data==='string'&&/^Launched: (0|[1-9][0-9]*)$/.exec(data);
 return match&&Number.isSafeInteger(Number(match[1]))?Number(match[1]):null;
}
export function assessLaunchOwnership(f,o){
 const samples=Array.isArray(o.samples)?o.samples:[],counts=samples.map(s=>counter(s.data));
 const checks={
  matching_fixture:o.id===f.id&&o.language===f.language&&['publisher','listener','launch'].every(k=>o.sourceSHA256?.[k]===f.sourceSHA256[k]),
  no_harness_error:!o.error,
  two_fresh_real_workers:o.workerInstances?.length===2&&o.workerInstances.every(v=>v===true)&&o.ownersDistinct===true&&o.ownersReused===false,
  installed_sources:o.installedSourceMatches?.publisher===true&&o.installedSourceMatches?.listener===true&&o.installedSourceMatches?.launch===true,
  actual_cpp_artifacts:f.language!=='cpp'||o.compiledWasm?.length===2&&o.compiledWasm.every(v=>v===true),
  same_live_launch_group:typeof o.group==='string'&&o.group.length>0&&o.sameGroup===true&&o.groupMembers===2&&o.activeProcesses===2,
  actual_topic_endpoints:[o.endpointsAtReady,o.endpoints].every(e=>e?.publisher===true&&e?.selfSubscription===true&&e?.peerSubscription===true&&e?.peerTopic===f.peerTopic),
  fresh_sample_window:Number.isSafeInteger(o.launchStartSample)&&Number.isSafeInteger(o.startSample)&&o.startSample>=o.launchStartSample&&samples.length===3&&samples.every((s,i)=>Number.isSafeInteger(s.sample)&&s.sample>o.startSample&&(i===0||s.sample>samples[i-1].sample)),
  same_publisher_and_topic:samples.every(s=>s.publisherMatches===true&&s.topic===f.topic&&s.type==='std_msgs/msg/String'),
  advancing_expected_payload:counts.length===3&&counts.every((n,i)=>n!==null&&(i===0||n>counts[i-1])),
  real_self_consumption:samples.every(s=>s.selfReceived===true)&&Number.isSafeInteger(o.selfDeliveries)&&o.selfDeliveries>=3,
  expected_peer_consumption:samples.every(s=>s.peerReceived===f.peerExpected)&&Number.isSafeInteger(o.peerDeliveries)&&(f.peerExpected?o.peerDeliveries>=3:o.peerDeliveries===0),
  checkpoint_distinguishes_group_from_exchange:o.checkerActive?.group===true&&o.checkerActive?.exchange===f.peerExpected,
  stopped_group_and_active_proof:o.checkerStopped?.group===false&&o.checkerStopped?.exchange===false,
  released_active_resources:o.cleanup?.activeProcesses===0&&o.cleanup?.groups===0&&o.cleanup?.nodes===0&&o.cleanup?.jobs===0&&o.cleanup?.listeners===0,
 };
 return {passed:Object.values(checks).every(Boolean),checks};
}
