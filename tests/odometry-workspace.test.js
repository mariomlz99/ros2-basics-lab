import test from 'node:test';
import assert from 'node:assert/strict';
import {Lab} from '../src/lab.js';
import {ROOT,manifest} from '../src/workspace.js';
import {prepareLesson} from '../src/course/prepare.js';
import {odometryPackageState,odometryPackageBlocked,prepareOdometryWorkspace} from '../src/playground/odometry-workspace.js';
import {ODOMETRY_LANGUAGE_NOTICE,ODOMETRY_MANIFEST_NOTICE} from '../src/playground/odometry-workspace.js';
import {odometryExercise} from '../src/playground/odometry-lesson.js';
import {odometryTranslations} from '../src/playground/odometry-translations.js';

test('odometry preparation supplies only directories and preserves learner packages and source edits',async()=>{
 for(const language of ['python','cpp']){
  const lab=new Lab(),terminal=lab.terminal();
  try{
   assert.equal(odometryPackageState(lab.fs,language).kind,'missing');
   await prepareLesson(lab,9,language,()=>{},{exercise:'odometry'});
   assert(lab.fs.exists(ROOT+'/src'));assert.equal(terminal.cwd,ROOT);
   assert(!lab.fs.exists(ROOT+'/src/tf_lab'));assert(!lab.fs.exists(ROOT+'/src/odom_lab'));
   lab.workspace.create('odom_lab',language==='python'?'ament_python':'ament_cmake');
   const file=ROOT+'/src/odom_lab/notes.txt';lab.fs.write(file,'keep this experiment');
   const before=lab.fs.filesUnder(ROOT);
   prepareOdometryWorkspace(lab,language);assert.deepEqual(lab.fs.filesUnder(ROOT),before);
   const other=language==='python'?'cpp':'python',state=odometryPackageState(lab.fs,other);
   assert.equal(state.kind,'incompatible');assert.equal(state.language,language);assert(odometryPackageBlocked(state));
   assert.throws(()=>prepareOdometryWorkspace(lab,other),/export your source first/);
   assert.deepEqual(lab.fs.filesUnder(ROOT),before);
  }finally{lab.reset();}
 }
});

test('odometry guard follows the source manifest, rejects missing or invalid identity, and ignores unrelated packages',()=>{
 const lab=new Lab();try{
  lab.fs.mkdir(ROOT+'/src',true);lab.workspace.create('unrelated','ament_python');
  assert.equal(odometryPackageState(lab.fs,'cpp').kind,'missing');
  const base=ROOT+'/src/odom_lab';lab.fs.mkdir(base);
  assert.equal(odometryPackageState(lab.fs,'python').kind,'invalid');
  for(const xml of ['<package>',manifest('other_name','ament_python'),manifest('odom_lab','ament_python').replace('<build_type>ament_python</build_type>','')]){
   lab.fs.write(base+'/package.xml',xml);assert.equal(odometryPackageState(lab.fs,'python').kind,'invalid');
  }
  lab.fs.write(base+'/package.xml',manifest('odom_lab','ament_cmake'));
  assert.deepEqual(odometryPackageState(lab.fs,'cpp'),{kind:'ready',language:'cpp',buildType:'ament_cmake'});
  assert.equal(odometryPackageState(lab.fs,'python').kind,'incompatible');
  lab.fs.write(base+'/package.xml',manifest('odom_lab','ament_python'));
  assert.equal(odometryPackageState(lab.fs,'python').kind,'ready');
 }finally{lab.reset();}
});

test('odometry preparation rejects an active terminal without changing its process or files',async()=>{
 const lab=new Lab(),terminal=lab.terminal();try{
  terminal.busy=true;const before=[...lab.fs.entries];
  await assert.rejects(()=>prepareLesson(lab,9,'python',()=>{},{exercise:'odometry'}),/Stop running commands/);
  assert(terminal.busy);assert.deepEqual([...lab.fs.entries],before);
 }finally{lab.reset();}
});

test('all six translated paths explain metadata replacement, timed motion and language recovery',()=>{
 const prose=new Set([ODOMETRY_LANGUAGE_NOTICE,ODOMETRY_MANIFEST_NOTICE,'Prepare odometry workspace','Odometry workspace ready. Follow the package and file steps below.','Learning path unchanged. Your files and unsaved edits are preserved.','Use package language']);
 for(const language of ['python','cpp'])for(const step of odometryExercise(language).steps){
  if(step.kind==='text')prose.add(step.body);
  for(const instruction of Object.values(step.instructions??{}))prose.add(instruction);
 }
 for(const source of prose){
  assert.equal(odometryTranslations[source]?.length,6,source);
  for(const translated of odometryTranslations[source])assert(translated&&translated!==source,source);
 }
});
