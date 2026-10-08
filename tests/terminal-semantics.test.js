import test from 'node:test';
import assert from 'node:assert/strict';
import {Lab} from '../src/lab.js';
import {HOME} from '../src/fs.js';
import {ROOT} from '../src/workspace.js';
import {captureSession,restoreSession} from '../src/session.js';

test('command lookup uses PATH, executable permissions and explicit paths',async()=>{
 const lab=new Lab(),t=lab.terminal();await t.ready;
 assert.match(await t.execute('/opt/ros/jazzy/bin/ros2 --help'),/Commands:/);
 await t.execute('export PATH=/usr/bin:/bin');assert.equal(await t.execute('which ros2'),'');
 await assert.rejects(()=>t.execute('ros2 --help'),/command not found/);
 assert.match(await t.execute('/opt/ros/jazzy/bin/ros2 --help'),/Commands:/);
 await t.execute('source /opt/ros/jazzy/setup.bash');assert.match(await t.execute('ros2 --help'),/Commands:/);
 await t.execute('cd /opt/ros/jazzy/bin');assert.match(await t.execute('./ros2 --help'),/Commands:/);
 await t.execute('chmod -x ros2');assert.equal(await t.execute('which ros2'),'');await assert.rejects(()=>t.execute('./ros2 --help'),/Permission denied/);
 await t.execute('chmod +x ros2');assert.match(await t.execute('./ros2 --help'),/Commands:/);
 await t.execute('unset PATH');await t.execute('PATH=/usr/bin:/bin');assert.equal(await t.execute('which ros2'),'');await t.execute('source /opt/ros/jazzy/setup.bash');assert.match(await t.execute('ros2 --help'),/Commands:/);
 await t.execute('export PATH=');assert.equal(await t.execute('echo builtins still work'),'builtins still work');await assert.rejects(()=>t.execute('ls'),/command not found/);
 assert.match(await t.execute('/bin/ls /opt/ros/jazzy/bin'),/ros2/);lab.reset();
});

test('new terminals execute edited bashrc; existing environments remain independent',async()=>{
 const lab=new Lab(),first=lab.terminal();await first.ready;
 lab.fs.write(HOME+'/.bashrc','# No ROS preload\nexport STUDENT_MODE="practice mode" # comment\nLOCAL_ONLY=private\n');
 const next=lab.terminal();await next.ready;
 assert.equal(await next.execute('echo $STUDENT_MODE'),'practice mode');assert.equal(await next.execute('echo $LOCAL_ONLY'),'private');assert.equal(await next.execute('printenv LOCAL_ONLY'),'');
 await assert.rejects(()=>next.execute('ros2 --help'),/command not found/);assert.match(await first.execute('ros2 --help'),/Commands:/);
 lab.fs.write(HOME+'/.bashrc','export STUDENT_MODE=updated\nsource /opt/ros/jazzy/setup.bash\n');
 await next.execute('source ~/.bashrc');assert.match(await next.execute('ros2 --help'),/Commands:/);assert.equal(await next.execute('echo ${STUDENT_MODE}'),'updated');
 assert.equal(await first.execute('printenv STUDENT_MODE'),'');
 await next.execute('unset ROS_DISTRO');assert.equal(await next.execute('echo $ROS_DISTRO'),'');
 assert(!next.history.includes('export STUDENT_MODE=updated'));
 const saved=captureSession(lab,{}),restored=new Lab(),states=restoreSession(restored,saved),resumed=restored.terminal(states[1]);await resumed.ready;
 assert.equal(await resumed.execute('printenv ROS_DISTRO'),'','Restoring a saved terminal must not source ROS again');
 lab.reset();restored.reset();
});

test('sourcing affects this shell while running bash scripts uses a child environment',async()=>{
 const lab=new Lab(),t=lab.terminal();await t.ready;
 lab.fs.write(HOME+'/settings.sh','#!/bin/bash\nexport EXERCISE=topics\ncd /tmp\necho $EXERCISE\n');
 assert.equal(await t.execute('bash ~/settings.sh'),'topics');assert.equal(t.cwd,HOME);assert.equal(await t.execute('printenv EXERCISE'),'');
 await t.execute('chmod +x ~/settings.sh');assert.equal(await t.execute('./settings.sh'),'topics');
 const output=[];t.output=line=>output.push(line);await t.execute('. ~/settings.sh');assert.equal(t.cwd,'/tmp');assert.equal(await t.execute('printenv EXERCISE'),'topics');assert.deepEqual(output,['topics']);
 lab.reset();
});

async function packageFixture(language='python'){
 const lab=new Lab(),t=lab.terminal();await t.ready;
 lab.builder.compile=async data=>data.type==='python'?{imports:[]}:{module:{builtFrom:data.code}};
 await t.execute('mkdir -p ~/ros2_ws/src');await t.execute('cd ~/ros2_ws/src');await t.execute(`ros2 pkg create --build-type ament_${language==='python'?'python':'cmake'} --node-name hello demo`);
 await t.execute('cd ..');await t.execute('colcon build');await t.execute('source install/setup.bash');return {lab,t};
}
for(const language of ['python','cpp'])test(`${language}: editing and failed rebuilding retain the installed executable until a successful rebuild`,async()=>{
 const {lab,t}=await packageFixture(language),programs=[];
 lab.processes.factories=new Map([[language,async()=>class{run(program){programs.push(program);}stop(){}}]]);
 const record=lab.workspace.installed.get('demo'),path=ROOT+'/src/demo/'+(language==='python'?'demo/hello.py':'src/hello.cpp');
 const original=lab.fs.read(path),changed=original.replace('Hi from demo.','Rebuilt demo.');
 await t.execute('ros2 run demo hello');lab.stop(t.id);
 lab.fs.write(path,changed);assert.equal(lab.workspace.current('demo'),false);assert.equal(await t.execute('ros2 pkg prefix demo'),ROOT+'/install/demo');
 await t.execute('ros2 run demo hello');lab.stop(t.id);assert.equal(lab.workspace.installed.get('demo'),record);
 if(language==='python')assert.equal(programs.at(-1).files['demo/hello.py'],original);else assert.equal(programs.at(-1).code,original);
 lab.builder.compile=async()=>{throw Error('deliberate compiler failure');};await assert.rejects(()=>t.execute('colcon build'),/deliberate compiler failure/);
 await t.execute('ros2 run demo hello');lab.stop(t.id);assert.equal(lab.workspace.installed.get('demo'),record);
 lab.builder.compile=async data=>data.type==='python'?{imports:[]}:{module:{builtFrom:data.code}};await t.execute('colcon build');await t.execute('ros2 run demo hello');lab.stop(t.id);
 if(language==='python')assert.equal(programs.at(-1).files['demo/hello.py'],changed);else assert.equal(programs.at(-1).code,changed);
 await t.execute('rm -r src');assert.equal(await t.execute('ros2 pkg executables demo'),'demo hello');
 await t.execute('ros2 run demo hello');lab.stop(t.id);
 await t.execute('rm install/demo/lib/demo/hello');assert.equal(await t.execute('ros2 pkg executables demo'),'');await assert.rejects(()=>t.execute('ros2 run demo hello'),/not installed/);
 assert.equal(await t.execute('ros2 pkg prefix demo'),ROOT+'/install/demo');await t.execute('rm -r install');await assert.rejects(()=>t.execute('ros2 pkg prefix demo'),/not found/);lab.reset();
});

test('local_setup loads only its overlay; setup restores captured underlays and bashrc can source overlays',async()=>{
 const {lab,t}=await packageFixture();
 lab.fs.write(HOME+'/.bashrc','# deliberately unsourced\n');const other=lab.terminal();await other.ready;
 await other.execute('source ~/ros2_ws/install/local_setup.bash');assert.equal(await other.execute('which ros2'),'');assert.equal(other.env.ROS_DISTRO,undefined);
 assert.equal(await other.execute('/opt/ros/jazzy/bin/ros2 pkg prefix demo'),ROOT+'/install/demo');
 await other.execute('source ~/ros2_ws/install/setup.bash');assert.equal(await other.execute('which ros2'),'/opt/ros/jazzy/bin/ros2');
 assert.equal(await other.execute('ros2 pkg prefix demo'),ROOT+'/install/demo');
 await other.execute('unset AMENT_PREFIX_PATH');await assert.rejects(()=>other.execute('ros2 pkg prefix demo'),/not found/);
 lab.fs.write(HOME+'/.bashrc','source ~/ros2_ws/install/setup.bash\n');const next=lab.terminal();await next.ready;assert.equal(await next.execute('ros2 pkg prefix demo'),ROOT+'/install/demo');
 assert.equal(t.env.AMENT_PREFIX_PATH.split(':').filter(prefix=>prefix===ROOT+'/install/demo').length,1);
 lab.reset();
});

test('building at two directory levels preserves both installs and sourcing selects the executable',async()=>{
 const {lab,t}=await packageFixture();const rootPrefix=ROOT+'/install/demo';
 const source=ROOT+'/src/demo/demo/hello.py',first=lab.fs.read(source);lab.fs.write(source,first.replace('Hi from demo.','Built from src.'));
 await t.execute('cd src');await t.execute('colcon build');
 assert.equal(await t.execute('ros2 pkg prefix demo'),rootPrefix,'Building must not change the shell environment');
 await t.execute('source install/setup.bash');assert.equal(await t.execute('ros2 pkg prefix demo'),ROOT+'/src/install/demo');
 const programs=[];lab.processes.factories=new Map([['python',async()=>class{run(program){programs.push(program);}stop(){}}]]);
 await t.execute('ros2 run demo hello');lab.stop(t.id);assert.match(programs.at(-1).files['demo/hello.py'],/Built from src/);
 await t.execute('source ~/ros2_ws/install/local_setup.bash');assert.equal(await t.execute('ros2 pkg prefix demo'),ROOT+'/src/install/demo','Re-sourcing an existing prefix does not reorder it');await t.execute('unset AMENT_PREFIX_PATH');await t.execute('source ~/ros2_ws/install/local_setup.bash');await t.execute('ros2 run demo hello');lab.stop(t.id);assert.equal(programs.at(-1).files['demo/hello.py'],first);
 await t.execute(ROOT+'/src/install/demo/lib/demo/hello');lab.stop(t.id);assert.match(programs.at(-1).files['demo/hello.py'],/Built from src/);
 const saved=captureSession(lab,{}),restored=new Lab(),states=restoreSession(restored,saved),resumed=restored.terminal(states[0]);await resumed.ready;
 assert.equal(await resumed.execute('ros2 pkg prefix demo'),rootPrefix);await resumed.execute('source ~/ros2_ws/src/install/local_setup.bash');assert.equal(await resumed.execute('ros2 pkg prefix demo'),ROOT+'/src/install/demo');lab.reset();restored.reset();
});

test('legacy saved installs gain source hooks and executable metadata without losing code',async()=>{
 const {lab,t}=await packageFixture();const saved=captureSession(lab,{});delete saved.workspace.installations;
 const record=saved.workspace.installed.get('demo');delete record.installationVersion;
 saved.workspace.entries.set(ROOT+'/install/setup.bash',{kind:'file',content:'# Browser educational overlay\n'});
 saved.workspace.entries.set(ROOT+'/install/local_setup.bash',{kind:'file',content:'# Browser educational overlay\n'});
 saved.workspace.entries.set(ROOT+'/install/demo/lib/demo/hello',{kind:'file',content:'# Modeled executable; real code runs in a worker\n'});
 saved.workspace.entries.delete(ROOT+'/install/demo/share/ament_index/resource_index/packages/demo');
 saved.terminals[0].env.AMENT_PREFIX_PATH=ROOT+'/install:/opt/ros/jazzy';
 const restored=new Lab(),states=restoreSession(restored,saved),shell=restored.terminal(states[0]);await shell.ready;
 assert.equal(await shell.execute('ros2 pkg prefix demo'),ROOT+'/install/demo');
 assert.equal(await shell.execute('which '+ROOT+'/install/demo/lib/demo/hello'),ROOT+'/install/demo/lib/demo/hello');
 const fresh=restored.terminal();await fresh.execute('source ~/ros2_ws/install/setup.bash');assert.equal(await fresh.execute('ros2 pkg executables demo'),'demo hello');
 lab.reset();restored.reset();
});

test('restoring a session preserves disabled executables and migrates the original base setup stub',async()=>{
 const lab=new Lab(),t=lab.terminal();await t.execute('chmod -x /opt/ros/jazzy/bin/ros2');const saved=captureSession(lab,{});
 saved.workspace.entries.set('/opt/ros/jazzy/setup.bash',{kind:'file',content:'# Browser model of the Jazzy base environment\n'});
 const restored=new Lab(),states=restoreSession(restored,saved),resumed=restored.terminal(states[0]);
 assert.equal(await resumed.execute('which ros2'),'');
 await resumed.execute('chmod +x /opt/ros/jazzy/bin/ros2');
 const fresh=restored.terminal();assert.equal(await fresh.execute('printenv ROS_DISTRO'),'jazzy');assert.match(await fresh.execute('ros2 --help'),/Commands:/);
 lab.reset();restored.reset();
});
