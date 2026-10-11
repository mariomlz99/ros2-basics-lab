import {publishBuild} from './publish-build.mjs';
import {cp,mkdir,readFile,writeFile,rm,readdir,mkdtemp} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const publicBuild=process.argv.includes('--public');
const output=await mkdtemp('dist.staging-');
for(const name of ['index.html','src','LICENSE','NOTICE'])await cp(name,output+'/'+name,{recursive:true});
if(publicBuild){
 const html=await readFile(output+'/index.html','utf8');
 await writeFile(output+'/index.html',html.replace(/<div class="university-logos">.*?<\/div>/s,''));
 await rm(output+'/src/assets',{recursive:true,force:true});
 await mkdir(output+'/docs',{recursive:true});
 for(const name of ['HANDOFF.md','ARCHITECTURE.md','INTERFACES.md'])await cp('docs/'+name,output+'/docs/'+name);
}else await cp('docs',output+'/docs',{recursive:true});
await writeFile(output+'/.nojekyll','');
// Version the complete module tree, including relative imports and workers.
const hash=createHash('sha256');
async function digest(dir){for(const entry of (await readdir(dir,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))){const path=dir+'/'+entry.name;hash.update('dist'+path.slice(output.length));if(entry.isDirectory())await digest(path);else hash.update(await readFile(path));}}
await digest(output+'/src');
const assetVersion=hash.digest('hex').slice(0,12),prefix='assets/'+assetVersion+'/';
await mkdir(output+'/'+prefix,{recursive:true});await cp(output+'/src',output+'/'+prefix+'src',{recursive:true});
const entry=await readFile(output+'/index.html','utf8');await writeFile(output+'/index.html',entry.replaceAll('./src/','./'+prefix+'src/'));
await writeFile(output+'/build-info.json',JSON.stringify({commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),builtAt:new Date().toISOString(),publicBuild,assetVersion},null,2));
await publishBuild(output);
console.log(`Static ${publicBuild?'public ':''}site written to dist; serve with the /ros2-basics-lab/ prefix.`);
