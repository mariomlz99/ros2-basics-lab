import test from 'node:test';import assert from 'node:assert/strict';
import {Lab} from '../src/lab.js';import {prepareLesson} from '../src/course/prepare.js';import {captureSession,restoreSession} from '../src/session.js';import {rosCompletions} from '../src/completion.js';
for(const language of ['python','cpp'])test(`independent ${language} lessons preserve source and restore installed completion data`,async()=>{
 const lab=new Lab(),terminal=lab.terminal();lab.builder.compile=async()=>({imports:[],module:new Uint8Array([0,97,115,109])});
 await prepareLesson(lab,6,language);
 const pkg='my_first_package';assert(lab.workspace.current(pkg));assert(lab.workspace.current('tutorial_interfaces'));
 assert.deepEqual(rosCompletions(lab,terminal,`ros2 run ${pkg} ta`),['talker']);assert.deepEqual(rosCompletions(lab,terminal,`ros2 launch ${pkg} `),['system.launch.py']);
 const other=lab.terminal();assert.deepEqual(rosCompletions(lab,other,'ros2 run '+pkg.slice(0,3)),[],'Unsourced terminals do not see workspace packages');
 const path=lab.workspace.sourcePath(pkg)+(language==='python'?'/'+pkg+'/talker.py':'/src/publisher_member_function.cpp');const edited=lab.fs.read(path)+'\n';lab.fs.write(path,edited);await prepareLesson(lab,6,language);assert.equal(lab.fs.read(path),edited,'Preparation preserves student edits');
 const saved=structuredClone(captureSession(lab,{lessonIndex:6})),restored=new Lab();const shells=restoreSession(restored,saved);const t=restored.terminal();Object.assign(t,shells[0]);
 assert(restored.workspace.current(pkg));assert.deepEqual(rosCompletions(restored,t,`ros2 run ${pkg} ta`),['talker']);assert.equal(restored.processes.active().length,0);
 lab.reset();restored.reset();
});
