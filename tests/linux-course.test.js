import test from 'node:test';
import assert from 'node:assert/strict';
import {Lab} from '../src/lab.js';
import {HOME} from '../src/fs.js';
import {linuxUnit,linuxChecks,LINUX_NAMES} from '../src/linux-course.js';
test('Linux module commands, editor saves, missing-file failure and separate terminal environments',async()=>{
 const lab=new Lab(),t=lab.terminal();
 t.editFile=(_mode,path)=>lab.fs.write(path,'Edited in my terminal.\nA second line.\n');
 try{for(let i=0;i<LINUX_NAMES.length;i++){
  for(const command of linuxUnit(i).filter(s=>s.kind==='commands').flatMap(s=>s.commands)){
   if(command==='cat practice/missing.txt')await assert.rejects(()=>t.execute(command),/No such file/);
   else {const output=await t.execute(command);if(command==='printenv NOTE')assert.equal(output,'terminal_practice');}
  }
  assert(linuxChecks(lab,i).every(c=>c.passed),JSON.stringify(linuxChecks(lab,i)));
 }
 const other=lab.terminal();assert.equal(other.cwd,HOME);assert.equal(await other.execute('printenv NOTE'),'');
 assert.equal(await other.execute('cat ~/linux_ws/project/source/notes.txt'),'My first workspace\n');
 assert(!lab.fs.exists(HOME+'/linux_ws/project/archive'));assert(lab.fs.exists(HOME+'/linux_ws/practice/archive/backup.txt'));
 }finally{lab.reset();}
});
