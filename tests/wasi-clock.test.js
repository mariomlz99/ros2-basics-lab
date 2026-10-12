import test from 'node:test';
import assert from 'node:assert/strict';
import {clockTimeGet} from '../src/cpp/wasi-clock.js';

test('C++ clocks expose Unix wall time and monotonic nanoseconds without 32-bit truncation',()=>{
 const memory=new WebAssembly.Memory({initial:1}),view=new DataView(memory.buffer);
 const wallBefore=BigInt(Date.now())*1000000n;
 assert.equal(clockTimeGet(memory,0,8),0);
 const wall=view.getBigUint64(8,true);
 assert(wall>=wallBefore&&wall<=BigInt(Date.now())*1000000n);
 const monoBefore=BigInt(Math.floor(performance.now()*1000000));
 assert.equal(clockTimeGet(memory,1,24),0);
 const mono=view.getBigUint64(24,true);
 assert(mono>=monoBefore&&mono<=BigInt(Math.floor(performance.now()*1000000)));
 assert.equal(clockTimeGet(memory,1,32),0);assert(view.getBigUint64(32,true)>=mono);
 assert.equal(view.getBigUint64(0,true),0n);assert.equal(view.getBigUint64(16,true),0n);
});
test('C++ clocks reject unsupported clocks and invalid output pointers without writes',()=>{
 const memory=new WebAssembly.Memory({initial:1}),bytes=new Uint8Array(memory.buffer);bytes.fill(99);
 for(const clock of [2,3,42,-1])assert.equal(clockTimeGet(memory,clock,0),28);
 for(const pointer of [-1,65529,65536,.5])assert.equal(clockTimeGet(memory,0,pointer),21);
 assert(bytes.every(value=>value===99));
 memory.grow(1);assert.equal(clockTimeGet(memory,0,65536),0);
 assert(new DataView(memory.buffer).getBigUint64(65536,true)>0n);
});
