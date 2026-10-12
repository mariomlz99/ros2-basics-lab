import test from 'node:test';
import assert from 'node:assert/strict';
import {Lab} from '../src/lab.js';
import {ROOT} from '../src/workspace.js';
import {customFiles} from '../src/examples.js';
import {captureSession,restoreSession} from '../src/session.js';
test('custom message bindings live in the built overlay and restore without overwriting edits',async()=>{
 const lab=new Lab();
 try{
  lab.fs.mkdir(ROOT+'/src',true);lab.workspace.create('tutorial_interfaces','ament_cmake');
  for(const [path,source]of Object.entries(customFiles())){const full=ROOT+'/src/tutorial_interfaces/'+path;lab.fs.mkdir(full.slice(0,full.lastIndexOf('/')),true);lab.fs.write(full,source);}
  const prefix=ROOT+'/install/tutorial_interfaces',header=prefix+'/include/tutorial_interfaces/msg/student_status.hpp',python=prefix+'/lib/python3.12/site-packages/tutorial_interfaces/msg/_student_status.py';
  assert(!lab.fs.exists(header));await lab.builder.build();
  assert.match(lab.fs.read(header),/struct StudentStatus/);
  assert.match(lab.fs.read(python),/class StudentStatus/);
  assert.match(lab.fs.read(prefix+'/lib/libtutorial_interfaces__rosidl_typesupport_cpp.so'),/SIMULATED/);
  assert(!lab.fs.exists('/opt/ros/jazzy/share/tutorial_interfaces'));
  lab.fs.write(header,'// keep my inspected header edit');
  const saved=captureSession(lab,{});
  saved.workspace.entries.delete(python);
  for(const record of saved.workspace.installed.values())delete record.generatedInstallationVersion;
  for(const record of saved.workspace.installations.values())delete record.generatedInstallationVersion;
  const restored=new Lab();
  try{restoreSession(restored,saved);assert.match(restored.fs.read(python),/class StudentStatus/);assert.equal(restored.fs.read(header),'// keep my inspected header edit');}finally{restored.reset();}
 }finally{lab.reset();}
});
