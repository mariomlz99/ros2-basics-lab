import {OdometryTrace} from './odometry-trace.js';
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
const svg=(tag,attrs)=>{const n=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [k,v]of Object.entries(attrs))n.setAttribute(k,v);return n;};
const number=n=>(Math.abs(n)<.0005?0:n).toFixed(3);

export class OdometryView {
 constructor(container,runtime,playground){
  Object.assign(this,{container,runtime,playground,trace:new OdometryTrace(),cursor:runtime.sampleCounter,wasRunning:false});
  container.className='odom-notebook';
  container.innerHTML='<div class="odom-heading"><div><small>ODOMETRY NOTEBOOK</small><h2>How far is “back where you started”?</h2><p>One published pose. Two ways to describe motion.</p></div><button class="odom-mark">Mark a new start</button></div><div class="odom-grid"><figure><svg class="odom-path" viewBox="0 0 440 240" role="img" aria-label="Recorded odometry path"></svg><figcaption>Solid: sampled path · Dashed: displacement</figcaption></figure><div class="odom-readings"><dl></dl><p class="odom-status" role="status"></p></div></div><p class="odom-note">Sampled path length is approximate. This simulator publishes ideal pose and zero covariance; real odometry can drift.</p>';
  container.querySelector('svg').dataset.i18nLabel='Recorded odometry path';
  container.querySelector('.odom-mark').onclick=()=>{this.gap=false;this.trace.mark();this.render();};
  this.render();
 }
 reset(){this.gap=false;this.trace.reset();this.cursor=this.runtime.sampleCounter;this.render();}
 update(){
  const running=!!(this.playground.running??this.playground.timer);
  if(!running){if(this.wasRunning){this.wasRunning=false;this.render();}return;}
  let changed=!this.wasRunning;
  // Do not bridge a stopped simulator, a changed frame, or discarded history.
  if(!this.wasRunning){this.trace.reset();this.gap=false;this.wasRunning=true;}
  const entries=[...this.runtime.samples.entries()];
  if(this.trace.latest&&entries.length&&this.cursor<entries[0][0]-1){this.trace.reset();this.gap=true;}
  for(const [id,sample]of entries){
   if(id<=this.cursor)continue;
   if(sample.topic==='/odom'&&sample.type==='nav_msgs/msg/Odometry'&&sample.publisher==='/playground')changed=this.trace.add(sample.message)||changed;
  }
  this.cursor=this.runtime.sampleCounter;
  if(changed)this.render();
 }
 render(){
  const {trace,container}=this,s=trace.latest,world=trace.worldVelocity;
  const readings=container.querySelector('dl');readings.replaceChildren();
  const metric=(key,label,value)=>{const item=el('div');item.append(el('dt',label),el('dd',value));item.lastChild.dataset.odom=key;readings.append(item);};
  metric('distance','Path travelled',s?number(trace.distance)+' m':'—');
  metric('displacement','Distance from start',s?number(trace.displacement)+' m':'—');
  metric('pose','Pose · '+(s?.frame??'odom'),s?`x ${number(s.x)} · y ${number(s.y)} m`:'—');
  metric('yaw','Heading',s?`${number(s.yaw)} rad · ${(s.yaw*180/Math.PI).toFixed(1)}°`:'—');
  metric('body','Velocity · '+(s?.child??'base_link'),s?`x ${number(s.vx)} · y ${number(s.vy)} m/s`:'—');
  metric('world','Velocity · '+(s?.frame??'odom'),s?`x ${number(world.x)} · y ${number(world.y)} m/s`:'—');
  container.querySelector('.odom-mark').disabled=!s||!this.wasRunning;
  const status=!s?'Start the simulator to record /odom.':!this.wasRunning?'Paused · last recorded sample':this.gap?'New recording after a sample gap':trace.trimmed?'Live /odom · showing the latest 600 path points':'Live /odom · recording published poses';
  // Keep the live region stable between state changes. Compare the source
  // status, since localization may have translated the displayed text.
  if(this.statusText!==status){this.statusText=status;container.querySelector('.odom-status').textContent=status;}
  this.draw();
 }
 draw(){
  const view=this.container.querySelector('svg');view.replaceChildren();const t=this.trace,s=t.latest;
  if(!s)return;
  const points=[t.origin,...t.points],xs=points.map(p=>p.x),ys=points.map(p=>p.y);
  const minX=Math.min(...xs)-.25,maxX=Math.max(...xs)+.25,minY=Math.min(...ys)-.25,maxY=Math.max(...ys)+.25;
  const scale=Math.min(360/Math.max(2,maxX-minX),160/Math.max(1,maxY-minY));
  if(!Number.isFinite(scale)||scale<=0)return;
  const x=p=>220+(p.x-(minX/2+maxX/2))*scale,y=p=>120-(p.y-(minY/2+maxY/2))*scale;
  const add=(tag,attrs)=>{const n=svg(tag,attrs);view.append(n);return n;};
  for(let i=0;i<=6;i++)add('line',{x1:40+i*60,y1:28,x2:40+i*60,y2:212,class:'odom-grid-line'});
  add('polyline',{points:t.points.map(p=>`${x(p)},${y(p)}`).join(' '),class:'odom-trail'});
  add('line',{x1:x(t.origin),y1:y(t.origin),x2:x(s),y2:y(s),class:'odom-displacement'});
  add('circle',{cx:x(t.origin),cy:y(t.origin),r:5,class:'odom-start'});
  add('path',{d:'M 12 0 L -8 -7 L -4 0 L -8 7 Z',transform:`translate(${x(s)} ${y(s)}) rotate(${-s.yaw*180/Math.PI})`,class:'odom-robot'});
  add('text',{x:12,y:228,class:'odom-axis-label'}).textContent='odom · +x → · +y ↑';
 }
 destroy(){this.container.replaceChildren();}
}
