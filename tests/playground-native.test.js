import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Lab} from '../src/lab.js';
import {playgroundSamples} from '../scripts/playground-samples.mjs';
const fixture=JSON.parse(readFileSync(new URL('./fixtures/native-playground.json',import.meta.url)));
test('all playground inspection exercises match native Jazzy output and invalid-field diagnostics',async()=>{
 const output=[],lab=new Lab({onOutput:(id,text)=>output.push(text)}),t=lab.terminal(),samples=playgroundSamples();
 try{
  lab.runtime.addNode('/playground');for(const [topic,sample]of Object.entries(samples)){lab.runtime.ensureTopic(topic,sample.type).publishers.add('/playground');if(sample.durability)lab.runtime.publish(topic,sample.type,sample.message,{node:'/playground',durability:sample.durability});}
  for(const expected of fixture.cases){
   output.length=0;
   if(expected.code){await assert.rejects(()=>t.execute(expected.command),error=>error.message===expected.stderr);assert(!t.busy);continue;}
   const result=await t.execute(expected.command);if(result)output.push(result);
   for(const [topic,sample]of Object.entries(samples))if(!sample.durability)lab.runtime.publish(topic,sample.type,sample.message,{node:'/playground'});
   await new Promise(resolve=>setTimeout(resolve,0));assert(!t.busy,expected.command);
   assert.equal(output.join('\n'),expected.stdout,expected.command);
  }
 }finally{lab.reset();}
});
