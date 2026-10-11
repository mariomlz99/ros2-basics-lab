import test from 'node:test';
import assert from 'node:assert/strict';
import {cmakeCompletions,cmakeSignature} from '../src/cmake-intelligence.js';
const complete=(source,context)=>cmakeCompletions(source,source.length,context);
test('CMake suggestions follow command arguments, targets, packages and workspace files',()=>{
 assert(complete('find_p').options.some(o=>o.label==='find_package'));
 assert(complete('find_package(rc',{packages:['rclcpp','custom_interfaces']}).options.some(o=>o.label==='rclcpp'));
 assert.deepEqual(complete('find_package(rclcpp ').options.map(o=>o.label),['REQUIRED']);
 const source='add_executable(talker src/talker.cpp)\nfind_package(rclcpp REQUIRED)\n';
 assert.deepEqual(complete(source+'ament_target_dependencies(ta').options.map(o=>o.label),['talker']);
 assert(complete(source+'ament_target_dependencies(talker rc').options.some(o=>o.label==='rclcpp'));
 assert.deepEqual(complete('add_executable(talker src/',{files:['src/talker.cpp','package.xml']}).options.map(o=>o.label),['src/talker.cpp']);
 const variable=complete('install(TARGETS talker DESTINATION lib/${PRO');
 assert.equal(variable.from,'install(TARGETS talker DESTINATION lib/${'.length);
 assert.equal(variable.options.find(o=>o.label==='PROJECT_NAME').insert,'PROJECT_NAME}');
});
test('CMake comments and quoted parentheses do not corrupt suggestions or signatures',()=>{
 for(const source of ['# find_package(rc','#[[ find_package(rc','#[=[ find_package(rc'])assert.equal(complete(source).options.length,0);
 assert(complete('# find_package(ignored\nfind_p').options.some(o=>o.label==='find_package'));
 const source='find_package("parenthesis(in_name" ';
 assert.match(cmakeSignature(source,source.length).signature,/find_package/);
 const call='ament_target_dependencies(\n  talker\n  ';
 assert.match(cmakeSignature(call,call.length).signature,/target packages/);
 const closed='find_package(rclcpp REQUIRED)';assert.equal(cmakeSignature(closed,closed.length),null);
});
