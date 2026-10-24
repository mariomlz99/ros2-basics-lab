// Small navigation choices must survive reload while the workspace's IndexedDB
// snapshot is still saving. Keep this journal scoped and separate from files.
import {sessionScope} from './session-scopes.js';
export function navigationStorage(database,curriculumVersion,storage=()=>globalThis.localStorage){
 const indexOf=ui=>ui.unitIndex??ui.lessonIndex??0;
 const key=ui=>`${database}:navigation:${curriculumVersion}:${sessionScope(indexOf(ui))}`;
 return {
  save(ui){try{const index=indexOf(ui),scope=sessionScope(index);storage().setItem(key(ui),JSON.stringify({savedAt:Date.now(),index,language:ui.language,guidePositions:ui.guidePositions.filter(([key])=>sessionScope(Number(key.split(':')[0]))===scope)}));}catch{/* The full workspace save still reports storage failures. */}},
  load(ui,savedAt=0){try{
   const record=JSON.parse(storage().getItem(key(ui))??'null'),scope=sessionScope(indexOf(ui));
   if(!record||!Number.isFinite(record.savedAt)||record.savedAt<savedAt||!Number.isInteger(record.index)||record.index<0||record.index>9||sessionScope(record.index)!==scope||!['python','cpp'].includes(record.language)||!Array.isArray(record.guidePositions))return ui;
   if(!record.guidePositions.every(item=>Array.isArray(item)&&item.length===2&&typeof item[0]==='string'&&/^\d+:(python|cpp)$/.test(item[0])&&sessionScope(Number(item[0].split(':')[0]))===scope&&Number.isInteger(item[1])&&item[1]>=0))return ui;
   const positions=new Map((ui.guidePositions??[]).filter(([key])=>sessionScope(Number(key.split(':')[0]))!==scope));
   for(const entry of record.guidePositions)positions.set(...entry);
   return {...ui,[Object.hasOwn(ui,'unitIndex')?'unitIndex':'lessonIndex']:record.index,language:record.language,guidePositions:[...positions]};
  }catch{return ui;}}
 };
}
