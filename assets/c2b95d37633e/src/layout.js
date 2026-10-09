import {t} from './i18n.js';

export function initLayout(){
 const workspace=document.querySelector('#workspace');
 const storageKey='ros2lab.layout';
 let values={};
 try{const saved=JSON.parse(localStorage.getItem(storageKey)||'{}');for(const key of ['split','height','streams'])if(Number.isFinite(saved[key]))values[key]=saved[key];}catch{}
 const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
 const save=()=>{try{localStorage.setItem(storageKey,JSON.stringify(values));}catch{}};
 const apply=()=>{
  if(values.split!==undefined){values.split=clamp(values.split,25,70);workspace.style.setProperty('--lesson-share',values.split+'fr');workspace.style.setProperty('--editor-share',(100-values.split)+'fr');}
  if(values.height!==undefined){values.height=clamp(values.height,280,1000);workspace.style.setProperty('--workspace-height',values.height+'px');}
  if(values.streams!==undefined){values.streams=clamp(values.streams,160,800);document.querySelector('#playground-stage').style.setProperty('--stream-height',values.streams+'px');}
  streamHandle.setAttribute('aria-valuenow',String(Math.round(values.streams??200)));
  widthHandle.setAttribute('aria-valuenow',String(Math.round(values.split??43)));
  heightHandle.setAttribute('aria-valuenow',String(Math.round(values.height??workspace.getBoundingClientRect().height)));
 };
 function handle(id,label,orientation,min,max){
  const node=document.createElement('div');node.id=id;node.className='layout-divider '+orientation;node.tabIndex=0;
  node.dataset.layoutLabel=label;node.setAttribute('role','separator');node.setAttribute('aria-label',t(label));node.title=t(label);node.setAttribute('aria-orientation',orientation);node.setAttribute('aria-valuemin',min);node.setAttribute('aria-valuemax',max);return node;
 }
 const widthHandle=handle('resize-columns','Resize lesson and editor','vertical',25,70);
 workspace.querySelector('#lesson').after(widthHandle);
 const heightHandle=handle('resize-workspace','Resize workspace height','horizontal',280,1000);workspace.after(heightHandle);
 const streamHandle=handle('resize-streams','Resize playground views','horizontal',160,800);document.querySelector('#playground-stage').after(streamHandle);
 function bind(node,key,coordinate,measure){
  let drag;
  node.addEventListener('pointerdown',event=>{if(event.button!==0)return;event.preventDefault();node.focus();drag={origin:event[coordinate],value:measure()};node.setPointerCapture(event.pointerId);document.body.classList.add('resizing-layout');});
  node.addEventListener('pointermove',event=>{if(!drag)return;const delta=event[coordinate]-drag.origin;values[key]=drag.value+(key==='split'?100*delta/(workspace.clientWidth-12):delta);apply();});
  const finish=()=>{drag=null;document.body.classList.remove('resizing-layout');save();};
  node.addEventListener('lostpointercapture',finish);node.addEventListener('pointerup',finish);node.addEventListener('pointercancel',finish);
  node.addEventListener('keydown',event=>{const negative=key==='split'?'ArrowLeft':'ArrowUp',positive=key==='split'?'ArrowRight':'ArrowDown';if(![negative,positive].includes(event.key))return;event.preventDefault();values[key]=measure()+(event.key===negative?-1:1)*(key==='split'?2:20);apply();save();});
 }
 bind(streamHandle,'streams','clientY',()=>values.streams??(matchMedia('(max-width:700px)').matches?180:200));
 bind(widthHandle,'split','clientX',()=>values.split??43);
 bind(heightHandle,'height','clientY',()=>workspace.getBoundingClientRect().height);
 document.querySelector('#restore-layout').onclick=()=>{
  values={};workspace.style.removeProperty('--lesson-share');workspace.style.removeProperty('--editor-share');workspace.style.removeProperty('--workspace-height');
  for(const node of document.querySelectorAll('.terminal-screen,#lesson,#files')){node.style.removeProperty('height');node.style.removeProperty('width');}
  document.querySelector('#playground-stage').style.removeProperty('--stream-height');
  for(const button of document.querySelectorAll('.stream-expand')){button.closest('figure').classList.remove('expanded');button.textContent='Enlarge';button.setAttribute('aria-expanded','false');}
  save();apply();
 };
 apply();
}
