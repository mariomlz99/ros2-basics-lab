import test from 'node:test';
import assert from 'node:assert/strict';
import {load} from './source-root.mjs';

const {Lab}=await load('lab.js');
const {ROOT,setup}=await load('workspace.js');
const {pubsubFiles,launchSource}=await load('examples.js');
const {RuntimeAdapter}=await load('runtime/adapter.js');
const {lessonChecks}=await load('course/checks.js');
const {changedParameterOutput}=await load('runtime/parameter-evidence.js');

// Exercise the real Lab/graph/checker with explicit compiler and worker doubles.
// Browser Python/C++ execution is a separate release-validation requirement.
class Recorded extends RuntimeAdapter{
 run(){this.messages=[];this.worker={postMessage:message=>this.messages.push(message),terminate(){}};}
}
async function withLab(run){
 const lab=new Lab();
 try{
  lab.fs.mkdir(ROOT+'/src',true);
  lab.workspace.create('checker_probe','ament_python',{dependencies:['rclpy','std_msgs']});
  const files={...pubsubFiles('python','checker_probe'),
   'setup.py':setup('checker_probe',['talker = checker_probe.talker:main','listener = checker_probe.listener:main'],['launch/system.launch.py']),
   'launch/system.launch.py':launchSource('checker_probe')};
  for(const [path,content]of Object.entries(files)){
   const full=ROOT+'/src/checker_probe/'+path;
   lab.fs.mkdir(full.slice(0,full.lastIndexOf('/')),true);lab.fs.write(full,content);
  }
  lab.builder.compile=async()=>({imports:[]});await lab.builder.build();
  lab.processes.factories=new Map([['python',async()=>Recorded]]);
  const terminal=lab.terminal();await terminal.ready;
  await run(lab,terminal);
 }finally{lab.reset();}
}

async function parameterCase(lab,terminal,{previous,value,before,after,type}){
 const process=await lab.processes.run('checker_probe','talker'),adapter=process.adapter;
 adapter.handle({kind:'node',node:'/sender'});
 adapter.handle({kind:'parameter_declare',node:'/sender',name:'setting',value:previous});
 adapter.handle({kind:'publisher',node:'/sender',topic:'/observed',type});
 const publish=data=>adapter.handle({kind:'publish',node:'/sender',topic:'/observed',type,message:{data}});
 publish(before);
 assert.equal(lessonChecks(lab,4)[2].passed,false,'a publication alone is not parameter-change evidence');
 await terminal.execute('ros2 param set /sender setting '+JSON.stringify(value));
 publish(after);
 return {passed:lessonChecks(lab,4)[2].passed,publish};
}

for(const [name,previous,value,before,after]of [
 ['shortening','Hello World','Hello','Hello World: 0','Hello World: 1'],
 ['lengthening','Hello','Hello World','Hello World: 0','Hello World: 1']
])test('parameter checker rejects ignored overlapping '+name+' despite a changing counter',()=>withLab(async(lab,t)=>{
 const result=await parameterCase(lab,t,{previous,value,before,after,type:'std_msgs/msg/String'});
 assert.equal(result.passed,false);
}));

for(const [name,previous,value,before,after,type]of [
 ['shortened string','Hello World','Hello','Hello World: 0','Hello: 1','std_msgs/msg/String'],
 ['longer string','Hello','Hello World','Hello: 0','Hello World: 1','std_msgs/msg/String'],
 ['unrelated string','first','second','first: 0','second: 1','std_msgs/msg/String'],
 ['number',2.5,4.5,2.5,4.5,'std_msgs/msg/Float64'],
 ['boolean',false,true,false,true,'std_msgs/msg/Bool']
])test('parameter checker accepts observed '+name+' changes',()=>withLab(async(lab,t)=>{
 const result=await parameterCase(lab,t,{previous,value,before,after,type});
 assert.equal(result.passed,true);
 lab.reset();assert.equal(lessonChecks(lab,4)[2].passed,false,'Reset removes previous observations');
}));

test('numeric parameter evidence needs the same payload field, value and type',()=>{
 assert.equal(changedParameterOutput({reading:2.5},{other:4.5},2.5,4.5),false);
 assert.equal(changedParameterOutput({reading:'2.5'},{reading:'4.5'},2.5,4.5),false);
 assert.equal(changedParameterOutput({reading:2.5},{reading:2.5,counter:4.5},2.5,4.5),false);
 assert.equal(changedParameterOutput({nested:{reading:2.5}},{nested:{reading:4.5}},2.5,4.5),true);
 assert.equal(changedParameterOutput({reading:2.5},{reading:2.5},2.5,2.5),false);
});

function node(process,name){process.adapter.handle({kind:'node',node:name});}
function subscribe(process,name,id=1){process.adapter.handle({kind:'subscribe',id,node:name,topic:'/observed',type:'std_msgs/msg/String'});}
function publish(process,name){
 process.adapter.handle({kind:'publisher',node:name,topic:'/observed',type:'std_msgs/msg/String'});
 process.adapter.handle({kind:'publish',node:name,topic:'/observed',type:'std_msgs/msg/String',message:{data:'observed'}});
}
function acknowledge(process,id=1){
 const delivered=process.adapter.messages.findLast(message=>message.kind==='message');
 assert(delivered,'the real graph delivered a sample to the worker double');
 process.adapter.handle({kind:'message_processed',sample:delivered.sample});
 process.adapter.handle({kind:'frame_done',subscription:id});
}

test('launch checker rejects self-delivery and accepts recovery with a distinct launched subscriber',()=>withLab(async lab=>{
 const {processes:[publisher,receiver]}=await lab.processes.launch('checker_probe','system.launch.py');
 node(publisher,'/talker');node(receiver,'/listener');
 subscribe(publisher,'/talker');publish(publisher,'/talker');acknowledge(publisher);
 assert.equal(receiver.adapter.messages.filter(message=>message.kind==='message').length,0);
 assert.equal(lessonChecks(lab,5)[1].passed,true,'both launch children exist');
 assert.equal(lessonChecks(lab,5)[2].passed,false,'hearing oneself is not interprocess exchange');
 subscribe(receiver,'/listener');publish(publisher,'/talker');acknowledge(receiver);
 assert.equal(lessonChecks(lab,5)[2].passed,true,'a distinct launched child processed the sample');
 lab.reset();assert.equal(lessonChecks(lab,5)[2].passed,false);
}));

test('launch checker accepts a reversed publisher/subscriber alternative',()=>withLab(async lab=>{
 const {processes:[first,second]}=await lab.processes.launch('checker_probe','system.launch.py');
 node(first,'/first');node(second,'/second');subscribe(first,'/first');publish(second,'/second');
 assert.equal(lessonChecks(lab,5)[2].passed,false,'queued but unprocessed output does not count');
 acknowledge(first);assert.equal(lessonChecks(lab,5)[2].passed,true);
}));

test('launch checker rejects communication between separately started processes',()=>withLab(async lab=>{
 const first=await lab.processes.run('checker_probe','talker');
 const second=await lab.processes.run('checker_probe','listener');
 node(first,'/first');node(second,'/second');subscribe(second,'/second');publish(first,'/first');acknowledge(second);
 assert.equal(lessonChecks(lab,5)[2].passed,false);
}));
