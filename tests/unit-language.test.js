import test from 'node:test';
import assert from 'node:assert/strict';
import {lesson as unit} from '../src/course.js';
import {guidePages,correspondingGuidePosition} from '../src/course/guide.js';
import {prepareLesson as prepareUnit} from '../src/course/prepare.js';
import {Lab} from '../src/lab.js';
import {ROOT} from '../src/workspace.js';
import {exampleBuildType,examplePackageState} from '../src/example-package.js';

test('Unit 3 has the same lesson stages, commands and greeting in both languages',()=>{
 const py=guidePages(unit(2,'python')),cpp=guidePages(unit(2,'cpp'));
 assert.equal(py.length,17);assert.equal(cpp.length,py.length);
 for(let i=0;i<py.length;i++){
  assert.equal(correspondingGuidePosition(unit(2,'python'),unit(2,'cpp'),i),i);
  assert.deepEqual(py[i].map(s=>s.kind),cpp[i].map(s=>s.kind));
  const a=py[i].find(s=>s.kind==='commands'),b=cpp[i].find(s=>s.kind==='commands');
  if(a)assert.deepEqual(a.commands.map(s=>s.replace('ament_python','ament_cmake')),b.commands);
 }
 for(const language of ['python','cpp']){
  const source=unit(2,language).find(s=>s.kind==='files');
  assert.match(Object.values(source.items)[0],/Hi from my_first_package\./);
 }
});

test('split custom interface files keep their CMake package type in the Python path',()=>{
 for(const language of ['python','cpp'])for(const page of guidePages(unit(4,language)))for(const step of page){
  if(step.kind==='files'&&step.pkg==='tutorial_interfaces')assert.equal(exampleBuildType(step,language),'ament_cmake');
 }
});

test('preparation refuses incompatible prerequisites while preserving sources and installs',async()=>{
 for(const language of ['python','cpp']){
  const lab=new Lab();try{
   lab.fs.mkdir(ROOT+'/src',true);
   const type=language==='python'?'ament_python':'ament_cmake';
   lab.workspace.create('my_first_package',type,{node:'hello'});
   const base=ROOT+'/src/my_first_package';
   lab.fs.write(base+'/notes.txt','keep my edits');
   const before=lab.fs.filesUnder(ROOT);
   assert.equal(examplePackageState(lab.fs,base,type).kind,'ready');
   assert.equal(examplePackageState(lab.fs,base,type==='ament_python'?'ament_cmake':'ament_python').kind,'incompatible');
   await assert.rejects(()=>prepareUnit(lab,4,language==='python'?'cpp':'python'),/other language/);
   assert.deepEqual(lab.fs.filesUnder(ROOT),before);
   lab.fs.write(base+'/package.xml','<package>');
   assert.equal(examplePackageState(lab.fs,base,type).kind,'invalid');
  }finally{lab.reset();}
 }
});
