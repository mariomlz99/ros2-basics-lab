import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Lab} from '../src/lab.js';
import {Builder,ROOT} from '../src/workspace.js';
import {parseCmake} from '../src/metadata.js';
const {cases}=JSON.parse(readFileSync(new URL('./fixtures/native-cmake-templates.json',import.meta.url)));

for(const sample of cases)test('native Jazzy creation, install and source: '+sample.name,async()=>{
 const lab=new Lab(),terminal=lab.terminal();
 // Exercise the real shell path; only native compilation is stubbed here.
 lab.builder=new Builder(lab.workspace,async()=>({module:{}}));
 try{
  await terminal.execute('mkdir -p ~/ros2_ws/src');await terminal.execute('cd ~/ros2_ws/src');
  await terminal.execute(sample.command);
  const base=terminal.cwd+'/'+sample.name;
  assert.equal(lab.fs.read(base+'/CMakeLists.txt'),sample.cmake);
  const record=lab.workspace.inspect(sample.name);
  assert.deepEqual([...record.metadata.testDependencies],['ament_lint_auto','ament_lint_common']);
  assert.deepEqual([...record.executables.keys()],sample.node?['hello']:[]);
  // A build from src must stay there, including the setup file beginners source.
  assert.match(await terminal.execute('colcon build'),/1 package finished/);
  await terminal.execute('cd ..');
  await assert.rejects(()=>terminal.execute('source install/setup.bash'));
  await assert.rejects(()=>terminal.execute('ros2 pkg prefix '+sample.name),/not found/);
  await terminal.execute('source src/install/setup.bash');
  assert.equal(await terminal.execute('ros2 pkg prefix '+sample.name),ROOT+'/src/install/'+sample.name);
  assert.equal(lab.fs.exists('/opt/ros/jazzy/share/'+sample.name),false);
  await assert.rejects(()=>terminal.execute('cd src').then(()=>terminal.execute(sample.command)),/already exists/);
  assert.equal(lab.fs.read(base+'/CMakeLists.txt'),sample.cmake);
 }finally{lab.reset();}
});

test('stock boilerplate does not hide unsupported CMake or lose quoted dependencies',()=>{
 const sample=cases.find(c=>c.node&&c.dependencies.length),source=sample.cmake;
 assert.deepEqual([...parseCmake(source,sample.name).dependencies.get('hello')],sample.dependencies);
 for(const invalid of [
  source.replace('if(BUILD_TESTING)','if(UNKNOWN_FLAG)'),
  source.replace('  ament_lint_auto_find_test_dependencies()','  execute_process(COMMAND arbitrary)'),
  source.replace('-Wall -Wextra -Wpedantic','-O3'),
  source.replace('cxx_std_17','cxx_std_20'),
  source.replace('target_compile_features(hello','target_compile_features(absent'),
  source.replace('endif()',''),
  source+'\nendif()',
  source+'\nexecute_process(COMMAND arbitrary)',
 ])assert.throws(()=>parseCmake(invalid,sample.name));
});
