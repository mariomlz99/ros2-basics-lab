import test from 'node:test';
import assert from 'node:assert/strict';
import {Lab} from '../src/lab.js';

test('rm refuses dot and dot-dot operands before path normalization, including with -rf',async()=>{
 const lab=new Lab(),t=lab.terminal();
 try{
  await t.execute('mkdir -p ~/ros2_ws/src/probe');await t.execute('cd ~/ros2_ws');
  await t.execute('echo keep > marker.txt');
  for(const operand of ['.','./','./.','src/..','src/../','src/../.','..','../','~/ros2_ws/.']){
   await assert.rejects(()=>t.execute('rm -rf '+operand),/refusing to remove/);
   assert.equal(await t.execute('cat marker.txt'),'keep\n',operand);
  }
  // GNU rm still processes the other operands and reports failure overall.
  await t.execute('touch disposable');
  await assert.rejects(()=>t.execute('rm -rf . disposable'),/refusing to remove/);
  assert(!lab.fs.exists(t.cwd+'/disposable'));
  await t.execute('rm -rf ./src/probe/../probe');
  assert(!lab.fs.exists(t.cwd+'/src/probe'));
  await t.execute('mkdir -p src/probe');assert(lab.fs.exists(t.cwd+'/src/probe'));
 }finally{lab.reset();}
});
