// source /opt/ros/jazzy/setup.bash && node scripts/native-tf-review.mjs
import {mkdtemp,mkdir,writeFile,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';import {join,resolve} from 'node:path';import {spawnSync} from 'node:child_process';
import {probeSource,poses} from './tf-review-fixtures.mjs';
import {staticTransforms,dynamicTransforms} from '../src/playground/frames.js';
import {manifest,cmake} from '../src/workspace.js';
const root=await mkdtemp(join(tmpdir(),'kinenest-tf-review-')),artifacts=resolve('artifacts/review'),base=join(root,'src/tf_probe');
await mkdir(base+'/src',{recursive:true});
await writeFile(base+'/package.xml',manifest('tf_probe','ament_cmake',['rclcpp','tf2_ros','tf2_geometry_msgs']));
await writeFile(base+'/CMakeLists.txt',cmake('tf_probe',{probe:'src/probe.cpp'},['rclcpp','tf2_ros','tf2_geometry_msgs']));
await writeFile(base+'/src/probe.cpp',probeSource('cpp'));await writeFile(root+'/probe.py',probeSource('python'));
const build=spawnSync('colcon',['build','--base-paths','src'],{cwd:root,encoding:'utf8',timeout:180000});await writeFile(artifacts+'/native-review-build.log',(build.stdout??'')+(build.stderr??''));if(build.status!==0)throw Error('Native build failed: '+build.stdout+build.stderr);
const stamp={sec:0,nanosec:0},browser=JSON.parse(await readFile(artifacts+'/runtime-numerics.json','utf8'));
await writeFile(root+'/scenarios.json',JSON.stringify({static:staticTransforms(stamp),cases:poses.map((pose,index)=>({pose,dynamic:dynamicTransforms({...pose,leftWheel:.4,rightWheel:-.9},stamp),expected:browser.reports[index].values}))}));
const result=spawnSync('python3',[new URL('./native-tf-review.py',import.meta.url).pathname,root,artifacts],{encoding:'utf8',timeout:180000});process.stdout.write(result.stdout??'');process.stderr.write(result.stderr??'');if(result.status!==0)throw Error('Native TF cross-check failed');
