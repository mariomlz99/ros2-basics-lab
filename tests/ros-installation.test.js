import test from 'node:test';
import assert from 'node:assert/strict';
import {Lab} from '../src/lab.js';
import {captureSession,restoreSession} from '../src/session.js';
test('installed ROS paths are shared and setup restores each terminal environment without duplicates',async()=>{
 const lab=new Lab(),a=lab.terminal(),b=lab.terminal();
 for(const name of ['bin','etc','include','lib','opt','share','src','tools','setup.bash','local_setup.bash','setup.sh','local_setup.sh','setup.zsh','local_setup.zsh','_local_setup_util.py'])assert(lab.fs.exists('/opt/ros/jazzy/'+name));
 assert.equal(await a.execute('which ros2'),'/opt/ros/jazzy/bin/ros2');
 await a.execute('cd /opt/ros/jazzy/bin');assert.match(await a.execute('ls'),/ros2/);
 assert.match(await b.execute('cat /opt/ros/jazzy/share/std_msgs/msg/String.msg'),/string data/);
 a.env.PATH='/usr/bin:/bin';delete a.env.ROS_DISTRO;
 assert.equal(await a.execute('which ros2'),'');
 await a.execute('. /opt/ros/jazzy/local_setup.bash');await a.execute('source /opt/ros/jazzy/setup.sh');
 assert.equal(a.env.PATH,b.env.PATH);assert.equal(a.env.ROS_DISTRO,'jazzy');
 assert.equal(await a.execute('ros2 pkg prefix std_msgs'),'/opt/ros/jazzy');
 await assert.rejects(()=>a.execute('source /opt/ros/jazzy/missing.bash'),/No such/);
 lab.reset();
});
test('legacy sessions receive the installation without losing student files',()=>{
 const lab=new Lab();lab.terminal();lab.fs.write('/home/student/notes.txt','keep me');
 const saved=captureSession(lab,{});for(const path of saved.workspace.entries.keys())if(path.startsWith('/opt/ros/jazzy/'))saved.workspace.entries.delete(path);
 const restored=new Lab();restoreSession(restored,saved);
 assert(restored.fs.exists('/opt/ros/jazzy/bin/ros2'));assert(restored.fs.exists('/opt/ros/jazzy/share/std_msgs/msg/String.msg'));
 assert.equal(restored.fs.read('/home/student/notes.txt'),'keep me');lab.reset();restored.reset();
});

// Installation coverage is checked against the runtime definitions, not a second list.
import {BUILTIN} from '../src/interfaces/builtin.js';
import {InterfaceRegistry} from '../src/interfaces/registry.js';
import {BASE_PACKAGES,seedEcosystem,interfaceSource} from '../src/ros-ecosystem.js';
import {CPP_RUNTIME_HEADERS} from '../src/runtime-catalog.js';
import {SYSTEM_COMMANDS} from '../src/ros-installation.js';
import {RUNTIME_FILES} from '../src/installation-assets.js';
test('every supported interface, runtime header, command and package has installed artifacts',()=>{
 const lab=new Lab(),fs=lab.fs,prefix='/opt/ros/jazzy',python=prefix+'/lib/python3.12/site-packages';
 for(const pkg of BASE_PACKAGES){assert(fs.exists(prefix+'/share/'+pkg+'/package.xml'),pkg);assert(fs.exists(prefix+'/share/ament_index/resource_index/packages/'+pkg),pkg);assert(fs.exists(prefix+'/share/'+pkg+'/cmake/'+pkg+'Config.cmake'),pkg);}
 for(const [name,record]of Object.entries(BUILTIN)){
  const [pkg,kind,type]=name.split('/');
  assert.equal(fs.read(prefix+'/share/'+pkg+'/'+kind+'/'+type+'.'+kind),interfaceSource(record),name);
  assert.match(fs.read(python+'/'+pkg+'/'+kind+'/__init__.py'),new RegExp('import '+type+'(?:\n|$)'),name);
  assert.match(fs.read(prefix+'/lib/lib'+pkg+'__rosidl_typesupport_cpp.so'),/SIMULATED/,name);
  assert(fs.read(prefix+'/share/ament_index/resource_index/rosidl_interfaces/'+pkg).includes(kind+'/'+type+'.'+kind));
 }
 for(const [path,content]of Object.entries(new InterfaceRegistry().cppHeaders()))assert.equal(fs.read(prefix+path),content,path);
 for(const path of Object.keys(CPP_RUNTIME_HEADERS))assert.equal(fs.read(prefix+path),RUNTIME_FILES.files[path],path);
 for(const module of RUNTIME_FILES.modules)assert(fs.exists(python+'/'+module.replaceAll('.','/')+(module.includes('.')?'.py':'/__init__.py')),module);
 for(const command of SYSTEM_COMMANDS)for(const dir of ['/bin','/usr/bin'])assert(fs.exists(dir+'/'+command));
 assert(fs.list('/lib').length>0);assert(fs.read(python+'/rclpy/__init__.py').includes('class Node'));
 lab.reset();
});
test('future built-in interfaces populate all generated locations and preserve edits',()=>{
 const lab=new Lab(),fs=lab.fs,key='std_msgs/msg/FutureSample';
 try{
  BUILTIN[key]={fields:[{type:'string',name:'value'}]};seedEcosystem(fs);
  assert.equal(fs.read('/opt/ros/jazzy/share/std_msgs/msg/FutureSample.msg'),'string value\n');
  assert(fs.exists('/opt/ros/jazzy/include/std_msgs/msg/future_sample.hpp'));
  assert.match(fs.read('/opt/ros/jazzy/lib/python3.12/site-packages/std_msgs/msg/__init__.py'),/import FutureSample/);
  BUILTIN[key].fields.push({type:'int32',name:'count'});seedEcosystem(fs);
  assert.match(fs.read('/opt/ros/jazzy/share/std_msgs/msg/FutureSample.msg'),/int32 count/);
  fs.write('/opt/ros/jazzy/share/std_msgs/msg/FutureSample.msg','# user edit');seedEcosystem(fs);
  assert.equal(fs.read('/opt/ros/jazzy/share/std_msgs/msg/FutureSample.msg'),'# user edit');
 }finally{delete BUILTIN[key];lab.reset();}
});

test('old saved schemas cannot hide newly supported built-in interfaces',()=>{
 const lab=new Lab();lab.terminal();const saved=captureSession(lab,{});
 delete saved.workspace.schema['std_msgs/msg/String'];
 const restored=new Lab();restoreSession(restored,saved);
 assert(restored.workspace.registry.definitions.has('std_msgs/msg/String'));
 assert.equal(restored.fs.read('/opt/ros/jazzy/share/std_msgs/msg/String.msg'),interfaceSource(BUILTIN['std_msgs/msg/String']));
 lab.reset();restored.reset();
});

import {nativeEntries,nativeContent} from '../src/native-installation.js';
import {seedInstallation} from '../src/ros-installation.js';
test('complete native inventory is inspectable, executable references are explicit and saves preserve edits',async()=>{
 const lab=new Lab(),t=lab.terminal();
 try{
  for(const [path,row]of nativeEntries){assert(lab.fs.exists(path),path);assert.equal(lab.fs.entry(path).kind,row[1]==='d'?'dir':'file',path);}
  const nativeBin=[...nativeEntries.keys()].filter(path=>path.startsWith('/opt/ros/jazzy/bin/')&&!path.slice('/opt/ros/jazzy/bin/'.length).includes('/')).map(path=>path.split('/').at(-1)).sort();
  assert.deepEqual(lab.fs.list('/opt/ros/jazzy/bin').map(e=>e.name).sort(),nativeBin);
  assert.equal(await t.execute('which rviz2'),'/opt/ros/jazzy/bin/rviz2');assert.equal(await t.execute('which dot'),'/usr/bin/dot');
  await assert.rejects(()=>t.execute('rviz2'),/inspection only/);await assert.rejects(()=>t.execute('dot'),/inspection only/);
  assert.match(lab.fs.read('/opt/ros/jazzy/bin/rviz2'),/SIMULATED NATIVE ARTIFACT/);
  const path='/opt/ros/jazzy/bin/ament_index',source=nativeContent(path);assert.match(source,/python3/);assert.equal(lab.fs.read(path),source);
  assert(!Object.keys(lab.fs.entry(path)).includes('content'),'Snapshots keep a compact native reference');
  lab.fs.write(path,'# my edit');seedInstallation(lab.fs);assert.equal(lab.fs.read(path),'# my edit');
  const saved=structuredClone(captureSession(lab,{}));saved.workspace.entries.delete('/opt/ros/jazzy/bin/rqt_graph');
  const restored=new Lab();restoreSession(restored,saved);assert.equal(restored.fs.read(path),'# my edit');assert(restored.fs.exists('/opt/ros/jazzy/bin/rqt_graph'));assert.match(restored.fs.read('/opt/ros/jazzy/bin/ament_cpplint'),/python3/);restored.reset();
 }finally{lab.reset();}
});
