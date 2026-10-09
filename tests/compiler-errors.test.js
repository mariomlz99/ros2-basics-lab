import test from 'node:test';
import assert from 'node:assert/strict';
import {browserCompile} from '../src/workspace.js';
for(const type of ['cpp','python'])test(type+' empty worker errors produce an actionable diagnostic',async()=>{
 const original=globalThis.Worker;let terminated=false;
 globalThis.Worker=class {postMessage(){queueMicrotask(()=>this.onerror({message:''}));}terminate(){terminated=true;}};
 try{await assert.rejects(browserCompile({type}),new RegExp('Could not start the '+type+' compiler worker.*Save your session'));assert(terminated);}finally{globalThis.Worker=original;}
});
