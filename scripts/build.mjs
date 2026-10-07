import {cp,mkdir} from 'node:fs/promises';
await mkdir('dist',{recursive:true});
for(const name of ['index.html','src','LICENSE','NOTICE'])await cp(name,'dist/'+name,{recursive:true});
console.log('Static site written to dist; serve with the /ros2-basics-lab/ prefix.');
