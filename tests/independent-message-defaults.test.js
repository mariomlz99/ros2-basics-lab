import test from 'node:test';
import assert from 'node:assert/strict';
import {InterfaceRegistry} from '../src/interfaces/registry.js';

// Independently reproduced with native Jazzy ros2 topic pub, 2026-10-18.
// rosidl_runtime_py fills omitted fields inside a sequence of messages too.
test('CLI message completion supplies defaults inside a TF sequence',()=>{
 const registry=new InterfaceRegistry();
 const input={transforms:[{header:{frame_id:'audit_root'},child_frame_id:'audit_body',transform:{translation:{x:-1.37,y:.84},rotation:{z:.9878882805105652,w:.15516683031459658}}}]};
 const message=registry.complete('tf2_msgs/msg/TFMessage',input);
 assert.deepEqual(message.transforms[0].header,{stamp:{sec:0,nanosec:0},frame_id:'audit_root'});
 assert.deepEqual(message.transforms[0].transform.translation,{x:-1.37,y:.84,z:0});
 assert.equal(message.transforms[0].transform.rotation.x,0);
 assert.equal(input.transforms[0].header.stamp,undefined,'completion must not mutate the caller');
 assert.throws(()=>registry.complete('tf2_msgs/msg/TFMessage',{transforms:[{typo:1}]}),/Unknown field typo/);
 assert.throws(()=>registry.complete('tf2_msgs/msg/TFMessage',{transforms:42}),/array/);
});
