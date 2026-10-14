// Run with native Jazzy sourced. Only temporary workspaces are changed.
import {mkdtemp,mkdir,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,dirname,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {odometryFiles,odometryExercise} from '../src/playground/odometry-lesson.js';
const root=await mkdtemp(join(tmpdir(),'native-odometry-')),out=resolve('artifacts/odometry');await mkdir(out,{recursive:true});
process.env.ROS_LOG_DIR=join(root,'ros-logs');process.env.ROS_DOMAIN_ID='187';
const run=(cmd,args,cwd)=>{const r=spawnSync(cmd,args,{cwd,encoding:'utf8',timeout:120000});if(r.status!==0)throw Error([cmd,...args].join(' ')+'\n'+r.stdout+r.stderr);return r.stdout+r.stderr;};
for(const language of ['python','cpp']){
 const ws=join(root,language),src=join(ws,'src');await mkdir(src,{recursive:true});
 run('ros2',['pkg','create','--build-type',language==='python'?'ament_python':'ament_cmake','--license','Apache-2.0','odom_lab','--dependencies',language==='python'?'rclpy':'rclcpp','nav_msgs'],src);
 for(const [path,source]of Object.entries(odometryFiles(language))){const file=join(src,'odom_lab',path);await mkdir(dirname(file),{recursive:true});await writeFile(file,source);}
 await writeFile(join(out,'native-'+language+'-build.log'),run('colcon',['build','--packages-select','odom_lab'],ws));
 console.log('PASS native '+language+' package/build');
}
const commands=[...new Set(odometryExercise('python').steps.flatMap(s=>s.kind==='commands'?s.commands:[]).filter(c=>/^ros2 topic (type|echo|pub)/.test(c)))];
await writeFile(join(root,'commands.json'),JSON.stringify(commands));
console.log(run('python3',[new URL('./native-odometry-check.py',import.meta.url).pathname,root,out],root));
console.log('Native workspaces retained: '+root);
