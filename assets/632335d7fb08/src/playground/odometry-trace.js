// A bounded notebook of published poses, never a second robot simulation.
export class OdometryTrace {
 constructor(limit=600){this.limit=limit;this.reset();}
 reset(){this.points=[];this.latest=null;this.origin=null;this.distance=0;this.count=0;this.trimmed=false;}
 mark(){const last=this.latest;this.reset();if(last)this.add(last.message);}
 add(message){
  const p=message?.pose?.pose?.position,q=message?.pose?.pose?.orientation,v=message?.twist?.twist;
  const stamp=message?.header?.stamp;
  if(!p||!q||!v||!stamp||![p.x,p.y,p.z,q.x,q.y,q.z,q.w,v.linear?.x,v.linear?.y,v.angular?.z,stamp.sec,stamp.nanosec].every(Number.isFinite))return false;
  const norm=Math.hypot(q.x,q.y,q.z,q.w);if(!Number.isFinite(norm)||norm<1e-12)return false;
  // This teaching view is planar. Avoid silently projecting tilted frames.
  if(Math.abs(q.x/norm)>1e-6||Math.abs(q.y/norm)>1e-6)return false;
  const yaw=Math.atan2(2*(q.w/norm)*(q.z/norm),(q.w/norm)**2-(q.z/norm)**2),time=stamp.sec+stamp.nanosec/1e9;
  const frame=message.header.frame_id,child=message.child_frame_id;
  if(!frame||!child)return false;
  if(this.latest&&(this.latest.frame!==frame||this.latest.child!==child||time<this.latest.time))this.reset();
  const current={x:p.x,y:p.y,yaw,time,frame,child,vx:v.linear.x,vy:v.linear.y,w:v.angular.z,message};
  if(this.latest)this.distance+=Math.hypot(p.x-this.latest.x,p.y-this.latest.y);
  this.latest=current;this.origin??={x:p.x,y:p.y};this.count++;
  const last=this.points.at(-1);if(!last||Math.hypot(p.x-last.x,p.y-last.y)>1e-9)this.points.push({x:p.x,y:p.y});
  if(this.points.length>this.limit){this.points.shift();this.trimmed=true;}
  return true;
 }
 get displacement(){return this.latest?Math.hypot(this.latest.x-this.origin.x,this.latest.y-this.origin.y):0;}
 get worldVelocity(){const s=this.latest;if(!s)return null;return {x:s.vx*Math.cos(s.yaw)-s.vy*Math.sin(s.yaw),y:s.vx*Math.sin(s.yaw)+s.vy*Math.cos(s.yaw)};}
}
