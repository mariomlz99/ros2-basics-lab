// Compare the same payload field before and after a parameter change. Merely
// printing the new value, or continually publishing a constant, is not evidence.
export function changedParameterOutput(before,after,previous,value){
 if(Object.is(previous,value)||typeof previous!==typeof value||!['string','number','boolean'].includes(typeof value))return false;
 const count=(text,part)=>text.split(part).length-1;
 const visit=(old,next)=>{
  if(typeof previous!=='string')return Object.is(old,previous)&&Object.is(next,value)||!!(old&&next&&typeof old==='object'&&typeof next==='object'&&Object.keys(old).some(key=>Object.hasOwn(next,key)&&visit(old[key],next[key])));
  if(typeof old==='string'&&typeof next==='string'){
   if(!previous||!value||old===next||!old.includes(previous)||!next.includes(value))return false;
   const removed=count(next,previous)<count(old,previous),added=count(next,value)>count(old,value);
   // A counter may change while an ignored prefix still contains both values.
   // For overlapping values, require the distinguishable part to change.
   return (previous.includes(value)||added)&&(value.includes(previous)||removed);
  }
  return old&&next&&typeof old==='object'&&typeof next==='object'&&Object.keys(old).some(key=>Object.hasOwn(next,key)&&visit(old[key],next[key]));
 };
 return !!visit(before,after);
}
