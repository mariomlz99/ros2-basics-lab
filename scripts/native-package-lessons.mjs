import {mkdtempSync,writeFileSync} from 'node:fs';import {tmpdir} from 'node:os';import path from 'node:path';import {execFileSync} from 'node:child_process';import {lesson} from '../src/course.js';
const quote=s=>"'"+s.replaceAll("'","'\\''")+"'";
for(const language of ['python','cpp']){
 const root=mkdtempSync(path.join(tmpdir(),'ros-package-continuity-'+language+'-')),commands=['set -e','unset AMENT_PREFIX_PATH COLCON_PREFIX_PATH CMAKE_PREFIX_PATH','source /opt/ros/jazzy/setup.bash','if [ -x /snap/tree/current/bin/tree ]; then tree() { /snap/tree/current/bin/tree "$@"; }; fi','cd '+quote(root)];let sourced=false;
 for(const index of [2,3])for(const step of lesson(index,language)){
  if(step.kind==='files')for(const [file,content]of Object.entries(step.items)){const target=path.join(root,'ros2_ws/src',step.pkg,file);commands.push('mkdir -p '+quote(path.dirname(target)),'printf %s '+quote(content)+' > '+quote(target));}
  if(step.kind==='commands')for(let command of step.commands){
   if(index===3&&command.startsWith('ros2 run '))break;
   if(index===3&&(step.terminal||1)>1)continue;
   if(index===3&&(/ros2 (node|topic)/.test(command)||command.startsWith('source ~')))continue;
   if(command==='cd ~')command='cd '+quote(root);else command=command.replaceAll('~/ros2_ws',quote(path.join(root,'ros2_ws')));
   if(index===2&&command==='ros2 run my_first_package hello'&&!sourced){commands.push('if '+command+'; then echo "Expected unsourced failure"; exit 1; fi');continue;}
   if(command==='source install/setup.bash')sourced=true;
   commands.push(command);
  }
 }
 commands.push("executables=$(ros2 pkg executables my_first_package)","[[ $executables == *'my_first_package talker'* && $executables == *'my_first_package listener'* && $executables != *'hello'* ]]",'test ! -e src/my_first_package/'+(language==='python'?'my_first_package/hello.py':'src/hello.cpp'));
 writeFileSync(path.join(root,'run.sh'),commands.join('\n')+'\n');const output=execFileSync('bash',[path.join(root,'run.sh')],{encoding:'utf8',timeout:180000});if(!output.includes('Hi from my_first_package.'))throw Error(language+' greeting mismatch');writeFileSync(path.join(root,'native.log'),output);console.log('PASS native '+language+' lesson 3 greeting and lesson 4 same-package replacement: '+root);
}
