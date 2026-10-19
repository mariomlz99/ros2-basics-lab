import assert from 'node:assert/strict';
import {navigationStorage} from '../src/session-navigation.js';
const values=new Map(),storage={getItem:key=>values.get(key),setItem:(key,value)=>values.set(key,value)};
const navigation=navigationStorage('test',5,()=>storage);
const old={unitIndex:2,language:'cpp',guidePositions:[['2:cpp',7],['8:cpp',3]]};
navigation.save({...old,language:'python',guidePositions:[['2:python',8],['8:cpp',3]]});
assert.deepEqual(navigation.load(old),{unitIndex:2,language:'python',guidePositions:[['8:cpp',3],['2:python',8]]});
// A completed newer workspace save wins over an older journal (including tabs).
assert.deepEqual(navigation.load(old,Date.now()+1000),old);
// Free Lab and the course share an IndexedDB database, but keep separate navigation.
const tf={unitIndex:8,language:'cpp',guidePositions:[['8:cpp',15]]};
navigation.save(tf);assert.deepEqual(navigation.load(tf),tf);
assert.equal(navigation.load(old).language,'python');
// Reset must remove remembered steps in the active scope.
navigation.save({...old,guidePositions:[]});assert.deepEqual(navigation.load(old).guidePositions,[['8:cpp',3]]);
// Corrupt, cross-scope, old-curriculum and unavailable storage cannot break startup.
const key=[...values.keys()].find(key=>key.endsWith(':course'));
for(const value of ['{',JSON.stringify({savedAt:Date.now(),index:8,language:'cpp',guidePositions:[]}),JSON.stringify({savedAt:Date.now(),index:2,language:'cpp',guidePositions:[['2:cpp',-1]]})]){
 values.set(key,value);assert.deepEqual(navigation.load(old),old);
}
assert.deepEqual(navigationStorage('test',6,()=>storage).load(old),old);
const unavailable=navigationStorage('test',5,()=>{throw Error('Storage unavailable');});unavailable.save(old);assert.deepEqual(unavailable.load(old),old);
const lesson={lessonIndex:2,language:'python',guidePositions:[['2:python',7]]};
navigation.save(lesson);assert.deepEqual(navigation.load({...lesson,language:'cpp'}),lesson);
