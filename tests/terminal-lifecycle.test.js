import test from 'node:test';
import assert from 'node:assert/strict';
import {Lab} from '../src/lab.js';
test('Reset and close cancel commands that have not resumed from terminal startup',async()=>{
 for(const reset of [false,true]){
  const l=new Lab(),t=l.terminal();await t.ready;
  let ready;t.ready=new Promise(resolve=>ready=resolve);
  const command=t.execute('mkdir ghost');
  const rejected=assert.rejects(command,/closed/);
  if(reset)l.reset();else l.close(t.id);
  ready();await rejected;
  assert.equal(l.fs.exists(t.env.HOME+'/ghost'),false);assert.equal(l.runtime.nodes.size,0);
  l.reset();
 }
});
test('lesson restore cancels pending terminal startup without closing the reusable terminal',async()=>{
 const {snapshotLesson,restoreLesson}=await import('../src/course/checks.js');
 const l=new Lab(),t=l.terminal();await t.ready;const snapshot=snapshotLesson(l);
 let ready;t.ready=new Promise(resolve=>ready=resolve);
 const command=t.execute('mkdir ghost');const rejected=assert.rejects(command,/cancel|interrupt/i);
 restoreLesson(l,snapshot);ready();await rejected;
 assert.equal(l.fs.exists(t.env.HOME+'/ghost'),false);
 await t.execute('mkdir recovered');assert(l.fs.exists(t.env.HOME+'/recovered'));l.reset();
});
