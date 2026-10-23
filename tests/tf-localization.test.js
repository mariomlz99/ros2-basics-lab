import {odometryTranslations} from '../src/playground/odometry-translations.js';
import test from 'node:test';import assert from 'node:assert/strict';
import {tfExercises} from '../src/tf/lesson.js';import {tfTranslations} from '../src/tf/translations.js';
test('all TF lesson prose, reflection, and interface entries cover six translated languages',()=>{
 const keys=new Set(['python','cpp'].flatMap(language=>tfExercises(language).flatMap(e=>[e.title.replace(/^\d+\. /,''),...e.steps.flatMap(s=>s.kind==='text'?[s.body]:s.kind==='tf-reflection'?[s.question,s.answer]:[])])));
 for(const key of keys)assert(tfTranslations[key]||odometryTranslations[key],key);
 for(const [key,values]of Object.entries(tfTranslations)){
  assert.equal(values.length,6,key);assert(values.every(value=>typeof value==='string'&&value.trim()&&(value!==key||key==='Frame')),key);
  for(const placeholder of key.match(/\{\w+\}/g)??[])assert(values.every(value=>value.includes(placeholder)),key+' '+placeholder);
  for(const identifier of ['odom','base_link','laser_link','camera_link','camera_optical_frame','TransformStamped','PointStamped','lookup_transform','lookupTransform','TimePointZero'])if(key.includes(identifier))assert(values.every(value=>value.includes(identifier)),key+' '+identifier);
 }
});
test('TF interpolation translates prose while retaining source/target identifiers',async()=>{
 for(const locale of ['fr','nl']){
  globalThis.localStorage={getItem:()=>locale};const {t,registerTranslations}=await import('../src/i18n.js?review='+locale);registerTranslations(tfTranslations);
  assert.notEqual(t('Pose of laser_link in base_link.'),'Pose of laser_link in base_link.');assert(t('Pose of laser_link in base_link.').includes('laser_link'));
  assert(!t('1 square = 0.5 m · room view').includes('{'));assert(!t('Think it through: '+tfExercises('python')[0].steps.at(-1).question).startsWith('Think it through:'));
 }
 delete globalThis.localStorage;
});
