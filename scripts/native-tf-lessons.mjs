// Run after: source /opt/ros/jazzy/setup.bash
// Builds the actual lesson sources in temporary native workspaces. No host ROS
// installation or existing student workspace is changed.
import {mkdtemp,mkdir,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {tfFiles,tfDependencies} from '../src/tf/lesson.js';
import {manifest,setup,cmake} from '../src/workspace.js';

const root=await mkdtemp(join(tmpdir(),'kinenest-native-tf-'));
const artifacts=resolve('artifacts/tf');await mkdir(artifacts,{recursive:true});
for(const language of ['python','cpp']){
 const py=language==='python',workspace=join(root,language),base=join(workspace,'src/tf_lab');
 const files=tfFiles(language),wrong=tfFiles(language,'lookup',{starter:true});
 files['package.xml']=manifest('tf_lab',py?'ament_python':'ament_cmake',tfDependencies(language));
 if(py){
  files['tf_lab/__init__.py']='';files['resource/tf_lab']='';
  files['setup.cfg']='[develop]\nscript_dir=$base/lib/tf_lab\n[install]\ninstall_scripts=$base/lib/tf_lab\n';
  files['tf_lab/wrong_lookup.py']=wrong['tf_lab/lookup.py'];
  files['setup.py']=setup('tf_lab',['lookup = tf_lab.lookup:main','point = tf_lab.point:main','wrong_lookup = tf_lab.wrong_lookup:main']);
 }else{
  files['src/wrong_lookup.cpp']=wrong['src/lookup.cpp'];
  files['CMakeLists.txt']=cmake('tf_lab',{lookup:'src/lookup.cpp',point:'src/point.cpp',wrong_lookup:'src/wrong_lookup.cpp'},tfDependencies(language));
 }
 for(const [path,source]of Object.entries(files)){const full=join(base,path);await mkdir(resolve(full,'..'),{recursive:true});await writeFile(full,source);}
 const build=spawnSync('colcon',['build','--base-paths','src','--event-handlers','console_direct+'],{cwd:workspace,encoding:'utf8',timeout:120000});
 await writeFile(join(artifacts,'native-build-'+language+'.log'),(build.stdout??'')+(build.stderr??''));
 if(build.status!==0)throw Error(language+' native build failed: '+build.error+'\n'+build.stdout+'\n'+build.stderr);
 console.log('PASS native '+language+' build');
}
const check=spawnSync('python3',[new URL('./native-tf-lessons.py',import.meta.url).pathname,root,artifacts],{encoding:'utf8',timeout:90000});
process.stdout.write(check.stdout??'');process.stderr.write(check.stderr??'');
if(check.status!==0)throw Error('Native TF lessons failed: '+check.error);
console.log('Native sources and install overlays: '+root);
