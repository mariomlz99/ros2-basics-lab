import {parsePackageXml} from './metadata.js';

export function exampleBuildType(step,language){
 return step.buildType??(Object.hasOwn(step.items,'CMakeLists.txt')?'ament_cmake':Object.hasOwn(step.items,'setup.py')?'ament_python':language==='python'?'ament_python':'ament_cmake');
}

// Protect example buttons, without changing shell or native build semantics.
export function examplePackageState(fs,base,expected){
 if(!fs.exists(base))return {kind:'missing'};
 try{
  const metadata=parsePackageXml(fs.read(base+'/package.xml'));
  if(metadata.name!==base.split('/').at(-1))throw Error('Package name does not match its directory.');
  return {kind:metadata.buildType===expected?'ready':'incompatible',buildType:metadata.buildType};
 }catch(error){return {kind:'invalid',detail:error.message};}
}

export const EXAMPLE_LANGUAGE_NOTICE='This package uses the other language. You can compare the example, but adding it would mix incompatible package files. Choose the package language to continue, or export your work and recreate the package with the displayed creation command.';
export const EXAMPLE_MANIFEST_NOTICE='Repair this package’s package.xml before adding examples. Your existing files are preserved.';
