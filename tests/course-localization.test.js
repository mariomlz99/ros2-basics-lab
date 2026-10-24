import test from 'node:test';
import assert from 'node:assert/strict';
import {translations} from '../src/translations.js';
import {tfTranslations} from '../src/tf/translations.js';
import {odometryTranslations} from '../src/playground/odometry-translations.js';
import {courseTranslations} from '../src/course-translations.js';
import {lesson as steps} from '../src/course.js';

test('every course, playground, Free Lab and TF prose block has translations',()=>{
 const all={...translations,...tfTranslations,...odometryTranslations};
 for(let index=0;index<10;index++)for(const language of ['python','cpp'])for(const step of steps(index,language)){
  if(step.kind!=='text')continue;
  assert(all[step.body],`Unit ${index+1}, ${language}: ${step.body}`);
  for(let locale=0;locale<2;locale++)assert(all[step.body][locale]?.trim()&&all[step.body][locale]!==step.body,step.body);
 }
 for(const [source,values]of Object.entries(courseTranslations)){
  assert.equal(values.length,6);assert(values.every(value=>value.trim()&&value!==source));
  // These literal topics, fields, switches and numeric examples must survive translation.
  for(const token of ['--once','--times','--rate','-w 0','--no-daemon','--all','std_msgs/msg/String','/lab_chat','/lab_twist','/cmd_vel','/odom','/tf_static','/camera/image_raw','linear.x','angular.z','camera_optical_frame','my_first_package','sensor_lab','2.88','2.12','960']){
   if(source.includes(token))assert(values.every(value=>value.includes(token)),source+' loses '+token);
  }
 }
});
