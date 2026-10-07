export class Robot {
  constructor() { this.reset(); }
  reset() { this.x=0; this.y=0; this.yaw=0; this.linear=0; this.angular=0; this.distance=0; this.remaining=0; }
  command(linear, angular) { if(!Number.isFinite(linear)||!Number.isFinite(angular))throw Error('Velocity must be finite');this.linear=linear; this.angular=angular; this.remaining=2; }
  step(dt) {
    if (!Number.isFinite(dt) || dt<0) throw new Error('Invalid timestep');
    const t=Math.min(dt,this.remaining); if (!t) return;
    const angle=this.yaw+this.angular*t;
    if (Math.abs(this.angular)<1e-9) { this.x+=this.linear*Math.cos(this.yaw)*t; this.y+=this.linear*Math.sin(this.yaw)*t; }
    else { this.x+=this.linear/this.angular*(Math.sin(angle)-Math.sin(this.yaw)); this.y-=this.linear/this.angular*(Math.cos(angle)-Math.cos(this.yaw)); }
    this.yaw=Math.atan2(Math.sin(angle),Math.cos(angle)); this.distance+=Math.abs(this.linear)*t;
    this.remaining=Math.max(0,this.remaining-t);
    if(this.remaining<1e-9) { this.remaining=0; this.linear=0; this.angular=0; }
  }
}
