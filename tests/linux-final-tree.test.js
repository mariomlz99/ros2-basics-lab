import test from 'node:test';
import assert from 'node:assert/strict';
import {Lab} from '../src/lab.js';
import {HOME} from '../src/fs.js';
import {linuxChecks} from '../src/linux-course.js';

test('final-tree credit requires inspecting the completed current hierarchy',async()=>{
 const lab=new Lab(),t=lab.terminal();t.color=true;
 const checked=()=>linuxChecks(lab,6)[2].passed;
 try{
  await t.execute('mkdir -p ~/linux_ws/project/source ~/linux_ws/project/archive');
  await t.execute('cd ~/linux_ws');
  await t.execute('echo "My first workspace" > project/source/notes.txt');
  await t.execute('cp project/source/notes.txt project/archive/README.txt');
  await t.execute('tree ./project');assert.equal(checked(),false,'pre-removal inspection is not the final tree');
  await t.execute('rm -r project/archive');assert.equal(checked(),false,'old output does not describe the new hierarchy');
  await t.execute('tree '+HOME+'/linux_ws/project');assert.equal(checked(),true,'absolute paths and colored output are valid');
  await t.execute('touch project/source/later.txt');assert.equal(checked(),false,'a new entry changes the inspected hierarchy');
  await t.execute('tree project');assert.equal(checked(),true);
  await t.execute('echo changed > project/source/notes.txt');assert.equal(checked(),true,'tree inspects names and structure, not file contents');
  await t.execute('touch ~/unrelated.txt');assert.equal(checked(),true,'unrelated filesystem edits do not invalidate inspection');
  await t.execute('rm -r project');assert.equal(checked(),false,'deleted hierarchy cannot borrow inspection credit');
 }finally{lab.reset();}
});
