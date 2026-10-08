// Insert the terminal-topic lesson without moving a returning learner to a different lesson.
export function migrateCurriculum(record){
 if(!record)return record;
 if(record.curriculumVersion!==2){
  const shift=index=>Number.isInteger(index)&&index>=2?index+1:index;
  if(record.ui){for(const key of ['lessonIndex','unitIndex'])if(key in record.ui)record.ui[key]=shift(record.ui[key]);
   if(record.ui.progress)record.ui.progress=record.ui.progress.map(shift);
   if(record.ui.guidePositions)record.ui.guidePositions=record.ui.guidePositions.map(([key,value])=>{const [index,...rest]=key.split(':');return [[shift(Number(index)),...rest].join(':'),value];});
  }
  record.curriculumVersion=2;
 }
 if(record.other)migrateCurriculum(record.other);
 return record;
}
