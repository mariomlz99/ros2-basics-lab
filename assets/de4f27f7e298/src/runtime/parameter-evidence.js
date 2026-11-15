// Compare the same payload field before and after a parameter change. Merely
// printing the new value, or continually publishing a constant, is not evidence.
export function changedParameterOutput(before,after,previous,value){
 if(Object.is(previous,value)||typeof previous!=='string'||typeof value!=='string'||!previous||!value)return false;
 const visit=(old,next)=>{
  if(typeof old==='string'&&typeof next==='string')return old!==next&&old.includes(previous)&&next.includes(value);
  return old&&next&&typeof old==='object'&&typeof next==='object'&&Object.keys(old).some(key=>Object.hasOwn(next,key)&&visit(old[key],next[key]));
 };
 return !!visit(before,after);
}
