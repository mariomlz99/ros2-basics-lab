import test from 'node:test';
import assert from 'node:assert/strict';
import {copyByteField} from '../src/cpp/protocol.js';
test('bulk byte transfer preserves image values, offsets and typed arrays',()=>{
 const memory=new ArrayBuffer(230410),source=Array.from({length:230400},(_,i)=>i%256);
 assert.equal(copyByteField({image:{data:source}},'image.data',memory,5,source.length),source.length);
 assert.deepEqual([...new Uint8Array(memory,5,source.length)],source);
 assert.equal(new Uint8Array(memory)[4],0);assert.equal(new Uint8Array(memory).at(-1),0);
 copyByteField({data:new Uint8Array([0,128,255])},'data',memory,0,3);assert.deepEqual([...new Uint8Array(memory,0,3)],[0,128,255]);
 copyByteField({data:[]},'data',memory,0,0);
});
test('bulk byte transfer rejects invalid fields and sizes before writing memory',()=>{
 const memory=new ArrayBuffer(8),bytes=new Uint8Array(memory);bytes.fill(17);
 for(const value of [[0,256],[-1,0],[1.5,2],[NaN,2],['1',2],new Int8Array([-1,0]),new Float64Array([0,256]),new DataView(new ArrayBuffer(2)),null])assert.throws(()=>copyByteField({data:value},'data',memory,0,2));
 for(const [dest,count]of [[-1,2],[7,2],[0,1],[0,3],[.5,2]])assert.throws(()=>copyByteField({data:[1,2]},'data',memory,dest,count));
 assert.throws(()=>copyByteField({data:[1]},'__proto__.data',memory,0,1));assert.deepEqual([...bytes],Array(8).fill(17));
});
