import {formatPublishedMessage,formatEchoMessage} from './message-format.js';
export {formatPublishedMessage} from './message-format.js';
import {parseMapping} from './literals.js';

import {nativeTopicHelp} from './native-topic-help.js';

function missingArguments(action,fields){
 const captured=nativeTopicHelp['topic '+action].text;
 const usage=captured.slice(0,captured.lastIndexOf('\n'));
 throw Error(usage+'\nros2 topic '+action+': error: the following arguments are required: '+fields.join(', '));
}
export function topicCLI(lab,t,args){
 const r=lab.runtime,workspace=lab.workspace,[action,...rest]=args;
 const output=text=>lab.output(t.id,text);
 const visible=type=>workspace.baseVisible(t,type.split('/')[0])||workspace.visible(t).includes(type.split('/')[0]);
 const topicName=value=>value.startsWith('/')?value:'/'+value;
 const evidence=(key,value)=>{r.cliTopicEvidence??=new Map();r.cliTopicEvidence.set(key,value);};
 if(action==='--help')return nativeTopicHelp['topic --help'].text;
 if(rest.includes('--help')&&nativeTopicHelp['topic '+action+' --help'])return nativeTopicHelp['topic '+action+' --help'].text;
 if(action==='list'&&(rest.length===0||rest.length===1&&['-t','--show-types'].includes(rest[0])))return [...r.topics].sort(([a],[b])=>a.localeCompare(b)).map(([name,topic])=>name+(rest.length?' ['+topic.type+']':'')).join('\n');
 if(action==='pub'){
  let rate=1,limit=null,waitFor=null,keepAlive=.1;const positional=[];
  for(let i=0;i<rest.length;i++){
   const arg=rest[i],number=()=>{if(i+1>=rest.length)throw Error(nativeTopicHelp['topic pub '+arg].text);const value=Number(rest[++i]);if(!Number.isFinite(value))throw Error('Invalid value for '+arg);return value;};
   if(['-1','--once'].includes(arg)){if(limit!==null)throw Error('Choose either --once or --times');limit=1;}
   else if(['-t','--times'].includes(arg)){if(limit!==null)throw Error('Choose either --once or --times');limit=number();if(!Number.isSafeInteger(limit)||limit<1)throw Error('--times must be a positive integer');}
   else if(['-r','--rate'].includes(arg))rate=number();
   else if(['-w','--wait-matching-subscriptions'].includes(arg)){waitFor=number();if(!Number.isSafeInteger(waitFor)||waitFor<0)throw Error('Subscriber count must be a nonnegative integer');}
   else if(arg==='--keep-alive'){keepAlive=number();if(keepAlive<0||keepAlive>60)throw Error('Keep-alive must be between 0 and 60 seconds in this lab');}
   else if(arg.startsWith('-'))throw Error('Unsupported topic pub option '+arg);
   else positional.push(arg);
  }
  if(positional.length<2)missingArguments('pub',['topic_name','message_type'].slice(positional.length));
  if(positional.length>3||rate<1/60||rate>20)throw Error('Use ros2 topic pub [-r 1] [--once | --times N] /topic package/msg/Type "{field: value}" (1/60–20 Hz in this lab)');
  const [rawTopic,type,payload='{}']=positional,topic=topicName(rawTopic);
  if(!visible(type))throw Error('Interface package not found');
  if(type.split('/')[1]!=='msg')throw Error('Topics require a message type');
  const message=r.registry.complete(type,parseMapping(payload));r.ensureTopic(topic,type);
  waitFor??=limit===null?0:1;
  const node='/_ros2cli_pub_'+t.id;let timer=null,waitTimer=null,finishTimer=null,stopped=false,process,job,finishPending=false;
  const record={kind:'published',terminal:t.id,topic,type,rate,limit,count:0,finished:false};
  const stop=()=>{if(process)lab.processes.stop(process.id);t.finishJob(job);};
  const send=()=>{
   if(stopped||job?.state==='Stopped')return;
   record.count++;r.publish(topic,type,message,{node,terminal:t.id});
   output('publishing #'+record.count+': '+formatPublishedMessage(r.registry,type,message)+'\n');
   if(limit!==null&&record.count>=limit){timer?.();timer=null;record.finished=true;finishTimer=setTimeout(()=>{if(job?.state==='Stopped')finishPending=true;else stop();},keepAlive*1000);}
  };
  const begin=()=>{waitTimer?.();waitTimer=null;output('publisher: beginning loop');if(limit===null||limit>1)timer=r.every(1/rate,send);send();};
  t.busy=true;t.foreground='process';
  job=t.registerJob({pause:()=>{process.state='suspended';},resume:()=>{process.state='running';if(finishPending)stop();},stop});
  process=lab.processes.task('topic pub',t.id,()=>{
   r.ensureTopic(topic,type).publishers.add(node);r.addNode(node);
   if(r.topics.get(topic).subscribers.size>=waitFor)begin();
   else waitTimer=r.every(1,()=>{if(job.state==='Stopped')return;if((r.topics.get(topic)?.subscribers.size??0)>=waitFor)begin();else output('Waiting for at least '+waitFor+' matching subscription(s)...');});
   return()=>{stopped=true;timer?.();waitTimer?.();clearTimeout(finishTimer);r.removeNode(node);r.removeEmptyTopics();t.finishJob(job);};
  });
  evidence('pub:'+process.id,record);t.stopTask=()=>lab.processes.stop(process.id);
  return waitTimer?'Waiting for at least '+waitFor+' matching subscription(s)...':'';
 }
 if(action==='echo'||action==='hz'){
  const positional=[];let once=false;
  for(const arg of rest){if(action==='echo'&&arg==='--once')once=true;else if(arg.startsWith('-'))throw Error('Unsupported topic '+action+' option '+arg);else positional.push(arg);}
  if(!positional.length)missingArguments(action,['topic_name']);
  if(positional.length>(action==='echo'?2:1))throw Error('Use ros2 topic '+action+' /topic'+(action==='echo'?' [package/msg/Type] [--once]':''));
  const topic=topicName(positional[0]),type=positional[1]??r.topics.get(topic)?.type;
  if(type&&!visible(type))throw Error('Interface package not found; source its installation in this terminal');
  if(type&&type.split('/')[1]!=='msg')throw Error('Topics require a message type');
  if(action==='echo'&&!type)throw Error('Could not determine the type for '+topic+'. Start a publisher or specify the message type: ros2 topic echo /topic package/msg/Type');
  if(type){r.registry.get(type);r.ensureTopic(topic,type);}
  const node='/_ros2cli_'+t.id;let dispose=null,discover=null,report=null,process,job,received=0,lastReported=null;const times=[],pending=[];
  const complete=()=>{lab.processes.stop(process.id);t.finishJob(job);};
  let deliver;
  const subscribe=resolvedType=>{
   discover?.();discover=null;
   deliver=(message,publisher,sample)=>{
    received++;r.samples.get(sample)?.receivedBy.add(node);
    if(action==='echo'){
     output(formatEchoMessage(r.registry,resolvedType,message)+'\n---');
     evidence('echo:'+t.id+':'+topic,{kind:'received',terminal:t.id,publisherTerminal:publisher?.terminal,topic,type:resolvedType,count:received});
     if(once)complete();
    }else{times.push(performance.now());if(times.length>10001)times.shift();}
   };
   dispose=r.subscribe(topic,node,(...args)=>{if(job.state==='Stopped'){pending.push(args);if(pending.length>10)pending.shift();}else deliver(...args);},{type:resolvedType});
  };
  t.busy=true;t.foreground='process';
  job=t.registerJob({pause:()=>{process.state='suspended';},resume:()=>{process.state='running';for(const args of pending.splice(0)){if(!lab.processes.processes.has(process.id))break;deliver(...args);}},stop:()=>lab.processes.stop(process.id)});
  process=lab.processes.task('topic '+action,t.id,()=>{
   r.addNode(node);
   if(type)subscribe(type);else discover=r.every(.1,()=>{if(job.state==='Stopped')return;const known=r.topics.get(topic)?.type;if(known)subscribe(known);});
   if(action==='hz')report=r.every(1,()=>{if(job.state==='Stopped'||times.length<2||lastReported===times.at(-1))return;lastReported=times.at(-1);const rate=(times.length-1)*1000/(times.at(-1)-times[0]);output(formatHzStatistics(times));evidence('hz:'+t.id+':'+topic,{kind:'rate',terminal:t.id,topic,rate,samples:times.length});});
   return()=>{dispose?.();discover?.();report?.();r.removeNode(node);r.removeEmptyTopics();t.finishJob(job);};
  });t.stopTask=()=>lab.processes.stop(process.id);return type?'':'Waiting for topic '+topic+' to become available...';
 }
 if(['info','type'].includes(action)&&!rest.length)missingArguments(action,['topic_name']);
 const name=rest[0]&&topicName(rest[0]),verbose=action==='info'&&rest.length===2&&['-v','--verbose'].includes(rest[1]);
 if(rest.length!==1&&!verbose)throw Error('Use ros2 topic --help');const topic=r.topics.get(name);if(!topic)throw Error('Unknown topic: '+name);
 if(action==='type')return topic.type;
 if(action==='info')return `Type: ${topic.type}\nPublisher count: ${topic.publishers.size}\nSubscription count: ${topic.subscribers.size}`+(verbose?`\nPublishers:\n${[...topic.publishers].join('\n')}\nSubscribers:\n${[...topic.subscribers].join('\n')}`:'');
 throw Error('Use ros2 topic --help');
}

export function formatHzStatistics(times){
 const intervals=times.slice(1).map((time,i)=>(time-times[i])/1000),n=intervals.length;
 if(!n)return '';
 const mean=intervals.reduce((a,b)=>a+b,0)/n,std=Math.sqrt(intervals.reduce((sum,x)=>sum+(x-mean)**2,0)/n);
 return 'average rate: '+(1/mean).toFixed(3)+'\n\tmin: '+Math.min(...intervals).toFixed(3)+'s max: '+Math.max(...intervals).toFixed(3)+'s std dev: '+std.toFixed(5)+'s window: '+n;
}
