// Adapted from KineNest RuntimeAdapter (Apache-2.0): communication-only graph,
// explicit owner cleanup, no curriculum evidence or mandatory simulator.
import {LatestMailbox} from './mailbox.js';
let nextOwner=0;
export class RuntimeAdapter{
 constructor(runtime,{output=()=>{},status=()=>{},ros={},onStop=()=>{},language='Python'}={}){Object.assign(this,{runtime,output,status,ros,onStop,language});this.owner=++nextOwner;this.actionGoals=new Map();this.nodes=new Set();this.sourceNames=new Map();this.subscriptions=new Map();this.jobs=new Map();this.mailbox=new LatestMailbox();this.processed=new Map();this.reports=new Map();this.pendingServices=new Map();this.worker=null;}
 mapNode(name){const n='/'+[this.ros.namespace?.replace(/^\/+|\/+$/g,''),this.ros.name??name.replace(/^\//,'')].filter(Boolean).join('/');this.sourceNames.set(n,name);return n;}
 mapTopic(name){const absolute=n=>n.startsWith('/')?n:'/'+[this.ros.namespace?.replace(/^\/+|\/+$/g,''),n].filter(Boolean).join('/');return absolute(this.ros.remappings?.find(([a])=>absolute(a)===absolute(name))?.[1]??name);}
 watchdog(ms,message){clearTimeout(this.timer);this.timer=setTimeout(()=>{this.output(message);this.stop();},ms);}
 cleanupNode(node){for(const [id,s]of this.subscriptions)if(s.node===node){s.dispose();this.subscriptions.delete(id);this.mailbox.remove(id);}for(const [id,j]of this.jobs)if(j.node===node){j.dispose();this.jobs.delete(id);this.mailbox.remove('timer-'+id);}for(const t of this.runtime.topics.values()){t.publishers.delete(node);t.subscribers.delete(node);}for(const [name,s]of this.runtime.services)if(s.node===node)this.runtime.services.delete(name);this.runtime.removeNode(node);this.nodes.delete(node);this.runtime.removeEmptyTopics();}
 stop(){this.runtime.actions.remove(this.owner);this.actionGoals.clear();const active=!!this.worker||this.nodes.size>0;clearTimeout(this.timer);this.worker?.terminate();this.worker=null;for(const node of [...this.nodes])this.cleanupNode(node);for(const p of this.pendingServices.values()){clearTimeout(p.timer);p.reject(Error('Service process stopped'));}this.pendingServices.clear();this.runtime.parameterListeners.delete(this.parameterListener);this.mailbox.clear();if(active){this.status(this.language+' stopped');this.onStop();}}
 handle(d){const r=this.runtime;if(d.node)d={...d,node:this.mapNode(d.node)};if(d.topic)d={...d,topic:this.mapTopic(d.topic)};
  switch(d.kind){
   case 'loading':this.status(d.text);break;
   case 'executing':this.watchdog(10000,'Program took too long; stopped.');break;
   case 'ready':clearTimeout(this.timer);this.status('Running');break;
   case 'stdout':this.output(d.text);break;
   case 'log':r.log(d.node,d.text,d.level);this.output('['+d.node+'] '+d.text);break;
   case 'error':this.output(d.text);this.stop();break;
   case 'shutdown':this.stop();break;
   case 'node':if(r.nodes.has(d.node))throw Error('Node already exists: '+d.node);r.addNode(d.node);this.nodes.add(d.node);break;
   case 'destroy':this.cleanupNode(d.node);break;
   case 'publisher':r.ensureTopic(d.topic,d.type).publishers.add(d.node);break;
   case 'publish':r.publish(d.topic,d.type,d.message,{node:d.node,owner:this});break;
   case 'subscribe':{const dispose=r.subscribe(d.topic,d.node,(message,publisher,sample)=>{if(!this.worker)return;this.mailbox.offer(d.id,()=>{this.worker?.postMessage({kind:'message',subscription:d.id,message,sample});this.watchdog(5000,'Callback took too long; stopped.');});},{type:d.type});this.subscriptions.set(d.id,{node:d.node,dispose});break;}
   case 'unsubscribe':this.subscriptions.get(d.id)?.dispose();this.subscriptions.delete(d.id);this.mailbox.remove(d.id);break;
   case 'timer':{const dispose=r.every(d.period,()=>{if(this.worker)this.mailbox.offer('timer-'+d.id,()=>{this.worker?.postMessage({kind:'timer',id:d.id});this.watchdog(5000,'Timer callback took too long; stopped.');});});this.jobs.set(d.id,{node:d.node,dispose});break;}
   case 'timer_cancel':this.jobs.get(d.id)?.dispose();this.jobs.delete(d.id);this.mailbox.remove('timer-'+d.id);break;
   case 'message_processed':{const sample=r.samples.get(d.sample);if(sample)for(const node of this.nodes)sample.receivedBy.add(node);break;}
   case 'frame_done':this.mailbox.done(d.subscription);if(!this.mailbox.inFlight.size)clearTimeout(this.timer);break;
   case 'action_server':{r.actions.register(this.mapTopic(d.name),d.type,d.node,this.owner,event=>this.worker?.postMessage({kind:'action_server_event',id:d.id,...event}));break;}
   case 'action_client':r.actions.client(this.mapTopic(d.name),d.type,d.node,this.owner);break;
   case 'action_goal':{const worker=this.worker;try{const id=r.actions.goal(this.mapTopic(d.name),d.type,d.goal,this.owner,(event,payload)=>{if(this.worker===worker)worker.postMessage({kind:'action_event',id:d.id,event,payload});if(event==='result'||event==='accepted'&&!payload.accepted)this.actionGoals.delete(d.id);});this.actionGoals.set(d.id,id);}catch(error){this.output(error.message);worker?.postMessage({kind:'action_event',id:d.id,event:'accepted',payload:{accepted:false}});}break;}
   case 'action_cancel':{const worker=this.worker;r.actions.cancel(this.owner,this.actionGoals.get(d.id),accepted=>{if(this.worker===worker)worker?.postMessage({kind:'action_event',id:d.request,event:'cancel',payload:{goals_canceling:accepted?[d.id]:[]}});});break;}
   case 'action_server_reply':r.actions.serverEvent(this.owner,d.token,d.event,d.payload);break;
   case 'service':{const name=this.mapTopic(d.name);if(r.services.has(name))throw Error('Service already exists: '+name);const worker=this.worker;r.services.set(name,{node:d.node,type:d.type,handler:request=>new Promise((resolve,reject)=>{const token=String(++r.sampleCounter);const timer=setTimeout(()=>{this.pendingServices.delete(token);reject(Error('Service response timed out'));},10000);this.pendingServices.set(token,{resolve,reject,timer});worker.postMessage({kind:'service_request',id:d.id,token,request});})});break;}
   case 'service_result':{const pending=this.pendingServices.get(d.token);if(pending){clearTimeout(pending.timer);this.pendingServices.delete(d.token);pending.resolve(d.response);}break;}
   case 'service_call':{const worker=this.worker;r.callService(this.mapTopic(d.name),d.type,d.request).then(response=>{if(this.worker===worker)worker.postMessage({kind:'service_response',id:d.id,response});}).catch(e=>{if(this.worker===worker)worker.postMessage({kind:'service_response',id:d.id,response:{error:e.message}});});break;}
   case 'parameter_declare':{let p=r.parameters.get(d.node);if(!p)r.parameters.set(d.node,p=new Map());const v=Object.hasOwn(this.ros.parameters??{},d.name)?this.ros.parameters[d.name]:d.value;p.set(d.name,v);let types=r.parameterTypes.get(d.node);if(!types)r.parameterTypes.set(d.node,types=new Map());types.set(d.name,d.value_type??(typeof v==='boolean'?1:typeof v==='string'?4:Number.isInteger(v)?2:3));r.parameterEvent(d.node,d.name,v,'new_parameters');if(v!==d.value)this.worker?.postMessage({kind:'parameter_update',node:this.sourceNames.get(d.node),name:d.name,value:v});break;}
  }r.onChange();
 }
}
