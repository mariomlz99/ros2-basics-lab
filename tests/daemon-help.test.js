import test from 'node:test';import assert from 'node:assert/strict';
import {Lab} from '../src/lab.js';import {rootHelp,ROS_COMMANDS} from '../src/cli-help.js';import {rosCompletions} from '../src/completion.js';
test('root help retains native layout with only supported command groups',async()=>{
 const lab=new Lab(),t=lab.terminal();try{
  const help=await t.execute('ros2 --help');assert.equal(help,rootHelp());assert.match(help,/^usage: ros2/);assert.match(help,/ros2 is an extensible command-line tool for ROS 2/);assert.match(help,/options:/);
  assert.deepEqual([...help.matchAll(/^  ([a-z]+) {2,}/gm)].map(m=>m[1]),ROS_COMMANDS);
  assert.equal(await t.execute('ros2 -h'),help);assert.equal(await t.execute('ros2 --use-python-default-buffering --help'),help);
  for(const name of ROS_COMMANDS)assert(await t.execute('ros2 '+name+' --help'));
 }finally{lab.reset();}
});
test('daemon visibility, stop/start/status and discovery restart do not stop other nodes',async()=>{
 const lab=new Lab(),t=lab.terminal(),pub=lab.terminal();try{
  assert.equal(await t.execute('ros2 daemon status'),'The daemon is not running');
  assert.equal(await t.execute('ros2 node list'),'');assert.equal(await t.execute('ros2 node list --all'),lab.runtime.systemNode);assert.equal(await t.execute('ros2 node list -a -c'),'1');
  await pub.execute("ros2 topic pub /daemon_test std_msgs/msg/String '{data: hello}'");
  assert.equal(await t.execute('ros2 daemon stop'),'The daemon has been stopped');assert(pub.busy);assert.equal(await t.execute('ros2 daemon status'),'The daemon is not running');assert.equal(await t.execute('ros2 daemon stop'),'The daemon is not running');
  assert.equal(await t.execute('ros2 daemon start'),'The daemon has been started');assert.equal(await t.execute('ros2 daemon start'),'The daemon is already running');assert.equal(await t.execute('ros2 daemon status'),'The daemon is running');
  await t.execute('ros2 daemon stop');assert.match(await t.execute('ros2 node list --all'),/_ros2cli_daemon_/);assert.equal(await t.execute('ros2 daemon status'),'The daemon is running');
  assert.deepEqual(rosCompletions(lab,t,'ros2 daemon st'),['start','status','stop']);await assert.rejects(()=>t.execute('ros2 daemon unknown'));
 }finally{lab.reset();}
});
