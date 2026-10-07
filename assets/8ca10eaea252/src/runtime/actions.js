// Browser action transport. User server/client code executes in its own worker.
// Goal ownership, terminal states and cancellation are enforced here.
export class Actions {
 constructor(runtime){this.runtime=runtime;this.servers=new Map();this.clients=new Map();this.goals=new Map();this.events=[];this.next=0;}
 record(event,goal){this.events.push({event,id:goal.id,name:goal.name,status:goal.status});if(this.events.length>200)this.events.shift();this.runtime.onChange();}
 register(name,type,node,owner,send){if(this.servers.has(name))throw Error('Action server already exists: '+name);if(!this.runtime.registry.get(type).feedback)throw Error('Not an action interface');this.servers.set(name,{type,node,owner,send});}
 client(name,type,node,owner){this.clients.set(owner+':'+node+':'+name,{name,type,node,owner});}
 goal(name,type,request,owner,notify){const server=this.servers.get(name);if(!server)throw Error('Action server not available: '+name);if(server.type!==type)throw Error('Action type mismatch');this.runtime.registry.validate(type,request);const id=String(++this.next),goal={id,name,type,request,owner,server,notify,status:1,accepted:false};this.goals.set(id,goal);goal.timeout=setTimeout(()=>{if(this.goals.has(id)&&!goal.accepted){notify('accepted',{accepted:false});this.drop(goal);}},10000);server.send({event:'goal',token:id,request});return id;}
 drop(goal){clearTimeout(goal.timeout);this.goals.delete(goal.id);}
 serverEvent(owner,token,event,payload){const goal=this.goals.get(token);if(!goal||goal.server.owner!==owner)return;
  if(event==='accepted'){if(goal.accepted||goal.status!==1)return;clearTimeout(goal.timeout);goal.accepted=!!payload.accepted;goal.status=goal.accepted?2:0;goal.notify('accepted',{accepted:goal.accepted});this.record(goal.accepted?'accepted':'rejected',goal);if(!goal.accepted)this.drop(goal);return;}
  if(!goal.accepted)return;
  if(event==='feedback'){this.runtime.registry.validateFields(this.runtime.registry.get(goal.type).feedback,payload,goal.type);goal.notify('feedback',{feedback:payload});this.record('feedback',goal);}
  else if(event==='cancel'){if(!goal.cancel)return;const cancel=goal.cancel;delete goal.cancel;if(payload.accepted)goal.status=3;cancel(!!payload.accepted);this.record('cancel',goal);}
  else if(event==='result'){if(![4,5,6].includes(payload.status)||payload.status===5&&goal.status!==3)throw Error('Invalid action terminal state');this.runtime.registry.validate(goal.type,payload.result,true);goal.status=payload.status;goal.notify('result',payload);goal.cancel?.(false);this.record('result',goal);this.drop(goal);}
 }
 cancel(owner,id,reply){const goal=this.goals.get(id);if(!goal||goal.owner!==owner||!goal.accepted||goal.status!==2||goal.cancel){reply(false);return;}goal.cancel=reply;goal.server.send({event:'cancel',token:id});}
 remove(owner){for(const [name,s]of this.servers)if(s.owner===owner)this.servers.delete(name);for(const [key,c]of this.clients)if(c.owner===owner)this.clients.delete(key);for(const goal of [...this.goals.values()]){if(goal.server.owner===owner){if(goal.accepted){const result=this.runtime.registry.complete(goal.type,{},true);goal.status=6;goal.notify('result',{status:6,result});this.record('result',goal);}else goal.notify('accepted',{accepted:false});goal.cancel?.(false);this.drop(goal);}else if(goal.owner===owner){goal.notify=()=>{};this.cancel(owner,goal.id,()=>{});}}}
 reset(){for(const goal of this.goals.values())clearTimeout(goal.timeout);this.goals.clear();this.servers.clear();this.clients.clear();this.events=[];}
}
