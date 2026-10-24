import {OdometryView} from '../playground/odometry-view.js';
import {tfViewModel,tfTreeRows} from './view-model.js';
import {quaternionYaw} from '../runtime/tf.js';
import {TF_TARGET} from './target.js';
import {ROBOT_RADIUS,WHEELS} from '../playground/sensors.js';

const node=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
const svg=(tag,attrs={})=>{const n=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [key,value]of Object.entries(attrs))n.setAttribute(key,value);return n;};
const number=value=>(Math.abs(value)<.0005?0:value).toFixed(3);

export class TFVisualizer {
 constructor(container,runtime,playground){
  Object.assign(this,{container,runtime,playground,reference:'odom',frame:'base_link',targetVisible:false,mountView:false});
  container.className='tf-visualizer';container.setAttribute('aria-label','Live coordinate frames');
  container.innerHTML='<div class="tf-heading"><div><strong>One robot. Several points of view.</strong><p><b>Frame</b>: an origin and axes. <b>Transform</b>: a relationship between frames. <b>TF tree</b>: their connected hierarchy.</p></div><span class="tf-live" role="status"></span></div><div class="tf-views"><section class="tf-tree-panel"><h2>TF tree</h2><div class="tf-tree" role="group" aria-label="Frame hierarchy"></div><p class="tf-key">Solid: dynamic · Dashed: static</p></section><section class="tf-space-panel"><div class="tf-space-heading"><h2>Spatial view</h2><button class="tf-zoom" aria-pressed="false">Mount detail</button></div><svg class="tf-space" viewBox="0 0 600 310" role="img" aria-label="Top view of robot coordinate frames"></svg><p class="tf-space-caption">Top view · <span class="tf-x">x → red</span> · <span class="tf-y">y → green</span> · metres</p></section><section class="tf-inspector"><h2>Transform inspector</h2><div class="tf-pair"></div><p class="tf-direction"></p><dl class="tf-values"></dl><p class="tf-rotation-note"></p><details class="tf-ros"><summary>ROS message details</summary><p>ROS stores orientation as a quaternion. This lesson uses yaw for planar frames.</p><pre></pre></details></section></div><div class="tf-comparison" aria-label="Compare dynamic and static transforms"></div><div class="tf-target" hidden></div><div class="tf-controls"></div>';
  for(const element of [container,...container.querySelectorAll('[aria-label]')])element.dataset.i18nLabel=element.getAttribute('aria-label');
  this.tree=container.querySelector('.tf-tree');this.space=container.querySelector('.tf-space');
  const pair=container.querySelector('.tf-pair');
  for(const [key,title]of [['reference','Reference · target'],['frame','Frame · source']]){
   const label=node('label',title),select=node('select');select.setAttribute('aria-label',title);select.dataset.i18nLabel=title;select.id='tf-'+key;
   select.onchange=()=>{this[key]=select.value;this.update(true);};label.append(select);pair.append(label);this[key+'Select']=select;
  }
  container.querySelector('.tf-zoom').onclick=()=>{this.mountView=!this.mountView;this.update(true);};
  const controls=container.querySelector('.tf-controls');
  const action=(id,label,fn)=>{const button=node('button',label);button.id=id;button.onclick=()=>{fn();this.update(true);};controls.append(button);return button;};
  action('tf-start','Start simulator',()=>{try{playground.start();this.failure='';}catch(e){this.failure=e.message;}});
  action('tf-forward','Move forward',()=>playground.robot.command(.25,0));
  action('tf-turn','Turn left',()=>playground.robot.command(0,.5));
  action('tf-halt','Stop motion',()=>playground.robot.command(0,0));
  action('tf-reset-pose','Reset pose',()=>{playground.robot.command(0,0);playground.resetPose();this.odometry.reset();runtime.invalidateTfEvidence();});
  action('tf-stop','Stop simulator',()=>{playground.stop();runtime.invalidateTfEvidence();});
  controls.append(node('span','Movement lasts up to 2 seconds.','tf-motion-help'));
  const notebook=node('section');container.append(notebook);this.odometry=new OdometryView(notebook,runtime,playground);notebook.hidden=true;
  this.update(true);
 }
 setExercise(id){if(this.exercise===id)return;this.exercise=id;this.targetVisible=id==='point';this.odometry.container.hidden=id!=='odometry';if(this.targetVisible){this.reference='base_link';this.frame='odom';this.mountView=false;}this.update(true);}
 update(force=false){
  this.odometry?.update();
  const tf=this.runtime.tf,revision=tf.snapshot().revision;
  if(!force&&this.revision===revision)return;
  this.revision=revision;
  const names=tf.frames();
  if(names.length&&!names.includes(this.reference))this.reference=names.includes('odom')?'odom':names[0];
  if(names.length&&!names.includes(this.frame))this.frame=names.includes('base_link')?'base_link':names[0];
  const model=tfViewModel(tf,this.reference,this.frame);this.model=model;
  const shape=JSON.stringify(model.edges.map(e=>[e.parent,e.child,e.static]));
  if(shape!==this.shape){
   this.shape=shape;this.tree.replaceChildren();
   for(const row of tfTreeRows(model.edges,names)){
    const button=node('button',undefined,'tf-node');button.dataset.frame=row.name;button.style.setProperty('--depth',row.depth);
    button.append(node('code',row.name),node('small',row.edge?(row.edge.static?'static':'dynamic'):'root'));
    button.classList.toggle('static',!!row.edge?.static);
    button.onclick=()=>{this.reference=row.edge?.parent??row.name;this.frame=row.name;this.mountView=!!row.edge&&row.edge.parent!=='odom';this.update(true);};
    this.tree.append(button);
   }
   for(const select of [this.referenceSelect,this.frameSelect])select.replaceChildren(...names.map(name=>{const option=node('option',name);option.value=name;option.setAttribute('translate','no');return option;}));
  }
  for(const button of this.tree.querySelectorAll('button')){
   const selected=button.dataset.frame===this.frame,parent=button.dataset.frame===this.reference;
   button.setAttribute('aria-pressed',String(selected));button.classList.toggle('tf-parent',parent&&!selected);
  }
  this.referenceSelect.value=this.reference;this.frameSelect.value=this.frame;
  this.referenceSelect.disabled=this.frameSelect.disabled=!names.length;
  this.container.querySelector('.tf-live').textContent=this.failure||(!names.length?'Simulator stopped · start to see live TF':'Live TF · latest transforms');
  this.container.querySelector('#tf-start').disabled=!!this.playground.running;
  for(const id of ['tf-forward','tf-turn','tf-halt','tf-stop'])this.container.querySelector('#'+id).disabled=!this.playground.running;
  this.container.querySelector('.tf-zoom').setAttribute('aria-pressed',String(this.mountView));
  this.container.querySelector('.tf-zoom').textContent=this.mountView?'Room view':'Mount detail';
  this.container.querySelector('.tf-direction').textContent=names.length?`Pose of ${this.frame} in ${this.reference}.`:'Start the simulator to populate the tree.';
  const values=this.container.querySelector('.tf-values');values.replaceChildren();
  if(model.selected){
   const transform=model.selected.transform;
   const planar=Math.abs(transform.rotation.x)<1e-8&&Math.abs(transform.rotation.y)<1e-8;
   for(const [label,value]of [['x',number(transform.translation.x)+' m'],['y',number(transform.translation.y)+' m'],['yaw',planar?number(quaternionYaw(transform.rotation))+' rad':'3D orientation']])values.append(node('dt',label),node('dd',value));
   this.container.querySelector('.tf-rotation-note').textContent=planar?'Yaw is the turn about the upward axis.':'Optical/wheel axes leave this top view; projected axes may appear as a dot.';
   const t=transform.translation,q=transform.rotation;
   this.container.querySelector('.tf-ros pre').textContent=`header.frame_id: ${this.reference}\nchild_frame_id: ${this.frame}\ntranslation.x: ${number(t.x)}\ntranslation.y: ${number(t.y)}\ntranslation.z: ${number(t.z)}\nrotation.x: ${number(q.x)}\nrotation.y: ${number(q.y)}\nrotation.z: ${number(q.z)}\nrotation.w: ${number(q.w)}`;
  }else{values.append(node('dd',model.error||'No transforms available.'));this.container.querySelector('.tf-rotation-note').textContent='';this.container.querySelector('.tf-ros pre').textContent='';}
  const comparison=this.container.querySelector('.tf-comparison');comparison.replaceChildren();
  for(const [from,to,label]of [['odom','base_link','Dynamic · robot pose'],['base_link','laser_link','Static · sensor mount']]){
   const item=node('div');item.append(node('strong',label),node('code',from+' → '+to));
   try{const t=tf.lookup(from,to).transform;item.append(node('span',`x ${number(t.translation.x)} · y ${number(t.translation.y)} m · yaw ${number(quaternionYaw(t.rotation))} rad`));}catch{item.append(node('span','Waiting for simulator'));}
   comparison.append(item);
  }
  const target=this.container.querySelector('.tf-target');target.hidden=!this.targetVisible;target.replaceChildren();
  if(this.targetVisible){target.append(node('strong','Same target · two coordinate descriptions'),node('span',`odom: x ${TF_TARGET.x.toFixed(3)}, y ${TF_TARGET.y.toFixed(3)} m`));if(model.relativeTarget)target.append(node('span',`base_link: x ${number(model.relativeTarget.point.x)}, y ${number(model.relativeTarget.point.y)} m`));}
  this.draw(model);
 }
 draw(model){
  this.space.replaceChildren();
  const add=(tag,attrs,text)=>{const n=svg(tag,attrs);if(text!==undefined)n.textContent=text;this.space.append(n);return n;};
  if(!model.poses.length){add('text',{x:300,y:145,'text-anchor':'middle',class:'tf-svg-empty'},'Start the simulator to see the frame tree.');return;}
  const poses=new Map(model.poses.map(p=>[p.name,p]));
  const a=poses.get(this.reference),b=poses.get(this.frame),robot=poses.get('base_link');
  const focus=this.mountView&&a&&b?[a.origin,b.origin]:model.poses.map(p=>p.origin);
  const showTarget=this.targetVisible&&model.root==='odom'&&!!model.relativeTarget;
  if(showTarget)focus.push(TF_TARGET);
  const minX=Math.min(...focus.map(p=>p.x)),maxX=Math.max(...focus.map(p=>p.x)),minY=Math.min(...focus.map(p=>p.y)),maxY=Math.max(...focus.map(p=>p.y));
  const span=Math.max(.65,(maxX-minX)*1.5,(maxY-minY)*2.1);
  // Keep the world origin anchored on screen. Only mount detail follows the
  // selected pair; an automatically expanding room scale never pans odom.
  const scale=this.mountView?250/span:Math.min(160,180/Math.max(.1,-minX+.35),370/Math.max(.1,maxX+.35),180/Math.max(.1,maxY+.35),85/Math.max(.1,-minY+.35));
  const centre=this.mountView?{x:(minX+maxX)/2,y:(minY+maxY)/2}:{x:100/scale,y:55/scale};
  const px=p=>300+(p.x-centre.x)*scale,py=p=>155-(p.y-centre.y)*scale;
  const line=(p,q,cls)=>add('line',{x1:px(p),y1:py(p),x2:px(q),y2:py(q),class:cls});
  // Keep grid work bounded even for a learner-published frame far from odom.
  // The square size is always disclosed; all geometry uses the same scale.
  const spacing=Math.max(this.mountView?.1:.5,45/scale),power=10**Math.floor(Math.log10(spacing));
  const step=[1,2,5,10].find(n=>n*power>=spacing)*power;
  if(!Number.isFinite(step)||!Number.isFinite(centre.x)||!Number.isFinite(centre.y)||!Number.isFinite(300/scale)||!(scale>0)){add('text',{x:300,y:145,'text-anchor':'middle',class:'tf-svg-empty'},'Coordinates exceed the spatial view range.');return;}
  for(let x=Math.floor((centre.x-300/scale)/step)*step;x<=centre.x+300/scale;x+=step)line({x,y:centre.y-155/scale},{x,y:centre.y+155/scale},'tf-grid');
  for(let y=Math.floor((centre.y-155/scale)/step)*step;y<=centre.y+155/scale;y+=step)line({x:centre.x-300/scale,y},{x:centre.x+300/scale,y},'tf-grid');
  if(robot){
   const body=svg('g',{transform:`translate(${px(robot.origin)} ${py(robot.origin)}) rotate(${-robot.yaw*180/Math.PI})`});
   body.append(svg('rect',{x:-.13*scale,y:-.11*scale,width:.25*scale,height:.22*scale,rx:.03*scale,class:'tf-body'}));
   for(const side of [-1,1])body.append(svg('rect',{x:-WHEELS.radius*scale,y:(side*WHEELS.track/2-WHEELS.width/2)*scale,width:WHEELS.radius*2*scale,height:WHEELS.width*scale,class:'tf-wheel'}));
   body.append(svg('path',{d:`M ${ROBOT_RADIUS*scale} 0 L ${.075*scale} ${-.035*scale} L ${.075*scale} ${.035*scale} Z`,class:'tf-nose'}));this.space.append(body);
  }
  if(a&&b&&model.selected)line(a.origin,b.origin,'tf-selected-edge'+(model.selectedKind==='static'?' static':''));
  if(showTarget){
   if(robot)line(robot.origin,TF_TARGET,'tf-target-vector');
   add('path',{d:`M ${px(TF_TARGET)-7} ${py(TF_TARGET)} h 14 M ${px(TF_TARGET)} ${py(TF_TARGET)-7} v 14`,class:'tf-target-mark'});
   add('text',{x:px(TF_TARGET)+12,y:py(TF_TARGET)-10,class:'tf-svg-label'},'target');
  }
  for(const p of model.poses){
   const selected=p.name===this.reference||p.name===this.frame;
   const x=px(p.origin),y=py(p.origin);if(x<0||x>600||y<0||y>310)continue;
   const circle=add('circle',{cx:x,cy:y,r:selected?4:3,class:'tf-origin'+(selected?' selected':''),'data-frame-origin':p.name,translate:'no'});circle.append(svg('title'));circle.firstChild.textContent=p.name;
   if(!selected)continue;
   const length=this.mountView?.13:.25;
   for(const [endpoint,cls]of [[p.xAxis,'tf-axis-x'],[p.yAxis,'tf-axis-y']]){
    const end={x:p.origin.x+(endpoint.x-p.origin.x)*length,y:p.origin.y+(endpoint.y-p.origin.y)*length};
    line(p.origin,end,cls+(p.name===model.root?' root':''));
    add('circle',{cx:px(end),cy:py(end),r:2,class:cls});
    if(Math.hypot(px(end)-x,py(end)-y)>6)add('text',{x:px(end)+5,y:py(end)-5,class:'tf-axis-letter '+cls},cls==='tf-axis-x'?'x':'y');
   }
   const isRoot=p.name===this.reference,dy=isRoot?30:-22;
   add('text',{x:x+(isRoot?-10:12),y:y+dy,'text-anchor':isRoot?'end':'start',class:'tf-svg-label',translate:'no'},p.name);
  }
  add('text',{x:12,y:294,class:'tf-svg-scale'},`1 square = ${step} m · ${this.mountView?'mount detail':'room view'}`);
 }
 destroy(){this.odometry.destroy();this.container.replaceChildren();}
}
