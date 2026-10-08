import test from 'node:test';
import assert from 'node:assert/strict';
import {Lab} from '../src/lab.js';
import {topicsLesson,topicsChecks} from '../src/topics-lesson.js';
import {migrateCurriculum} from '../src/curriculum-session.js';
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(check){const end=Date.now()+4000;while(!check()){assert(Date.now()<end,'Timed out waiting for topic delivery');await sleep(30);}}
test('every terminal-topic lesson command delivers, waits and stops as taught',async()=>{
 const lab=new Lab(),terminals=[lab.terminal(),lab.terminal(),lab.terminal()],logs=[[],[],[]];terminals.forEach((t,i)=>t.output=s=>logs[i].push(s));
 try{
  for(const step of topicsLesson()){
   if(step.kind==='terminal-action'){lab.stop(terminals[step.terminal-1].id);continue;}
   if(step.kind!=='commands')continue;
   for(const command of step.commands){
    const terminal=terminals[step.terminal-1];assert(!terminal.busy,command+' requires a free terminal');
    const output=await terminal.execute(command);
    if(command.includes('pub --once /lab_chat')){await until(()=>!terminal.busy);assert.match(logs[1].join('\n'),/data: Hello from Terminal 1/);}
    if(command.includes('pub /lab_chat')){await sleep(1100);assert(logs[1].filter(s=>s.includes('A message every second')).length>=2);}
    if(command.includes('pub --times')){await until(()=>!terminal.busy);assert.equal(logs[1].filter(s=>s.includes('Three messages')).length,3);}
    if(command==='ros2 topic info /lab_chat')assert.match(output,/Publisher count: 1\nSubscription count: 1/);
    if(command==='ros2 topic echo /lab_twist'){await sleep(250);assert.match(logs[1].join('\n'),/linear:\n  x: 0.2/);assert.match(logs[1].join('\n'),/angular:\n  x: 0\n  y: 0\n  z: 0.5/);}
    if(command==='ros2 topic hz /lab_twist'){await until(()=>logs[2].some(s=>s.includes('average rate:')));const rate=[...lab.runtime.cliTopicEvidence.values()].find(e=>e.kind==='rate');assert(rate.rate>3&&rate.rate<7);}
    if(command.includes('pub --once /lab_wait')){assert.match(output,/Waiting/);await sleep(150);assert(terminal.busy);assert.equal(logs[0].filter(s=>s.includes('Ready when you are')).length,0);}
    if(command.includes('echo /lab_wait')){await until(()=>!terminal.busy&&!terminals[0].busy);assert.match(logs[1].at(-1),/Ready when you are/);}
    if(command.includes('pub -1 -w 0'))await until(()=>!terminal.busy);
    if(command.includes('echo /lab_unheard')){const count=logs[1].length;await sleep(200);assert.equal(logs[1].length,count,'Volatile topics do not replay');}
   }
  }
  assert(topicsChecks(lab).every(c=>c.passed));assert.equal(lab.processes.active().length,0);assert.equal(lab.runtime.jobs.size,0);assert.equal(lab.runtime.listeners.size,0);assert.equal(lab.runtime.nodes.size,0);
 }finally{lab.reset();}
});
test('invalid commands and interrupted waiters leave no nodes or timers',async()=>{
 const lab=new Lab(),t=lab.terminal();try{
  for(const command of ['ros2 topic echo /unknown',"ros2 topic pub --once --times 3 /bad std_msgs/msg/String '{}'","ros2 topic pub -r 0 /bad std_msgs/msg/String '{}'","ros2 topic pub --once /bad std_msgs/msg/String '{data: 5}'",'ros2 topic echo /bad missing/msg/Type'])await assert.rejects(()=>t.execute(command));
  assert.equal(lab.runtime.nodes.size,0);assert.equal(lab.runtime.jobs.size,0);assert(!t.busy);
  await t.execute("ros2 topic pub --once /waiting std_msgs/msg/String '{data: waiting}'");assert(t.busy);lab.stop(t.id);assert(!t.busy);assert.equal(lab.runtime.jobs.size,0);assert.equal(lab.runtime.nodes.size,0);
 }finally{lab.reset();}
});
test('curriculum insertion preserves existing progress and selection exactly once',()=>{
 const old={ui:{lessonIndex:2,progress:[0,1,2,5],guidePositions:[['2:python',4],['6:cpp',2]]},other:{ui:{unitIndex:6,progress:[]}}};
 migrateCurriculum(old);assert.equal(old.ui.lessonIndex,3);assert.deepEqual(old.ui.progress,[0,1,3,6]);assert.deepEqual(old.ui.guidePositions,[['3:python',4],['7:cpp',2]]);assert.equal(old.other.ui.unitIndex,7);
 const once=structuredClone(old);migrateCurriculum(old);assert.deepEqual(old,once);
});
