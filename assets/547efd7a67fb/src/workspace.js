import {ROS_PREFIX} from './ros-installation.js';
import {InterfaceRegistry,parseMessage} from './interfaces/registry.js';
import {HOME} from './fs.js';
import {parsePackageXml,parseCmake,parsePythonSetup,cmakeCalls} from './metadata.js';
export const ROOT=HOME+'/ros2_ws';
export {BASE_PACKAGES} from './ros-ecosystem.js';
import {BASE_PACKAGES,seedEcosystem} from './ros-ecosystem.js';
export function manifest(name,type,dependencies=[]){return `<?xml version="1.0"?>
<package format="3">
  <name>${name}</name><version>0.0.0</version>
  <description>ROS 2 Basics Lab student package</description>
  <maintainer email="student@example.com">Student</maintainer>
  <license>Apache-2.0</license>
  <buildtool_depend>${type}</buildtool_depend>
${dependencies.map(d=>'  <depend>'+d+'</depend>').join('\n')}
  <export><build_type>${type}</build_type></export>
</package>
`;}
export function setup(name,entries=[],launch=[]){return `from setuptools import find_packages, setup
package_name = '${name}'
setup(
    name=package_name, version='0.0.0',
    packages=find_packages(exclude=['test']),
    data_files=[('share/ament_index/resource_index/packages', ['resource/' + package_name]),
                ('share/' + package_name, ['package.xml'])${launch.length?",\n                ('share/' + package_name + '/launch', "+JSON.stringify(launch)+')':''}],
    install_requires=['setuptools'], zip_safe=True,
    maintainer='Student', maintainer_email='student@example.com',
    description='ROS 2 Basics Lab student package', license='Apache-2.0',
    entry_points={'console_scripts': ${JSON.stringify(entries)}},
)
`;}
export function cmake(name,targets={},dependencies=[],launch=false){return `cmake_minimum_required(VERSION 3.8)
project(${name})
find_package(ament_cmake REQUIRED)
${dependencies.map(d=>`find_package(${d} REQUIRED)`).join('\n')}
${Object.entries(targets).map(([n,p])=>`add_executable(${n} ${p})\n${dependencies.length?`ament_target_dependencies(${n} ${dependencies.join(' ')})`:''}\ninstall(TARGETS ${n} DESTINATION lib/\${PROJECT_NAME})`).join('\n')}
${launch?'install(DIRECTORY launch DESTINATION share/${PROJECT_NAME})':''}
ament_package()
`;}
export class Workspace{
 constructor(fs){this.fs=fs;this.installed=new Map();this.installations=new Map();this.sourcePaths=new Map();this.buildRoot=ROOT;this.registry=new InterfaceRegistry();}
 seedBasePackages(){seedEcosystem(this.fs);}

 create(name,type,{cwd=ROOT+'/src',dependencies=[],node=null,license='Apache-2.0',report=()=>{}}={}){
  if(!/^[a-z][a-z0-9_]*$/.test(name)||node&&!/^[a-z][a-z0-9_]*$/.test(node))throw Error('Use lowercase names with letters, numbers and underscores');
  if(!['ament_python','ament_cmake'].includes(type))throw Error('Build type must be ament_python or ament_cmake');
  if(license!=='Apache-2.0')throw Error('This package template supports --license Apache-2.0');
  for(const d of dependencies)if(!/^[a-z][a-z0-9_]*$/.test(d))throw Error('Invalid dependency name');
  const base=cwd+'/'+name;
  if(this.fs.exists(base))throw Error('Aborted!\nThe directory already exists: '+base+'\nEither remove the directory or choose a different destination directory or package name');
  this.fs.mkdir(base);report('creating folder '+base);
  const write=(p,s)=>{this.fs.write(base+'/'+p,s);report('creating '+base+'/'+p);},dir=p=>{this.fs.mkdir(base+'/'+p,true);report('creating folder '+base+'/'+p);};
  write('package.xml',manifest(name,type,dependencies));
  if(type==='ament_python'){
   report('creating source folder');dir(name);dir('resource');dir('test');write(name+'/__init__.py','');write('resource/'+name,'');write('setup.cfg',`[develop]\nscript_dir=$base/lib/${name}\n[install]\ninstall_scripts=$base/lib/${name}\n`);write('setup.py',setup(name,node?[`${node} = ${name}.${node}:main`]:[]));if(node)write(name+'/'+node+'.py',`def main():\n    print('Hi from ${name}.')\n\nif __name__ == '__main__':\n    main()\n`);
  }else{report('creating source and include folder');dir('src');dir('include/'+name);write('CMakeLists.txt',cmake(name,node?{[node]:'src/'+node+'.cpp'}:{},dependencies));if(node)write('src/'+node+'.cpp',`#include <iostream>\nint main(){ std::cout << "Hi from ${name}." << std::endl; return 0; }\n`);}
  this.sourcePaths.set(name,base);return base;
 }
 sourcePath(name){return this.sourcePaths.get(name)??this.installed.get(name)?.sourcePath??ROOT+'/src/'+name;}
 sourceFiles(path){return Object.fromEntries(Object.entries(this.fs.filesUnder(path)).filter(([file])=>{const parts=file.split('/');for(let i=1;i<parts.length;i++)if(this.fs.exists(path+'/'+parts.slice(0,i).join('/')+'/COLCON_IGNORE'))return false;return true;}));}
 packages(){return [...this.sourcePaths.keys()];}
 discover(cwd){const found=new Map();const visit=path=>{if(this.fs.exists(path+'/COLCON_IGNORE'))return;const manifestPath=path+'/package.xml';if(this.fs.exists(manifestPath)||this.fs.exists(path+'/CMakeLists.txt')||this.fs.exists(path+'/setup.py')){const name=this.fs.exists(manifestPath)?parsePackageXml(this.fs.read(manifestPath)).name:path.split('/').at(-1);if(found.has(name))throw Error('Duplicate package name '+name+': '+found.get(name)+' and '+path);found.set(name,path);return;}for(const entry of this.fs.list(path))if(entry.kind==='dir'&&!entry.name.startsWith('.'))visit(entry.path);};visit(cwd);for(const [name,path]of found)this.sourcePaths.set(name,path);return [...found.keys()];}
 fingerprint(name,path=this.sourcePath(name)){return JSON.stringify(this.sourceFiles(path));}
 upgradeInstallations(){
  const roots=new Set();
  for(const record of this.installedRecords().values()){
   const {name}=record,prefix=this.installPrefix(name,record);if(!this.hasInstall(name,record)||record.installationVersion===2)continue;
   const marker=prefix+'/share/ament_index/resource_index/packages/'+name;this.fs.mkdir(marker.slice(0,marker.lastIndexOf('/')),true);if(!this.fs.exists(marker))this.fs.write(marker,'');
   for(const executable of record.executables.keys()){const path=prefix+'/lib/'+name+'/'+executable;if(this.fs.exists(path)&&this.fs.read(path)==='# Modeled executable; real code runs in a worker\n')Object.assign(this.fs.entry(path),{executable:true,package:name,program:executable});}
   if(record.type==='python')for(const [path,content]of Object.entries(record.files))if(path.startsWith(name+'/')&&path.endsWith('.py')){const target=prefix+'/lib/python3.12/site-packages/'+path;this.fs.mkdir(target.slice(0,target.lastIndexOf('/')),true);if(!this.fs.exists(target))this.fs.write(target,content);}
   record.installationVersion=2;roots.add(record.buildRoot??ROOT);
  }
  for(const root of roots){const setup=root+'/install/setup.bash',local=root+'/install/local_setup.bash';if(this.fs.exists(setup)&&this.fs.exists(local)&&this.fs.read(setup)==='# Browser educational overlay\n'&&this.fs.read(local)==='# Browser educational overlay\n'){this.fs.write(root+'/install/.colcon-underlays.json',JSON.stringify([ROS_PREFIX]));this.writeSetup(root);}}
 }
 restoreEnvironment(env){const result={...env};if(result.AMENT_PREFIX_PATH!==undefined){const records=[...this.installedRecords()];result.AMENT_PREFIX_PATH=result.AMENT_PREFIX_PATH.split(':').flatMap(prefix=>{const expanded=records.filter(([,r])=>(r.buildRoot??ROOT)+'/install'===prefix).map(([path])=>path);return expanded.length?expanded:[prefix];}).join(':');}return result;}
 installPrefix(name,record=this.installed.get(name)){return record?(record.buildRoot??ROOT)+'/install/'+name:null;}
 installedRecords(){return new Map([...this.installations,...[...this.installed].map(([name,record])=>[this.installPrefix(name,record),record])]);}
 hasInstall(name,record=this.installed.get(name)){const prefix=this.installPrefix(name,record);return !!prefix&&this.fs.exists(prefix+'/share/'+name+'/package.xml')&&(record.installationVersion!==2||this.fs.exists(prefix+'/share/ament_index/resource_index/packages/'+name));}
 executableExists(name,executable,record=this.installed.get(name)){const prefix=this.installPrefix(name,record);return !!prefix&&this.fs.exists(prefix+'/lib/'+name+'/'+executable)&&this.fs.entry(prefix+'/lib/'+name+'/'+executable).executable!==false;}
 current(name){const r=this.installed.get(name);if(!this.hasInstall(name))return false;try{return Object.entries(r.dependencyRevisions??{}).every(([dep,revision])=>this.current(dep)&&this.installed.get(dep).fingerprint===revision)&&r.fingerprint===this.fingerprint(name,r.sourcePath);}catch{return false;}}
 installedPackage(name){if(!this.hasInstall(name))throw Error(`Package '${name}' has no installed build. Run colcon build.`);return this.installed.get(name);}
 baseVisible(terminal,name){return BASE_PACKAGES.includes(name)&&(terminal.env.AMENT_PREFIX_PATH||'').split(':').includes(ROS_PREFIX)&&this.fs.exists(ROS_PREFIX+'/share/ament_index/resource_index/packages/'+name);}
 visible(terminal){const records=this.installedRecords();return [...new Set((terminal.env.AMENT_PREFIX_PATH||'').split(':').flatMap(prefix=>{const record=records.get(prefix);return record&&this.hasInstall(record.name,record)?[record.name]:[];}))];}
 resolve(terminal,name){const records=this.installedRecords();for(const prefix of (terminal.env.AMENT_PREFIX_PATH||'').split(':')){const record=records.get(prefix);if(record?.name===name&&this.hasInstall(name,record))return record;}throw Error(`Package '${name}' not found`);}
 sourceOverlay(terminal,root){
  const prepend=(key,paths)=>{if(Object.hasOwn(terminal.vars??{},key)){terminal.env[key]=terminal.vars[key];delete terminal.vars[key];}const existing=(terminal.env[key]||'').split(':').filter(Boolean),values=[...new Set([...paths.filter(path=>!existing.includes(path)),...existing])];if(values.length)terminal.env[key]=values.join(':');};
  const prefixes=[...this.installedRecords()].filter(([,record])=>this.hasInstall(record.name,record)&&(record.buildRoot??ROOT)===root).map(([prefix])=>prefix);
  prepend('AMENT_PREFIX_PATH',prefixes);prepend('CMAKE_PREFIX_PATH',prefixes);
  prepend('LD_LIBRARY_PATH',prefixes.map(prefix=>prefix+'/lib').filter(path=>this.fs.exists(path)));
  prepend('PYTHONPATH',prefixes.map(prefix=>prefix+'/lib/python3.12/site-packages').filter(path=>this.fs.exists(path)));
  prepend('PATH',prefixes.map(prefix=>prefix+'/bin').filter(path=>this.fs.exists(path)));
  prepend('COLCON_PREFIX_PATH',[root+'/install']);terminal.overlays.delete(root);terminal.overlays.add(root);
 }
 buildOrder(names){const output=[],visiting=new Set(),done=new Set(),packageNames=new Map();const visit=name=>{if(done.has(name))return;if(visiting.has(name))throw Error('Cyclic package dependency');visiting.add(name);const p=this.sourcePath(name)+'/package.xml';if(!this.fs.exists(p))throw Error('Missing package.xml in '+name);const m=parsePackageXml(this.fs.read(p));if(packageNames.has(m.name)&&packageNames.get(m.name)!==name)throw Error('Duplicate package name '+m.name);packageNames.set(m.name,name);for(const d of m.dependencies)if(names.includes(d))visit(d);visiting.delete(name);done.add(name);output.push(name);};for(const name of names)visit(name);return output;}
 inspect(name){
  const sourcePath=this.sourcePath(name),files=this.sourceFiles(sourcePath);if(!files['package.xml'])throw Error('Missing package.xml in '+name);
  const metadata=parsePackageXml(files['package.xml']);if(metadata.name!==name)throw Error('Package name changed during discovery: '+name);
  for(const d of metadata.dependencies)if(!BASE_PACKAGES.includes(d)&&!this.hasInstall(d))throw Error('Dependency '+d+' is not available; build its package first');
  const msgFiles=Object.keys(files).filter(p=>p.startsWith('msg/')&&p.endsWith('.msg'));
  if(msgFiles.length){
   if(metadata.buildType!=='ament_cmake')throw Error('Interface packages must use ament_cmake');
   const cm=files['CMakeLists.txt']??'',calls=cmakeCalls(cm),generation=calls.find(c=>c.name==='rosidl_generate_interfaces');
   if(!generation||generation.args[0]!=='${PROJECT_NAME}')throw Error('Use rosidl_generate_interfaces(${PROJECT_NAME} "msg/Name.msg")');
   const declared=generation.args.slice(1).map(p=>p.replace(/^"|"$/g,''));
   for(const file of declared)if(!msgFiles.includes(file))throw Error('Missing or unsupported interface '+file);
   if(msgFiles.some(p=>!declared.includes(p)))throw Error('List every message in rosidl_generate_interfaces');
   parseCmake(cm.replace(/rosidl_generate_interfaces\([^]*?\)/g,''),name);
   for(const d of ['rosidl_default_generators','rosidl_default_runtime'])if(!metadata.dependencies.has(d))throw Error('Missing dependency '+d);
   if(!calls.some(c=>c.name==='find_package'&&c.args[0]==='rosidl_default_generators'&&c.args.includes('REQUIRED')))throw Error('Missing find_package(rosidl_default_generators REQUIRED)');
   if(!/<member_of_group>\s*rosidl_interface_packages\s*<\/member_of_group>/.test(files['package.xml']))throw Error('Interface package must be a member of rosidl_interface_packages');
   const generated=Object.fromEntries(msgFiles.map(p=>[name+'/msg/'+p.slice(4,-4),parseMessage(files[p])]));
   return {name,sourcePath,buildRoot:this.buildRoot,type:'interface',metadata,files,executables:new Map(),launch:[],generated,fingerprint:this.fingerprint(name)};
  }
  let executables,launch=[];
  if(metadata.buildType==='ament_python'){
   for(const p of ['resource/'+name,name+'/__init__.py','setup.py','setup.cfg'])if(!Object.hasOwn(files,p))throw Error('Missing '+p);
   if(!files['setup.cfg'].includes('script_dir=$base/lib/'+name)||!files['setup.cfg'].includes('install_scripts=$base/lib/'+name))throw Error('setup.cfg must install scripts into $base/lib/'+name);
   executables=parsePythonSetup(files['setup.py'],name);launch=[...executables.launchFiles];for(const e of executables.values())if(!Object.hasOwn(files,e.module.replaceAll('.','/')+'.py'))throw Error('Missing source file for '+e.module);
  }else{
   if(!files['CMakeLists.txt'])throw Error('Missing CMakeLists.txt');const c=parseCmake(files['CMakeLists.txt'],name);executables=new Map();
   for(const d of c.found)if(d!=='ament_cmake'&&!metadata.dependencies.has(d))throw Error('Dependency '+d+' missing from package.xml');
   for(const [target,paths]of c.targets){if(paths.length!==1||!Object.hasOwn(files,paths[0]))throw Error('Target '+target+' needs one existing source file');if(!c.installed.has(target))throw Error('Target '+target+' is not installed');for(const d of c.dependencies.get(target)??[])if(!c.found.has(d))throw Error('Missing find_package('+d+' REQUIRED)');const code=files[paths[0]];if(code.includes('rclcpp')&&!c.dependencies.get(target)?.has('rclcpp'))throw Error('Target '+target+' needs ament_target_dependencies with rclcpp');for(const match of code.matchAll(/#include\s*[<"]([a-z][a-z0-9_]*)\//g)){const dep=match[1];if(BASE_PACKAGES.includes(dep)||this.packages().includes(dep)){if(!metadata.dependencies.has(dep)||!c.found.has(dep)||!c.dependencies.get(target)?.has(dep))throw Error('C++ include '+dep+' requires package.xml, find_package and ament_target_dependencies declarations');}}executables.set(target,{code,source:paths[0]});}
   for(const n of c.installed)if(!c.targets.has(n))throw Error('Invalid installed target '+n);if(c.launchInstalled)launch=Object.keys(files).filter(p=>p.startsWith('launch/')&&p.endsWith('.py'));
  }
  for(const p of launch)if(!Object.hasOwn(files,p))throw Error('Missing launch file '+p);
  return {name,sourcePath,buildRoot:this.buildRoot,type:metadata.buildType==='ament_python'?'python':'cpp',metadata,files,executables,launch,fingerprint:this.fingerprint(name)};
 }
 initializeBuild(root,underlays=[ROS_PREFIX]){
  this.buildRoot=root;
  for(const dir of ['build','install','log']){this.fs.mkdir(root+'/'+dir,true);this.fs.write(root+'/'+dir+'/COLCON_IGNORE','');}
  const path=root+'/install/.colcon-underlays.json';
  this.fs.write(path,JSON.stringify([...new Set(underlays)].filter(prefix=>prefix!==root+'/install')));
  this.writeSetup(root);
 }
 writeSetup(root){
  const underlays=JSON.parse(this.fs.read(root+'/install/.colcon-underlays.json'));
  const prefixes=[...this.installedRecords()].filter(([,record])=>this.hasInstall(record.name,record)&&(record.buildRoot??ROOT)===root).map(([prefix])=>prefix);
  for(const shell of ['bash','sh']){
   this.fs.write(root+'/install/setup.'+shell,underlays.slice().reverse().map(prefix=>'. '+JSON.stringify(prefix+'/local_setup.'+shell)).join('\n')+'\n. '+JSON.stringify(root+'/install/local_setup.'+shell)+'\n');
   const path=root+'/install/local_setup.'+shell;
   this.fs.write(path,'# Apply this workspace only; setup.'+shell+' also loads its underlays.\n'+(prefixes.length?'export AMENT_PREFIX_PATH="'+prefixes.join(':')+':$AMENT_PREFIX_PATH"\nexport CMAKE_PREFIX_PATH="'+prefixes.join(':')+':$CMAKE_PREFIX_PATH"\n':'')+'export COLCON_PREFIX_PATH="'+root+'/install:$COLCON_PREFIX_PATH"\n');
   this.fs.entry(path).environmentHook={kind:'overlay',root};
  }
 }
 install(record){
  const {name}=record,root=record.buildRoot??ROOT,prefix=root+'/install/'+name;
  const write=(path,content)=>{this.fs.mkdir(path.slice(0,path.lastIndexOf('/')),true);this.fs.write(path,content);};
  write(root+'/build/'+name+'/status.txt','Validated '+record.type+' package\n');
  write(prefix+'/share/'+name+'/package.xml',record.files['package.xml']);
  write(prefix+'/share/ament_index/resource_index/packages/'+name,'');
  for(const path of record.launch)write(prefix+'/share/'+name+'/'+path,record.files[path]);
  for(const executable of record.executables.keys()){
   const path=prefix+'/lib/'+name+'/'+executable;write(path,'# Installed browser executable; rebuilt from source by colcon build.\n');Object.assign(this.fs.entry(path),{executable:true,package:name,program:executable});
  }
  if(record.type==='python')for(const [path,source]of Object.entries(record.files))if(path.startsWith(name+'/')&&path.endsWith('.py'))write(prefix+'/lib/python3.12/site-packages/'+path,source);
  if(record.generated){for(const type of Object.keys(record.generated)){const path=type.split('/').slice(1).join('/')+'.msg';write(prefix+'/share/'+name+'/'+path,record.files[path]);}write(prefix+'/share/ament_index/resource_index/rosidl_interfaces/'+name,Object.keys(record.generated).map(type=>type.split('/').slice(1).join('/')+'.msg').join('\n')+'\n');}
  record.installationVersion=2;this.installed.set(name,record);this.installations.set(prefix,record);this.writeSetup(root);write(root+'/log/build.txt','Built '+name+'\n');
 }

}
export function browserCompile(data){return new Promise((resolve,reject)=>{const {signal,onStatus,...payload}=data;const diagnostics=[];if(signal?.aborted){reject(Error('Build cancelled'));return;}const worker=new Worker(new URL(data.type==='cpp'?'./cpp/worker.js':'./python/worker.js',import.meta.url),data.type==='cpp'?{type:'module'}:undefined);const timer=setTimeout(()=>finish(Error('Build timed out. Check runtime download access.')),180000);const cancel=()=>finish(Error('Build cancelled'));function finish(error,result){clearTimeout(timer);signal?.removeEventListener('abort',cancel);worker.terminate();error?reject(error):resolve(result);}signal?.addEventListener('abort',cancel,{once:true});worker.onerror=e=>finish(Error(e.message));worker.onmessage=({data:d})=>{if(['stage','loading'].includes(d.kind))onStatus?.(d.text);if(d.kind==='stdout')diagnostics.push(d.text);if(d.kind==='build_ok'){for(const line of diagnostics)onStatus?.(line);finish(null,d);}else if(d.kind==='error')finish(Error([...diagnostics,d.text].join('\n')));};worker.postMessage({kind:'build',...payload});});}
export class Builder{
 constructor(workspace,compile=browserCompile){this.workspace=workspace;this.compile=compile;this.controller=null;}
 cancel(){this.controller?.abort();}
 async build(names=null,report=()=>{},cwd=ROOT,{underlays=[ROS_PREFIX]}={}){if(this.controller)throw Error('A build is already running');const controller=new AbortController();this.controller=controller;try{const w=this.workspace;this.finished=[];this.failed=null;w.initializeBuild(cwd,underlays);const discovered=w.discover(cwd);if(names){for(const name of names)if(!discovered.includes(name))report("colcon.colcon_core.package_selection WARNING ignoring unknown package '"+name+"' in --packages-select");names=names.filter(name=>discovered.includes(name));}else names=discovered;names=w.buildOrder(names);for(const name of names){this.failed=name;const started=Date.now();report('Starting >>> '+name);try{const record=w.inspect(name);if(record.type==='interface'){for(const [type,schema]of Object.entries(record.generated)){const check=new InterfaceRegistry();check.add(type,schema);check.cppHeaders();}}else if(record.type==='python'){const result=await this.compile({type:'python',name,files:record.files,entries:[...record.executables.values()],schema:w.registry.schema(),onStatus:report,signal:controller.signal});for(const imported of result.imports??[]){const root=imported.split('.')[0];if((BASE_PACKAGES.includes(root)||w.packages().includes(root)&&root!==name)&&!record.metadata.dependencies.has(root))throw Error(root+' missing from package.xml');}}else for(const entry of record.executables.values()){report('Compiling '+entry.source+' with Clang/LLD');const result=await this.compile({type:'cpp',code:'#line 1 '+JSON.stringify(name+'/'+entry.source)+'\n'+entry.code,schema:w.registry.schema(),onStatus:report,signal:controller.signal});entry.module=result.module;entry.wasmBytes=result.bytes;}if(controller.signal.aborted)throw Error('Build cancelled');if(w.fingerprint(name)!==record.fingerprint)throw Error('Files changed during build; rebuild');if(record.generated)for(const [type,schema]of Object.entries(record.generated))w.registry.add(type,schema);record.dependencyRevisions=Object.fromEntries([...record.metadata.dependencies].filter(d=>w.installed.has(d)).map(d=>[d,w.installed.get(d).fingerprint]));record.schema=w.registry.schema();w.install(record);report('Finished <<< '+name+' ['+((Date.now()-started)/1000).toFixed(2)+'s]');this.finished.push(name);this.failed=null;}catch(error){if(controller.signal.aborted)throw Error('Build cancelled');w.fs.mkdir(cwd+'/log/'+name,true);w.fs.write(cwd+'/log/'+name+'/stderr.log',error.message+'\n');throw Error('--- stderr: '+name+'\n'+error.message+'\n---\nFailed <<< '+name+' ['+((Date.now()-started)/1000).toFixed(2)+'s, exited with code 1]');}}return names;}finally{this.controller=null;}}
}
