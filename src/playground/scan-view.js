export function drawScan(canvas,scan){
 const c=canvas.getContext('2d'),w=canvas.width,h=canvas.height,scale=Math.min(w,h)/2/scan.range_max,cx=w/2,cy=h/2;
 c.fillStyle='#122831';c.fillRect(0,0,w,h);c.font='10px system-ui';
 for(let radius=2;radius<=scan.range_max;radius+=2){c.strokeStyle='#29444d';c.lineWidth=1;c.beginPath();c.arc(cx,cy,radius*scale,0,Math.PI*2);c.stroke();c.fillStyle='#718f98';c.fillText(radius+' m',cx+4,cy-radius*scale+11);}
 c.strokeStyle='#31535c';c.beginPath();c.moveTo(cx,0);c.lineTo(cx,h);c.moveTo(0,cy);c.lineTo(w,cy);c.stroke();
 for(let i=0;i<scan.ranges.length;i++){
  const distance=Math.min(scan.ranges[i],scan.range_max),angle=scan.angle_min+i*scan.angle_increment,x=cx-Math.sin(angle)*distance*scale,y=cy-Math.cos(angle)*distance*scale;
  c.strokeStyle='rgba(97,207,181,.12)';c.beginPath();c.moveTo(cx,cy);c.lineTo(x,y);c.stroke();
  if(Number.isFinite(scan.ranges[i])&&scan.ranges[i]<scan.range_max){c.fillStyle='#91edd0';c.beginPath();c.arc(x,y,1.7,0,Math.PI*2);c.fill();}
 }
 c.fillStyle='#f3ae62';c.beginPath();c.moveTo(cx,cy-7);c.lineTo(cx-5,cy+4);c.lineTo(cx+5,cy+4);c.closePath();c.fill();
 c.fillStyle='#d1e4e6';c.font='11px system-ui';c.fillText('laser_link · forward ↑ · left ←',10,h-10);
}
