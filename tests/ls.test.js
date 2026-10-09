import test from 'node:test';import assert from 'node:assert/strict';
import {Lab} from '../src/lab.js';import {HOME} from '../src/fs.js';
import {snapshotLesson as snapshotUnit,restoreLesson as restoreUnit} from '../src/course/checks.js';
import {permissionText} from '../src/ls.js';
test('ls -la formats virtual metadata and updates it across filesystem operations',async()=>{const lab=new Lab(),t=lab.terminal();try{
 await t.execute('mkdir -p listing/sub');await t.execute('cd listing');await t.execute('echo "café" > note.txt');await t.execute('touch .hidden');
 let out=await t.execute('ls -la');assert.match(out,/^total 16\n/);assert.match(out,/drwxr-xr-x 3 \S+ \S+ 4096 .* \.$/m);assert.match(out,/-rw-r--r-- 1 \S+ \S+\s+6 .* note.txt$/m);assert.match(out,/\.hidden/);assert(!out.includes('./'));
 assert(!(await t.execute('ls -l')).includes('.hidden'));assert(!(await t.execute('ls note.txt')).includes('total'));assert(!(await t.execute('ls -l note.txt')).includes('total'));
 await t.execute('chmod u+x note.txt');assert.match(await t.execute('ls -l note.txt'),/^-rwxr--r--/);await t.execute('chmod 755 note.txt');await t.execute('echo "new" > note.txt');assert.match(await t.execute('ls -l note.txt'),/^-rwxr-xr-x/);
 lab.fs.entry(HOME+'/listing/note.txt').mtime=1000;await t.execute('touch note.txt');assert(lab.fs.stat(HOME+'/listing/note.txt').mtime>1000);
 const timestamp=1234567890000;lab.fs.entry(HOME+'/listing/note.txt').mtime=timestamp;await t.execute('mv note.txt moved.txt');assert.equal(lab.fs.stat(HOME+'/listing/moved.txt').mtime,timestamp);await t.execute('cp moved.txt copied.txt');assert(lab.fs.stat(HOME+'/listing/copied.txt').mtime>timestamp);
 const snapshot=snapshotUnit(lab);restoreUnit(lab,snapshot);assert.equal(lab.fs.stat(HOME+'/listing/moved.txt').mtime,timestamp);assert.equal(lab.fs.stat(HOME+'/listing/moved.txt').mode,0o755);
 await t.execute('rm -r sub');assert.equal(lab.fs.stat(HOME+'/listing').links,2);assert.match(await t.execute('ls -l . ..'),/^\.:\ntotal .*\n[\s\S]*\n\n\.\.:\ntotal /);
 assert.equal(permissionText(lab.fs.stat('/tmp')),'drwxrwxrwt');assert.equal(lab.fs.stat('/opt/ros/jazzy').owner,'root');
 lab.fs.entries.set(HOME+'/legacy.txt',{kind:'file',content:'old',executable:false});assert.equal(lab.fs.stat(HOME+'/legacy.txt').size,3);assert.equal(lab.fs.read(HOME+'/legacy.txt'),'old');
 }finally{lab.reset();}});
