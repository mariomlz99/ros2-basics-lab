import test from 'node:test';
import assert from 'node:assert/strict';
import {Lab} from '../src/lab.js';

test('topic info accepts native verbose option ordering and reads live endpoints',async()=>{
 const lab=new Lab(),publisher=lab.terminal(),inspect=lab.terminal();
 try{
  await publisher.execute("ros2 topic pub -r 5 /ordering std_msgs/msg/String '{data: live}'");
  const expected=await inspect.execute('ros2 topic info /ordering -v');
  assert.match(expected,/Publisher count: 1/);assert.match(expected,/_ros2cli_pub/);
  for(const args of ['-v /ordering','--verbose /ordering','/ordering --verbose','-v /ordering --verbose'])assert.equal(await inspect.execute('ros2 topic info '+args),expected,args);
  await assert.rejects(()=>inspect.execute('ros2 topic info -v'),/topic_name/);
  await assert.rejects(()=>inspect.execute('ros2 topic info -v /ordering extra'),/help/);
  await assert.rejects(()=>inspect.execute('ros2 topic type -v /ordering'),/help/);
  lab.close(publisher.id);
  await assert.rejects(()=>inspect.execute('ros2 topic info -v /ordering'),/Unknown topic/);
 }finally{lab.reset();}
});
