import {navigationStorage} from './session-navigation.js';
import {exampleBuildType,examplePackageState,EXAMPLE_LANGUAGE_NOTICE,EXAMPLE_MANIFEST_NOTICE} from './example-package.js';
import {odometryPackageState,odometryPackageBlocked,odometryPackageNotice} from './playground/odometry-workspace.js';
import {translations as odometryDictionary} from './translations.js';
import {odometryTranslations} from './playground/odometry-translations.js';
import {TFVisualizer} from './tf/visualizer.js';
import {TF_TITLE,tfChecks} from './tf/lesson.js';
import {tfTranslations} from './tf/translations.js';
import {OdometryView} from './playground/odometry-view.js';
import {sessionScope, savedSlots} from './session-scopes.js';
import {playgroundSections} from './playground/sections.js';
import {pubsubDiagram} from './pubsub-diagram.js';
import{Playground}from'./playground/playground.js';
import{prepareLesson}from'./course/prepare.js';
import{loadSession,saveSession,captureSession,restoreSession,restoreCompiledModules}from'./session.js';
import{initLayout}from'./layout.js';
import{guidePages,environmentHints,correspondingGuidePosition}from'./course/guide.js';
import{initPreferences,t}from'./i18n.js';
import{lessonChecks,snapshotLesson,restoreLesson}from'./course/checks.js';
import{Lab}from'./lab.js';import{ROOT,BASE_PACKAGES}from'./workspace.js';import{LESSON_NAMES,lesson}from'./course.js';
let exampleUpdates=[];let preparing=false;let overview=false;const guidePositions=new Map();
let activeExercise=null,odometryStateSignature='',odometryFileRevision=-1,odometrySwitchNotice=null;
const sessionSlots=new Map();
const navigation=navigationStorage('ros2-basics-lab-session',4);
let freeRobot=false;
let odometryView,playground,tfVisualizer,tfPlayground;let lessonSnapshots=new Map();const collapsed=new Set([ROOT+'/build',ROOT+'/install',ROOT+'/log']);
let lab,editor,views=[],activeFile=null,saved='',lessonIndex=0,language='python',progress=new Set(),refreshPending=false;
Object.assign(odometryDictionary,odometryTranslations,tfTranslations);
const $=s=>document.querySelector(s),el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
function updateProgress(){
 $('#progress').textContent=`${progress.size} / 7 completed`;
 for(const b of document.querySelectorAll('#nav button')){const done=progress.has(Number(b.dataset.index));b.classList.toggle('completed',done);b.querySelector('.completion-mark')?.remove();if(done){const mark=el('span','✓','completion-mark');mark.setAttribute('aria-label','Completed');b.append(mark);}}
}
function status(s){$('#status').textContent=s;}
function refresh(){if(refreshPending)return;refreshPending=true;requestAnimationFrame(()=>{refreshPending=false;if(!lab)return;if((lessonIndex===7||lessonIndex===9)&&odometryFileRevision!==lab.fs.revision){odometryFileRevision=lab.fs.revision;if(odometryStateSignature!==JSON.stringify(odometryPackageState(lab.fs,language)))renderLesson();}tfVisualizer?.update();odometryView?.update();renderFiles();for(const update of exampleUpdates)update();$('#graph-state').textContent=`${lab.runtime.nodes.size} nodes · ${lab.runtime.topics.size} topics`;if(activeFile&&!lab.fs.exists(activeFile)){activeFile=null;editor.open('','');saved='';fileTitle();}else if(activeFile&&editor.value===saved&&lab.fs.read(activeFile)!==saved){saved=lab.fs.read(activeFile);editor.open(activeFile,saved);fileTitle();}});}
function fileTitle(){const dirty=activeFile&&editor.value!==saved;$('#active-file').textContent=(activeFile?.replace('/home/student/','~/')??'Choose a file')+(dirty?' • unsaved':'');$('#save').disabled=!activeFile;}
function save(){if(!activeFile)return;try{if(lab.fs.read(activeFile)!==saved)throw Error('File changed in another editor. Reopen it before saving.');lab.fs.write(activeFile,editor.value);saved=editor.value;fileTitle();status('Saved '+activeFile.split('/').at(-1));}catch(e){status(e.message);}}
function openFile(path){if(activeFile&&editor.value!==saved){status('Save the current file before switching, or use Revert.');return false;}try{saved=lab.fs.read(path);activeFile=path;for(const p of [...collapsed])if(path.startsWith(p+'/'))collapsed.delete(p);editor.open(path,saved);fileTitle();return true;}catch(e){status(e.message);return false;}}
function openFromTerminal(path){if(activeFile&&editor.value!==saved)throw Error('Save or revert current edits first.');if(!lab.fs.exists(path))lab.fs.touch(path);if(!openFile(path))throw Error('Could not open file');renderFiles();$('#files').scrollIntoView({block:'nearest'});editor.view.focus();}
// Sensor publications refresh the graph; preserve file controls until their inputs change.
let renderedFiles;
function renderFiles(){const root=$('#file-tree'),signature=JSON.stringify([lab.fs.revision,activeFile,[...collapsed]]);if(renderedFiles?.root===root&&renderedFiles.fs===lab.fs&&renderedFiles.signature===signature)return;renderedFiles={root,fs:lab.fs,signature};root.replaceChildren();const entries=[...lab.fs.entries].filter(([p])=>p.startsWith('/home/student/')&&!p.includes('/.')).sort(([a],[b])=>a.localeCompare(b));for(const[p,e]of entries){if([...collapsed].some(dir=>p.startsWith(dir+'/')))continue;const button=el('button',(e.kind==='dir'?(collapsed.has(p)?'▸ ':'▾ '):'  ')+p.split('/').at(-1)+(e.kind==='dir'?'/':''),p===activeFile?'active':'');button.style.paddingLeft=(8+(p.split('/').length-4)*12)+'px';button.title=p;button.dataset.path=p;button.onclick=()=>{if(e.kind==='file'){openFile(p);renderFiles();}else{collapsed.has(p)?collapsed.delete(p):collapsed.add(p);renderFiles();}};root.append(button);}if(!entries.length)root.append(el('p','Your workspace will appear here as you create it.'));}
function addTerminal(state){if(views.length>=6){status('The lab supports up to six terminals. Close one to add another.');return;}const t=lab.terminal(state);const view=new (window.TerminalView)(lab,t,$('#terminals'),()=>{view.destroy();views=views.filter(v=>v!==view);},openFromTerminal);views.push(view);if(matchMedia('(pointer:fine)').matches)view.xterm.textarea?.focus({preventScroll:true});}
function currentSessionUI(){return {lessonIndex,language,freeRobot,progress:[...progress],guidePositions:[...guidePositions],activeFile,draft:activeFile&&editor.value!==saved?editor.value:null};}
function changeLesson(index){
 if(index!==lessonIndex)odometrySwitchNotice=null;
 if(preparing)return;
 if(lessonIndex===9&&index!==9){tfPlayground?.stop();lab.processes.reset();for(const terminal of lab.terminals.values())terminal.stop();lab.runtime.invalidateTfEvidence();}
 if(sessionScope(index)!==sessionScope(lessonIndex)){
  overview=false;const from=sessionScope(lessonIndex),to=sessionScope(index);
  sessionSlots.set(from,{lab,views,activeFile,saved,draft:editor.value,lessonSnapshots,ui:currentSessionUI()});
  for(const view of views)view.element.remove();
  const state=sessionSlots.get(to);
  if(state&&!state.record){lab=state.lab;views=state.views;activeFile=state.activeFile;saved=state.saved;lessonSnapshots=state.lessonSnapshots;editor.open(activeFile??'',state.draft);for(const view of views){$('#terminals').append(view.element);view.fit.fit();}}
  else{
   lab=new Lab({onChange:refresh});views=[];activeFile=null;saved='';lessonSnapshots=new Map();editor.open('','');
   if(state?.record){const terminals=restoreSession(lab,state.record);for(const terminal of terminals)addTerminal(terminal);if(state.record.ui.activeFile&&lab.fs.exists(state.record.ui.activeFile)){openFile(state.record.ui.activeFile);if(state.record.ui.draft!==null)editor.open(activeFile,state.record.ui.draft);}}
   if(index===8&&!state)lab.fs.mkdir(ROOT+'/src',true);
   if(!views.length)addTerminal();
  }
  language=state?.ui?.language??state?.record?.ui?.language??language;$('#language').value=language;sessionSlots.delete(to);fileTitle();
 }
 lessonIndex=index;renderLesson();renderFiles();refresh();status('');
}
function renderPlayground(){
 const stage=$('#playground-stage');stage.hidden=lessonIndex!==7&&!(lessonIndex===8&&freeRobot);if(stage.hidden){playground?.stop();if($('#playground-status'))$('#playground-status').textContent='Paused · simulator stopped';return;}
 if(playground?.runtime===lab.runtime)return;
 playground?.stop();stage.innerHTML='<div class="playground-streams"><figure><figcaption>Robot world | 1 square = 1 m</figcaption><canvas class="world" width="800" height="640"></canvas></figure><figure><figcaption>Camera · /camera/image_raw</figcaption><canvas class="camera" width="320" height="240"></canvas></figure><figure><figcaption>LiDAR · /scan</figcaption><canvas class="scan" width="320" height="240"></canvas></figure></div><div class="playground-controls"><button id="playground-start">Start playground</button><button id="playground-stop">Stop playground</button><button id="playground-reset">Reset robot pose</button><button id="playground-view" aria-pressed="false">Room overview</button><span id="playground-status">Preview · simulator stopped</span></div>';
 for(const [index,figure]of [...stage.querySelectorAll('figure')].entries()){
  const caption=figure.querySelector('figcaption'),canvas=figure.querySelector('canvas');caption.id='stream-caption-'+index;canvas.id='stream-view-'+index;
  const button=el('button','Enlarge','stream-expand');button.setAttribute('aria-expanded','false');button.setAttribute('aria-controls',canvas.id);button.setAttribute('aria-describedby',caption.id);
  button.onclick=()=>{const expanded=figure.classList.toggle('expanded');button.textContent=expanded?'Restore view':'Enlarge';button.setAttribute('aria-expanded',String(expanded));};figure.insertBefore(button,canvas);
 }
 playground=new Playground(lab.runtime,stage.querySelector('.world'),stage.querySelector('.camera'),stage.querySelector('.scan'));
 const notebook=el('section');stage.append(notebook);odometryView?.destroy();odometryView=new OdometryView(notebook,lab.runtime,playground);
 $('#playground-start').onclick=()=>{try{playground.start();$('#playground-status').textContent='Live sensor streams';}catch(error){status(error.message);}};
 $('#playground-view').onclick=()=>{playground.overview=!playground.overview;$('#playground-view').textContent=playground.overview?'Follow robot':'Room overview';$('#playground-view').setAttribute('aria-pressed',String(playground.overview));playground.draw();};
 $('#playground-reset').onclick=()=>{playground.resetPose();odometryView?.reset();status('Robot pose reset. Stop any velocity publisher before resetting.');};
 $('#playground-stop').onclick=()=>{playground.stop();$('#playground-status').textContent='Paused · simulator stopped';};
}
function renderTF(){
 const stage=$('#tf-stage');stage.hidden=lessonIndex!==9;$('.workarea').classList.toggle('tf-session',lessonIndex===9);
 if(stage.hidden){tfPlayground?.stop();tfVisualizer?.destroy();tfVisualizer=null;return;}
 if(tfVisualizer?.runtime===lab.runtime)return;
 tfVisualizer?.destroy();tfPlayground?.stop();
 // Reuse the same simulator; its canvases are detached because the TF view
 // renders its publication state instead of duplicating robot geometry state.
 tfPlayground=new Playground(lab.runtime,document.createElement('canvas'),document.createElement('canvas'));
 tfVisualizer=new TFVisualizer(stage,lab.runtime,tfPlayground);
}
function odometryNotice(root,state,{rejected=false}={}){
 const notice=el('div',undefined,'guide-observation odom-language-notice');notice.dataset.odometryGuard=state.kind;notice.setAttribute('role','status');
 if(rejected)notice.append(el('strong','Learning path unchanged. Your files and unsaved edits are preserved.'));
 notice.append(el('p',odometryPackageNotice(state)));
 if(state.buildType){const info=el('p');info.append(el('code','package.xml: '+state.buildType));notice.append(info);}
 if(state.detail)notice.append(el('pre',state.detail));
 if(state.language){const use=el('button','Use package language');use.dataset.odometryLanguage=state.language;use.onclick=()=>{language=state.language;$('#language').value=language;odometrySwitchNotice=null;renderLesson();};notice.append(use);}
 root.append(notice);
}
function renderLesson(){renderPlayground();renderTF();$('#prepare-lesson').textContent=lessonIndex===9?'Prepare this unit':lessonIndex===7?'Prepare this exercise':'Prepare this lesson';$('#prepare-lesson').hidden=lessonIndex===0||lessonIndex===1||lessonIndex===8;$('#reset-lesson').hidden=lessonIndex===8;if(!lessonSnapshots.has(lessonIndex))lessonSnapshots.set(lessonIndex,snapshotLesson(lab));const root=$('#lesson');exampleUpdates=[];root.replaceChildren();$('#lesson-heading').textContent=lessonIndex===9?TF_TITLE:lessonIndex===8?'Free Lab':lessonIndex===7?'Robotics Playground':`${lessonIndex+1}. ${LESSON_NAMES[lessonIndex]}`;for(const b of document.querySelectorAll('#nav button, #exercise-nav button'))b.classList.toggle('active',Number(b.dataset.index)===lessonIndex);$('#workspace').classList.toggle('intro',lessonIndex===0);
 const allSteps=lesson(lessonIndex,language),pages=guidePages(allSteps.filter(step=>step.kind!=='playground')).slice(0,lessonIndex>=7?-1:undefined),key=lessonIndex+':'+language;
 if(lessonIndex===8){const toggle=el('button',freeRobot?'Disable robot and sensors':'Enable robot and sensors');toggle.id='free-robot';toggle.setAttribute('aria-pressed',String(freeRobot));toggle.onclick=()=>{freeRobot=!freeRobot;renderLesson();};root.append(toggle);}
 const position=Math.min(guidePositions.get(key)||0,pages.length-1),guided=!overview&&lessonIndex!==8;
 const sections=lessonIndex===7||lessonIndex===9?playgroundSections(pages):[],section=sections.find(s=>position>=s.start&&position<=s.end);
 activeExercise=section?.id??null;const odometryState=odometryPackageState(lab.fs,language),odometryBlocked=odometryPackageBlocked(odometryState);odometryStateSignature=JSON.stringify(odometryState);odometryFileRevision=lab.fs.revision;
 if(activeExercise==='odometry')$('#prepare-lesson').textContent='Prepare odometry workspace';
 if(lessonIndex===9)tfVisualizer?.setExercise(section?.id??'frames');
 if(odometryView)odometryView.container.hidden=lessonIndex!==7||section?.id!=='odometry';
 if(sections.length){const nav=el('nav',undefined,'playground-exercises');nav.setAttribute('aria-label',lessonIndex===9?'TF exercises':'Playground exercises');if(lessonIndex===9)nav.dataset.i18nLabel='TF exercises';for(const item of sections){const button=el('button',item.title);button.dataset.exercise=item.id;button.classList.toggle('active',guided&&item.id===section.id);if(guided&&item.id===section.id)button.setAttribute('aria-current','step');button.onclick=()=>{guidePositions.set(key,item.start);overview=false;renderLesson();$('#lesson').scrollTop=0;};nav.append(button);}root.append(nav);if(guided)root.append(el('h2',section.title,'exercise-title'));}

 if(lessonIndex!==8){
  const controls=el('div',undefined,'guide-controls');
  const mode=el('button',overview?'Guided steps':'Lesson overview');mode.id='guide-mode';mode.setAttribute('aria-pressed',String(overview));mode.onclick=()=>{overview=!overview;renderLesson();};
  if(guided){
   const indicator=el('span',undefined,'guide-progress');indicator.append(el('span','Step'),document.createTextNode(` ${section?position-section.start+1:position+1} / ${section?section.end-section.start+1:pages.length}`));indicator.setAttribute('aria-live','polite');
   const back=el('button','Back');back.id='guide-back';back.disabled=position===0;
   const next=el('button','Next');next.id='guide-next';next.disabled=position===pages.length-1;
   const move=n=>{guidePositions.set(key,n);renderLesson();$('#save-session').click();$('#lesson').scrollTop=0;$('#guide-next').focus({preventScroll:true});};
   back.onclick=()=>move(position-1);next.onclick=()=>move(position+1);
   controls.append(indicator,back,next);
  }controls.append(mode);root.append(controls);
 }
 let odometryNoticeShown=false;
 if(odometrySwitchNotice||activeExercise==='odometry'&&odometryBlocked){odometryNotice(root,odometrySwitchNotice??odometryState,{rejected:!odometryBlocked});odometryNoticeShown=true;}
 for(const step of (guided?pages[position]:allSteps)){
  if(step.odometryPackage&&odometryBlocked){if(!odometryNoticeShown){odometryNotice(root,odometryState);odometryNoticeShown=true;}continue;}
  if(step.kind==='section'&&!guided)root.append(el('h2',step.title,'exercise-title'));
  if(step.kind==='simulator-action')root.append(el('p',step.body,'guide-observation'));
  if(step.kind==='frame-tree'){const tree=el('pre','odom\n└─ base_link  (moving: /tf)\n   ├─ left_wheel_link  (rolling: /tf)\n   ├─ right_wheel_link  (rolling: /tf)\n   ├─ laser_link  (fixed: /tf_static)\n   └─ camera_link  (fixed: /tf_static)\n      └─ camera_optical_frame  (fixed: /tf_static)','frame-tree');tree.setAttribute('aria-label','Robot coordinate frames');root.append(tree);}
  if(step.kind==='tf-reflection'){const details=el('details'),summary=el('summary','Think it through: '+step.question);details.append(summary,el('p',step.answer));root.append(details);}
  if(step.kind==='tf-check'){const checks=el('div',undefined,'checks'),button=el('button','Check exercise','complete');button.dataset.tfCheck=step.exercise;button.onclick=()=>{const results=tfChecks(lab,step.exercise);checks.replaceChildren(...results.map(r=>el('p',(r.passed?'✓ ':'○ ')+r.label)));status(results.every(r=>r.passed)?'TF exercise passed.':'Run your current program with the simulator, then check again.');};root.append(button,checks);}
  if(step.kind==='text')root.append(el('p',step.body));
  if(step.kind==='diagram')root.append(pubsubDiagram());
  if(step.kind==='topic-diagram'){const d=el('div','Terminal 1: pub  →  /lab_chat : String  →  Terminal 2: echo','diagram');d.setAttribute('role','img');d.setAttribute('aria-label','A publisher and subscriber exchange messages on the same typed topic.');root.append(d);}
  if(step.kind==='terminal-action')root.append(el('p','Terminal '+step.terminal+': press Ctrl+C to stop its running command.','guide-observation'));
  if(step.kind==='commands'){if(step.terminal)root.append(el('strong','Terminal '+step.terminal,'command-terminal'));if(guided&&lessonIndex===0&&environmentHints[step.commands[0]])root.append(el('p',environmentHints[step.commands[0]],'guide-observation'));const group=el('div',undefined,'command-group');for(const command of step.commands){const row=el('div',undefined,'command');const code=el('code',command);const copy=el('button','Copy');let copyTimer;copy.setAttribute('aria-live','polite');copy.onclick=async()=>{clearTimeout(copyTimer);copy.disabled=true;try{await navigator.clipboard.writeText(command);copy.textContent='Copied!';status('Copied command');}catch{copy.textContent='Copy failed';status('Copy failed. Select the command and copy it manually.');}finally{copy.disabled=false;copyTimer=setTimeout(()=>{copy.textContent='Copy';},1800);}};row.append(code,copy);group.append(row);}root.append(group);}
  if(step.kind==='files'){for(const[path,source]of Object.entries(step.items)){
   const details=el('details'),summary=el('summary',`${step.pkg}/${path}`),pre=el('pre',source),actions=el('div',undefined,'example-actions');if(guided)details.open=true;
   if(step.instructions?.[path])root.append(el('p',step.instructions[path],'guide-observation'));
   const base=ROOT+'/src/'+step.pkg,full=base+'/'+path;
   const starter=step.starters?.[path];if(starter){pre.hidden=true;const reveal=el('button','Show reference solution');reveal.onclick=()=>{pre.hidden=!pre.hidden;reveal.textContent=pre.hidden?'Show reference solution':'Hide reference solution';};details.append(reveal);}
   let actionState;const update=()=>{
    const signature=JSON.stringify([lab.fs.exists(base),lab.fs.entries.get(full),lab.fs.entries.get(base+'/package.xml')]);if(signature===actionState)return;actionState=signature;actions.replaceChildren();
    if(!lab.fs.exists(base)){
     actions.append(el('p','Create the package before adding this file.'));
     const jump=el('button','Show package command');jump.onclick=()=>{
      const target=pages.findIndex(page=>page.some(part=>part.kind==='commands'&&part.commands.some(command=>command.startsWith('ros2 pkg create ')&&command.split(/\s+/).includes(step.pkg))));
      if(target>=0){overview=false;guidePositions.set(key,target);renderLesson();$('#lesson').scrollTop=0;}else{$('#prepare-lesson').focus();status('Use Prepare this lesson to supply the prerequisite package.');}
     };actions.append(jump);return;
    }
    const packageState=examplePackageState(lab.fs,base,exampleBuildType(step,language));
    if(packageState.kind==='incompatible'||packageState.kind==='invalid'){
     const notice=el('div',undefined,'guide-observation');notice.dataset.packageGuard=packageState.kind;
     notice.append(el('p',packageState.kind==='invalid'?EXAMPLE_MANIFEST_NOTICE:EXAMPLE_LANGUAGE_NOTICE));
     if(packageState.buildType)notice.append(el('code','package.xml: '+packageState.buildType));
     if(packageState.detail)notice.append(el('pre',packageState.detail));
     actions.append(notice);return;
    }
    if(starter){const skeleton=el('button',lab.fs.exists(full)?'Replace with starter skeleton':'Add starter skeleton');skeleton.onclick=()=>{if(activeFile&&editor.value!==saved){status('Save or revert current edits first.');return;}if(lab.fs.exists(full)&&!confirm(t('Replace this file with the starter skeleton? Existing contents will be lost.')))return;lab.fs.mkdir(full.slice(0,full.lastIndexOf('/')),true);lab.fs.write(full,starter);if(activeFile===full){saved=starter;editor.open(full,starter);fileTitle();}else openFile(full);update();};actions.append(skeleton);}
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
 if(lessonIndex===7&&guided&&position===pages.length-1)root.append(el('p','Exercise walkthrough complete. Keep experimenting here, or return to any lesson. Your course workspace is separate.'));
 if(guided&&pages[position].some(step=>step.kind==='commands'&&!(step.odometryPackage&&odometryBlocked)))root.append(el('p','Run the command, inspect the output, then choose Next. If it keeps running, leave it active unless the lesson asks you to stop it.','guide-hint'));
 if(lessonIndex===6&&(!guided||position===pages.length-1)){const link=el('a','Native handoff');link.className='native-handoff';link.href='./docs/HANDOFF.md';link.target='_blank';link.rel='noopener';root.append(link);}
 if(lessonIndex<7&&(!guided||position===pages.length-1)){const checks=el('div',undefined,'checks');const finish=el('button','Check lesson progress','complete');finish.onclick=()=>{const results=lessonChecks(lab,lessonIndex);checks.replaceChildren(...results.map(r=>el('p',(r.passed?'✓ ':'○ ')+r.label)));if(results.every(r=>r.passed)){progress.add(lessonIndex);updateProgress();$('#save-session').click();status('Lesson checks passed.');
 const onward=el('div',undefined,'lesson-onward');onward.setAttribute('role','status');
 onward.append(el('strong',progress.size===7?'Course complete!':lessonIndex===6?'Final lesson complete.':'Lesson complete!'));
 if(lessonIndex===6)onward.append(el('p',progress.size===7?'Continue with the optional exercises to practise what you learned.':'You can explore the exercises now, or return to finish the earlier lessons.'));
 const nextLesson=lessonIndex+1;const next=el('button',lessonIndex===6?'Explore exercises':`Move to lesson ${nextLesson+1}`);next.id='next-lesson';
 next.onclick=()=>{overview=false;changeLesson(nextLesson);$('#lesson').scrollTop=0;$('#lesson-heading').setAttribute('tabindex','-1');$('#lesson-heading').focus({preventScroll:true});status('');};
 onward.append(next);checks.append(onward);onward.scrollIntoView({block:'nearest',behavior:'instant'});
 }else status('Keep exploring: the checklist shows what remains.');};root.append(finish,checks);}

}
async function start(){const stored=await restoreCompiledModules(await loadSession());const [{CodeEditor},{TerminalView}]=await Promise.all([import('./vendor/ui.js'),import('./terminal-view.js')]);window.TerminalView=TerminalView;
 $('#app').innerHTML=`<aside><div class="eyebrow">LESSONS</div><nav id="nav" aria-label="Lessons"></nav><div class="eyebrow exercise-heading">EXERCISES</div><nav id="exercise-nav" aria-label="Exercises"></nav><div id="progress">0 / 7 completed</div><label>Learning path<select id="language"><option value="python">Python</option><option value="cpp">C++</option></select></label><p class="disclosure">Designed for the ROS 2 exercise session at Diepenbeek.</p><button id="prepare-lesson">Prepare this lesson</button><button id="reset-lesson">Restart lesson</button><button id="reset">Reset workspace</button><button id="save-session">Save session</button><p id="session-state" role="status"></p><button id="export">Export source workspace</button></aside><section class="workarea"><div class="workspace-top"><h1 id="lesson-heading"></h1><span id="graph-state">0 nodes · 0 topics</span><button id="restore-layout">Restore layout</button></div><section id="playground-stage" hidden></section><section id="tf-stage" hidden></section><div id="workspace"><article id="lesson"></article><section id="files"><div class="panel-title">Workspace files <button id="new-file">New file</button></div><div class="editor-layout"><div id="file-tree"></div><div class="editor-pane"><div class="editor-title"><span id="active-file">Choose a file</span><button id="save">Save</button><button id="revert">Revert</button></div><div class="editor-help">Suggestions: Ctrl+Space · Tab accepts · Esc closes</div><div id="editor"></div></div></div></section></div><div class="terminal-toolbar"><strong>Terminals</strong><span>Shared files & graph · separate environments</span><button id="add-terminal">+ Terminal</button></div><div id="terminals"></div><footer id="status" role="status"></footer></section>`;
 $('#app').className='lab';initLayout();lab=new Lab({onChange:refresh,onOutput:(id,s)=>{const match=/(?:controller\.cpp|\.py)["']?[:,](?: line )?(\d+)/.exec(s);if(match&&activeFile)editor.diagnostic(Number(match[1]),s);}});editor=new CodeEditor($('#editor'),fileTitle,save,()=>lab.workspace.registry.definitions,()=>({packages:[...BASE_PACKAGES,...lab.workspace.packages()],files:activeFile?Object.keys(lab.fs.filesUnder(activeFile.slice(0,activeFile.lastIndexOf('/')))):[]}));document.addEventListener('lab-diagnostic',event=>{if(!activeFile)return;const text=event.detail.text;const cpp=/([\w./-]+\.cpp):(\d+):/.exec(text),python=/File ["']([^"']+\.py)["'], line (\d+)/.exec(text),m=cpp??python;if(m&&(activeFile.endsWith(m[1])||m[1]==='controller.cpp'))editor.diagnostic(Number(m[2]),text);});
 LESSON_NAMES.concat('Robotics Playground · optional','Free Lab · experiment freely',TF_TITLE).forEach((name,index)=>{const b=el('button',(index<7?`${index+1}  `:'↗  ')+name);b.dataset.index=index;b.onclick=()=>changeLesson(index);$(index<7?'#nav':'#exercise-nav').append(b);});
 $('#language').onchange=e=>{const requested=e.target.value,states=lessonIndex===9?['tf_lab','odom_lab'].map(name=>odometryPackageState(lab.fs,requested,name)):activeExercise==='odometry'?[odometryPackageState(lab.fs,requested)]:[],state=states.find(odometryPackageBlocked);if(state){e.target.value=language;odometrySwitchNotice=state;renderLesson();status('Learning path unchanged. Your files and unsaved edits are preserved.');return;}if(lessonIndex===9){
   const pagesFor=lang=>guidePages(lesson(lessonIndex,lang).filter(step=>step.kind!=='playground')).slice(0,-1);
   const position=guidePositions.get(lessonIndex+':'+language)||0;
   const current=playgroundSections(pagesFor(language)).find(item=>position>=item.start&&position<=item.end);
   const target=playgroundSections(pagesFor(requested)).find(item=>item.id===current?.id);
   if(target)guidePositions.set(lessonIndex+':'+requested,Math.min(target.end,target.start+position-current.start));
  }else if(lessonIndex<7){guidePositions.set(lessonIndex+':'+requested,correspondingGuidePosition(lesson(lessonIndex,language),lesson(lessonIndex,requested),guidePositions.get(lessonIndex+':'+language)||0));}language=requested;odometrySwitchNotice=null;renderLesson();$('#save-session').click();};$('#save').onclick=save;$('#revert').onclick=()=>{if(activeFile){saved=lab.fs.read(activeFile);editor.open(activeFile,saved);fileTitle();}};$('#new-file').onclick=()=>{const p=prompt(t('New file path (absolute or relative to ~/ros2_ws):'),'src/');if(!p)return;try{const path=p.startsWith('/')?p:ROOT+'/'+p;lab.fs.touch(path);openFile(path);}catch(e){status(e.message);}};$('#add-terminal').onclick=()=>addTerminal();
 $('#reset').onclick=()=>{if(!confirm(t('Delete the virtual workspace and stop all processes?')))return;odometrySwitchNotice=null;for(const v of views)v.destroy();views=[];playground?.stop();playground=null;tfPlayground?.stop();tfVisualizer?.destroy();tfVisualizer=null;tfPlayground=null;lab.reset();lab=new Lab({onChange:refresh});lessonSnapshots=new Map();for(const key of [...guidePositions.keys()])if(sessionScope(lessonIndex)===sessionScope(Number(key.split(':')[0])))guidePositions.delete(key);if(lessonIndex<7)progress.clear();if(lessonIndex===8)lab.fs.mkdir(ROOT+'/src',true);updateProgress();activeFile=null;saved='';editor.open('','');fileTitle();addTerminal();renderLesson();refresh();status('Workspace reset.');$('#save-session').click();};
 $('#reset-lesson').onclick=()=>{if(!confirm(t('Restore files and environments to when you first opened this lesson? Current lesson edits will be replaced.')))return;playground?.stop();playground=null;tfPlayground?.stop();tfVisualizer?.destroy();tfVisualizer=null;tfPlayground=null;restoreLesson(lab,lessonSnapshots.get(lessonIndex));activeFile=null;saved='';editor.open('','');fileTitle();for(const v of views){v.output('Lesson restored.');v.prompt();}guidePositions.delete(lessonIndex+':'+language);progress.delete(lessonIndex);updateProgress();renderLesson();status('Restored this lesson’s starting files and environments.');$('#save-session').click();};

 $('#prepare-lesson').onclick=async()=>{
  if(preparing)return;
  if(views.some(v=>v.terminal.busy||v.executing||v.line)||activeFile&&editor.value!==saved){status('Stop running commands and save edits before preparing a lesson.');return;}
  preparing=true;const controls=[...document.querySelectorAll('#nav button,#exercise-nav button,#language,#reset,#reset-lesson,#prepare-lesson,#add-terminal')];controls.forEach(node=>node.disabled=true);
  status('Preparing prerequisite files and builds. Existing files are kept.');
  try{await prepareLesson(lab,lessonIndex,language,line=>{status(line);views[0]?.output(line);},{exercise:activeExercise});lessonSnapshots.set(lessonIndex,snapshotLesson(lab));if(lessonIndex!==7&&lessonIndex!==9)guidePositions.delete(lessonIndex+':'+language);for(const view of views)view.redraw();renderLesson();refresh();status(activeExercise==='odometry'?'Odometry workspace ready. Follow the package and file steps below.':'Lesson ready. Prerequisites are available; earlier lessons were not marked complete.');}
  catch(error){status(error.message);}finally{preparing=false;controls.forEach(node=>node.disabled=false);}
 };
 $('#export').onclick=async()=>{try{const{downloadWorkspace}=await import('./export.js');downloadWorkspace(lab.fs);lab.exported=true;status('Source workspace exported. Native compatibility applies to validated reference examples.');}catch(e){status(e.message);}};
 if(stored){
  for(const [scope,record]of savedSlots(stored))sessionSlots.set(scope,{record});freeRobot=!!stored.ui.freeRobot;
  const terminals=restoreSession(lab,stored);lessonIndex=stored.ui.lessonIndex;language=stored.ui.language;progress=new Set(stored.ui.progress);for(const [key,value]of stored.ui.guidePositions)guidePositions.set(key,value);
  $('#language').value=language;updateProgress();
  for(const terminal of terminals)addTerminal(terminal);if(!terminals.length)addTerminal();
  if(stored.ui.activeFile&&lab.fs.exists(stored.ui.activeFile)){openFile(stored.ui.activeFile);if(stored.ui.draft!==null){editor.open(activeFile,stored.ui.draft);fileTitle();}}
  status('Saved session restored. Start your nodes again when needed.');
 }else addTerminal();
 const restoredNavigation=navigation.load({lessonIndex,language,guidePositions:[...guidePositions]},stored?.savedAt??0);
 lessonIndex=restoredNavigation.lessonIndex;language=restoredNavigation.language;guidePositions.clear();for(const [key,value]of restoredNavigation.guidePositions)guidePositions.set(key,value);$('#language').value=language;
 let signature='',saving=false,savePending=false;
 const persist=async(force=false)=>{
  if(preparing)return;const ui=currentSessionUI();navigation.save(ui);if(saving){savePending||=force;return;}
  const current=JSON.stringify([lab.fs.revision,ui,[...lab.terminals.values()].map(t=>[t.cwd,t.env,t.vars,[...t.overlays],t.history,t.completedCommands]),!!lab.exported]);
  if(!force&&current===signature)return;
  saving=true;try{const record=captureSession(lab,ui);record.slots=Object.fromEntries([...sessionSlots].map(([scope,state])=>[scope,state.record??captureSession(state.lab,state.ui)]));await saveSession(record);signature=current;$('#session-state').textContent='Saved in this browser';}catch(error){$('#session-state').textContent='Session could not be saved. Export your workspace to keep a copy.';console.error(error);}finally{saving=false;if(savePending){savePending=false;persist(true);}}
 };
 $('#save-session').onclick=()=>persist(true);setInterval(()=>persist(),1500);document.addEventListener('visibilitychange',()=>{if(document.hidden)persist();});
 renderLesson();refresh();if(new URLSearchParams(location.search).get('unit')==='tf')changeLesson(9);window.addEventListener('beforeunload',e=>{if(activeFile&&editor.value!==saved||views.some(v=>v.nano?.buffer.dirty)){e.preventDefault();e.returnValue='';}});
}
$('#start').onclick=async()=>{document.documentElement.classList.add('workspace-loading');$('#start').disabled=true;try{await start();await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));}catch(e){console.error(e);$('#app').append(el('p',e.message));}finally{document.documentElement.classList.remove('workspace-loading');}};
initPreferences();
