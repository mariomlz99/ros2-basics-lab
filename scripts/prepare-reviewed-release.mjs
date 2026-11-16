// Assemble a versioned distribution without overwriting historical assets.
import assert from 'node:assert/strict';
import {cp,mkdir,readdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {join,relative} from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const baseDistributionCommit=process.argv[2];
assert.match(baseDistributionCommit??'',/^[a-f0-9]{40}$/,'Pass the reviewed baseline commit SHA');
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
const previous=JSON.parse(await readFile(join(root,'build-info.json'),'utf8'));
const original=await readFile(join(root,'index.html'),'utf8');
const oldPrefix='./assets/'+previous.assetVersion+'/src/';
assert(original.includes(oldPrefix+'app.js')&&original.includes(oldPrefix+'style.css'),'Unexpected entry point');
const destination=join(root,'assets',assetVersion,'src');
try{
 await mkdir(destination,{recursive:false});
}catch(error){
 if(error.code==='ENOENT'){await mkdir(join(root,'assets',assetVersion),{recursive:false});await mkdir(destination);}
 else if(error.code!=='EEXIST')throw error;
 else assert.deepEqual(await files(destination),sourceFiles,'Existing asset version differs; refusing overwrite');
}
await cp(join(root,'src'),destination,{recursive:true,force:false,errorOnExist:false});
assert.deepEqual(await files(destination),sourceFiles,'Source changed while packaging');
await writeFile(join(root,'index.html'),original.replaceAll(oldPrefix,'./assets/'+assetVersion+'/src/'));
await writeFile(join(root,'build-info.json'),JSON.stringify({project:'ROS 2 Basics Lab',publicBuild:true,preview:false,builtAt:new Date().toISOString(),assetVersion,sourceSha256,baseDistributionCommit},null,2)+'\n');
console.log(JSON.stringify({assetVersion,sourceSha256,sourceFiles:sourceFiles.length,baseDistributionCommit}));
