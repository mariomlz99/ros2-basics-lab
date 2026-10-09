export async function runPythonShell(lab,terminal,args){
 if(args[0]==='--help'||args[0]==='-h')return 'python3 [script.py [args...]] | -c "code" | --version\nWith no arguments: interactive Python. Ctrl+D or exit() returns to the shell.\nStandard library and Pyodide-supported imports (including NumPy) run in the browser. Use ros2 run for ROS nodes. Native OS processes and pip are not supported.';
 let request;
 if(!args.length)request={mode:'interactive'};
 else if(['--version','-V'].includes(args[0]))request={mode:'version'};
 else if(args[0]==='-c'){if(args.length<2)throw Error('python3 -c requires code');request={mode:'code',code:args[1],args:['-c',...args.slice(2)]};}
 else if(args[0].startsWith('-'))throw Error('Unsupported Python option. Use python3 --help.');
 else{const path=terminal.path(args[0]);lab.fs.read(path);request={mode:'file',path,args:[path,...args.slice(1)]};}
 const worker=new Worker(new URL('./shell-worker.js',import.meta.url));let pending,baseline,timer,closed=false;
 const entries=()=>[...lab.fs.entries].filter(([path])=>path==='/home/student'||path.startsWith('/home/student/'));
 const close=()=>{if(closed)return;closed=true;clearTimeout(timer);worker.terminate();terminal.pythonShell=null;terminal.busy=false;terminal.foreground=null;terminal.stopTask=null;pending?.();pending=null;};
 const send=data=>new Promise(resolve=>{pending=resolve;baseline=new Map(entries());terminal.busy=true;timer=setTimeout(()=>{terminal.output('Python timed out.');close();},180000);worker.postMessage({...data,entries:[...baseline],cwd:terminal.cwd});});
 const shell={more:false,send:code=>send({mode:'line',code}),interrupt:()=>{shell.more=false;return send({mode:'interrupt'});},close};terminal.pythonShell=shell;terminal.foreground='python';terminal.stopTask=close;
 worker.onerror=event=>{terminal.output(event.message||'Python worker failed to load. Save your session, reload the page and retry.');close();};
 worker.onmessage=({data})=>{
  if(data.kind==='output'){terminal.output(data.text);return;}
  if(data.kind==='fatal'){terminal.output(data.text);close();return;}
  if(data.kind!=='result')return;
  clearTimeout(timer);const result=new Map(data.entries);let conflicts=false;
  for(const path of new Set([...baseline.keys(),...result.keys()])){
   const before=baseline.get(path),after=result.get(path);if(JSON.stringify(before)===JSON.stringify(after))continue;
   if(JSON.stringify(lab.fs.entries.get(path))!==JSON.stringify(before)){conflicts=true;continue;}
   if(after)lab.fs.entries.set(path,after);else lab.fs.entries.delete(path);
  }
  lab.fs.changed('/home/student');if(conflicts)terminal.output('Some files changed in another editor; those changes were kept.');
  shell.more=data.more;terminal.busy=false;if(data.done)close();else{pending?.();pending=null;}
 };
 await send(request);return '';
}
