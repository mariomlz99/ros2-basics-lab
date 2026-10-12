import test from 'node:test';
import assert from 'node:assert/strict';
import {Lab} from '../src/lab.js';
import {shellChecks} from '../src/runtime/shell-evidence.js';
import {captureSession,restoreSession} from '../src/session.js';
test('shell checks require successful inspection, not literals, comments or failed commands',async()=>{
 const l=new Lab(),t=l.terminal();
 try{
  await t.execute("echo '$ROS_DISTRO'");await t.execute('echo jazzy # $ROS_DISTRO');
  await t.execute('unset PATH');await assert.rejects(()=>t.execute('ros2 node list'),/command not found/);
  assert.deepEqual(shellChecks(l).map(c=>c.passed),[false,false,false]);
  await t.execute('source /opt/ros/jazzy/setup.bash');await t.execute('pwd');await t.execute('echo "${ROS_DISTRO}"');await t.execute('ros2 node list');
  assert(shellChecks(l).every(c=>c.passed));
  const saved=captureSession(l,{}),restored=new Lab();
  try{for(const shell of restoreSession(restored,saved))restored.terminal(shell);assert(shellChecks(restored).every(c=>c.passed));}finally{restored.reset();}
 }finally{l.reset();}
});
