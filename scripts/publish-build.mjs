import {mkdir,readdir,rename,rm} from 'node:fs/promises';

// Keep every immutable version addressable for tabs opened before a rebuild.
// The completed HTML is published last, after all of its imports are present.
export async function publishBuild(staging,destination='dist'){
 await mkdir(destination,{recursive:true});
 async function mergeAssets(source,target){
  await mkdir(target,{recursive:true});
  for(const entry of await readdir(source,{withFileTypes:true})){
   const from=source+'/'+entry.name,to=target+'/'+entry.name;
   if(entry.isDirectory())await mergeAssets(from,to);else await rename(from,to);
  }
 }
 await mergeAssets(staging+'/assets',destination+'/assets');
 const entries=(await readdir(staging,{withFileTypes:true})).filter(entry=>entry.name!=='assets');
 entries.sort((a,b)=>Number(a.name.endsWith('.html'))-Number(b.name.endsWith('.html')));
 for(const entry of entries){
  const target=destination+'/'+entry.name;
  if(entry.isDirectory())await rm(target,{recursive:true,force:true});
  await rename(staging+'/'+entry.name,target);
 }
 await rm(staging,{recursive:true,force:true});
}
