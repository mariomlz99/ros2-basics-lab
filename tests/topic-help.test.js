import test from 'node:test';
import assert from 'node:assert/strict';
import {Lab} from '../src/lab.js';
import {nativeTopicHelp} from '../src/native-topic-help.js';
test('topic help and incomplete commands match native Jazzy captures',async()=>{
 const lab=new Lab(),t=lab.terminal();try{
  for(const [command,expected] of Object.entries(nativeTopicHelp)){
   if(expected.status===0)assert.equal(await t.execute('ros2 '+command),expected.text,command);
   else await assert.rejects(()=>t.execute('ros2 '+command),error=>{assert.equal(error.message,expected.text,command);return true;});
   assert(!t.busy,command+' must return to the prompt');
   assert.equal(lab.runtime.nodes.size,0);assert.equal(lab.runtime.jobs.size,0);assert.equal(lab.processes.active().length,0);
  }
  assert.equal(await t.execute('ros2 topic echo -h'),nativeTopicHelp['topic echo --help'].text);
  await assert.rejects(()=>t.execute('ros2 topic echo /example --qos-depth 10'),/Unsupported topic echo option --qos-depth/);
  assert.equal(await t.execute('echo ready'),'ready');
 }finally{lab.reset();}
});
