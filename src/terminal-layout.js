// Column widths are local preferences; terminals keep their own running state.
export function initTerminalLayout(container){
 const key='ros2lab.terminalWidths';let saved={},cards=[],columns=0,weights=[],handles=[];
 try{saved=JSON.parse(localStorage.getItem(key)||'{}');}catch{}
 const store=()=>{saved[columns]=weights;try{localStorage.setItem(key,JSON.stringify(saved));}catch{}};
 const apply=()=>{
  container.style.gridTemplateColumns=weights.map(w=>`minmax(0, ${w}fr)`).join(' ');
  const width=container.clientWidth,gap=12,available=width-gap*(columns-1);let sum=0;
  handles.forEach((handle,i)=>{sum+=weights[i];handle.style.left=(sum*available+i*gap)+'px';handle.setAttribute('aria-valuenow',String(Math.round(weights[i]/(weights[i]+weights[i+1])*100)));});
 };
 const adjust=(index,left,total)=>{const available=container.clientWidth-12*(columns-1),minimum=Math.min(180/available,total/3);weights[index]=Math.max(minimum,Math.min(total-minimum,left));weights[index+1]=total-weights[index];apply();};
 const refresh=()=>{
  const next=[...container.children].filter(node=>node.classList.contains('terminal-card')),count=Math.min(next.length,Math.max(1,Math.floor((container.clientWidth+12)/312)));
  if(count!==columns||next.length!==cards.length||next.some((card,i)=>card!==cards[i])){
   cards=next;columns=count;for(const handle of handles)handle.remove();handles=[];
   const stored=saved[columns];weights=Array.isArray(stored)&&stored.length===columns&&stored.every(w=>Number.isFinite(w)&&w>0)?stored.slice():Array(columns).fill(1/columns);const total=weights.reduce((a,b)=>a+b,0);weights=weights.map(w=>w/total);
   for(let i=0;i<columns-1;i++){
    const handle=document.createElement('div');handle.className='terminal-column-divider';handle.tabIndex=0;handle.setAttribute('role','separator');handle.setAttribute('aria-orientation','vertical');handle.setAttribute('aria-label','Resize terminal columns '+(i+1)+' and '+(i+2));handle.setAttribute('aria-valuemin','0');handle.setAttribute('aria-valuemax','100');handle.title='Drag left/right to resize terminals; use arrow keys when focused';let drag;
    handle.onpointerdown=event=>{if(event.button!==0)return;event.preventDefault();handle.focus();drag={x:event.clientX,left:weights[i],total:weights[i]+weights[i+1]};handle.setPointerCapture(event.pointerId);document.body.classList.add('resizing-layout');};
    handle.onpointermove=event=>{if(drag)adjust(i,drag.left+(event.clientX-drag.x)/(container.clientWidth-12*(columns-1)),drag.total);};
    const finish=()=>{if(!drag)return;drag=null;document.body.classList.remove('resizing-layout');store();};handle.onpointerup=finish;handle.onpointercancel=finish;handle.onlostpointercapture=finish;
    handle.onkeydown=event=>{if(!['ArrowLeft','ArrowRight','Home'].includes(event.key))return;event.preventDefault();const total=weights[i]+weights[i+1];adjust(i,event.key==='Home'?total/2:weights[i]+(event.key==='ArrowLeft'?-.02:.02),total);store();};
    container.append(handle);handles.push(handle);
   }
  }apply();
 };
 const mutations=new MutationObserver(refresh);mutations.observe(container,{childList:true});const resize=new ResizeObserver(refresh);resize.observe(container);refresh();
 return {reset(){saved={};weights=Array(columns).fill(1/columns);store();apply();},destroy(){mutations.disconnect();resize.disconnect();handles.forEach(handle=>handle.remove());}};
}
