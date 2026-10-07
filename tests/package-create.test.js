import test from 'node:test';
import assert from 'node:assert/strict';
import {Lab} from '../src/lab.js';
for(const type of ['ament_python','ament_cmake'])test(`${type} creation reports actual metadata and generated paths in cwd`,async()=>{
 const lab=new Lab(),terminal=lab.terminal();
 await terminal.execute('mkdir -p ~/practice/ros2_ws/src');await terminal.execute('cd ~/practice/ros2_ws/src');
 const command=`ros2 pkg create --build-type ${type} --license Apache-2.0 --node-name hello my_first_package --dependencies std_msgs`;
 const output=await terminal.execute(command);
 assert.match(output,/going to create a new package/);assert.ok(output.includes('build type: '+type));assert.match(output,/dependencies: \['std_msgs'\]/);assert.match(output,/node_name: hello/);
 const base=terminal.cwd+'/my_first_package';
 assert.ok(output.includes('destination directory: '+terminal.cwd));
 const reported=output.split('\n').filter(line=>/^creating (folder )?\//.test(line)).map(line=>line.replace(/^creating (folder )?/,''));
 for(const path of reported)assert.ok(lab.fs.exists(path),path);
 for(const path of Object.keys(lab.fs.filesUnder(base)))assert.ok(reported.includes(base+'/'+path),path);
 assert.ok(reported.includes(base+(type==='ament_python'?'/my_first_package/hello.py':'/src/hello.cpp')));
 const before=lab.fs.read(base+'/package.xml');await assert.rejects(()=>terminal.execute(command),/Aborted!\nThe directory already exists:/);assert.equal(lab.fs.read(base+'/package.xml'),before);
 lab.reset();
});
