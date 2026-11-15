const INDEX='https://cdn.jsdelivr.net/pyodide/v0.28.3/full/';
let python,more=false,lines=[],known=new Set(),chain=Promise.resolve();
let count=0,last=0;
const output=text=>{if(Date.now()-last>1000){count=0;last=Date.now();}if(count++<80)postMessage({kind:'output',text:String(text)});};
function mount(entries){
 const paths=new Set(entries.map(([path])=>path));
 for(const path of [...known].sort((a,b)=>b.length-a.length))if(!paths.has(path))try{const item=python.FS.stat(path);python.FS.isDir(item.mode)?python.FS.rmdir(path):python.FS.unlink(path);}catch{}
 for(const [path,item]of entries){if(item.kind==='dir')python.FS.mkdirTree(path);else{python.FS.mkdirTree(path.slice(0,path.lastIndexOf('/')));python.FS.writeFile(path,item.content);}}
 known=paths;
}
function files(){const entries=[];function walk(path){const stat=python.FS.stat(path);if(python.FS.isDir(stat.mode)){entries.push([path,{kind:'dir'}]);for(const name of python.FS.readdir(path))if(!['.','..','__pycache__'].includes(name))walk(path+'/'+name);}else if(python.FS.isFile(stat.mode)){try{entries.push([path,{kind:'file',content:new TextDecoder('utf-8',{fatal:true}).decode(python.FS.readFile(path))}]);}catch{output('Cannot save binary file to the teaching workspace: '+path);}}}walk('/home/student');return entries;}
async function handle(data){
 if(!python){output('Loading Python runtime…');importScripts(INDEX+'pyodide.js');python=await loadPyodide({indexURL:INDEX,stdout:output,stderr:output});python.runPython("import sys, os, code\nsys.dont_write_bytecode = True\n_lab_console = code.InteractiveConsole({'__name__': '__main__'})");}
 mount(data.entries);python.FS.chdir(data.cwd);python.globals.set('_lab_cwd',data.cwd);python.runPython("os.chdir(_lab_cwd)\nif _lab_cwd not in sys.path: sys.path.insert(0, _lab_cwd)");
 let done=false;
 try{
  if(data.mode==='interrupt'){python.runPython('_lab_console.resetbuffer()');more=false;lines=[];}
  else if(data.mode==='version'){output(python.runPython("'Python ' + sys.version.split()[0]"));done=true;}
  else if(data.mode==='interactive'){output(python.runPython("'Python ' + sys.version.split()[0] + ' (browser runtime)\\nType exit() or press Ctrl+D to return to the shell.'"));}
  else {
   const source=data.mode==='file'?python.FS.readFile(data.path,{encoding:'utf8'}):data.code;
   const imports=data.mode==='line'?[...lines,source].join('\n'):source;
   try{await python.loadPackagesFromImports(imports,{messageCallback:output,errorCallback:output});}catch(error){if(!String(error).includes('SyntaxError'))throw error;}
   python.globals.set('_lab_source',source);
   if(data.mode==='line'){try{more=!!python.runPython('_lab_console.push(_lab_source)');}catch(error){if(String(error).includes('SystemExit'))done=true;else throw error;}lines=more?[...lines,source]:[];}
   else{python.globals.set('_lab_args',data.args);python.runPython('sys.argv = _lab_args.to_py()');python.globals.set('_lab_path',data.path??'<string>');python.runPython("exec(compile(_lab_source, _lab_path, 'exec'), {'__name__': '__main__', '__file__': _lab_path})");done=true;}
  }
 }catch(error){if(!String(error).includes('SystemExit'))output(String(error));done=data.mode!=='line';}
 postMessage({kind:'result',entries:files(),more,done});
}
onmessage=({data})=>{chain=chain.then(()=>handle(data)).catch(error=>postMessage({kind:'fatal',text:String(error)}));};
