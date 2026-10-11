import test from 'node:test';
import assert from 'node:assert/strict';
import {sessionScope,savedSlots} from '../src/session-scopes.js';
import {Lab} from '../src/lab.js';
import {HOME} from '../src/fs.js';
import {captureSession,restoreSession} from '../src/session.js';
import {migrateCurriculum} from '../src/curriculum-session.js';
test('course, playground and Free Lab retain independent snapshots through reload and reset',()=>{
 const labs=[new Lab(),new Lab(),new Lab()],indices=[0,7,8];
 try{
  const records=labs.map((lab,i)=>{lab.terminal();lab.fs.write(HOME+'/marker',String(i));return captureSession(lab,{lessonIndex:indices[i],unitIndex:indices[i],progress:[0,1],guidePositions:[['7:cpp',9]]});});
  records[2].slots={course:records[0],playground:records[1]};
  const restored=structuredClone(records[2]),slots=savedSlots(restored);assert.deepEqual([...slots.keys()],['course','playground']);
  for(const [i,record]of [slots.get('course'),slots.get('playground'),restored].entries()){
   const lab=new Lab();restoreSession(lab,record);assert.equal(lab.fs.read(HOME+'/marker'),String(i));lab.fs.write(HOME+'/marker','changed');assert.equal(record.workspace.entries.get(HOME+'/marker').content,String(i));lab.reset();
  }
  assert.deepEqual(records[0].ui.progress,[0,1]);assert.equal(sessionScope(6),'course');assert.equal(sessionScope(7),'playground');assert.equal(sessionScope(8),'free');
 }finally{for(const lab of labs)lab.reset();}
});
test('older two-workspace saves migrate without dropping the inactive workspace',()=>{
 const other={curriculumVersion:3,ui:{lessonIndex:7,guidePositions:[['7:cpp',22]]}};
 const record={curriculumVersion:4,ui:{lessonIndex:0},other};assert.equal(savedSlots(record).get('playground'),other);
 const free={curriculumVersion:4,ui:{lessonIndex:8},slots:{course:record,playground:other}};migrateCurriculum(free);
 assert.deepEqual(other.ui.guidePositions,[['7:cpp',0]]);assert.equal(savedSlots(free).size,2);
});
