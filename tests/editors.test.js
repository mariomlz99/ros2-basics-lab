import test from 'node:test';import assert from 'node:assert/strict';
import {FileSystem,HOME} from '../src/fs.js';import {Terminal} from '../src/shell.js';import {FileBuffer} from '../src/file-buffer.js';
test('editor commands resolve terminal paths and do not create files before opening',async()=>{
 const fs=new FileSystem(),terminal=new Terminal(fs,1),requests=[];terminal.editFile=(mode,path)=>requests.push({mode,path});
 await terminal.execute('mkdir practice');await terminal.execute('cd practice');await terminal.execute('nano "my notes.txt"');await terminal.execute('gedit ~/.bashrc');
 assert.deepEqual(requests,[{mode:'nano',path:HOME+'/practice/my notes.txt'},{mode:'gedit',path:HOME+'/.bashrc'}]);assert.equal(fs.exists(HOME+'/practice/my notes.txt'),false);
 await assert.rejects(()=>terminal.execute('nano missing/file'),/No such/);await assert.rejects(()=>terminal.execute('nano .'),/directory/);await assert.rejects(()=>terminal.execute('gedit a b'),/operand/);
 assert.equal(await terminal.execute('which nano gedit'),'/usr/bin/nano\n/usr/bin/gedit');assert.match(await terminal.execute('nano --help'),/Ctrl\+O/);
});
test('file buffers preserve unsaved state and reject conflicting writes',()=>{
 const fs=new FileSystem(),path=HOME+'/notes.txt',first=new FileBuffer(fs,path);first.text='Hello\n';assert.equal(first.dirty,true);assert.equal(fs.exists(path),false);first.save();assert.equal(first.dirty,false);assert.equal(fs.read(path),'Hello\n');
 const second=new FileBuffer(fs,path);first.text='First\n';first.save();second.text='Second\n';assert.throws(()=>second.save(),/another editor/);assert.equal(fs.read(path),'First\n');
 const third=new FileBuffer(fs,path);fs.remove(path);third.text='Stale';assert.throws(()=>third.save(),/another editor/);assert.equal(fs.exists(path),false);
});
