import {mkdtempSync,mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {Lab} from '../src/lab.js';
import {HOME} from '../src/fs.js';
import {linuxUnit,linuxChecks} from '../src/linux-course.js';
const home=mkdtempSync(path.join(tmpdir(),'kinenest-linux-')),lab=new Lab(),t=lab.terminal();
for(const entry of lab.fs.list(HOME)){const p=path.join(home,entry.name);if(entry.kind==='dir')mkdirSync(p);else writeFileSync(p,lab.fs.read(entry.path));}
const records=[];t.editFile=(_mode,p)=>lab.fs.write(p,'Edited in my terminal.\nA second line.\n');
try{for(let unit=0;unit<7;unit++){
 for(const command of linuxUnit(unit).filter(s=>s.kind==='commands').flatMap(s=>s.commands)){
  const cwd=t.cwd.replace(HOME,home),env={...process.env,HOME:home,...(t.env.NOTE?{NOTE:t.env.NOTE}:{})};delete env.NOTE;if(t.env.NOTE)env.NOTE=t.env.NOTE;
  if(/^(nano|gedit) /.test(command)){await t.execute(command);writeFileSync(path.join(cwd,'journal.txt'),'Edited in my terminal.\nA second line.\n');records.push({command,editor:'same saved content; interactive editor tested in browser'});continue;}
  const actual=spawnSync('bash',['--noprofile','--norc','-c','if [ "$(command -v tree)" = /snap/bin/tree ]; then tree() { /snap/tree/current/bin/tree "$@"; }; fi\n'+command],{cwd,env,encoding:'utf8'});if(actual.error)throw actual.error;
  let simulated,error;try{simulated=await t.execute(command);}catch(e){error=e.message;}
  records.push({command,simulated,error,native:actual.stdout,stderr:actual.stderr,exit:actual.status});
  if(command==='cat practice/missing.txt'){assert.equal(actual.status,1);assert.match(error,/No such file/);continue;}
  assert.equal(actual.status,0,command+actual.stderr);
  if(command==='history'||command==='ls -la')continue;
  const native=actual.stdout.replaceAll(home,HOME).replaceAll('\u00a0',' ').trimEnd();
  if(command.startsWith('ls'))assert.deepEqual(simulated.trim().split(/\s+/).sort(),native.trim().split(/\s+/).sort());
  else assert.equal(simulated.trimEnd(),native,command);
 }
 assert(linuxChecks(lab,unit).every(c=>c.passed));
}
for(const[p,e]of lab.fs.entries)if(p.startsWith(HOME+'/linux_ws/')&&e.kind==='file')assert.equal(lab.fs.read(p),readFileSync(p.replace(HOME,home),'utf8'),p);
console.log('PASS Linux lesson commands against native Bash: outputs, tree, files and missing-file failure; ls metadata/history not byte-compared; editor saves tested separately.');
}finally{lab.reset();writeFileSync(path.join(home,'comparison.json'),JSON.stringify(records,null,2));console.log(home+'/comparison.json');}
