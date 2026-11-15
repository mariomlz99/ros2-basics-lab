import {tokenize} from '../shell.js';

// Read the executable resolved at execution time. Never infer it from a basename:
// a learner script called /tmp/printenv is not the installed printenv command.
function execution(record){
 if(Object.hasOwn(record,'command')){
  return {words:typeof record.command==='string'&&Array.isArray(record.operands)
   ?[record.command,...record.operands]:[],verified:true};
 }
 // Older sessions retain the original exact command evidence. Do not invent
 // resolution metadata or broaden their full-environment inspection credit.
 return {words:Array.isArray(record.words)?record.words:[],verified:false};
}

export function shellChecks(lab){
 const completed=[...lab.terminals.values()].flatMap(t=>t.completedCommands??[])
  .filter(record=>!record.error).map(record=>({record,...execution(record)}));
 const directory=completed.some(({record,words})=>words[0]==='pwd'&&record.result===record.cwd);
 const distribution=completed.some(({record,words,verified})=>{
  if(!record.rosDistro)return false;
  const [command,...args]=words;
  if(command==='printenv'){
   const operands=args.filter(arg=>arg!=='--');
   if(operands.length===1&&operands[0]==='ROS_DISTRO')return record.result===record.rosDistro;
   // A different variable may contain a forged newline-prefixed ROS_DISTRO
   // line. Require the shell's execution-time exported-variable evidence too.
   return verified&&record.inspectedRosDistro===true&&operands.length===0&&String(record.result).split('\n').includes('ROS_DISTRO='+record.rosDistro);
  }
  if(command!=='echo'||record.result!==record.rosDistro)return false;
  // Re-tokenize with a marker to distinguish actual expansion from a literal,
  // quoted identifier or comment, including the supported echo -n spelling.
  try{
   const expanded=tokenize(record.line,{ROS_DISTRO:'__inspected_ros_distro__'}).slice(1);
   if(expanded[0]==='-n')expanded.shift();
   return expanded.join(' ')==='__inspected_ros_distro__';
  }catch{return false;}
 });
 const graph=completed.some(({record,words,verified})=>{
  const [command,...args]=words;
  if(command!=='ros2'||record.helpRequested)return false;
  // Old wildcard history cannot reveal whether expansion requested help.
  // Preserve exact legacy commands; ambiguous records need a fresh inspection.
  const expanded=typeof record.helpRequested==='boolean';
  if(!expanded&&(record.words??[]).some(word=>typeof word==='string'&&/[?*]/.test(word)))return false;
  if(verified&&args[0]==='--use-python-default-buffering')args.shift();
  // Lab's operand metadata intentionally omits flags, so inspect the recorded
  // raw arguments too. --h is also a supported help alias in this CLI.
  if([...words,...record.words??[]].some(word=>['-h','--help','--h'].includes(word)))return false;
  return args[0]==='node'&&args[1]==='list';
 });
 return [{label:'Inspect your directory with pwd',passed:directory},
  {label:'Inspect the ROS distribution',passed:distribution},
  {label:'Inspect the node graph',passed:graph}];
}
