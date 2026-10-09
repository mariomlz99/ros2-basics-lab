import {mkdtempSync,mkdirSync,writeFileSync,chmodSync,utimesSync,statSync} from 'node:fs';import {tmpdir,userInfo} from 'node:os';import {execFileSync} from 'node:child_process';import assert from 'node:assert/strict';
import {Lab} from '../src/lab.js';import {HOME} from '../src/fs.js';
const root=mkdtempSync(tmpdir()+'/native-ls-'),lab=new Lab(),t=lab.terminal(),stamp=new Date('2025-01-15T12:00:00Z');
try{chmodSync(root,0o750);mkdirSync(root+'/fixture',{mode:0o755});mkdirSync(root+'/fixture/sub',{mode:0o755});writeFileSync(root+'/fixture/note.txt','café\n');writeFileSync(root+'/fixture/.hidden','');chmodSync(root+'/fixture/note.txt',0o640);chmodSync(root+'/fixture/.hidden',0o644);
await t.execute('mkdir -p fixture/sub');await t.execute('cd fixture');await t.execute('echo "café" > note.txt');await t.execute('touch .hidden');lab.fs.metadata(HOME+'/fixture/note.txt').mode=0o640;
for(const suffix of ['', '/fixture','/fixture/sub','/fixture/note.txt','/fixture/.hidden']){utimesSync(root+suffix,stamp,stamp);lab.fs.metadata(HOME+suffix).mtime=stamp.getTime();}
const {username}=userInfo(),nativeOwner=execFileSync('id',['-un'],{encoding:'utf8'}).trim(),nativeGroup=execFileSync('id',['-gn'],{encoding:'utf8'}).trim(),owner=HOME.split('/').at(-1);
for(const args of [['-la'],['-l'],['-l','note.txt'],['-la','sub'],['-l','.','sub']]){
 const actual=execFileSync('ls',args,{cwd:root+'/fixture',env:{...process.env,LC_ALL:'C',TZ:'UTC'},encoding:'utf8'}).trimEnd();
 const output=await t.execute('ls '+args.join(' '));
 // Owner identities differ; compare columns after normalizing whitespace, keeping line structure.
 const normalized=value=>value.split('\n').map(line=>line.replaceAll(nativeOwner,owner).replaceAll(nativeGroup,owner).trim().replace(/ +/g,' ')).join('\n');
 assert.equal(normalized(output),normalized(actual),'ls '+args.join(' '));
}
console.log('PASS native GNU ls parity: -la, -l, individual files, empty directories and multiple directory operands; owners and padding normalized.');
}finally{lab.reset();console.log('Native fixture: '+root);}
