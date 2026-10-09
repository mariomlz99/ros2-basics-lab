import {seedEcosystem} from './ros-ecosystem.js';
// Shared, inspectable installation used by every browser terminal.
export const ROS_PREFIX='/opt/ros/jazzy';
export const SYSTEM_COMMANDS=['bash','colcon','python3','nano','gedit','ls','mkdir','cat','touch','cp','mv','rm','echo','pwd','printenv','which','tree','clear','chmod'];
export function sourceBase(env,vars={}){
 for(const key of ['ROS_VERSION','ROS_PYTHON_VERSION','ROS_DISTRO','PATH','AMENT_PREFIX_PATH','CMAKE_PREFIX_PATH','LD_LIBRARY_PATH','PYTHONPATH']){if(Object.hasOwn(vars,key)){env[key]=vars[key];delete vars[key];}}
 Object.assign(env,{ROS_VERSION:'2',ROS_PYTHON_VERSION:'3',ROS_DISTRO:'jazzy'});
 for(const [key,paths] of Object.entries({PATH:[ROS_PREFIX+'/bin'],AMENT_PREFIX_PATH:[ROS_PREFIX],CMAKE_PREFIX_PATH:[ROS_PREFIX],LD_LIBRARY_PATH:[ROS_PREFIX+'/lib'],PYTHONPATH:[ROS_PREFIX+'/lib/python3.12/site-packages']})){const existing=(env[key]||'').split(':').filter(Boolean);env[key]=[...new Set([...paths.filter(path=>!existing.includes(path)),...existing])].join(':');}
 return env;
}
export function baseEnvironment(home){return {HOME:home,USER:home.split('/').at(-1),SHELL:'/bin/bash',PATH:'/usr/bin:/bin',PWD:home};}
export function seedInstallation(fs){
 const file=(path,text,command=null)=>{fs.mkdir(path.slice(0,path.lastIndexOf('/')),true);const missing=!fs.exists(path);if(missing||path===ROS_PREFIX+'/setup.bash'&&fs.read(path)==='# Browser model of the Jazzy base environment\n')fs.write(path,text);const entry=fs.entry(path);if(command&&entry.content===text){entry.command=command;if(missing||entry.executable===undefined)entry.executable=true;}};
 for(const dir of ['bin','etc','include','lib/python3.12/site-packages','opt','share/ament_index/resource_index/packages','src','tools'])fs.mkdir(ROS_PREFIX+'/'+dir,true);
 for(const shell of ['bash','sh','zsh']){
  file(ROS_PREFIX+'/setup.'+shell,'# Browser model: source the Jazzy installation environment.\n. /opt/ros/jazzy/local_setup.'+shell+'\n');
  const localSource='# Browser model of the installed ROS environment hooks.\nexport ROS_VERSION=2\nexport ROS_PYTHON_VERSION=3\nexport ROS_DISTRO=jazzy\nexport AMENT_PREFIX_PATH=/opt/ros/jazzy\nexport PATH=/opt/ros/jazzy/bin:$PATH\nexport LD_LIBRARY_PATH=/opt/ros/jazzy/lib:$LD_LIBRARY_PATH\nexport PYTHONPATH=/opt/ros/jazzy/lib/python3.12/site-packages:$PYTHONPATH\n';
  file(ROS_PREFIX+'/local_setup.'+shell,localSource);
  const local=fs.entry(ROS_PREFIX+'/local_setup.'+shell);if(local.content===localSource)local.environmentHook={kind:'base'};
 }
 file(ROS_PREFIX+'/_local_setup_util.py','# Native ROS uses this helper to order package environment hooks.\n# This browser lab applies supported hooks in its terminal model.\n');
 file(ROS_PREFIX+'/bin/ros2','#!/usr/bin/python3\n# ROS 2 CLI entry point; dispatched by the browser terminal.\n','ros2');
 for(const name of SYSTEM_COMMANDS)for(const dir of ['/usr/bin','/bin'])file(dir+'/'+name,'# Command implemented by the browser terminal: '+name+'\n',name);
 for(const lib of ['libc.so.6','libm.so.6','libstdc++.so.6','libpython3.12.so'])file('/lib/'+lib,'SIMULATED SYSTEM LIBRARY '+lib+'\nProvided by browser Python/C++ runtimes; not a native binary.\n');
 seedEcosystem(fs);
 file('/bin/bash','# Browser terminal shell model.\n');
}
