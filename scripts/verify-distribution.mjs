import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const info=JSON.parse(await readFile('build-info.json','utf8'));
const index=await readFile('index.html','utf8');
assert.equal(info.preview,false);assert.equal(info.publicBuild,true);
for(const file of ['app.js','style.css'])assert(index.includes('./assets/'+info.assetVersion+'/src/'+file));
const sourceFiles=[];
async function verify(path=''){
 for(const entry of (await readdir('src/'+path,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))){
  const file=path+entry.name;
  if(entry.isDirectory())await verify(file+'/');
  else{
   const source=await readFile('src/'+file),shipped=await readFile('assets/'+info.assetVersion+'/src/'+file);
   assert(source.equals(shipped),'Source and published assets differ: '+file);
   sourceFiles.push({path:file,sha256:createHash('sha256').update(source).digest('hex')});
  }
 }
}
await verify();
const digest=createHash('sha256').update(JSON.stringify(sourceFiles)).digest('hex');
assert.equal(digest,info.sourceSha256);assert.equal(digest.slice(0,12),info.assetVersion);
// Preserve every historical Git blob, not only the previous active version.
const baseline=execFileSync('git',['ls-tree','-rz',info.baseDistributionCommit,'--','assets'],{encoding:'utf8'}).split('\0').filter(Boolean);
for(const record of baseline){
 const [,type,sha,path]=/^(\d+) (\w+) ([a-f0-9]+)\t(.+)$/s.exec(record).slice(1);
 assert.equal(type,'blob');
 const bytes=await readFile(path),actual=createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
 assert.equal(actual,sha,'Historical asset changed: '+path);
}
console.log(JSON.stringify({assetVersion:info.assetVersion,sourceFiles:sourceFiles.length,retainedAssetFiles:baseline.length,status:'PASS'}));
