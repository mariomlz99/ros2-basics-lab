import {tokenize} from '../shell.js';
export function shellChecks(lab){
 const completed=[...lab.terminals.values()].flatMap(t=>t.completedCommands??[]);
 const ran=words=>completed.some(c=>JSON.stringify(c.words)===JSON.stringify(words));
 const distribution=completed.some(c=>{
  if(!c.rosDistro||c.result!==c.rosDistro)return false;
  if(c.words.join(' ')==='printenv ROS_DISTRO')return true;
  if(c.words[0]!=='echo')return false;
  try{return tokenize(c.line,{ROS_DISTRO:'__inspected_ros_distro__'}).slice(1).join(' ')==='__inspected_ros_distro__';}catch{return false;}
 });
 return [{label:'Inspect your directory with pwd',passed:ran(['pwd'])},
  {label:'Inspect the ROS distribution',passed:distribution},
  {label:'Inspect the node graph',passed:ran(['ros2','node','list'])}];
}
