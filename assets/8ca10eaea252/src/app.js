import{Playground}from'./playground/playground.js';
import{prepareUnit}from'./units/prepare.js';
import{loadSession,saveSession,captureSession,restoreSession,restoreCompiledModules}from'./session.js';
import{initLayout}from'./layout.js';
import{guidePages,environmentHints}from'./units/guide.js';
import{initPreferences,t}from'./i18n.js';
import{unitChecks,snapshotUnit,restoreUnit}from'./units/checks.js';
import{Lab}from'./lab.js';import{ROOT}from'./workspace.js';import{UNIT_NAMES,unit}from'./units.js';
let exampleUpdates=[];let preparing=false;let overview=false;const guidePositions=new Map();
const sessionSlots=new Map();
let playground;let unitSnapshots=new Map();const collapsed=new Set([ROOT+'/build',ROOT+'/install',ROOT+'/log']);
let lab,editor,views=[],activeFile=null,saved='',unitIndex=0,language='python',progress=new Set(),refreshPending=false;
const $=s=>document.querySelector(s),el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
function status(s){$('#status').textContent=s;}
function refresh(){if(refreshPending)return;refreshPending=true;requestAnimationFrame(()=>{refreshPending=false;if(!lab)return;renderFiles();for(const update of exampleUpdates)update();$('#graph-state').textContent=`${lab.runtime.nodes.size} nodes · ${lab.runtime.topics.size} topics`;if(activeFile&&!lab.fs.exists(activeFile)){activeFile=null;editor.open('','');saved='';fileTitle();}else if(activeFile&&editor.value===saved&&lab.fs.read(activeFile)!==saved){saved=lab.fs.read(activeFile);editor.open(activeFile,saved);fileTitle();}});}
function fileTitle(){const dirty=activeFile&&editor.value!==saved;$('#active-file').textContent=(activeFile?.replace('/home/learner/','~/')??'Choose a file')+(dirty?' • unsaved':'');$('#save').disabled=!activeFile;}
function save(){if(!activeFile)return;try{if(lab.fs.read(activeFile)!==saved)throw Error('File changed in another editor. Reopen it before saving.');lab.fs.write(activeFile,editor.value);saved=editor.value;fileTitle();status('Saved '+activeFile.split('/').at(-1));}catch(e){status(e.message);}}
function openFile(path){if(activeFile&&editor.value!==saved){status('Save the current file before switching, or use Revert.');return false;}try{saved=lab.fs.read(path);activeFile=path;for(const p of [...collapsed])if(path.startsWith(p+'/'))collapsed.delete(p);editor.open(path,saved);fileTitle();return true;}catch(e){status(e.message);return false;}}
function openFromTerminal(path){if(activeFile&&editor.value!==saved)throw Error('Save or revert current edits first.');if(!lab.fs.exists(path))lab.fs.touch(path);if(!openFile(path))throw Error('Could not open file');renderFiles();$('#files').scrollIntoView({block:'nearest'});editor.view.focus();}
function renderFiles(){const root=$('#file-tree');root.replaceChildren();const entries=[...lab.fs.entries].filter(([p])=>p.startsWith('/home/learner/')&&!p.includes('/.')).sort(([a],[b])=>a.localeCompare(b));for(const[p,e]of entries){if([...collapsed].some(dir=>p.startsWith(dir+'/')))continue;const button=el('button',(e.kind==='dir'?(collapsed.has(p)?'▸ ':'▾ '):'  ')+p.split('/').at(-1)+(e.kind==='dir'?'/':''),p===activeFile?'active':'');button.style.paddingLeft=(8+(p.split('/').length-4)*12)+'px';button.title=p;button.dataset.path=p;button.onclick=()=>{if(e.kind==='file'){openFile(p);renderFiles();}else{collapsed.has(p)?collapsed.delete(p):collapsed.add(p);renderFiles();}};root.append(button);}if(!entries.length)root.append(el('p','Your workspace will appear here as you create it.'));}
function addTerminal(state){if(views.length>=6){status('The lab supports up to six terminals. Close one to add another.');return;}const t=lab.terminal();if(state){t.cwd=lab.fs.exists(state.cwd)?state.cwd:'/home/learner';t.env=state.env;t.overlays=new Set(state.overlays);t.history=state.history;}const view=new (window.TerminalView)(lab,t,$('#terminals'),()=>{view.destroy();views=views.filter(v=>v!==view);},openFromTerminal);views.push(view);view.xterm.focus();}
function currentSessionUI(){return {unitIndex,language,progress:[...progress],guidePositions:[...guidePositions],activeFile,draft:activeFile&&editor.value!==saved?editor.value:null};}
function changeUnit(index){
 if(preparing)return;
 if((index===6)!==(unitIndex===6)){
  overview=false;const from=unitIndex===6?'playground':'basics',to=index===6?'playground':'basics';
  sessionSlots.set(from,{lab,views,activeFile,saved,draft:editor.value,unitSnapshots,ui:currentSessionUI()});
  for(const view of views)view.element.remove();
  const state=sessionSlots.get(to);
  if(state&&!state.record){lab=state.lab;views=state.views;activeFile=state.activeFile;saved=state.saved;unitSnapshots=state.unitSnapshots;editor.open(activeFile??'',state.draft);for(const view of views){$('#terminals').append(view.element);view.fit.fit();}}
  else{
   lab=new Lab({onChange:refresh});views=[];activeFile=null;saved='';unitSnapshots=new Map();editor.open('','');
   if(state?.record){const terminals=restoreSession(lab,state.record);for(const terminal of terminals)addTerminal(terminal);if(state.record.ui.activeFile&&lab.fs.exists(state.record.ui.activeFile)){openFile(state.record.ui.activeFile);if(state.record.ui.draft!==null)editor.open(activeFile,state.record.ui.draft);}}
   if(!views.length)addTerminal();
  }
  sessionSlots.delete(to);fileTitle();
 }
 unitIndex=index;renderUnit();renderFiles();refresh();status('');
}
function renderPlayground(){
 const stage=$('#playground-stage');stage.hidden=unitIndex!==6;if(unitIndex!==6){playground?.stop();if($('#playground-status'))$('#playground-status').textContent='Paused · simulator stopped';return;}
 if(playground?.runtime===lab.runtime)return;
 playground?.stop();stage.innerHTML='<div class="playground-streams"><figure><figcaption>Robot world</figcaption><canvas class="world" width="400" height="320"></canvas></figure><figure><figcaption>Camera · /camera/image_raw</figcaption><canvas class="camera" width="320" height="240"></canvas></figure><figure><figcaption>LiDAR · /scan</figcaption><canvas class="scan" width="320" height="240"></canvas></figure></div><div class="playground-controls"><button id="playground-start">Start playground</button><button id="playground-stop">Stop playground</button><span id="playground-status">Preview · simulator stopped</span></div>';
 for(const [index,figure]of [...stage.querySelectorAll('figure')].entries()){
  const caption=figure.querySelector('figcaption'),canvas=figure.querySelector('canvas');caption.id='stream-caption-'+index;canvas.id='stream-view-'+index;
  const button=el('button','Enlarge','stream-expand');button.setAttribute('aria-expanded','false');button.setAttribute('aria-controls',canvas.id);button.setAttribute('aria-describedby',caption.id);
  button.onclick=()=>{const expanded=figure.classList.toggle('expanded');button.textContent=expanded?'Restore view':'Enlarge';button.setAttribute('aria-expanded',String(expanded));};figure.insertBefore(button,canvas);
 }
 playground=new Playground(lab.runtime,stage.querySelector('.world'),stage.querySelector('.camera'),stage.querySelector('.scan'));
 $('#playground-start').onclick=()=>{playground.start();$('#playground-status').textContent='Live sensor streams';};
 $('#playground-stop').onclick=()=>{playground.stop();$('#playground-status').textContent='Paused · simulator stopped';};
}
function renderUnit(){renderPlayground();$('#prepare-unit').hidden=unitIndex===0;if(!unitSnapshots.has(unitIndex))unitSnapshots.set(unitIndex,snapshotUnit(lab));const root=$('#unit');exampleUpdates=[];root.replaceChildren();$('#unit-heading').textContent=unitIndex===6?'Robotics Playground':`${unitIndex+1}. ${UNIT_NAMES[unitIndex]}`;for(const b of document.querySelectorAll('#nav button, #exercise-nav button'))b.classList.toggle('active',Number(b.dataset.index)===unitIndex);$('#workspace').classList.toggle('intro',unitIndex===0);
 const allSteps=unit(unitIndex,language),pages=guidePages(allSteps.filter(step=>step.kind!=='playground')),key=unitIndex+':'+language;
 const position=Math.min(guidePositions.get(key)||0,pages.length-1),guided=!overview;
 {
  const controls=el('div',undefined,'guide-controls');
  const mode=el('button',overview?'Guided steps':'Unit overview');mode.id='guide-mode';mode.setAttribute('aria-pressed',String(overview));mode.onclick=()=>{overview=!overview;renderUnit();};
  if(guided){
   const indicator=el('span',undefined,'guide-progress');indicator.append(el('span','Step'),document.createTextNode(` ${position+1} / ${pages.length}`));indicator.setAttribute('aria-live','polite');
   const back=el('button','Back');back.id='guide-back';back.disabled=position===0;
   const next=el('button','Next');next.id='guide-next';next.disabled=position===pages.length-1;
   const move=n=>{guidePositions.set(key,n);renderUnit();$('#unit').scrollTop=0;$('#guide-next').focus({preventScroll:true});};
   back.onclick=()=>move(position-1);next.onclick=()=>move(position+1);
   controls.append(indicator,back,next);
  }controls.append(mode);root.append(controls);
 }
 for(const step of (guided?pages[position]:allSteps)){
  if(step.kind==='text')root.append(el('p',step.body));
  if(step.kind==='diagram'){const d=el('div','/talker  →  /topic : String  →  /listener','diagram');d.setAttribute('role','img');d.setAttribute('aria-label','Talker publishes a String message on topic; listener subscribes.');root.append(d);}
  if(step.kind==='commands'){if(guided&&unitIndex===0&&environmentHints[step.commands[0]])root.append(el('p',environmentHints[step.commands[0]],'guide-observation'));const group=el('div',undefined,'command-group');for(const command of step.commands){const row=el('div',undefined,'command');const code=el('code',command);const copy=el('button','Copy');let copyTimer;copy.setAttribute('aria-live','polite');copy.onclick=async()=>{clearTimeout(copyTimer);copy.disabled=true;try{await navigator.clipboard.writeText(command);copy.textContent='Copied!';status('Copied command');}catch{copy.textContent='Copy failed';status('Copy failed. Select the command and copy it manually.');}finally{copy.disabled=false;copyTimer=setTimeout(()=>{copy.textContent='Copy';},1800);}};row.append(code,copy);group.append(row);}root.append(group);}
  if(step.kind==='files'){for(const[path,source]of Object.entries(step.items)){
   const details=el('details'),summary=el('summary',`${step.pkg}/${path}`),pre=el('pre',source),actions=el('div',undefined,'example-actions');if(guided)details.open=true;
   const base=ROOT+'/src/'+step.pkg,full=base+'/'+path;
   let actionState;const update=()=>{
    const signature=JSON.stringify([lab.fs.exists(base),lab.fs.entries.get(full)]);if(signature===actionState)return;actionState=signature;actions.replaceChildren();
    if(!lab.fs.exists(base)){
     actions.append(el('p','Create the package before adding this file.'));
     const jump=el('button','Show package command');jump.onclick=()=>{
      const target=pages.findIndex(page=>page.some(part=>part.kind==='commands'&&part.commands.some(command=>command.startsWith('ros2 pkg create ')&&command.split(/\s+/).includes(step.pkg))));
      if(target>=0){overview=false;guidePositions.set(key,target);renderUnit();$('#unit').scrollTop=0;}else{$('#prepare-unit').focus();status('Use Prepare this unit to supply the prerequisite package.');}
     };actions.append(jump);return;
    }
    const exists=lab.fs.exists(full),open=el('button',exists?'Open file':'Add file');open.dataset.file=path;
    open.onclick=()=>{
     if(activeFile===full){editor.view.focus();status('File is already open in the workspace editor.');return;}
     if(activeFile&&editor.value!==saved){status('Save or revert current edits first.');return;}
     try{if(!lab.fs.exists(full)){lab.fs.mkdir(full.slice(0,full.lastIndexOf('/')),true);lab.fs.write(full,source);}openFile(full);editor.view.focus();status(exists?'Opened existing file.':'Added visible example '+path);update();}catch(error){status(error.message);}
    };actions.append(open);
    if(exists&&lab.fs.read(full)!==source){
     actions.append(el('p','Your file differs from this example. Open it to keep your work, or replace it explicitly.'));
     const replace=el('button','Replace with example');replace.onclick=()=>{if(!confirm(t('Replace this file with the displayed example? Existing contents and unsaved edits to this file will be lost.')))return;if(activeFile&&activeFile!==full&&editor.value!==saved){status('Save or revert current edits first.');return;}lab.fs.write(full,source);if(activeFile===full){saved=source;editor.open(full,source);fileTitle();}else openFile(full);update();};actions.append(replace);
    }
   };
   details.append(summary,pre,actions);root.append(details);exampleUpdates.push(update);update();
  }}
 }
 if(unitIndex===6&&guided&&position===pages.length-1)root.append(el('p','Exercise walkthrough complete. Keep experimenting here, or return to any unit. Your BASICS workspace is separate.'));
 if(guided&&pages[position].some(step=>step.kind==='commands'))root.append(el('p','Run the command, inspect the output, then choose Next. If it keeps running, leave it active unless the unit asks you to stop it.','guide-hint'));

 if(unitIndex<6&&(!guided||position===pages.length-1)){const checks=el('div',undefined,'checks');const finish=el('button','Check unit progress','complete');finish.onclick=()=>{const results=unitChecks(lab,unitIndex);checks.replaceChildren(...results.map(r=>el('p',(r.passed?'✓ ':'○ ')+r.label)));if(results.every(r=>r.passed)){progress.add(unitIndex);$('#progress').textContent=`${progress.size} / 6 completed`;status('Unit checks passed.');
 const onward=el('div',undefined,'unit-onward');onward.setAttribute('role','status');
 onward.append(el('strong',progress.size===6?'BASICS complete!':unitIndex===5?'Final unit complete.':'Unit complete!'));
 if(unitIndex===5)onward.append(el('p',progress.size===6?'Explore the playground to practise what you learned.':'You can explore the exercises now, or return to finish the earlier units.'));
 const nextUnit=unitIndex+1;const next=el('button',unitIndex===5?'Open playground':`Move to unit ${nextUnit+1}`);next.id='next-unit';
 next.onclick=()=>{overview=false;changeUnit(nextUnit);$('#unit').scrollTop=0;$('#unit-heading').setAttribute('tabindex','-1');$('#unit-heading').focus({preventScroll:true});status('');};
 onward.append(next);checks.append(onward);onward.scrollIntoView({block:'nearest',behavior:'smooth'});
 }else status('Keep exploring: the checklist shows what remains.');};root.append(finish,checks);}

}
async function start(){const stored=await restoreCompiledModules(await loadSession());const [{CodeEditor},{TerminalView}]=await Promise.all([import('./vendor/ui.js'),import('./terminal-view.js')]);window.TerminalView=TerminalView;
 $('#app').innerHTML=`<aside><div class="eyebrow">BASICS</div><nav id="nav" aria-label="Units"></nav><div class="eyebrow exercise-heading">PLAYGROUND</div><nav id="exercise-nav" aria-label="Playground"></nav><div id="progress">0 / 6 completed</div><label>Learning path<select id="language"><option value="python">Python</option><option value="cpp">C++</option></select></label><p class="disclosure">BASICS · Build, run and understand ROS 2.</p><button id="prepare-unit">Prepare this unit</button><button id="reset-unit">Restart unit</button><button id="reset">Reset workspace</button><button id="save-session">Save session</button><p id="session-state" role="status"></p><p id="save-scope">Stored on this device in this browser. Export your source for a portable copy.</p><button id="export">Export source workspace</button></aside><section class="workarea"><div class="workspace-top"><h1 id="unit-heading"></h1><span id="graph-state">0 nodes · 0 topics</span><button id="restore-layout">Restore layout</button></div><section id="playground-stage" hidden></section><div id="workspace"><article id="unit"></article><section id="files"><div class="panel-title">Workspace files <button id="new-file">New file</button></div><div class="editor-layout"><div id="file-tree"></div><div class="editor-pane"><div class="editor-title"><span id="active-file">Choose a file</span><button id="save">Save</button><button id="revert">Revert</button></div><div id="editor"></div></div></div></section></div><div class="terminal-toolbar"><strong>Terminals</strong><span>Shared files & graph · separate environments</span><button id="add-terminal">+ Terminal</button></div><div id="terminals"></div><footer id="status" role="status"></footer></section>`;
 $('#app').className='lab';initLayout();lab=new Lab({onChange:refresh,onOutput:(id,s)=>{const match=/(?:controller\.cpp|\.py)["']?[:,](?: line )?(\d+)/.exec(s);if(match&&activeFile)editor.diagnostic(Number(match[1]),s);}});editor=new CodeEditor($('#editor'),fileTitle,save);document.addEventListener('lab-diagnostic',event=>{if(!activeFile)return;const text=event.detail.text;const cpp=/([\w./-]+\.cpp):(\d+):/.exec(text),python=/File ["']([^"']+\.py)["'], line (\d+)/.exec(text),m=cpp??python;if(m&&(activeFile.endsWith(m[1])||m[1]==='controller.cpp'))editor.diagnostic(Number(m[2]),text);});
 UNIT_NAMES.concat('Robotics Playground').forEach((name,index)=>{const b=el('button',(index<6?`${index+1}  `:'↗  ')+name);b.dataset.index=index;b.onclick=()=>changeUnit(index);$(index<6?'#nav':'#exercise-nav').append(b);});
 $('#language').onchange=e=>{language=e.target.value;renderUnit();};$('#save').onclick=save;$('#revert').onclick=()=>{if(activeFile){saved=lab.fs.read(activeFile);editor.open(activeFile,saved);fileTitle();}};$('#new-file').onclick=()=>{const p=prompt(t('New file path (absolute or relative to ~/ros2_ws):'),'src/');if(!p)return;try{const path=p.startsWith('/')?p:ROOT+'/'+p;lab.fs.touch(path);openFile(path);}catch(e){status(e.message);}};$('#add-terminal').onclick=()=>addTerminal();
 $('#reset').onclick=()=>{if(!confirm(t('Delete the virtual workspace and stop all processes?')))return;for(const v of views)v.destroy();views=[];playground?.stop();playground=null;lab.reset();lab=new Lab({onChange:refresh});unitSnapshots=new Map();for(const key of [...guidePositions.keys()])if((unitIndex===6)===key.startsWith('6:'))guidePositions.delete(key);if(unitIndex!==6)progress.clear();$('#progress').textContent=`${progress.size} / 6 completed`;activeFile=null;saved='';editor.open('','');fileTitle();addTerminal();renderUnit();refresh();status('Workspace reset.');};
 $('#reset-unit').onclick=()=>{if(!confirm(t('Restore files and environments to when you first opened this unit? Current unit edits will be replaced.')))return;playground?.stop();playground=null;restoreUnit(lab,unitSnapshots.get(unitIndex));activeFile=null;saved='';editor.open('','');fileTitle();for(const v of views){v.output('Unit restored.');v.prompt();}guidePositions.delete(unitIndex+':'+language);progress.delete(unitIndex);$('#progress').textContent=`${progress.size} / 6 completed`;renderUnit();status('Restored this unit’s starting files and environments.');};

 $('#prepare-unit').onclick=async()=>{
  if(preparing)return;
  if(views.some(v=>v.terminal.busy||v.executing||v.line)||activeFile&&editor.value!==saved){status('Stop running commands and save edits before preparing a unit.');return;}
  preparing=true;const controls=[...document.querySelectorAll('#nav button,#exercise-nav button,#language,#reset,#reset-unit,#prepare-unit,#add-terminal')];controls.forEach(node=>node.disabled=true);
  status('Preparing prerequisite files and builds. Existing files are kept.');
  try{await prepareUnit(lab,unitIndex,language,line=>{status(line);views[0]?.output(line);});unitSnapshots.set(unitIndex,snapshotUnit(lab));guidePositions.delete(unitIndex+':'+language);for(const view of views)view.prompt();renderUnit();refresh();status('Unit ready. Prerequisites are available; earlier units were not marked complete.');}
  catch(error){status(error.message);}finally{preparing=false;controls.forEach(node=>node.disabled=false);}
 };
 $('#export').onclick=async()=>{try{const{downloadWorkspace}=await import('./export.js');downloadWorkspace(lab.fs);lab.exported=true;status('Source workspace exported. Keep this copy as a backup.');}catch(e){status(e.message);}};
 if(stored){
  if(stored.other)sessionSlots.set(stored.other.ui.unitIndex===6?'playground':'basics',{record:stored.other});
  const terminals=restoreSession(lab,stored);unitIndex=stored.ui.unitIndex;language=stored.ui.language;progress=new Set(stored.ui.progress);for(const [key,value]of stored.ui.guidePositions)guidePositions.set(key,value);
  $('#language').value=language;$('#progress').textContent=`${progress.size} / 6 completed`;
  for(const terminal of terminals)addTerminal(terminal);if(!terminals.length)addTerminal();
  if(stored.ui.activeFile&&lab.fs.exists(stored.ui.activeFile)){openFile(stored.ui.activeFile);if(stored.ui.draft!==null){editor.open(activeFile,stored.ui.draft);fileTitle();}}
  status('Saved session restored. Start your nodes again when needed.');
 }else addTerminal();
 let signature='',saving=false,savePending=false;
 const persist=async(force=false)=>{
  if(saving){savePending||=force;return;}if(preparing)return;const ui=currentSessionUI();
  const current=JSON.stringify([lab.fs.revision,ui,[...lab.terminals.values()].map(t=>[t.cwd,t.env,[...t.overlays],t.history]),!!lab.exported]);
  if(!force&&current===signature)return;
  saving=true;try{const record=captureSession(lab,ui);const other=sessionSlots.values().next().value;if(other)record.other=other.record??captureSession(other.lab,other.ui);await saveSession(record);signature=current;$('#session-state').textContent='Progress saved in this browser';}catch(error){$('#session-state').textContent='Session could not be saved. Export your workspace to keep a copy.';console.error(error);}finally{saving=false;if(savePending){savePending=false;persist(true);}}
 };
 $('#save-session').onclick=()=>persist(true);setInterval(()=>persist(),1500);document.addEventListener('visibilitychange',()=>{if(document.hidden)persist();});
 renderUnit();refresh();window.addEventListener('beforeunload',e=>{if(activeFile&&editor.value!==saved||views.some(v=>v.nano?.buffer.dirty)){e.preventDefault();e.returnValue='';}});
}
$('#start').onclick=()=>start().catch(e=>{console.error(e);$('#app').append(el('p',e.message));});
initPreferences();
if(new URLSearchParams(location.search).has('start'))$('#start').click();
