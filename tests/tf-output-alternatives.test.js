import test from 'node:test';
import assert from 'node:assert/strict';
import {recordTfOutput} from '../src/runtime/tf-output.js';
// At reset the odom target (1,1) is (1,1) in base_link, independently of label wording.
// The executing runtime still has to supply a verified operation for this owner.
test('TF results accept descriptive text and ordinary labelled coordinate formatting',()=>{
 for(const line of ['Target x = 1.00, y = 1.00','Measured point: x=1 y=1 m','{"x": 1.0, "y": 1.0}','result y: 1.0, x: 1.0']){
  const owner={},event={owner,operation:'point',result:{point:{x:1,y:1,z:0}}},runtime={tfEvidence:[event]};
  recordTfOutput(runtime,owner,line);assert.equal(event.outputMatches,true,line);
 }
});
test('TF output alternatives retain verified-owner and value requirements',()=>{
 for(const line of ['Target x = 0, y = 0','callbacks 1 elapsed 1','example 1 1','x=1foo, y=1']){
  const owner={},event={owner,operation:'point',result:{point:{x:1,y:1,z:0}}},runtime={tfEvidence:[event]};
  recordTfOutput(runtime,owner,line);assert.notEqual(event.outputMatches,true,line);
 }
 const owner={},event={owner,operation:'point',result:{point:{x:1,y:1,z:0}}},runtime={tfEvidence:[event]};
 recordTfOutput(runtime,{},'Target x=1, y=1');assert.notEqual(event.outputMatches,true);
 recordTfOutput({tfEvidence:[]},owner,'Target x=1, y=1');
});
