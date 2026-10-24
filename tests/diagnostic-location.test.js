import test from 'node:test';
import assert from 'node:assert/strict';
import {diagnosticLocation} from '../src/diagnostic-location.js';
test('compiler and Python traceback locations retain their filename and line',()=>{
 assert.deepEqual(diagnosticLocation('src/reader.cpp:12:7: error: unknown value'),{file:'src/reader.cpp',line:12});
 assert.deepEqual(diagnosticLocation('  File "/home/student/my reader.py", line 4, in main'),{file:'/home/student/my reader.py',line:4});
 assert.deepEqual(diagnosticLocation("File 'reader.py', line 9"),{file:'reader.py',line:9});
 assert.equal(diagnosticLocation('value.cpp:missing: is plain text'),null);
 assert.equal(diagnosticLocation('File "reader.py", line no'),null);
});
test('long output and filename-like suffixes do not need recursive pattern matching',()=>{
 const long='X'.repeat(81000);
 assert.equal(diagnosticLocation(long),null);
 assert.deepEqual(diagnosticLocation(long+'.cpp:2: error'),{file:long+'.cpp',line:2});
 assert.deepEqual(diagnosticLocation('File "'+long+'.py", line 3'),{file:long+'.py',line:3});
 assert.deepEqual(diagnosticLocation(long+'\nsrc/reader.cpp:5:1: error'),{file:'src/reader.cpp',line:5});
});
