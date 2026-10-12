import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true});
try{
 const page=await browser.newPage();await page.goto(process.env.LAB_URL||'http://127.0.0.1:8033/ros2-basics-lab/');
 await page.exposeFunction('auditProgress',s=>console.log(s));
 const report=await page.evaluate(async()=>{
  const base=document.querySelector('script[type=module]').src,{Lab}=await import(new URL('lab.js',base)),{ROOT}=await import(new URL('workspace.js',base));
  const results=[];
  const cases=[
   ['malformed XML','python','package.xml',s=>s.replace('</package>',''),/package.xml/],
   ['missing manifest','python','package.xml',()=>null,/Missing package.xml/],
   ['invalid package name','python','package.xml',s=>s.replace('<name>probe_pkg</name>','<name>INVALID</name>'),/lowercase/],
   ['wrong build type','python','package.xml',s=>s.replaceAll('ament_python','ament_cmake'),/Missing CMakeLists/],
   ['unsupported dependency','python','package.xml',s=>s.replace('<export>','<depend>absent_dependency</depend><export>'),/Dependency absent_dependency/],
   ['Python missing dependency declaration','python','probe_pkg/probe.py',()=>"from std_msgs.msg import String\ndef main():\n print(String())",/std_msgs missing from package.xml/],
   ['missing module package','python','probe_pkg/__init__.py',()=>null,/Missing probe_pkg/],
   ['bad setup syntax','python','setup.py',s=>s+'\nbroken(\n',/SyntaxError/],
   ['missing setup.cfg','python','setup.cfg',()=>null,/Missing setup.cfg/],
   ['wrong setup.cfg','python','setup.cfg',s=>s.replaceAll('/lib/','/bin/'),/setup.cfg/],
   ['invalid console-script target','python','setup.py',s=>s.replace('probe_pkg.probe:main','not-a-target'),/Console script/],
   ['Python syntax error','python','probe_pkg/probe.py',()=>"def main(:\n pass",/SyntaxError/],
   ['missing C++ source','cpp','src/probe.cpp',()=>null,/existing source/],
   ['broken CMake','cpp','CMakeLists.txt',s=>s+'\nbroken(',/Unclosed CMake/],
   ['unknown CMake command','cpp','CMakeLists.txt',s=>s+'\nexecute_process(COMMAND whoami)',/outside the supported/],
   ['missing find_package','cpp','CMakeLists.txt',s=>s.replace('find_package(rclcpp REQUIRED)',''),/Missing find_package/],
   ['missing target dependencies','cpp','CMakeLists.txt',s=>s.replace(/ament_target_dependencies\([^]*?\)/,''),/needs ament_target_dependencies/],
   ['C++ compiler error','cpp','src/probe.cpp',()=>"int main(){this_is_not_valid;}\n",/error:/],
  ];
  for(const [name,language,path,edit,expected]of cases){
   const l=new Lab(),t=l.terminal(),other=l.terminal(),output=[];t.output=s=>output.push(s);
   try{
    await t.execute('mkdir -p ~/ros2_ws/src');await t.execute('cd ~/ros2_ws/src');
    await t.execute('ros2 pkg create probe_pkg --build-type '+(language==='python'?'ament_python':'ament_cmake')+' --node-name probe'+(language==='cpp'?' --dependencies rclcpp':''));
    const full=ROOT+'/src/probe_pkg/'+path,original=l.fs.read(full);
    if(language==='cpp'&&name==='missing target dependencies')l.fs.write(ROOT+'/src/probe_pkg/src/probe.cpp','#include <rclcpp/rclcpp.hpp>\nint main(){}');
    const changed=edit(original);if(changed===null)l.fs.remove(full);else l.fs.write(full,changed);
    await t.execute('cd ..');let error='';try{await t.execute('colcon build');}catch(e){error=e.message;}
    if(!expected.test(error))throw Error('Expected '+expected+', got '+error);
    if(l.workspace.hasInstall('probe_pkg'))throw Error('Failed first build installed a package');
    await t.execute('source install/setup.bash');let rejected=false;try{await t.execute('ros2 run probe_pkg probe');}catch{rejected=true;}
    if(!rejected)throw Error('Failed executable became runnable');
    l.fs.write(full,original);
    if(name==='missing target dependencies')l.fs.write(ROOT+'/src/probe_pkg/src/probe.cpp','#include <rclcpp/rclcpp.hpp>\nint main(){}');
    await t.execute('colcon build');await t.execute('source install/setup.bash');
    if(!l.workspace.hasInstall('probe_pkg'))throw Error('Recovery build failed');
    try{await other.execute('ros2 run probe_pkg probe');throw Error('New terminal inherited overlay');}catch(e){if(!e.message.includes('not found'))throw e;}
    results.push({name,passed:true,error:error.split('\n').slice(0,3).join('\n')});
    await window.auditProgress('PASS '+name+'; fresh build failure, no installed executable, repair, isolated terminal');
   }catch(error){results.push({name,passed:false,error:error.message});await window.auditProgress('FAIL '+name+' '+error.message);}
   finally{l.reset();}
  }
  return results;
 });
 await mkdir('artifacts/audit',{recursive:true});await writeFile('artifacts/audit/adversarial-build.json',JSON.stringify(report,null,2));assert(report.every(r=>r.passed),JSON.stringify(report.filter(r=>!r.passed)));
}finally{await browser.close();}
