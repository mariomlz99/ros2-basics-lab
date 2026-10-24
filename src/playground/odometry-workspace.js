import {ROOT} from '../workspace.js';
import {parsePackageXml} from '../metadata.js';

export const ODOMETRY_LANGUAGE_NOTICE='odom_lab belongs to another learning path. Changing the selector does not convert its package or installed reader. Use its existing language to continue. To start again in another language, export your source first, then use Reset workspace and choose that language.';
export const ODOMETRY_MANIFEST_NOTICE='The odom_lab folder needs a valid package.xml before these coding steps can continue. Open package.xml and repair it, or export your source before using Reset workspace. Your files have been kept.';

// A lesson guard only: do not alter native package, build or terminal semantics.
export function odometryPackageState(fs,language,packageName='odom_lab'){
 const base=ROOT+'/src/'+packageName,path=base+'/package.xml';
 if(!fs.exists(base))return {kind:'missing'};
 try{
  if(!fs.exists(path))throw Error('Missing '+path);
  const metadata=parsePackageXml(fs.read(path));
  if(metadata.name!==packageName)throw Error('Expected package name '+packageName+'.');
  const packageLanguage=metadata.buildType==='ament_python'?'python':'cpp';
  return {packageName,kind:packageLanguage===language?'ready':'incompatible',language:packageLanguage,buildType:metadata.buildType};
 }catch(error){return {packageName,kind:'invalid',detail:error.message};}
}
export const odometryPackageBlocked=state=>state.kind==='incompatible'||state.kind==='invalid';
export const odometryPackageNotice=state=>(state.kind==='invalid'?ODOMETRY_MANIFEST_NOTICE:ODOMETRY_LANGUAGE_NOTICE).replaceAll('odom_lab',state.packageName??'odom_lab');

export function prepareOdometryWorkspace(lab,language){
 const state=odometryPackageState(lab.fs,language);
 if(odometryPackageBlocked(state))throw Error(odometryPackageNotice(state));
 // Preparing supplies a directory, never a different package or hidden answer.
 lab.fs.mkdir(ROOT+'/src',true);
 for(const terminal of lab.terminals.values())terminal.cwd=ROOT;
 return [];
}
