import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(process.argv.includes('--built')?'dist':'.');
const server=http.createServer(async(req,res)=>{
 try{const url=new URL(req.url,'http://localhost');let name=decodeURIComponent(url.pathname);if(name==='/'){res.writeHead(302,{Location:'/ros2-basics-lab/'});res.end();return;}if(!name.startsWith('/ros2-basics-lab/'))throw Error();name=name.slice('/ros2-basics-lab/'.length);if(!name||name.endsWith('/'))name+='index.html';const file=path.resolve(root,name);if(!file.startsWith(root+path.sep))throw Error();const data=await readFile(file);res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.py':'text/plain','.hpp':'text/plain','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');res.end(data);}catch{res.writeHead(404);res.end('Not found');}
});server.listen(Number(process.env.PORT||8017),'127.0.0.1',()=>console.log('ROS 2 Basics Lab: http://127.0.0.1:'+server.address().port+'/ros2-basics-lab/'));
