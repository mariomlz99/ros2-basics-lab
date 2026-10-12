import {t} from './i18n.js';

export function initFileTreeLayout(container,key){
 const tree=container.querySelector('#file-tree'),handle=document.createElement('div');
 handle.id='resize-file-tree';handle.className='layout-divider vertical';handle.tabIndex=0;
 handle.dataset.layoutLabel='Resize file tree and code editor';handle.title=t(handle.dataset.layoutLabel);
 for(const [name,value]of Object.entries({role:'separator','aria-label':t(handle.dataset.layoutLabel),'aria-orientation':'vertical','aria-controls':'file-tree editor'}))handle.setAttribute(name,value);
 tree.after(handle);
 let preferred=null,drag=null;
 try{const saved=JSON.parse(localStorage.getItem(key));if(typeof saved==='number'&&Number.isFinite(saved))preferred=saved;}catch{}
 const limits=()=>{const available=Math.max(0,container.clientWidth-12),min=Math.min(90,available/3);return {min,max:Math.max(min,available-Math.min(160,available*.55))};};
 const apply=()=>{
  const {min,max}=limits(),initial=matchMedia('(max-width:650px)').matches?115:160;
  const width=Math.max(min,Math.min(max,preferred??initial));container.style.setProperty('--file-tree-width',width+'px');
  for(const [name,value]of Object.entries({'aria-valuemin':min,'aria-valuemax':max,'aria-valuenow':width}))handle.setAttribute(name,String(Math.round(value)));
 };
 const save=()=>{try{if(preferred===null)localStorage.removeItem(key);else localStorage.setItem(key,JSON.stringify(preferred));}catch{}};
 const adjust=width=>{const {min,max}=limits();preferred=Math.max(min,Math.min(max,width));apply();};
 handle.onpointerdown=event=>{if(event.button!==0)return;event.preventDefault();handle.focus();drag={x:event.clientX,width:tree.getBoundingClientRect().width};handle.setPointerCapture(event.pointerId);document.body.classList.add('resizing-layout');};
 handle.onpointermove=event=>{if(drag)adjust(drag.width+event.clientX-drag.x);};
 const finish=()=>{if(!drag)return;drag=null;document.body.classList.remove('resizing-layout');save();};
 handle.onpointerup=finish;handle.onpointercancel=finish;handle.onlostpointercapture=finish;
 handle.onkeydown=event=>{if(!['ArrowLeft','ArrowRight','Home'].includes(event.key))return;event.preventDefault();if(event.key==='Home')preferred=null;else adjust(tree.getBoundingClientRect().width+(event.key==='ArrowLeft'?-1:1)*(event.shiftKey?40:10));apply();save();};
 handle.ondblclick=()=>{preferred=null;apply();save();};
 const resize=new ResizeObserver(apply);resize.observe(container);apply();
 return {reset(){preferred=null;apply();save();},destroy(){resize.disconnect();handle.remove();}};
}
