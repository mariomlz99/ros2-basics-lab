const COMMANDS={
 cmake_minimum_required:['cmake_minimum_required(VERSION version)','Set the minimum CMake version. Jazzy templates use 3.8.'],
 project:['project(package_name)','Use the package name declared in package.xml.'],
 find_package:['find_package(package REQUIRED)','Find a dependency. Also declare it in package.xml.'],
 add_executable:['add_executable(target source.cpp)','Define the executable to compile from a source file.'],
 ament_target_dependencies:['ament_target_dependencies(target packages...)','Attach previously found ROS dependencies to an executable.'],
 install:['install(TARGETS targets... DESTINATION lib/${PROJECT_NAME})','Install executables where ros2 run can find them.'],
 ament_package:['ament_package()','Finalize the ament package; keep this at the end.'],
 target_include_directories:['target_include_directories(target PUBLIC directories...)','Declare header search directories. The lab recognizes the stock Jazzy template.'],
 target_compile_features:['target_compile_features(target PUBLIC c_std_99 cxx_std_17)','Declare language versions. The browser C++ runtime uses C++17.'],
 if:['if(condition)','Start a condition. The lab recognizes the stock compiler and BUILD_TESTING blocks.'],
 endif:['endif()','Close an if block.'],
 add_compile_options:['add_compile_options(-Wall -Wextra -Wpedantic)','Native compiler warnings. The lab retains the stock settings without reproducing these warning flags.'],
 set:['set(variable value)','Set a CMake variable. The lab supports the stock lint-skip settings.'],
 ament_lint_auto_find_test_dependencies:['ament_lint_auto_find_test_dependencies()','Configure native lint tests from package.xml. Browser builds do not run linters.'],
 rosidl_generate_interfaces:['rosidl_generate_interfaces(${PROJECT_NAME} "msg/Message.msg")','Generate interface bindings from the listed message files.'],
};
const VARIABLES=['PROJECT_NAME','CMAKE_CURRENT_SOURCE_DIR','CMAKE_CURRENT_BINARY_DIR','BUILD_TESTING','CMAKE_CXX_COMPILER_ID','CMAKE_COMPILER_IS_GNUCXX'];
function context(source,pos){
 const stack=[];let quote=false,comment=false,escape=false,bracket=null,clean='';
 for(let i=0;i<pos;i++){
  const c=source[i];
  if(bracket){if(source.startsWith(bracket,i)){clean+=' '.repeat(bracket.length);i+=bracket.length-1;bracket=null;}else clean+=c==='\n'?'\n':' ';continue;}
  if(comment){clean+=c==='\n'?'\n':' ';if(c==='\n')comment=false;continue;}
  if(!quote&&source.startsWith('#[',i)){const m=/^#\[(=*)\[/.exec(source.slice(i));if(m){bracket=']'+m[1]+']';clean+=' '.repeat(m[0].length);i+=m[0].length-1;continue;}}
  if(!quote&&c==='#'){comment=true;clean+=' ';continue;}
  clean+=c;
  if(escape){escape=false;continue;}if(c==='\\'){escape=true;continue;}if(c==='"'){quote=!quote;continue;}
  if(quote)continue;
  if(c==='('){const name=/([A-Za-z_]\w*)\s*$/.exec(clean.slice(0,-1))?.[1];stack.push({name:name?.toLowerCase(),pos:i});}
  if(c===')')stack.pop();
 }
 return {clean,call:stack.at(-1),comment:comment||!!bracket,quote};
}
const option=(label,type,doc)=>({label,type,signature:label,doc});
export function cmakeCompletions(source,pos,{packages=[],files=[]}={}){
 const state=context(source,pos),empty={from:pos,options:[]};if(state.comment)return empty;
 const variable=/\$\{(\w*)$/.exec(source.slice(0,pos));
 if(variable)return {from:pos-variable[1].length,options:VARIABLES.map(label=>({...option(label,'variable','CMake variable'),insert:label+(source[pos]==='}'?'':'}')})),validFor:/\w*/};
 const word=/[\w./<>:$\{\}-]*$/.exec(source.slice(0,pos))[0],from=pos-word.length;
 const targets=[...state.clean.matchAll(/\badd_executable\s*\(\s*([\w-]+)/gi)].map(m=>m[1]);
 const found=[...state.clean.matchAll(/\bfind_package\s*\(\s*([\w-]+)/gi)].map(m=>m[1]);
 let options=[];
 if(!state.call){
  if(state.quote)return empty;
  options=Object.entries(COMMANDS).map(([label,[signature,doc]])=>({label,type:'function',signature,doc,noArgs:['ament_package','endif','ament_lint_auto_find_test_dependencies'].includes(label)}));
 }else{
  const name=state.call.name,args=state.clean.slice(state.call.pos+1,from).trim().split(/\s+/).filter(Boolean);
  const names=values=>[...new Set(values)].map(label=>option(label,'variable','Target declared in this file'));
  const deps=()=>[...new Set([...packages,...found])].map(label=>option(label,'namespace','ROS package; declare the dependency in package.xml too'));
  const keywords=values=>values.map(label=>option(label,'keyword','CMake '+name+' argument'));
  if(name==='find_package')options=args.length?keywords(['REQUIRED']):deps();
  else if(name==='ament_target_dependencies')options=args.length?deps():names(targets);
  else if(['target_include_directories','target_compile_features'].includes(name))options=args.length?keywords(name==='target_compile_features'?['PUBLIC','c_std_99','cxx_std_17']:['PUBLIC','$<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}/include>','$<INSTALL_INTERFACE:include/${PROJECT_NAME}>']):names(targets);
  else if(name==='install')options=args.length===0?keywords(['TARGETS','DIRECTORY']):args.includes('DESTINATION')?[option(args[0]==='DIRECTORY'?'share/${PROJECT_NAME}':'lib/${PROJECT_NAME}','text','Installation destination')]:[...names(targets),...keywords(['DESTINATION']),...(args[0]==='DIRECTORY'?[option('launch','text','Launch file directory')]:[])];
  else if(name==='add_executable'&&args.length)options=files.filter(file=>/\.(cpp|cc|cxx)$/.test(file)).map(file=>option(file,'text','Source file in this package'));
  else if(name==='rosidl_generate_interfaces')options=files.filter(file=>/\.(msg|srv|action)$/.test(file)).map(file=>option(file,'text','Interface definition in this package'));
  else if(name==='cmake_minimum_required')options=keywords(args.length?['3.8']:['VERSION']);
  else if(name==='if'||name==='set')options=VARIABLES.map(label=>option(label,'variable','CMake variable'));
 }
 return {from,options,validFor:/[\w./<>:$\{\}-]*/};
}
export function cmakeSignature(source,pos){
 const state=context(source,pos);if(state.comment||!state.call)return null;
 const record=COMMANDS[state.call.name];return record?{pos:state.call.pos+1,signature:record[0],doc:record[1]}:null;
}
