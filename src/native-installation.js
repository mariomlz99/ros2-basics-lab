import {NATIVE_INSTALLATION} from './native-installation-data.js';
import {decodeNativeText} from './vendor/native-codec.js';
export const nativeEntries=new Map(NATIVE_INSTALLATION.map(row=>[row[0],row]));
export function nativeContent(path){
 const row=nativeEntries.get(path);if(!row)return '';
 if(row[1]==='z')return decodeNativeText(row[5]);
 return 'SIMULATED NATIVE ARTIFACT\nPath: '+path+'\nNative size: '+row[3]+' bytes\nSHA-256: '+row[4]+(row[6]?'\nNative symlink target: '+row[6]:'')+'\nInspection only. Native binaries, images and libraries are not executable browser runtimes.\n';
}
export function attachNativeContent(entry){
 if(entry.nativeKey&&!Object.hasOwn(entry,'content'))Object.defineProperty(entry,'content',{configurable:true,get(){return nativeContent(this.nativeKey);}});
 return entry;
}
export function seedNativeInstallation(fs){
 for(const row of NATIVE_INSTALLATION){
  const [path,encoding,mode,size,hash,,link]=row;
  if(encoding==='d'){if(!fs.exists(path))fs.mkdir(path,true);continue;}
  const old=fs.entries.get(path);
  // Runtime-backed files and user edits take precedence over reference captures.
  if(old&&!old.nativeKey)continue;
  fs.mkdir(path.slice(0,path.lastIndexOf('/')),true);
  fs.entries.set(path,attachNativeContent({kind:'file',nativeKey:path,nativeHash:hash,nativeSize:size,nativeLink:link||undefined,executable:old?.executable??!!(mode&0o111),nativeExecutable:!!(mode&0o111)}));
 }
}
