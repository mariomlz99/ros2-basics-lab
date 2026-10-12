// Lazy factories keep compiler assets out of Python-only sessions.
export const LANGUAGE_ADAPTERS = new Map([
 ['python',()=>import('../python/bridge.js').then(module=>module.PythonBridge)],
 ['cpp',()=>import('../cpp/bridge.js').then(module=>module.CppBridge)]
]);
export class ExecutionHost {
 constructor(runtime,options={},factories=LANGUAGE_ADAPTERS){this.runtime=runtime;this.options=options;this.factories=new Map(factories);this.instances=new Map();this.epoch=0;this.loading=false;}
 get active(){return this.loading||[...this.instances.values()].some(adapter=>adapter.worker);}
 peek(language){return this.instances.get(language);}
 async run(language,code){
  this.stop();const generation=this.epoch,factory=this.factories.get(language);
  if(!factory)throw Error('Unsupported code language: '+language);
  this.loading=true;
  try{
   let adapter=this.instances.get(language);
   if(!adapter){const Adapter=await factory();if(generation!==this.epoch)return false;adapter=new Adapter(this.runtime,this.options);this.instances.set(language,adapter);}
   this.loading=false;adapter.run(code);return true;
  }catch(error){if(generation!==this.epoch)return false;this.loading=false;throw error;}
 }
 stop(){this.epoch++;this.loading=false;for(const adapter of this.instances.values())adapter.stop();}
 reset(){this.stop();}
 dispose(){this.stop();this.instances.clear();}
}
