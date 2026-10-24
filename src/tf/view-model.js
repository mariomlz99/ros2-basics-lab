import {applyTransform, quaternionYaw} from '../runtime/tf.js';
import {TF_TARGET} from './target.js';

// No robot pose is held by this view: every coordinate is a TF lookup.
export function tfViewModel(tf, reference='odom', frame='base_link') {
 const edges=tf.edges(),names=tf.frames();
 const roots=names.filter(name=>!edges.some(edge=>edge.child===name));
 const root=roots.includes('odom')?'odom':roots[0];
 const poses=[];
 if(root)for(const name of names){
  try{
   const stamped=tf.lookup(root,name),transform=stamped.transform;
   const origin=transform.translation;
   poses.push({name,origin,xAxis:applyTransform(transform,{x:1,y:0,z:0}),yAxis:applyTransform(transform,{x:0,y:1,z:0}),yaw:quaternionYaw(transform.rotation)});
  }catch{/* A disconnected component remains in the tree, outside this spatial view. */}
 }
 let selected=null,relativeTarget=null,error='';
 try{if(names.length)selected=tf.lookup(reference,frame);}catch(e){error=e.message;}
 try{relativeTarget=tf.transformPoint('base_link',{header:{frame_id:'odom',stamp:{sec:0,nanosec:0}},point:{...TF_TARGET}});}catch{}
 const selectedKind=selected?relationshipKind(edges,reference,frame):'unavailable';
 return {edges,names,roots,root,poses,selected,selectedKind,relativeTarget,error};
}

export function tfTreeRows(edges,names) {
 const rows=[],seen=new Set();
 function visit(name,depth){
  if(seen.has(name))return;
  seen.add(name);rows.push({name,depth,edge:edges.find(edge=>edge.child===name)});
  for(const edge of edges.filter(edge=>edge.parent===name))visit(edge.child,depth+1);
 }
 for(const name of names.filter(name=>!edges.some(edge=>edge.child===name)))visit(name,0);
 for(const name of names)visit(name,0);
 return rows;
}

// Edge direction does not change whether a mounting relationship is fixed.
function relationshipKind(edges,reference,frame){
 const queue=[{name:reference,static:true}],seen=new Set();
 for(const current of queue){
  if(current.name===frame)return current.static?'static':'dynamic';
  seen.add(current.name);
  for(const edge of edges){
   const next=edge.parent===current.name?edge.child:edge.child===current.name?edge.parent:null;
   if(next&&!seen.has(next))queue.push({name:next,static:current.static&&edge.static});
  }
 }
 return 'unavailable';
}
