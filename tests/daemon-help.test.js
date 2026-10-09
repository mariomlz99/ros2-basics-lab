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

test('native direct discovery, abbreviations and repeated daemon lifecycle',async()=>{
 const lab=new Lab(),t=lab.terminal(),other=lab.terminal();try{
  await assert.rejects(()=>t.execute('ros2 node list --invalid'));
  assert.equal(await other.execute('ros2 daemon status'),'The daemon is not running');
  assert.match(await t.execute('ros2 node list --all --no-daemon'),/^\/_ros2cli_\d+$/);
  assert.equal(await other.execute('ros2 daemon status'),'The daemon is not running');
  const first=await t.execute('ros2 node list --a');assert.match(first,/^\/_ros2cli_\d+\n\/_ros2cli_daemon_0_[a-f0-9]{32}$/);
  const daemon=lab.runtime.systemNode;assert.equal(await t.execute('ros2 node list --all'),daemon);
  assert.equal(lab.runtime.nodes.size,0);
  await t.execute('ros2 daemon stop');assert.equal(await other.execute('ros2 daemon status'),'The daemon is not running');
  assert.equal(await other.execute('ros2 daemon stop'),'The daemon is not running');
  await t.execute('ros2 daemon start');assert.notEqual(lab.runtime.systemNode,daemon);
  assert.equal(await other.execute('ros2 daemon start'),'The daemon is already running');
 }finally{lab.reset();}
});

// Captured against native Jazzy in isolated domain 213; IDs are ephemeral.
test('daemon transcript matches native Jazzy command by command',async()=>{
 const {readFile}=await import('node:fs/promises');
 const records=JSON.parse(await readFile(new URL('./fixtures/native-daemon.json',import.meta.url),'utf8'));
 const normalize=s=>s.trim().replace(/_ros2cli_daemon_\d+_[a-f0-9]+/g,'_ros2cli_daemon_DOMAIN_ID').replace(/_ros2cli_\d+/g,'_ros2cli_PID');
 const lab=new Lab(),terminal=lab.terminal();try{for(const record of records){assert.equal(record.status,0);assert.equal(normalize(await terminal.execute(record.command)),normalize(record.stdout),record.command);}}finally{lab.reset();}
});
