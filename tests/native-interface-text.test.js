import test from 'node:test';
import assert from 'node:assert/strict';
import {Lab} from '../src/lab.js';
import {BUILTIN} from '../src/interfaces/builtin.js';
import {NATIVE_INTERFACE_TEXT} from '../src/interfaces/native-text.js';
import {parseMessage} from '../src/interfaces/registry.js';
import {seedEcosystem} from '../src/ros-ecosystem.js';
test('all supported built-in interfaces retain native source and all display modes',async()=>{
 const lab=new Lab(),t=lab.terminal();try{
  for(const name of Object.keys(BUILTIN)){
   const native=NATIVE_INTERFACE_TEXT[name];assert(native,'Capture native text for '+name);
   const [pkg,kind,type]=name.split('/');
   assert.equal(lab.fs.read(`/opt/ros/jazzy/share/${pkg}/${kind}/${type}.${kind}`),native.source,name);
   for(const [flag,mode] of [['','default'],[' --all-comments','all'],[' --no-comments','none']])assert.equal(await t.execute('ros2 interface show '+name+flag),native[mode],name+flag);
  }
  const path='/opt/ros/jazzy/share/geometry_msgs/msg/Twist.msg';lab.fs.write(path,'# User edit\n');seedEcosystem(lab.fs);assert.equal(lab.fs.read(path),'# User edit\n');
  const source='# My message\n\nstring label # user label\n';lab.workspace.registry.add('demo/msg/Label',parseMessage(source));assert.equal(lab.workspace.registry.show('demo/msg/Label'),source.slice(0,-1));assert.equal(lab.workspace.registry.show('demo/msg/Label','none'),'string label');
 }finally{lab.reset();}
});
test('CLI nodes are hidden by default and keep topic endpoints until stopped',async()=>{
 const lab=new Lab(),echo=lab.terminal(),pub=lab.terminal(),inspect=lab.terminal();try{
  await echo.execute('ros2 topic echo /hidden_check std_msgs/msg/String');await pub.execute("ros2 topic pub /hidden_check std_msgs/msg/String '{data: hello}'");
  assert.equal(await inspect.execute('ros2 node list'),'');assert.equal(await inspect.execute('ros2 node list -c'),'0');
  assert.match(await inspect.execute('ros2 node list --all'),/_ros2cli_/);assert.equal(await inspect.execute('ros2 node list -a --count-nodes'),'3');
  lab.runtime.addNode('/student');lab.runtime.addNode('/namespace/_private');lab.runtime.addNode('/_namespace/visible');
  assert.equal(await inspect.execute('ros2 node list'),'/_namespace/visible\n/student');
  assert.match(await inspect.execute('ros2 topic info /hidden_check'),/Publisher count: 1\nSubscription count: 1/);
  lab.stop(pub.id);lab.stop(echo.id);assert.equal(await inspect.execute('ros2 node list --all'),['/namespace/_private','/_namespace/visible',lab.runtime.systemNode,'/student'].sort().join('\n'));assert.equal(lab.runtime.jobs.size,0);
 }finally{lab.reset();}
});
