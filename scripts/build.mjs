import {cp,mkdir,readFile,writeFile,rm} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
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
await writeFile('dist/build-info.json',JSON.stringify({commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),builtAt:new Date().toISOString(),publicBuild},null,2));
console.log(`Static ${publicBuild?'public ':''}site written to dist; serve with the /ros2-basics-lab/ prefix.`);
