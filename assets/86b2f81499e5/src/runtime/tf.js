// Latest live TF only. Geometry, workers and the teaching view share this math.
// A TransformStamped maps coordinates from child_frame_id into header.frame_id.
const zero=()=>({x:0,y:0,z:0});
const identity=()=>({translation:zero(),rotation:{x:0,y:0,z:0,w:1}});
const clone=value=>structuredClone(value);
function quaternion(q){const length=Math.hypot(q.x,q.y,q.z,q.w);if(!Number.isFinite(length)||length<1e-12)throw Error('TF rotation must be a finite, nonzero quaternion');return {x:q.x/length,y:q.y/length,z:q.z/length,w:q.w/length};}
function multiply(a,b){return quaternion({x:a.w*b.x+a.x*b.w+a.y*b.z-a.z*b.y,y:a.w*b.y-a.x*b.z+a.y*b.w+a.z*b.x,z:a.w*b.z+a.x*b.y-a.y*b.x+a.z*b.w,w:a.w*b.w-a.x*b.x-a.y*b.y-a.z*b.z});}
function rotate(q,p){const tx=2*(q.y*p.z-q.z*p.y),ty=2*(q.z*p.x-q.x*p.z),tz=2*(q.x*p.y-q.y*p.x);return {x:p.x+q.w*tx+q.y*tz-q.z*ty,y:p.y+q.w*ty+q.z*tx-q.x*tz,z:p.z+q.w*tz+q.x*ty-q.y*tx};}
export function quaternionYaw(q){return Math.atan2(2*(q.w*q.z+q.x*q.y),1-2*(q.y*q.y+q.z*q.z));}
export function applyTransform(stamped,point){const t=stamped.transform??stamped;if(!['x','y','z'].every(k=>Number.isFinite(point[k])))throw Error('TF point coordinates must be finite');const p=rotate(quaternion(t.rotation),point);return {x:p.x+t.translation.x,y:p.y+t.translation.y,z:p.z+t.translation.z};}
function compose(a,b){return {translation:applyTransform(a,b.translation),rotation:multiply(a.rotation,b.rotation)};}
function inverse(t){const q={x:-t.rotation.x,y:-t.rotation.y,z:-t.rotation.z,w:t.rotation.w};return {translation:rotate(q,{x:-t.translation.x,y:-t.translation.y,z:-t.translation.z}),rotation:q};}
export class TransformStore{
 constructor(){this.records=new Map();this.revision=0;this.listeners=new Set();}
 edges(){return [...this.records.values()].map(clone).sort((a,b)=>a.child.localeCompare(b.child));}
 frames(){return [...new Set(this.edges().flatMap(edge=>[edge.parent,edge.child]))].sort();}
 snapshot(){return {revision:this.revision,edges:this.edges()};}
 replace(snapshot){this.records=new Map(snapshot.edges.map(edge=>[edge.child,clone(edge)]));this.revision=snapshot.revision;}
 changed(){this.revision++;for(const listener of this.listeners)listener(this.snapshot());}
 ingest(topic,message,publisher){if(topic!=='/tf'&&topic!=='/tf_static')return;const pending=new Map(this.records);for(const value of message.transforms){const transform=clone(value),parent=transform.header.frame_id,child=transform.child_frame_id;if(!parent||!child||parent===child||parent.startsWith('/')||child.startsWith('/'))throw Error('TF needs distinct, nonempty frame names without a leading slash');if(!Object.values(transform.transform.translation).every(Number.isFinite))throw Error('TF translation must be finite');transform.transform.rotation=quaternion(transform.transform.rotation);pending.set(child,{parent,child,static:topic==='/tf_static',transform,publisher:publisher?.node??null});}
  for(const child of pending.keys()){const seen=new Set();let current=child;while(pending.has(current)){if(seen.has(current))throw Error('TF tree cannot contain a cycle');seen.add(current);current=pending.get(current).parent;}}
  this.records=pending;this.changed();
 }
 removePublisher(node,topic){let changed=false;for(const [child,edge]of this.records)if(edge.publisher===node&&(!topic||(edge.static?'/tf_static':'/tf')===topic)){this.records.delete(child);changed=true;}if(changed)this.changed();}
 clear(){this.records.clear();this.changed();}
 lookup(target,source){const frames=this.frames();for(const frame of [target,source])if(!frames.includes(frame))throw Error('Unknown TF frame "'+frame+'". Frame names must match the TF tree.');
  const ancestry=frame=>{let current=frame,t=identity(),stamp={sec:0,nanosec:0};const ancestors=new Map([[current,{t,stamp}]]);while(this.records.has(current)){const edge=this.records.get(current);t=compose(edge.transform.transform,t);if(!edge.static)stamp=edge.transform.header.stamp;current=edge.parent;ancestors.set(current,{t,stamp});}return ancestors;};
  const from=ancestry(source),to=ancestry(target);for(const [ancestor,a]of from)if(to.has(ancestor)){const b=to.get(ancestor),stamp=a.stamp.sec||a.stamp.nanosec?a.stamp:b.stamp;return {header:{stamp:clone(stamp),frame_id:target},child_frame_id:source,transform:compose(inverse(b.t),a.t)};}throw Error('TF frames "'+target+'" and "'+source+'" are not connected.');
 }
 transformPoint(target,input){const transform=this.lookup(target,input.header.frame_id);return {header:clone(transform.header),point:applyTransform(transform,input.point)};}
}

// The worker mirrors publication-derived transforms, never robot pose. Operation
// evidence carries the revision so the main bridge can verify the same snapshot.
export class TransformClient{
 #proof;
 constructor(emit,proof){this.store=new TransformStore();this.emit=emit;this.#proof=proof;}
 authorize(proof){if(this.#proof===undefined)this.#proof=proof;}
 update(snapshot){if(snapshot&&snapshot.revision>=this.store.revision)this.store.replace(snapshot);}
 request(request){const {operation,target,source,input}=request;let result;if(operation==='lookup')result=this.store.lookup(target,source);else if(operation==='point')result=this.store.transformPoint(target,input);else throw Error('Unsupported TF operation');this.emit({kind:'tf_evidence',proof:this.#proof,operation,target,source:source??input.header.frame_id,input,result,revision:this.store.revision});return result;}
}
