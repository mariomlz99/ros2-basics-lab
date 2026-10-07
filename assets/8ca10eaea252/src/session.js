import {snapshotUnit,restoreUnit} from './units/checks.js';
const DATABASE='kinenest-basics-session';
function database(name=DATABASE){return new Promise((resolve,reject)=>{const request=indexedDB.open(name,1);request.onupgradeneeded=()=>request.result.createObjectStore('sessions');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});}
async function readSession(name=DATABASE){const db=await database(name);try{return await new Promise((resolve,reject)=>{if(!db.objectStoreNames.contains('sessions'))return resolve(undefined);const request=db.transaction('sessions').objectStore('sessions').get('current');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});}finally{db.close();}}
export function migrateSession(record){
 if(!record)return record;if(![1,2].includes(record.version))throw Error('This saved session uses an unsupported version.');
 const legacy=record.ui?.lessonIndex!==undefined;
 const rewrite=value=>{if(typeof value==='string')return value.startsWith('/home/student')?value.replace('/home/student','/home/learner'):value;if(value instanceof Map)return new Map([...value].map(([k,v])=>[rewrite(k),rewrite(v)]));if(value instanceof Set)return new Set([...value].map(rewrite));if(Array.isArray(value))return value.map(rewrite);if(value&&Object.getPrototypeOf(value)===Object.prototype)return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,rewrite(v)]));return value;};
 const next=legacy?rewrite(record):record;next.version=2;
 if(legacy){next.ui.unitIndex=next.ui.lessonIndex;delete next.ui.lessonIndex;next.ui.progress=next.ui.progress.filter(i=>i<5);next.ui.guidePositions=next.ui.guidePositions.filter(([key])=>!key.startsWith('5:'));}
 if(next.other)next.other=migrateSession(next.other);return next;
}
export async function loadSession(){const current=await readSession();if(current)return migrateSession(current);const databases=await indexedDB.databases?.()??[];if(databases.some(db=>db.name==='ros2-basics-lab-session'))return migrateSession(await readSession('ros2-basics-lab-session'));return undefined;}
export async function saveSession(record){const db=await database();try{await new Promise((resolve,reject)=>{const tx=db.transaction('sessions','readwrite');tx.objectStore('sessions').put(serializableRecord(record),'current');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('Session save aborted'));});}finally{db.close();}}
export function captureSession(lab,ui){const workspace=snapshotUnit(lab);workspace.installed=new Map([...workspace.installed].map(([name,record])=>[name,{...record,executables:new Map([...record.executables].map(([name,entry])=>{const copy={...entry};if(copy.wasmBytes)delete copy.module;return [name,copy];}))}]));return {version:2,savedAt:Date.now(),workspace,terminals:[...lab.terminals.values()].map(t=>({cwd:t.cwd,env:{...t.env},overlays:new Set(t.overlays),history:[...t.history]})),exported:!!lab.exported,ui};}
export function restoreSession(lab,record){if(record.version!==2)throw Error('This saved session uses an unsupported version.');restoreUnit(lab,record.workspace);lab.exported=record.exported;return record.terminals;}

export async function restoreCompiledModules(record){if(record?.other)await restoreCompiledModules(record.other);for(const pkg of record?.workspace.installed.values()??[])for(const entry of pkg.executables.values())if(entry.wasmBytes)entry.module=await WebAssembly.compile(entry.wasmBytes);return record;}

function serializableRecord(record){const workspace={...record.workspace,installed:new Map([...record.workspace.installed].map(([name,pkg])=>[name,{...pkg,executables:new Map([...pkg.executables].map(([key,entry])=>{const copy={...entry};if(copy.wasmBytes)delete copy.module;return [key,copy];}))}]))};return {...record,workspace,...(record.other?{other:serializableRecord(record.other)}:{})};}
