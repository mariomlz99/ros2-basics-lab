import {spawn} from 'node:child_process';
import {mkdir,writeFile,mkdtemp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
import {spinFixtures} from './python-spin-fixtures.mjs';
const dir=await mkdtemp(join(tmpdir(),'ros-spin-native-')),results=[];
for(const [name,source]of Object.entries(spinFixtures)){
 const file=join(dir,name+'.py');await writeFile(file,source);
 let output='',interrupted=false;
 const child=spawn('python3',['-u',file],{env:{...process.env,ROS_DOMAIN_ID:'177',ROS_LOCALHOST_ONLY:'1'},stdio:['ignore','pipe','pipe']});
 const read=data=>{output+=data;if(name.startsWith('interrupt')&&!interrupted&&output.includes('TICK 2')){interrupted=true;child.kill('SIGINT');}};
 child.stdout.on('data',read);child.stderr.on('data',read);
 const timeout=setTimeout(()=>child.kill('SIGKILL'),15000);
 const code=await new Promise(resolve=>child.on('exit',resolve));clearTimeout(timeout);
 assert.equal(code,name==='interrupt_error'?1:0,name+'\n'+output);
 const markers=output.split('\n').filter(line=>/^(ENTER|TICK|AFTER|EXIT|CAUGHT|INTERRUPTED|FINALLY|RETURN|FINITE|UNEXPECTED)/.test(line));
 const normal=['ENTER','TICK 1','TICK 2','TICK 3','AFTER','EXIT','FINALLY','RETURN'];
 const expected={shutdown:normal,sequential:[...normal,...normal],exception:['ENTER','TICK 1','EXIT','CAUGHT callback failed','FINALLY','RETURN'],finite:['FINITE']};
 if(name.startsWith('interrupt')){assert(markers.includes('TICK 2'));if(name==='interrupt_error'){assert.deepEqual(markers.slice(-3),['EXIT','INTERRUPTED','FINALLY']);assert(output.includes('RuntimeError: cleanup failed'));}else assert.deepEqual(markers.slice(-4),['EXIT','INTERRUPTED','FINALLY','RETURN']);}
 else assert.deepEqual(markers,expected[name],name+'\n'+output);
 results.push({name,passed:true,markers,output});console.log('PASS native Python stack lifecycle: '+name);
}
await mkdir('artifacts/product-fixes',{recursive:true});await writeFile('artifacts/product-fixes/native-python-spin.json',JSON.stringify(results,null,2));
