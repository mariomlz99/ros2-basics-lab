import test from 'node:test';
import assert from 'node:assert/strict';
import {lesson,LESSON_NAMES} from '../src/course.js';
import {tfExercises,tfLesson} from '../src/tf/lesson.js';
import {Lab} from '../src/lab.js';
import {ROOT} from '../src/workspace.js';
import {captureSession,restoreSession} from '../src/session.js';
import {sessionScope,savedSlots} from '../src/session-scopes.js';

test('the complete TF unit is appended after existing Lab lessons, Playground and Free Lab',()=>{
 assert.equal(LESSON_NAMES.length,7);
 assert.equal(sessionScope(0),'course');assert.equal(sessionScope(7),'playground');assert.equal(sessionScope(8),'free');assert.equal(sessionScope(9),'tf');
 for(const language of ['python','cpp']){
  assert.deepEqual(lesson(9,language),tfLesson(language));
  assert.deepEqual(tfExercises(language).map(e=>e.id),['frames','tree','lookup','point','odometry']);
  assert(lesson(7,language).some(s=>s.kind==='section'&&s.id==='odometry'));
  assert(lesson(8,language).length>0);
 }
});

test('old Lab saves gain TF installation files and update untouched generated files while preserving edits',()=>{
 const lab=new Lab(),restored=new Lab();
 try{
  const prefix='/opt/ros/jazzy',header=prefix+'/include/tf2_ros/buffer.h',python=prefix+'/lib/python3.12/site-packages/rclpy/__init__.py';
  lab.fs.mkdir(ROOT+'/src',true);lab.fs.write(ROOT+'/src/my-notes.txt','student workspace edits');
  lab.fs.write(header,'// my installed-header annotations');
  const record=captureSession(lab,{lessonIndex:9,language:'python',progress:[],guidePositions:[['9:python',12]],activeFile:null,draft:null});
  record.workspace.entries.delete(prefix+'/include/tf2_geometry_msgs/tf2_geometry_msgs.hpp');
  record.workspace.entries.delete(prefix+'/lib/python3.12/site-packages/tf2_ros/buffer.py');
  record.workspace.entries.set(python,{...record.workspace.entries.get(python),content:'# old generated API',installedContent:'# old generated API'});
  restoreSession(restored,record);
  assert(restored.fs.exists(prefix+'/include/tf2_geometry_msgs/tf2_geometry_msgs.hpp'));
  assert.match(restored.fs.read(prefix+'/lib/python3.12/site-packages/tf2_ros/buffer.py'),/Buffer|runtime|compat/i);
  assert.match(restored.fs.read(python),/class Buffer/);
  assert.equal(restored.fs.read(header),'// my installed-header annotations');
  assert.equal(restored.fs.read(ROOT+'/src/my-notes.txt'),'student workspace edits');
  assert.deepEqual(record.ui.guidePositions,[['9:python',12]]);
  record.slots={course:{},playground:{},free:{},tf:{}};
  assert.deepEqual([...savedSlots(record).keys()],['course','playground','free']);
 }finally{lab.reset();restored.reset();}
});
