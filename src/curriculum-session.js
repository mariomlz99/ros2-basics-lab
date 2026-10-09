// Keep saved selections, completion and guide positions attached to lesson content.
export function migrateCurriculum(record){
 if(!record)return record;
 const remap=map=>{
  if(!record.ui)return;
  for(const key of ['lessonIndex','unitIndex'])if(key in record.ui)record.ui[key]=map(record.ui[key]);
  if(record.ui.progress)record.ui.progress=record.ui.progress.map(map);
  if(record.ui.guidePositions)record.ui.guidePositions=record.ui.guidePositions.map(([key,value])=>{const [index,...rest]=key.split(':');return [[map(Number(index)),...rest].join(':'),value];});
 };
 if((record.curriculumVersion??1)<2){remap(index=>Number.isInteger(index)&&index>=2?index+1:index);record.curriculumVersion=2;}
 if(record.curriculumVersion===2){remap(index=>index===1?2:index===2?1:index);record.curriculumVersion=3;}
 if(record.other)migrateCurriculum(record.other);
 return record;
}
