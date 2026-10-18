// Read-only browser regression orchestration. No deployment commands.
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {createWriteStream} from 'node:fs';
import path from 'node:path';
const groups={
  core:['adversarial-build-check','build-causality-check','package-continuity-check','rebuild-session-check','python-build-parity','endpoint-lifecycle-check','checker-runtime-check','ui-state-audit','free-lab-check','free-lab-output-stress','job-control-check','session-race-check'],
  sensors:['playground-exercises-check','sensor-feedback-check','slow-sensor-check','byte-runtime-check','mixed-runtime-stress'],
  tf:['tf-runtime-check','tf-adversarial-runtime','tf-checker-attacks','tf-learning-check','tf-session-review','odometry-check','odometry-ui-check','tf-visual-check','tf-review-ui'],
  terminal:['terminal-shortcuts-check','terminal-wrap-review','terminal-feedback','completion-check','acceptance'],
};
const group=process.argv[2],label=process.argv[3]||group;
if(!groups[group]||!/^[-a-z0-9]+$/.test(label))throw Error('Expected group core|sensors|tf|terminal and a report label');
const root=path.resolve('artifacts/stabilization',label);await mkdir(root,{recursive:true});
const results=[];
for(const name of groups[group]){
  const log=createWriteStream(path.join(root,name+'.log')),start=Date.now();
  console.log('START '+name);
  const child=spawn(process.execPath,['scripts/'+name+'.mjs'],{env:process.env,stdio:['ignore','pipe','pipe']});
  child.stdout.pipe(log);child.stderr.pipe(log);
  const result=await new Promise(resolve=>{child.on('error',error=>resolve({error:error.message}));child.on('exit',(code,signal)=>resolve({code,signal}));});
  log.end();results.push({name,...result,seconds:(Date.now()-start)/1000,url:process.env.LAB_URL});
  await writeFile(path.join(root,'results.json'),JSON.stringify(results,null,2)+'\n');
  console.log((result.code===0?'PASS ':'FAIL ')+name+' '+results.at(-1).seconds+'s');
}
if(results.some(r=>r.code!==0))process.exitCode=1;
