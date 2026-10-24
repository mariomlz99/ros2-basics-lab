import test from 'node:test';
import assert from 'node:assert/strict';
import {Lab} from '../src/lab.js';
import {HOME} from '../src/fs.js';
import {linuxChecks} from '../src/linux-course.js';
import {shellChecks} from '../src/runtime/shell-evidence.js';

// Independent live reproductions: COORD-001/002/003 and root-reproduction-checkers.json.
// Native Bash resolves these operands to the same file; failed reads do not inspect files.
test('successful direct node discovery counts; help and failures do not',async()=>{
 const lab=new Lab(),t=lab.terminal();try{
  await t.execute('ros2 node list --help');assert.equal(shellChecks(lab)[2].passed,false);
  await assert.rejects(()=>t.execute('ros2 node list --invalid'));assert.equal(shellChecks(lab)[2].passed,false);
  await t.execute('ros2 node list --no-daemon');assert.equal(shellChecks(lab)[2].passed,true);
 }finally{lab.reset();}
});
test('Linux inspection accepts equivalent relative and absolute operands',async()=>{
 const lab=new Lab(),t=lab.terminal(),root=HOME+'/linux_ws';t.editFile=(_mode,path)=>lab.fs.write(path,'Edited');
 try{
  await t.execute('mkdir -p ~/linux_ws/practice');await t.execute('cd ~/linux_ws/practice');
  await t.execute('echo "A second line." > notes.txt');await t.execute('cat ./notes.txt');assert.equal(linuxChecks(lab,1)[1].passed,true);
  await t.execute('mv notes.txt journal.txt');await t.execute('nano '+root+'/practice/./journal.txt');assert.equal(linuxChecks(lab,4)[0].passed,true);
  await t.execute('cd ..');await t.execute('tree .');await assert.rejects(()=>t.execute('cat ./practice/missing.txt'));assert(linuxChecks(lab,3).every(c=>c.passed));
  await t.execute('mkdir -p project/source');await t.execute('echo "My first workspace" > project/source/notes.txt');await t.execute('tree ./project');assert(linuxChecks(lab,6).every(c=>c.passed));
 }finally{lab.reset();}
});
test('wrong-directory failures and unrelated successful inspections cannot pass Linux checks',async()=>{
 const lab=new Lab(),t=lab.terminal();try{
  await assert.rejects(()=>t.execute('cat notes.txt'));await assert.rejects(()=>t.execute('tree project'));await t.execute('tree');await assert.rejects(()=>t.execute('cat practice/missing.txt'));
  await t.execute('mkdir -p ~/linux_ws/practice ~/linux_ws/project/source');await t.execute('echo "A second line." > ~/linux_ws/practice/notes.txt');await t.execute('echo "My first workspace" > ~/linux_ws/project/source/notes.txt');
  assert.equal(linuxChecks(lab,1)[1].passed,false);assert(linuxChecks(lab,3).every(c=>!c.passed));assert.equal(linuxChecks(lab,6)[2].passed,false);
  await t.execute('echo unrelated > notes.txt');await t.execute('cat notes.txt');assert.equal(linuxChecks(lab,1)[1].passed,false);
 }finally{lab.reset();}
});
