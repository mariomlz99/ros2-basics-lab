import test from'node:test';import assert from'node:assert/strict';import{FileSystem}from'../src/fs.js';import{Terminal}from'../src/shell.js';import{Workspace,Builder,ROOT}from'../src/workspace.js';
function fixture(){const fs=new FileSystem();fs.mkdir(ROOT+'/src',true);return {fs,w:new Workspace(fs)};}
test('empty package layouts and meaningful installs',async()=>{const{fs,w}=fixture();w.create('py_pkg','ament_python');w.create('cpp_pkg','ament_cmake');assert.equal(fs.entry(ROOT+'/src/py_pkg/test').kind,'dir');assert.ok(fs.exists(ROOT+'/src/cpp_pkg/include/cpp_pkg'));let calls=0;const b=new Builder(w,async()=>{calls++;return {imports:[]};});await b.build();assert.equal(calls,1);assert.ok(fs.exists(ROOT+'/install/setup.bash'));const a=new Terminal(fs,1),c=new Terminal(fs,2);assert.throws(()=>w.resolve(a,'py_pkg'),/not found/);await a.execute('source '+ROOT+'/install/setup.bash');assert.equal(w.resolve(a,'py_pkg').name,'py_pkg');assert.throws(()=>w.resolve(c,'py_pkg'));fs.write(ROOT+'/src/py_pkg/py_pkg/__init__.py','# edit');assert.equal(w.current('py_pkg'),false);await b.build(['py_pkg']);fs.remove(ROOT+'/install',{recursive:true});assert.equal(w.current('py_pkg'),false);});
test('build diagnostics, failure and concurrent edits',async()=>{const{fs,w}=fixture();w.create('hello','ament_python',{node:'hello'});fs.remove(ROOT+'/src/hello/hello/hello.py');assert.throws(()=>w.inspect('hello'),/Missing source/);fs.write(ROOT+'/src/hello/hello/hello.py','def main(): pass');await assert.rejects(()=>new Builder(w,async()=>{throw Error('SyntaxError');}).build(),/SyntaxError/);assert.equal(w.current('hello'),false);await assert.rejects(()=>new Builder(w,async()=>{fs.write(ROOT+'/src/hello/hello/hello.py','# changed');return {};}).build(),/changed during build/);});

import {Lab} from '../src/lab.js';
test('colcon discovers from cwd, produces empty build spaces and warns for unknown selections',async()=>{
 const lab=new Lab(),t=lab.terminal();let output=[];t.output=s=>output.push(s);
 await t.execute('mkdir ros2_ws');await t.execute('cd ros2_ws');assert.match(await t.execute('colcon build'),/^Summary: 0 packages finished \[/);
 for(const directory of ['build','install','log'])assert(lab.fs.exists(ROOT+'/'+directory+'/COLCON_IGNORE'));
 await t.execute('source install/setup.bash');assert.equal(lab.workspace.visible(t).length,0);
 await t.execute('mkdir src');assert.match(await t.execute('colcon build'),/^Summary: 0 packages finished/);
 assert.match(await t.execute('colcon build --packages-select unknown'),/0 packages finished/);assert(output.some(s=>s.includes("ignoring unknown package 'unknown'")));
 await t.execute('cd src');await t.execute('ros2 pkg create --build-type ament_cmake demo');assert.match(await t.execute('colcon build'),/^Summary: 1 package finished/);
 assert(lab.fs.exists(ROOT+'/src/build/demo/status.txt'));assert.equal(lab.workspace.visible(t).length,0);await t.execute('source install/setup.bash');assert.deepEqual(lab.workspace.visible(t),['demo']);
 await t.execute('cd ..');await t.execute('colcon build');assert.equal(lab.workspace.installed.get('demo').buildRoot,ROOT);assert.equal(lab.workspace.current('demo'),true);assert.equal(lab.workspace.installed.size,1);
 lab.reset();
});
test('colcon skips non-packages and ignored directories and reports failed package',async()=>{
 const lab=new Lab(),t=lab.terminal();await t.execute('mkdir -p ~/ros2_ws/src/notes ~/ros2_ws/src/ignored');await t.execute('touch ~/ros2_ws/src/ignored/COLCON_IGNORE');await t.execute('cd ~/ros2_ws/src');await t.execute('ros2 pkg create --build-type ament_cmake broken');lab.fs.write(ROOT+'/src/broken/CMakeLists.txt','unsupported()');await t.execute('cd ..');
 await assert.rejects(()=>t.execute('colcon build'),/Failed <<< broken[^]*Summary: 0 packages finished[^]*1 package failed: broken/);assert(lab.fs.read(ROOT+'/log/broken/stderr.log').includes('outside the supported'));
 assert.equal(lab.workspace.current('broken'),false);lab.reset();
});
