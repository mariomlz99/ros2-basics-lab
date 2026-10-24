// Evidence belongs to executed installed code, never editor text or CLI peers.
// Keep only the latest run of an executable and require its current source.
export function programOwners(lab,{active=false}={}){
 const owners=new Map();
 for(const process of new Set([...lab.processes.runs.values(),...lab.processes.active()])){
  if(!process.adapter||active&&process.state==='stopped'||!lab.workspace.current(process.name))continue;
  const installed=lab.workspace.installed.get(process.name),entry=installed?.executables.get(process.executable);
  if(!entry||process.entrySignature!==JSON.stringify([entry.module,entry.function,entry.code]))continue;
  const code=installed.type==='python'?installed.files[entry.module.replaceAll('.','/')+'.py']:entry.code;
  if(process.entryCode===code)owners.set(process.adapter,process);
 }
 return owners;
}
export function programDeliveries(lab,owners){return lab.runtime.programDeliveries.filter(s=>owners.has(s.publisher)&&owners.has(s.receiver));}
