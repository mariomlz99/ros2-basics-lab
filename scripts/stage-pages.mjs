// Stage this lab's public artifact without breaking modules used by open tabs.
import {cp,readFile,readdir,rm,stat} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
const destination=path.resolve(process.argv[2]||'');
if(!process.argv[2]||destination===process.cwd())throw Error('Pass the existing Pages deployment checkout');
const origin=execFileSync('git',['-C',destination,'remote','get-url','origin'],{encoding:'utf8'}).trim();
if(!/[:/]mariomlz99\/ros2-basics-lab(?:\.git)?$/.test(origin))throw Error('Destination must be the standalone ROS 2 Basics Lab deployment repository');
const info=JSON.parse(await readFile('dist/build-info.json','utf8'));if(!info.publicBuild)throw Error('Run npm run build:public first');
await stat(path.join(destination,'.git'));
for(const entry of await readdir(destination)){if(['.git','assets'].includes(entry))continue;await rm(path.join(destination,entry),{recursive:true,force:true});}
for(const entry of await readdir('dist'))await cp(path.join('dist',entry),path.join(destination,entry),{recursive:true});
console.log('Staged '+info.assetVersion+'; prior immutable asset versions retained for open tabs');
