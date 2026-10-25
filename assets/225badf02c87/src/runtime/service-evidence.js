// Keep contradictory results independently of the bounded recent-call log.
// Weak keys do not retain a stopped program after its other evidence is released.
const ADD_TWO_INTS='example_interfaces/srv/AddTwoInts';
const correctSum=call=>call.result.sum===call.request.a+call.request.b;
export function recordServiceEvidence(runtime,call){
 if(call.type===ADD_TWO_INTS&&call.owner&&typeof call.owner==='object'&&!correctSum(call)){
  let names=runtime.serviceContradictions.get(call.owner);
  if(!names)runtime.serviceContradictions.set(call.owner,names=new Set());
  names.add(call.name);
 }
 runtime.serviceCalls.push(call);
 if(runtime.serviceCalls.length>100)runtime.serviceCalls.shift();
}
export function serviceClientCheck(runtime,owners){
 const calls=runtime.serviceCalls.filter(call=>owners.has(call.owner)&&call.type===ADD_TWO_INTS);
 return calls.some(call=>{
  if(runtime.serviceContradictions.get(call.owner)?.has(call.name))return false;
  const sameService=calls.filter(other=>other.owner===call.owner&&other.name===call.name);
  if(sameService.some(other=>!correctSum(other)))return false;
  return [true,false].every(client=>sameService.some(other=>!!other.caller===client&&(!client||owners.has(other.caller))&&correctSum(other)));
 });
}
