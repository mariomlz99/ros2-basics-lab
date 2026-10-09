import {NATIVE_INTERFACE_TEXT} from './interfaces/native-text.js';
import {BUILTIN} from './interfaces/builtin.js';
import {InterfaceRegistry,splitType,PRIMITIVES} from './interfaces/registry.js';
import {RUNTIME_FILES} from './installation-assets.js';
export const BASE_PACKAGES=[...new Set([...['rcl_interfaces','builtin_interfaces','action_msgs','unique_identifier_msgs','nav_msgs','rclpy','rclcpp','std_msgs','geometry_msgs','sensor_msgs','example_interfaces','std_srvs','ament_python','ament_cmake','ros2launch','launch','launch_ros','rosidl_default_generators','rosidl_default_runtime'],...Object.keys(BUILTIN).map(name=>name.split('/')[0]),...RUNTIME_FILES.modules.map(name=>name.split('.')[0])])];

const PREFIX='/opt/ros/jazzy',PYTHON=PREFIX+'/lib/python3.12/site-packages';
const snake=name=>name.replace(/([A-Z]+)([A-Z][a-z])/g,'$1_$2').replace(/([a-z0-9])([A-Z])/g,'$1_$2').toLowerCase();
const section=(fields,constants=[])=>[
 ...constants.map(c=>c.type+' '+c.name+'='+c.value),
 ...fields.map(f=>f.type+' '+f.name+(f.default!==undefined?' '+JSON.stringify(f.default):''))
].join('\n');
const nativeSources=new Map(Object.entries(BUILTIN).map(([name,record])=>[record,NATIVE_INTERFACE_TEXT[name]?.source]));
export function interfaceSource(record){if(nativeSources.has(record)&&nativeSources.get(record)!==undefined)return nativeSources.get(record);return section(record.fields,record.constants)+(record.response?'\n---\n'+section(record.response,record.responseConstants):'')+(record.feedback?'\n---\n'+section(record.feedback,record.feedbackConstants):'')+'\n';}
function pythonInterface(name,record){
 const type=name.split('/').at(-1),imports=new Set();
 const literal=value=>value===true?'True':value===false?'False':value===null?'None':JSON.stringify(value);
 const fields=(items,constants=[],indent='')=>{
  const lines=constants.map(c=>indent+c.name+' = '+literal(c.value));
  lines.push(indent+'def __init__(self, **kwargs):');
  for(const f of items){
   const t=splitType(f.type,name);let value;
   if(f.default!==undefined)value=literal(f.default);
   else if(PRIMITIVES[t.base])value=['string','wstring'].includes(t.base)?"''":t.base==='bool'?'False':'0';
   else {const [pkg,kind,short]=t.base.split('/');imports.add('from '+pkg+'.'+kind+' import '+short);value=short+'()';}
   if(t.array)value=t.length?'['+value+' for _ in range('+t.length+')]':'[]';
   lines.push(indent+'    self.'+f.name+' = kwargs.pop('+JSON.stringify(f.name)+', '+value+')');
  }
  lines.push(indent+"    if kwargs: raise TypeError('Unknown fields: ' + ', '.join(kwargs))");
  return lines.join('\n');
 };
 let body='class '+type+':\n';
 if(record.response){
  body+='    class '+(record.feedback?'Goal':'Request')+':\n'+fields(record.fields,record.constants,'        ')+'\n';
  body+='    class '+(record.feedback?'Result':'Response')+':\n'+fields(record.response,record.responseConstants,'        ')+'\n';
  if(record.feedback)body+='    class Feedback:\n'+fields(record.feedback,record.feedbackConstants,'        ')+'\n';
 }else body+=fields(record.fields,record.constants,'    ')+'\n';
 return '# Simulated generated binding for '+name+'\n'+[...imports].join('\n')+'\n'+body;
}
// Missing entries are added on session restore; existing student edits are preserved.
export function seedEcosystem(fs){
 const file=(path,content)=>{fs.mkdir(path.slice(0,path.lastIndexOf('/')),true);const entry=fs.entries.get(path);if(!entry||entry.content===entry.installedContent){fs.write(path,content);fs.entries.get(path).installedContent=content;}};
 const library=(name,description)=>file(PREFIX+'/lib/lib'+name+'.so','SIMULATED SHARED LIBRARY\n'+description+'\nImplemented by browser runtime workers; this is not a native ELF binary.\n');
 const pythonIndexes=new Map();
 for(const pkg of BASE_PACKAGES){
  const share=PREFIX+'/share/'+pkg;
  file(share+'/package.xml','<?xml version="1.0"?>\n<!-- Simulated installation metadata. -->\n<package format="3"><name>'+pkg+'</name><version>0.0.0</version><description>Browser ROS ecosystem package</description><maintainer email="student@example.com">ROS lab</maintainer><license>Apache-2.0</license></package>\n');
  file(PREFIX+'/share/ament_index/resource_index/packages/'+pkg,'');
  file(share+'/cmake/'+pkg+'Config.cmake','# Simulated ament package configuration\nset('+pkg+'_FOUND TRUE)\nset('+pkg+'_DIR '+share+'/cmake)\n');
  file(share+'/environment/ament_prefix_path.sh','# Simulated environment hook\nexport AMENT_PREFIX_PATH=/opt/ros/jazzy:$AMENT_PREFIX_PATH\n');
  file(share+'/local_setup.bash','# Simulated package environment\n. '+share+'/environment/ament_prefix_path.sh\n');
 }
 for(const [path,content]of Object.entries({...new InterfaceRegistry().cppHeaders(),...RUNTIME_FILES.files}))file(PREFIX+path,content);
 file(PYTHON+'/_ros_browser_compat.py',RUNTIME_FILES.python);
 for(const module of RUNTIME_FILES.modules){
  const path=PYTHON+'/'+module.replaceAll('.','/');
  file(module.includes('.')?path+'.py':path+'/__init__.py',module==='rclpy'?RUNTIME_FILES.python:'# Simulated '+module+' module.\n# Inspect ../_ros_browser_compat.py for the complete runtime implementation.\nfrom _ros_browser_compat import *\n');
 }
 const interfacesByPackage=new Map();
 for(const [name,record]of Object.entries(BUILTIN)){
  const [pkg,kind,type]=name.split('/'),relative=kind+'/'+type+'.'+kind;
  const sourcePath=PREFIX+'/share/'+pkg+'/'+relative;
  // Upgrade the previous installation model, which omitted action feedback.
  const previous=fs.entries.get(sourcePath);
  if(previous&&!previous.installedContent&&record.feedback&&previous.content===section(record.fields,record.constants)+'\n---\n'+section(record.response,record.responseConstants)+'\n')previous.installedContent=previous.content;
  file(sourcePath,interfaceSource(record));
  if(!interfacesByPackage.has(pkg))interfacesByPackage.set(pkg,[]);
  interfacesByPackage.get(pkg).push(relative);
  file(PYTHON+'/'+pkg+'/__init__.py','# Simulated ROS interface package '+pkg+'\n');
  const dir=PYTHON+'/'+pkg+'/'+kind,mod='_'+snake(type);
  file(dir+'/'+mod+'.py',pythonInterface(name,record));
  if(!pythonIndexes.has(dir))pythonIndexes.set(dir,[]);
  pythonIndexes.get(dir).push('from .'+mod+' import '+type);
 }
 for(const [dir,entries]of pythonIndexes)file(dir+'/__init__.py',entries.join('\n')+'\n# Classes are installed here by the ROS Python worker.\n');
 for(const [pkg,interfaces]of interfacesByPackage){
  file(PREFIX+'/share/ament_index/resource_index/rosidl_interfaces/'+pkg,interfaces.join('\n')+'\n');
  for(const suffix of ['rosidl_generator_c','rosidl_typesupport_c','rosidl_typesupport_cpp','rosidl_typesupport_introspection_c','rosidl_typesupport_introspection_cpp'])library(pkg+'__'+suffix,'Interface support for '+pkg+':\n'+interfaces.join('\n'));
 }
 for(const pkg of ['rclcpp',...(BASE_PACKAGES.includes('rclcpp_action')?['rclcpp_action']:[])])library(pkg,'Simulated '+pkg+' runtime; headers are in '+PREFIX+'/include/'+pkg+'.');
 file(PYTHON+'/rclpy/_rclpy_pybind11.so','SIMULATED Python extension: rclpy transport is implemented by the browser graph bridge.\n');
 for(const pkg of ['ament_python','launch','launch_ros','ros2launch'])file(PYTHON+'/'+pkg+'/__init__.py','# Simulated '+pkg+' package. Build/launch behavior is handled by the browser workspace and launch parser.\n');
}
