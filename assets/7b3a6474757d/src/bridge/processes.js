// Modified from KineNest: remove robot coupling and carry installed worker artifacts.
import {LANGUAGE_ADAPTERS} from '../runtime/languages.js';
import {parseLaunch} from './launch.js';

export class ProcessManager {
  constructor(runtime,workspace,{factories=LANGUAGE_ADAPTERS,onChange=()=>{},onOutput=()=>{}}={}){
    this.runtime=runtime;this.workspace=workspace;this.factories=factories;this.onChange=onChange;this.onOutput=onOutput;
    this.processes=new Map();this.groups=new Map();this.nextId=0;this.generation=0;
  }
  task(executable,terminal,start){const id=++this.nextId;const process={id,name:'ros2cli',executable,terminal,language:'cli',state:'running',output:[]};this.processes.set(id,process);try{const cleanup=start(process);process.adapter={stop:cleanup};this.onChange();return process;}catch(e){this.processes.delete(id);throw e;}}
  active(){return [...this.processes.values()].filter(p=>p.state!=='stopped');}
  communicated(active,{topics=null}={}){
    const publishers=active.filter(p=>p.executable==='publisher'),subscribers=active.filter(p=>p.executable==='subscriber');
    return publishers.some(p=>subscribers.some(s=>[...this.runtime.samples].some(([id,sample])=>
      id>Math.max(p.sampleStart,s.sampleStart)&&sample.processed&&
      sample.publisherOwner===p.adapter&&sample.receiverOwner===s.adapter&&
      p.adapter?.nodes.has(sample.publisher)&&s.adapter?.nodes.has(sample.receiver)&&
      (!topics||topics.has(sample.topic)))));
  }
  async run(name,executable,{terminal=null,group=null,ros={},installedRecord=null}={}){
    const installed=installedRecord??this.workspace.installedPackage(name),entry=installed.executables.get(executable);
    if(!entry||!this.workspace.executableExists(name,executable,installed))throw Error('Executable '+executable+' is not installed in '+name+'.');
    const id=++this.nextId,token=this.generation;
    const process={id,name,executable,terminal,group,ros,state:'loading',language:installed.type,adapter:null,output:[],sampleStart:this.runtime.sampleCounter};
    this.processes.set(id,process);if(group)this.groups.get(group)?.add(id);this.onChange();
    try{
      const factory=this.factories.get(installed.type);if(!factory)throw Error('No execution adapter for '+installed.type);
      const Adapter=await factory();if(token!==this.generation||!this.processes.has(id))return null;
      const options={ros,output:text=>{process.output.push(text);if(process.output.length>100)process.output.shift();this.onOutput(process,text);},status:text=>{process.status=text;this.onChange();},onStop:()=>{process.state='stopped';this.processes.delete(id);if(group){const members=this.groups.get(group);members?.delete(id);if(members?.size===0)this.groups.delete(group);}this.onChange();}};
      const adapter=new Adapter(this.runtime,options);process.adapter=adapter;
      const program=installed.type==='python'?{files:installed.files,entry,schema:installed.schema,services:[...this.runtime.services.keys()]}:{code:entry.code,module:entry.module,schema:installed.schema,services:[...this.runtime.services.keys()]};
      adapter.run(program);process.state='running';this.onChange();return process;
    }catch(error){this.processes.delete(id);if(group){const members=this.groups.get(group);members?.delete(id);if(members?.size===0)this.groups.delete(group);}this.onChange();throw error;}
  }
  async launch(name,file,{terminal=null,resolvePackage=name=>this.workspace.installedPackage(name)}={}){
    const installed=resolvePackage(name);
    if(!installed.launch.includes('launch/'+file))throw Error('Launch file '+file+' is not installed in '+name+'. Rebuild after editing it.');
    const actions=parseLaunch(installed.files['launch/'+file]);
    for(const action of actions){const packageRecord=resolvePackage(action.package);if(!packageRecord.executables.has(action.executable))throw Error('Launch executable '+action.package+'/'+action.executable+' is not installed.');}
    const group='launch-'+(++this.nextId);this.groups.set(group,new Set());
    try{
      const started=[];
      for(const action of actions){const process=await this.run(action.package,action.executable,{terminal,group,ros:action,installedRecord:resolvePackage(action.package)});if(!process)throw Error('Launch was cancelled.');started.push(process);}
      return {group,processes:started};
    }catch(error){this.stopGroup(group);throw error;}
  }
  stop(id){const process=this.processes.get(id);if(!process)return;this.processes.delete(id);process.state='stopped';process.adapter?.stop();if(process.group){const members=this.groups.get(process.group);members?.delete(id);if(members?.size===0)this.groups.delete(process.group);}this.onChange();}
  stopGroup(group){for(const id of [...(this.groups.get(group)??[])])this.stop(id);this.groups.delete(group);this.onChange();}
  stopTerminal(terminal){for(const process of this.active())if(process.terminal===terminal)this.stop(process.id);}
  stopAll(){this.generation++;for(const id of [...this.processes.keys()])this.stop(id);this.groups.clear();this.onChange();}
  reset(){this.stopAll();this.processes.clear();this.groups.clear();this.nextId=0;}
}
