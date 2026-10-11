import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Lab} from '../src/lab.js';
import {ROOT} from '../src/workspace.js';
import {customFiles} from '../src/examples.js';
const native=JSON.parse(readFileSync(new URL('./fixtures/native-topic-echo.json',import.meta.url)));
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));

test('echo diagnostics and custom-interface sourcing match captured native Jazzy',async()=>{
 const lab=new Lab(),publisher=lab.terminal(),earlier=lab.terminal(),fresh=lab.terminal();
 async function failure(terminal,key){
  const fixture=native.cases[key],out=[];terminal.output=line=>out.push(line);
  await assert.rejects(()=>terminal.execute(fixture.command),error=>error.message+'\n'===fixture.stderr);
  assert.equal(out.length?out.join('\n')+'\n':'',fixture.stdout);assert.equal(terminal.busy,false);
 }
 try{
  await failure(fresh,'absent');await failure(fresh,'explicit_invalid');
  const waiting=[];fresh.output=line=>waiting.push(line);
  assert.equal(await fresh.execute('ros2 topic echo /not_started std_msgs/msg/String'),'');
  await sleep(120);assert(fresh.busy);assert.deepEqual(waiting,[]);lab.stop(fresh.id);
  lab.fs.mkdir(ROOT+'/src',true);lab.workspace.create('my_first_package','ament_cmake');await lab.builder.build();
  await earlier.execute('source ~/ros2_ws/install/setup.bash');
  lab.workspace.create('tutorial_interfaces','ament_cmake');
  for(const [file,content]of Object.entries(customFiles())){const path=ROOT+'/src/tutorial_interfaces/'+file;lab.fs.mkdir(path.slice(0,path.lastIndexOf('/')),true);lab.fs.write(path,content);}
  await lab.builder.build(['tutorial_interfaces']);await publisher.execute('source ~/ros2_ws/install/setup.bash');
  await publisher.execute(`ros2 topic pub -r 10 ${native.topic} ${native.messageType} '{name: Ada, counter: 7, ready: true}'`);
  await failure(fresh,'custom_unsourced');await failure(earlier,'custom_unsourced');await failure(fresh,'custom_explicit_unsourced');
  await earlier.execute('source ~/ros2_ws/install/setup.bash');
  const output=[];earlier.output=line=>output.push(line);await earlier.execute(native.cases.custom_sourced.command);
  const deadline=Date.now()+2000;while(earlier.busy){assert(Date.now()<deadline);await sleep(20);}
  assert.equal(output.join('\n')+'\n',native.cases.custom_sourced.stdout);
  lab.stop(publisher.id);await failure(earlier,'custom_stopped');
  assert.equal(lab.runtime.listeners.size,0);assert.equal(lab.processes.active().length,0);
 }finally{lab.reset();}
});

const {lesson}=await import('../src/course.js');
test('unit 5 sources the receiving terminal before echoing a new custom type',()=>{
 for(const language of ['python','cpp']){
  const step=lesson(4,language).find(step=>step.kind==='commands'&&step.commands.includes('ros2 topic echo '+native.topic));
  assert.equal(step.terminal,2);assert.deepEqual(step.commands,['source ~/ros2_ws/install/setup.bash','ros2 topic echo '+native.topic]);
 }
});
