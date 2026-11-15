import test from 'node:test';
import assert from 'node:assert/strict';
import {load} from './source-root.mjs';
const {Lab}=await load('lab.js');
const {captureSession,restoreSession}=await load('session.js');
const {lessonChecks:courseChecks}=await load('course/checks.js');
const results=lab=>courseChecks(lab,0).map(check=>check.passed);
async function withLab(run){
 const lab=new Lab(),terminal=lab.terminal();
 try{await terminal.ready;await run(lab,terminal);}finally{lab.reset();}
}

test('displayed ROS environment commands still complete the actual course checker',()=>withLab(async(lab,t)=>{
 for(const command of ['pwd','printenv ROS_DISTRO','ros2 node list'])await t.execute(command);
 assert.deepEqual(results(lab),[true,true,true]);
}));

test('absolute installed executables receive the same course credit',()=>withLab(async(lab,t)=>{
 for(const command of ['/usr/bin/pwd','/usr/bin/printenv ROS_DISTRO','/opt/ros/jazzy/bin/ros2 node list'])await t.execute(command);
 assert.deepEqual(results(lab),[true,true,true]);
}));

test('whole environment and supported ROS global flag count as inspection',()=>withLab(async(lab,t)=>{
 await t.execute('pwd');
 await t.execute('printenv');
 await t.execute('ros2 --use-python-default-buffering node list --no-daemon');
 assert.deepEqual(results(lab),[true,true,true]);
}));

test('echo accepts real expansion with -n and rejects literals, comments and redirection',()=>withLab(async(lab,t)=>{
 for(const command of ["echo '$ROS_DISTRO'",'echo jazzy # $ROS_DISTRO','echo "$ROS_DISTRO" > /tmp/distro']){
  await t.execute(command);assert.equal(results(lab)[1],false,command);
 }
 await t.execute('/bin/echo -n "${ROS_DISTRO}"');
 assert.equal(results(lab)[1],true);
}));

test('every supported help spelling is rejected as node graph evidence',()=>withLab(async(lab,t)=>{
 for(const flag of ['-h','--help','--h']){
  for(const command of ['ros2 node list '+flag,'/opt/ros/jazzy/bin/ros2 --use-python-default-buffering node list '+flag]){
   await t.execute(command);assert.equal(results(lab)[2],false,command);
  }
 }
 await t.execute('ros2 node list --no-daemon');
 assert.equal(results(lab)[2],true);
}));

test('failed commands and unrelated successful commands do not count; recovery works',()=>withLab(async(lab,t)=>{
 await assert.rejects(()=>t.execute('pwd extra'));
 await assert.rejects(()=>t.execute('printenv --invalid ROS_DISTRO'));
 await assert.rejects(()=>t.execute('ros2 node list --invalid'));
 await t.execute('echo jazzy');await t.execute('ros2 topic list');await t.execute('which pwd');
 assert.deepEqual(results(lab),[false,false,false]);
 for(const command of ['pwd','echo "$ROS_DISTRO"','ros2 node list'])await t.execute(command);
 assert.deepEqual(results(lab),[true,true,true]);
}));

test('a user script with an inspection-like filename cannot fabricate completion',()=>withLab(async(lab,t)=>{
 lab.fs.write('/tmp/printenv','#!/bin/bash\necho ROS_DISTRO=jazzy\n');
 await t.execute('chmod +x /tmp/printenv');
 await t.execute('export PATH=/tmp:$PATH');
 assert.equal(await t.execute('printenv'),'ROS_DISTRO=jazzy');
 lab.fs.write('/tmp/pwd','#!/bin/bash\necho '+t.cwd+'\n');
 await t.execute('chmod +x /tmp/pwd');await t.execute('/tmp/pwd');
 assert.deepEqual(results(lab),[false,false,false]);
}));

test('current and legacy saved command records preserve files and completion; reset clears evidence',()=>withLab(async(lab,t)=>{
 for(const command of ['pwd','printenv ROS_DISTRO','ros2 node list'])await t.execute(command);
 const path=t.cwd+'/student-note.txt';lab.fs.write(path,'Keep my work\n');
 const saved=captureSession(lab,{completed:[true]});
 for(const legacy of [false,true]){
  const record=structuredClone(saved);
  if(legacy){
   for(const state of [...record.terminals,...record.workspace.terminals.values()]){
    for(const command of state.completedCommands){
     delete command.command;delete command.operands;delete command.resolvedWords;delete command.resolvedWordsTruncated;
    }
   }
  }
  const restored=new Lab();
  try{
   for(const state of restoreSession(restored,record))restored.terminal(state);
   assert.deepEqual(results(restored),[true,true,true]);
   assert.equal(restored.fs.read(path),'Keep my work\n');
   assert.deepEqual(record.ui.completed,[true]);
   restored.reset();assert.deepEqual(results(restored),[false,false,false]);
  }finally{restored.reset();}
 }
}));

test('Lab option terminators remain valid inspection alternatives',()=>withLab(async(lab,t)=>{
 await t.execute('pwd --');await t.execute('/usr/bin/printenv -- ROS_DISTRO');await t.execute('ros2 node list');
 assert.deepEqual(results(lab),[true,true,true]);
}));

test('wildcard-expanded help cannot count as graph inspection',()=>withLab(async(lab,t)=>{
 lab.fs.write(t.cwd+'/--help','');
 await t.execute('ros2 node list --*');
 assert.equal(results(lab)[2],false);
}));

test('a multiline unrelated variable cannot impersonate an exported ROS distribution',()=>withLab(async(lab,t)=>{
 await t.execute('unset ROS_DISTRO');
 await t.execute('ROS_DISTRO=jazzy');
 await t.execute("export OTHER='fake\nROS_DISTRO=jazzy'");
 const output=await t.execute('printenv');
 assert(output.includes('\nROS_DISTRO=jazzy'));
 assert.equal(results(lab)[1],false);
 await t.execute('export ROS_DISTRO');
 await t.execute('printenv');
 assert.equal(results(lab)[1],true);
}));

test('ambiguous legacy wildcard history cannot borrow graph-inspection credit',()=>withLab(async(lab,t)=>{
 lab.fs.write(t.cwd+'/--help','');
 await t.execute('ros2 node list --*');
 const record=t.completedCommands.at(-1);
 delete record.helpRequested;delete record.resolvedWords;delete record.resolvedWordsTruncated;
 assert.equal(results(lab)[2],false,'older canonical record without expanded help evidence');
 delete record.command;delete record.operands;
 assert.equal(results(lab)[2],false,'older raw-words-only record');
 lab.fs.remove(t.cwd+'/--help');
 lab.fs.write(t.cwd+'/--no-daemon','');
 await t.execute('ros2 node list --*');
 assert.equal(results(lab)[2],true,'new valid expanded listing records sufficient evidence');
}));
