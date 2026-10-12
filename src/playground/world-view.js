import {WHEELS,SENSORS} from './sensors.js';
import {TRAINING_WORLD} from './lidar.js';
import {ROBOT_RADIUS} from './sensors.js';
// Render in world metres so the robot, obstacles and collision footprint agree.
export function drawWorld(canvas,robot,overview=false){
 const c=canvas.getContext('2d'),w=canvas.width,h=canvas.height,b=TRAINING_WORLD.bounds;
 const centre={x:Math.max(b.minX+3,Math.min(b.maxX-3,robot.x+1.2)),y:Math.max(b.minY+2.4,Math.min(b.maxY-2.4,robot.y))};
 const view=overview?b:{minX:centre.x-3,maxX:centre.x+3,minY:centre.y-2.4,maxY:centre.y+2.4},sx=w/(view.maxX-view.minX),sy=h/(view.maxY-view.minY);
 c.fillStyle='#dce3e4';c.fillRect(0,0,w,h);c.save();c.translate(-view.minX*sx,view.maxY*sy);c.scale(sx,-sy);
 for(let x=b.minX;x<b.maxX;x++)for(let y=b.minY;y<b.maxY;y++){c.fillStyle=(x+y)%2?'#d9e0e1':'#e1e6e7';c.fillRect(x,y,1,1);}
 c.lineWidth=.018;c.strokeStyle='#c0cbce';for(let x=b.minX;x<=b.maxX;x++){c.beginPath();c.moveTo(x,b.minY);c.lineTo(x,b.maxY);c.stroke();}for(let y=b.minY;y<=b.maxY;y++){c.beginPath();c.moveTo(b.minX,y);c.lineTo(b.maxX,y);c.stroke();}
 c.lineWidth=.10;c.strokeStyle='#81949c';c.strokeRect(b.minX+.05,b.minY+.05,b.maxX-b.minX-.1,b.maxY-b.minY-.1);
 for(const o of TRAINING_WORLD.obstacles){c.fillStyle='#b4bfc1';c.fillRect(o.x+.09,o.y-.09,o.w,o.h);c.fillStyle='rgb('+o.color.join(',')+')';c.fillRect(o.x,o.y,o.w,o.h);c.lineWidth=.025;c.strokeStyle='#805c49';c.strokeRect(o.x,o.y,o.w,o.h);c.strokeStyle='#d4af89';c.beginPath();c.moveTo(o.x+o.w/2,o.y);c.lineTo(o.x+o.w/2,o.y+o.h);c.stroke();}
 c.save();c.translate(robot.x,robot.y);c.rotate(robot.yaw);
 const r=ROBOT_RADIUS;c.fillStyle='#8c9ca1';c.beginPath();c.ellipse(.035,-.035,r,r*.85,0,0,Math.PI*2);c.fill();
 // Two tyres, chassis, lidar puck and a forward-facing camera.
 c.fillStyle='#283a44';for(const side of [-1,1])c.fillRect(-WHEELS.radius,side*WHEELS.track/2-WHEELS.width/2,2*WHEELS.radius,WHEELS.width);
 c.fillStyle='#f4f8f8';c.strokeStyle='#416575';c.lineWidth=.02;c.fillRect(-.13,-.11,.25,.22);c.strokeRect(-.13,-.11,.25,.22);
 c.fillStyle='#348a98';c.fillRect(.045,-.085,.065,.17);c.fillStyle='#163440';c.beginPath();c.arc(SENSORS.lidar.x,SENSORS.lidar.y,.055,0,Math.PI*2);c.fill();
 c.fillStyle='#6dd9dc';c.beginPath();c.arc(SENSORS.lidar.x,SENSORS.lidar.y,.026,0,Math.PI*2);c.fill();c.fillStyle='#ef9b46';c.beginPath();c.moveTo(.17,0);c.lineTo(.10,-.045);c.lineTo(.10,.045);c.closePath();c.fill();c.restore();c.restore();
 c.fillStyle='#203844';c.font='30px ui-monospace, monospace';c.fillText(`x=${robot.x.toFixed(2)} m   y=${robot.y.toFixed(2)} m   yaw=${(robot.yaw*180/Math.PI).toFixed(0)}°`,20,36);
 c.font='26px system-ui';c.fillText('1 square = 1 m · +x → · +y ↑',20,h-20);
}
