import {migrateCurriculum} from './curriculum-session.js';
import {snapshotLesson,restoreLesson} from './course/checks.js';
const DATABASE='ros2-basics-lab-session';
// Version 2 keeps existing records but prevents legacy writers without conflict checks.
let loadedRevision=null;
const revisionOf=record=>record?.storageRevision??record?.savedAt??null;
function database(){return new Promise((resolve,reject)=>{let blocked=false;const request=indexedDB.open(DATABASE,2);request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains('sessions'))request.result.createObjectStore('sessions');};request.onblocked=()=>{blocked=true;reject(Error('Another tab is holding saved workspace storage open. Export unsaved source, close other tabs, then reload.'));};request.onsuccess=()=>{const db=request.result;db.onversionchange=()=>db.close();if(blocked){db.close();return;}resolve(db);};request.onerror=()=>reject(request.error);});}
export async function loadSession(){const db=await database();try{return await new Promise((resolve,reject)=>{const request=db.transaction('sessions').objectStore('sessions').get('current');request.onsuccess=()=>{loadedRevision=revisionOf(request.result);resolve(migrateCurriculum(request.result));};request.onerror=()=>reject(request.error);});}finally{db.close();}}
export async function saveSession(record){
 const db=await database();try{await new Promise((resolve,reject)=>{
  const tx=db.transaction('sessions','readwrite'),store=tx.objectStore('sessions'),read=store.get('current');
  const revision=crypto.randomUUID();let conflict=null;
  read.onsuccess=()=>{
   // The read and conditional write share one transaction: two tabs cannot
   // both accept the same old revision and silently replace each other's work.
   if(revisionOf(read.result)!==loadedRevision){conflict=Object.assign(Error('Another tab saved newer work'),{code:'SESSION_CONFLICT'});tx.abort();return;}
   store.put({...serializableRecord(record),storageRevision:revision},'current');
  };
  tx.oncomplete=()=>{loadedRevision=revision;resolve();};
  tx.onerror=()=>reject(conflict||tx.error);tx.onabort=()=>reject(conflict||tx.error||Error('Session save aborted'));
 });}finally{db.close();}
}
function portablePackages(packages){return new Map([...packages??[]].map(([name,record])=>[name,{...record,executables:new Map([...record.executables].map(([name,entry])=>{const copy={...entry};if(copy.wasmBytes)delete copy.module;return [name,copy];}))}]));}
export function captureSession(lab,ui){const workspace=snapshotLesson(lab);workspace.installed=portablePackages(workspace.installed);workspace.installations=portablePackages(workspace.installations);return {version:1,curriculumVersion:4,savedAt:Date.now(),workspace,terminals:[...lab.terminals.values()].map(t=>({cwd:t.cwd,env:{...t.env},vars:{...t.vars},overlays:new Set(t.overlays),history:[...t.history],completedCommands:[...t.completedCommands]})),exported:!!lab.exported,ui};}
export function restoreSession(lab,record){record=migrateCurriculum(record);if(record.version!==1)throw Error('This saved session uses an unsupported version.');restoreLesson(lab,record.workspace);lab.exported=record.exported;return record.terminals.map(t=>({...t,env:lab.workspace.restoreEnvironment(t.env),vars:{...t.vars}}));}

export async function restoreCompiledModules(record){if(record?.other)await restoreCompiledModules(record.other);for(const slot of Object.values(record?.slots??{}))await restoreCompiledModules(slot);for(const packages of [record?.workspace.installed,record?.workspace.installations])for(const pkg of packages?.values()??[])for(const entry of pkg.executables.values())if(entry.wasmBytes)entry.module=await WebAssembly.compile(entry.wasmBytes);return record;}

function serializableRecord(record){const workspace={...record.workspace,installed:portablePackages(record.workspace.installed),installations:portablePackages(record.workspace.installations)};return {...record,workspace,...(record.slots?{slots:Object.fromEntries(Object.entries(record.slots).map(([scope,slot])=>[scope,serializableRecord(slot)]))}:{}),...(record.other?{other:serializableRecord(record.other)}:{})};}
