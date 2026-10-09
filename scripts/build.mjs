import {cp,mkdir,readFile,writeFile,rm,readdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const publicBuild=process.argv.includes('--public');
await rm('dist',{recursive:true,force:true});
await mkdir('dist',{recursive:true});
for(const name of ['index.html','src','LICENSE','NOTICE'])await cp(name,'dist/'+name,{recursive:true});
if(publicBuild){
 const html=await readFile('dist/index.html','utf8');
 await writeFile('dist/index.html',html.replace(/<div class="university-logos">.*?<\/div>/s,''));
 await rm('dist/src/assets',{recursive:true,force:true});
 await mkdir('dist/docs',{recursive:true});
 for(const name of ['HANDOFF.md','ARCHITECTURE.md','INTERFACES.md'])await cp('docs/'+name,'dist/docs/'+name);
}else await cp('docs','dist/docs',{recursive:true});
await writeFile('dist/.nojekyll','');
// Version the complete module tree, including relative imports and workers.
const hash=createHash('sha256');
async function digest(dir){for(const entry of (await readdir(dir,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))){const path=dir+'/'+entry.name;hash.update(path);if(entry.isDirectory())await digest(path);else hash.update(await readFile(path));}}
await digest('dist/src');
const assetVersion=hash.digest('hex').slice(0,12),prefix='assets/'+assetVersion+'/';
await mkdir('dist/'+prefix,{recursive:true});await cp('dist/src','dist/'+prefix+'src',{recursive:true});
const entry=await readFile('dist/index.html','utf8');await writeFile('dist/index.html',entry.replaceAll('./src/','./'+prefix+'src/'));
await writeFile('dist/build-info.json',JSON.stringify({commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),builtAt:new Date().toISOString(),publicBuild,assetVersion},null,2));
console.log(`Static ${publicBuild?'public ':''}site written to dist; serve with the /ros2-basics-lab/ prefix.`);
