import test from 'node:test';
import assert from 'node:assert/strict';
// Independently derived geometry cases transferred after matching the Lab sensor catalog.
import {load} from './source-root.mjs';
const {laserScan}=await load('playground/lidar.js');
const {renderCamera}=await load('playground/camera.js');
const {TransformStore}=await load('runtime/tf.js');
const {Robot}=await load('playground/robot.js');
const {Playground}=await load('playground/playground.js');
const {Runtime}=await load('runtime/graph.js');

const near=(actual,expected,label)=>assert(Math.abs(actual-expected)<1e-9,`${label}: ${actual} != ${expected}`);
const stamp={sec:7,nanosec:123};

// Line-segment intersection oracle, independent of the simulator's slab/box code.
const cross=(a,b)=>a[0]*b[1]-a[1]*b[0];
function segmentDistance(origin,direction,a,b){
 const edge=[b[0]-a[0],b[1]-a[1]],delta=[a[0]-origin[0],a[1]-origin[1]];
 const denominator=cross(direction,edge);
 if(Math.abs(denominator)<1e-12)return Infinity;
 const distance=cross(delta,edge)/denominator,along=cross(delta,direction)/denominator;
 return distance>=0&&along>=0&&along<=1?distance:Infinity;
}
function rectangleEdges(x,y,w,h){
 const corners=[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
 return corners.map((a,i)=>[a,corners[(i+1)%4]]);
}

test('all 120 LiDAR beams match independent line intersections at eight unseen poses',()=>{
 const world={bounds:{minX:-4,maxX:6,minY:-3,maxY:5},obstacles:[{x:2,y:1,w:.7,h:1.4},{x:-2,y:2,w:.8,h:.5}]};
 const edges=[...rectangleEdges(-4,-3,10,8),...rectangleEdges(2,1,.7,1.4),...rectangleEdges(-2,2,.8,.5)];
 for(const pose of [{x:0,y:0,yaw:0},{x:-1,y:-1,yaw:Math.PI/2},{x:.7,y:-.3,yaw:-.8},{x:1,y:3,yaw:Math.PI-1e-7},{x:-.8,y:1,yaw:-Math.PI+1e-7},{x:3,y:-1,yaw:.37},{x:-2.5,y:-.5,yaw:-2.4},{x:4,y:3,yaw:2.1}]){
  const scan=laserScan(pose,world,stamp);
  assert.equal(scan.header.frame_id,'laser_link');assert.equal(scan.ranges.length,120);
  const origin=[pose.x+.12*Math.cos(pose.yaw),pose.y+.12*Math.sin(pose.yaw)];
  for(let i=0;i<120;i++){
   const angle=pose.yaw-Math.PI+i*Math.PI/60,direction=[Math.cos(angle),Math.sin(angle)];
   const distance=Math.min(...edges.map(([a,b])=>segmentDistance(origin,direction,a,b)));
   const expected=distance>10?Infinity:Math.max(.05,distance);
   if(expected===Infinity)assert.equal(scan.ranges[i],Infinity);
   else near(scan.ranges[i],expected,`pose ${JSON.stringify(pose)}, beam ${i}`);
  }
 }
});

test('full 3D multi-hop TF maps explicit source/target points using hand-derived rotations',()=>{
 const store=new TransformStore(),s=Math.SQRT1_2;
 store.ingest('/tf',{transforms:[
  {header:{stamp,frame_id:'world'},child_frame_id:'body',transform:{translation:{x:1,y:-2,z:3},rotation:{x:0,y:0,z:s,w:s}}},
  {header:{stamp,frame_id:'body'},child_frame_id:'sensor',transform:{translation:{x:0,y:2,z:0},rotation:{x:0,y:s,z:0,w:s}}}
 ]},{node:'/oracle_fixture'});
 // Pitch +90: (x,y,z) -> (z,y,-x); yaw +90: (x,y,z) -> (-y,x,z).
 for(const [local,world]of [
  [{x:1,y:2,z:3},{x:-3,y:1,z:2}],
  [{x:0,y:0,z:0},{x:-1,y:-2,z:3}],
  [{x:-4,y:1,z:-2},{x:-2,y:-4,z:7}]
 ]){
  const forward=store.transformPoint('world',{header:{frame_id:'sensor'},point:local});
  const reverse=store.transformPoint('sensor',{header:{frame_id:'world'},point:world});
  assert.equal(forward.header.frame_id,'world');assert.equal(reverse.header.frame_id,'sensor');
  for(const axis of ['x','y','z']){near(forward.point[axis],world[axis],'forward '+axis);near(reverse.point[axis],local[axis],'reverse '+axis);}
 }
});

test('quarter-circle motion, command timeout and reset follow independent geometry',()=>{
 const robot=new Robot();robot.command(.4,Math.PI/2);
 for(let i=0;i<20;i++)robot.step(.05);
 const radius=.8/Math.PI;
 near(robot.x,radius,'quarter-circle x');near(robot.y,radius,'quarter-circle y');near(robot.yaw,Math.PI/2,'quarter-circle yaw');near(robot.distance,.4,'arc length');
 robot.step(3); // Only one second of this step remains under the two-second watchdog.
 near(robot.x,0,'half-circle x');near(robot.y,2*radius,'half-circle y');near(robot.distance,.8,'watchdog arc length');
 assert.equal(robot.linear,0);assert.equal(robot.angular,0);
 const stopped=structuredClone(robot);robot.step(10);assert.deepEqual({...robot},stopped);
 robot.reset();assert.equal(robot.remaining,0);robot.step(1);assert.equal(robot.x,0);assert.equal(robot.y,0);
});

test('camera rays above a shorter foreground box still see the taller rear wall',()=>{
 const robot={x:0,y:0,yaw:0},image=renderCamera(robot);
 assert.equal(image.width,320);assert.equal(image.height,240);assert.equal(image.data.length,320*240*3);
 for(const y of [90,91]){
  // Pinhole f=160, camera z=.5 and x=.1; box front x=3, wall x=8.
  // Both pixel-center rays clear the box (height 1) and hit the wall (height 2).
  const elevationAtBox=.5+(120-y-.5)*2.9/160;
  const elevationAtWall=.5+(120-y-.5)*7.9/160;
  assert(elevationAtBox>1);assert(elevationAtWall>0&&elevationAtWall<2);
  const offset=(y*320+159)*3;
  // Wall material [188,200,207], distance attenuation 1-.025*7.9, x-face factor .84.
  const expected=[188,200,207].map(channel=>Math.round(channel*(1-.025*7.9)*.84));
  assert.deepEqual([...image.data.slice(offset,offset+3)],expected,`pixel (159,${y}) must show wall, not sky`);
 }
});

// A pixel-center ray is parameterized by camera-forward depth, independently
// intersected with each wall segment and rejected if above/below its height.
function pixelOracle(pose,x,y){
 const c=Math.cos(pose.yaw),s=Math.sin(pose.yaw),lateral=(160-x-.5)/160;
 const origin=[pose.x+.1*c,pose.y+.1*s],direction=[c-lateral*s,s+lateral*c];
 const rise=(120-y-.5)/160,candidates=[];
 for(const surface of [{x:-2,y:-4,w:10,h:8,height:2,obstacle:false},{x:3,y:-.6,w:.6,h:1.2,height:1,obstacle:true}]){
  for(const [a,b]of rectangleEdges(surface.x,surface.y,surface.w,surface.h)){
   const depth=segmentDistance(origin,direction,a,b),z=.5+rise*depth;
   if(!Number.isFinite(depth)||z<0||z>surface.height)continue;
   const side=a[0]===b[0],hx=origin[0]+direction[0]*depth,hy=origin[1]+direction[1]*depth;
   const seam=surface.obstacle&&Math.abs((side?hy-surface.y:hx-surface.x)-(side?surface.h:surface.w)/2)<.018;
   const base=surface.obstacle?(seam?[206,171,133]:[172,129,112]):z<.10?[100,120,129]:[188,200,207];
   const shade=Math.max(.60,1-.025*depth)*(side?.84:1);
   candidates.push({depth,rgb:base.map(channel=>Math.round(channel*shade))});
  }
 }
 if(rise<0){
  const depth=-.5/rise,fx=origin[0]+direction[0]*depth,fy=origin[1]+direction[1]*depth;
  const even=(Math.floor(fx)+Math.floor(fy))%2===0,seam=Math.min(fx-Math.floor(fx),fy-Math.floor(fy))<.015;
  const shade=Math.max(.62,1-.025*depth)*(seam?.84:1);
  candidates.push({depth,rgb:(even?[182,191,193]:[173,184,188]).map(channel=>Math.round(channel*shade))});
 }
 candidates.sort((a,b)=>a.depth-b.depth);
 return candidates[0]?.rgb??[180,193,199].map(channel=>Math.round(channel*(.85+.15*y/120)));
}

test('camera rasterization follows pixel-center rays across near walls, rotations and foreground edges',()=>{
 const poses=[{x:0,y:0,yaw:0},{x:0,y:0,yaw:Math.PI},{x:0,y:0,yaw:Math.PI/2},{x:-1.81,y:0,yaw:Math.PI},{x:7.81,y:1,yaw:0},{x:1,y:3.81,yaw:Math.PI/2},{x:1,y:-3.81,yaw:-Math.PI/2},{x:2.7,y:.8,yaw:-.71}];
 for(const pose of poses){
  const image=renderCamera(pose);
  assert.equal(image.width,320);assert.equal(image.height,240);assert.equal(image.step,960);assert.equal(image.encoding,'rgb8');assert.equal(image.is_bigendian,0);
  assert(image.data instanceof Uint8Array);assert.equal(image.data.length,image.step*image.height);
  for(const y of [12,45,89,90,91,119,120,130,147,148,220,239])for(const x of [36,80,130,159,211,282,315]){
   const offset=(y*320+x)*3,expected=pixelOracle(pose,x,y);
   assert.deepEqual([...image.data.slice(offset,offset+3)],expected,`pose ${JSON.stringify(pose)}, pixel (${x},${y})`);
  }
 }
});

test('moving and reset sensor messages share one instant and match independently predicted pose and rays',()=>{
 const oldImageData=globalThis.ImageData;globalThis.ImageData=class{};
 const canvas=()=>({width:400,height:320,getContext:()=>new Proxy({},{get:()=>()=>{}})});
 const runtime=new Runtime();let tick=0;runtime.stamp=()=>({sec:100,nanosec:++tick});
 const scene=new Playground(runtime,canvas(),canvas());
 const messagesAfter=first=>Object.fromEntries([...runtime.samples].filter(([id])=>id>first).map(([,s])=>[s.topic,s.message]));
 const assertAcquisition=(messages,pose,frontRange)=>{
  assert.deepEqual(Object.keys(messages),['/odom','/tf','/scan','/camera/image_raw']);
  const acquired=messages['/odom'].header.stamp;
  for(const topic of ['/scan','/camera/image_raw'])assert.deepEqual(messages[topic].header.stamp,acquired);
  for(const transform of messages['/tf'].transforms)assert.deepEqual(transform.header.stamp,acquired);
  const odom=messages['/odom'].pose.pose,tf=runtime.tf.lookup('odom','base_link');
  for(const [axis,expected]of [['x',pose.x],['y',pose.y],['z',0]]){near(odom.position[axis],expected,'odom '+axis);near(tf.transform.translation[axis],expected,'TF '+axis);}
  near(odom.orientation.z,Math.sin(pose.yaw/2),'odom yaw quaternion z');near(odom.orientation.w,Math.cos(pose.yaw/2),'odom yaw quaternion w');
  assert.equal(messages['/scan'].ranges[60],Math.fround(frontRange));
  const image=messages['/camera/image_raw'];assert.equal(image.header.frame_id,'camera_optical_frame');assert.equal(image.data.length,320*240*3);
  for(const [x,y]of [[80,89],[159,90],[130,130],[211,220]]){
   const offset=(y*320+x)*3;assert.deepEqual([...image.data.slice(offset,offset+3)],pixelOracle(pose,x,y));
  }
 };
 try{
  scene.start();clearInterval(scene.timer);
  Object.assign(scene.robot,{x:1,y:-1,yaw:Math.PI/2});scene.robot.command(.2,0);
  const first=runtime.sampleCounter;scene.step();
  assertAcquisition(messagesAfter(first),{x:1,y:-.99,yaw:Math.PI/2},4.87);
  const beforeReset=runtime.sampleCounter;scene.resetPose();
  assertAcquisition(messagesAfter(beforeReset),{x:0,y:0,yaw:0},2.88);
  assert.equal(scene.robot.linear,0);assert.equal(scene.robot.angular,0);assert.equal(scene.robot.remaining,0);
 }finally{scene.stop();runtime.reset();globalThis.ImageData=oldImageData;}
});
