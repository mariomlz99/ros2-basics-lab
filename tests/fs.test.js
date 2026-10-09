import test from 'node:test';import assert from 'node:assert/strict';import {FileSystem,normalize,HOME}from'../src/fs.js';import{Terminal,tokenize}from'../src/shell.js';
test('POSIX paths and root clamping',()=>{assert.equal(normalize('~/a//b/../.'),HOME+'/a');assert.equal(normalize('../../../..'),'/');assert.equal(normalize('/tmp/../home//student'),HOME);assert.throws(()=>normalize('x\0y'));});
test('directory and file semantics',()=>{const f=new FileSystem();assert.throws(()=>f.mkdir(HOME));f.mkdir(HOME,true);assert.throws(()=>f.mkdir(HOME+'/a/b'));f.mkdir(HOME+'/a/b',true);f.write(HOME+'/a/f','text');assert.throws(()=>f.mkdir(HOME+'/a/f/x',true));assert.throws(()=>f.read(HOME+'/a'));assert.throws(()=>f.remove(HOME+'/a'));f.copy(HOME+'/a',HOME+'/copy',{recursive:true});assert.equal(f.read(HOME+'/copy/f'),'text');assert.throws(()=>f.copy(HOME+'/a',HOME+'/a/b',{recursive:true}));f.move(HOME+'/copy/f',HOME+'/copy/g');assert.equal(f.read(HOME+'/copy/g'),'text');assert.equal(f.exists(HOME+'/copy/f'),false);f.remove(HOME+'/a',{recursive:true});f.remove('/missing',{force:true});assert.throws(()=>f.remove('/missing'));assert.throws(()=>f.copy('/missing','/tmp/a'));});
test('shared filesystem, independent cwd and environment',async()=>{const f=new FileSystem(),a=new Terminal(f,1),b=new Terminal(f,2);await a.execute('mkdir -p ros2_ws/src');await a.execute('cd ros2_ws');assert.equal(await b.execute('pwd'),HOME);await a.execute('touch src/a');assert.match(await b.execute('ls ros2_ws/src'),/a/);a.overlays.add('test');assert.equal(b.overlays.size,0);await a.execute('mkdir build install log');await a.execute('rm -rf build install log');assert.equal(f.exists(HOME+'/ros2_ws/build'),false);assert.equal(await a.execute('echo $ROS_DISTRO'),'jazzy');assert.equal(await a.execute("echo '$ROS_DISTRO'"),'$ROS_DISTRO');await assert.rejects(()=>a.execute('cd /missing'),/No such/);});
test('unsupported constructs are explicit',()=>{for(const s of ['ls | cat','touch a > b','echo $(pwd)','echo `pwd`','ls &','a;b'])assert.throws(()=>tokenize(s));assert.deepEqual(tokenize('echo "hello world"'),['echo','hello world']);});

test('echo redirects create, overwrite and append real shared files',async()=>{
 const f=new FileSystem(),a=new Terminal(f,1),b=new Terminal(f,2);
 await a.execute('mkdir practice');await a.execute('cd practice');
 assert.equal(await a.execute('echo "This is my text" > notes.txt'),'');assert.equal(await a.execute('cat notes.txt'),'This is my text\n');
 await a.execute('echo "ciao">notes.txt');await a.execute('echo "$ROS_DISTRO" >> notes.txt');await a.execute('echo -n "!" >> notes.txt');
 assert.equal(await b.execute('cat practice/notes.txt'),'ciao\njazzy\n!');
 await a.execute('echo "a > b" > "spaced file.txt"');assert.equal(await a.execute('cat "spaced file.txt"'),'a > b\n');
 assert.equal(await a.execute('echo "a >> b"'),'a >> b');await a.execute('echo > empty.txt');assert.equal(f.read(HOME+'/practice/empty.txt'),'\n');
 for(const command of ['echo x >','echo x >>> notes.txt','echo x > notes.txt > other','cat notes.txt > other','echo x 2> other','echo x > missing/file','echo x > .'])await assert.rejects(()=>a.execute(command));
 assert.equal(await a.execute('cat notes.txt'),'ciao\njazzy\n!');
});

test('unquoted wildcards expand for recursive removal without matching hidden files',async()=>{
 const fs=new FileSystem(),t=new Terminal(fs,1);await t.execute('mkdir -p practice/practice/nested');await t.execute('cd practice');await t.execute('touch notes.txt second.txt practice/nested/file .hidden');
 assert.equal(await t.execute('echo *.txt'),'notes.txt second.txt');assert.equal(await t.execute('echo "*.txt"'),'*.txt');assert.equal(await t.execute('echo \\*.txt'),'*.txt');
 await t.execute('rm *.txt');assert.equal(fs.exists(HOME+'/practice/notes.txt'),false);
 await t.execute('touch notes.txt');await t.execute('rm -rf *');assert.equal(await t.execute('ls'),'');assert.equal(fs.exists(HOME+'/practice/.hidden'),true);
 await t.execute('rm -rf *');await t.execute('mkdir -p one/nested two/nested');await t.execute('touch one/nested/x two/nested/y');await t.execute('rm -rf */nested');assert.equal(await t.execute('ls one'),'');assert.equal(await t.execute('ls two'),'');
 await t.execute('touch a.txt b.txt cc.txt');await t.execute('rm ?.txt');assert.equal(await t.execute('ls'),'cc.txt  one  two');
});

test('ls uses bare directory names, including dot entries, as native ls does',async()=>{
 const fs=new FileSystem(),t=new Terminal(fs,1);
 await t.execute('mkdir -p listing/directory');await t.execute('cd listing');await t.execute('touch file .hidden');
 assert.equal(await t.execute('ls'),'directory  file');
 assert.equal(await t.execute('ls -a'),'.  ..  .hidden  directory  file');
 assert.deepEqual((await t.execute('ls -la')).split('\n').map(line=>line.split(' ').at(-1)),['.','..','.hidden','directory','file']);
});
