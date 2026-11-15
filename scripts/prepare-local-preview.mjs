// Assemble a local preview from this published checkout's source mirror.
// No network, Git writes, deployment, or mutation of historical assets.
import {cp,mkdir,mkdtemp,readdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {join,relative} from 'node:path';

const root=fileURLToPath(new URL('../',import.meta.url));
async function files(directory,base=directory){
 const result=[];
 for(const entry of (await readdir(directory,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))){
  const path=join(directory,entry.name);
  if(entry.isDirectory())result.push(...await files(path,base));
  else if(entry.isFile())result.push({path:relative(base,path),sha256:createHash('sha256').update(await readFile(path)).digest('hex')});
  else throw Error('Unsupported source entry: '+path);
 }
 return result;
}

const sourceFiles=await files(join(root,'src'));
const sourceSha256=createHash('sha256').update(JSON.stringify(sourceFiles)).digest('hex');
const assetVersion=sourceSha256.slice(0,12);
const baseBuild=JSON.parse(await readFile(join(root,'build-info.json'),'utf8'));
const oldPrefix='./assets/'+baseBuild.assetVersion+'/src/';
const original=await readFile(join(root,'index.html'),'utf8');
if(!original.includes(oldPrefix+'app.js')||!original.includes(oldPrefix+'style.css'))throw Error('Unexpected entry point: inspect the active asset version before rebuilding.');
const html=original.replaceAll(oldPrefix,'./assets/'+assetVersion+'/src/');
await mkdir(join(root,'artifacts'),{recursive:true});
const output=await mkdtemp(join(root,'artifacts','local-preview-'));
const destination=join(output,'assets',assetVersion,'src');
await cp(join(root,'src'),destination,{recursive:true});
if(JSON.stringify(await files(destination))!==JSON.stringify(sourceFiles))throw Error('Source changed during preview assembly; discard this incomplete candidate and retry.');
for(const name of ['LICENSE','NOTICE','.nojekyll','docs'])await cp(join(root,name),join(output,name),{recursive:true});
await writeFile(join(output,'index.html'),html);
await writeFile(join(output,'build-info.json'),JSON.stringify({project:'ROS 2 Basics Lab',preview:true,publicBuild:false,builtAt:new Date().toISOString(),assetVersion,sourceSha256,baseBuild},null,2)+'\n');
await writeFile(join(output,'preview-manifest.json'),JSON.stringify({sourceFiles,scope:'Local review preview only. Not a deployment package: historical asset versions remain in the original checkout.'},null,2)+'\n');
console.log(JSON.stringify({output,assetVersion,sourceSha256,sourceFiles:sourceFiles.length},null,2));
