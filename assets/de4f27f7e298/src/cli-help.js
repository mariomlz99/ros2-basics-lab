import {NATIVE_CLI_HELP} from './native-cli-help.js';
export const ROS_COMMANDS=['daemon', 'interface', 'launch', 'node', 'param', 'pkg', 'run', 'service', 'topic'];
export function rootHelp(){return NATIVE_CLI_HELP.ros2.split('\n').filter(line=>{const match=/^  ([a-z]+)\s{2,}/.exec(line);return !match||ROS_COMMANDS.includes(match[1]);}).join('\n');}
export function daemonHelp(verb=''){const text=NATIVE_CLI_HELP['daemon'+(verb?' '+verb:'')];return verb==='start'?text.replace(' [--debug]','').split('\n').filter(line=>!line.includes('--debug, -d')).join('\n'):text;}
