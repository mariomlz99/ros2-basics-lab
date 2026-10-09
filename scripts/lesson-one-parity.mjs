import {mkdtempSync,mkdirSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {Lab} from '../src/lab.js';
import {HOME} from '../src/fs.js';
import {lesson} from '../src/course.js';
import {ROS_COMMANDS} from '../src/cli-help.js';
const root=mkdtempSync(path.join(tmpdir(),'lesson-one-parity-')),nativeHome=path.join(root,'home');mkdirSync(nativeHome);
const lab=new Lab(),terminal=lab.terminal(),records=[];let cwd=nativeHome;
for(const entry of lab.fs.list(HOME)){const target=path.join(nativeHome,entry.name);if(entry.kind==='dir')mkdirSync(target);else writeFileSync(target,lab.fs.read(entry.path));}
const env={...process.env,ROS_DOMAIN_ID:'190',ROS_AUTOMATIC_DISCOVERY_RANGE:'LOCALHOST',COLUMNS:'80'};
const native=command=>execFileSync('bash',['--noprofile','--norc','-c','source /opt/ros/jazzy/setup.bash\nif [ "$(command -v tree)" = /snap/bin/tree ]; then tree() { /snap/tree/current/bin/tree "$@"; }; fi\n'+command],{cwd,env,encoding:'utf8'}).trimEnd();
try{
 for(const command of lesson(0,'python').filter(s=>s.kind==='commands').flatMap(s=>s.commands)){
  const simulated=await terminal.execute(command),actual=native(command);records.push({command,simulated,native:actual});
  if(command==='pwd')assert.equal(simulated,actual.replace(nativeHome,HOME));
  else if(command==='ls -a')assert.deepEqual(simulated.split(/\s+/).sort(),actual.split(/\s+/).sort());
  else if(command==='ros2 --help'){
   const filtered=actual.split('\n').filter(line=>{const match=/^  ([a-z]+)\s{2,}/.exec(line);return !match||ROS_COMMANDS.includes(match[1]);}).join('\n');assert.equal(simulated,filtered);
  }else assert.equal(simulated.trimEnd(),actual,command);
  if(command.startsWith('cd '))cwd=path.resolve(cwd,command.slice(3));
 }
 console.log('PASS all 15 lesson 1 command steps against native Bash/Jazzy (home path and ls columns normalized; help limited to supported groups)');
}finally{lab.reset();native('ros2 daemon stop');writeFileSync(path.join(root,'comparison.json'),JSON.stringify(records,null,2));console.log('Native/simulated transcripts: '+root);}
