// Endpoint identity is separate from its owning node. CLI/simulator callers
// without an explicit identity have one endpoint per node and topic.
export class Endpoints {
 constructor(){this.entries=new Map();}
 get size(){return this.entries.size;}
 add(node,id=node){this.entries.set(id,node);return this;}
 has(node){return [...this.entries.values()].includes(node);}
 delete(node,id){
  if(arguments.length===2)return this.entries.get(id)===node&&this.entries.delete(id);
  let removed=false;
  for(const [key,owner]of this.entries)if(owner===node){this.entries.delete(key);removed=true;}
  return removed;
 }
 [Symbol.iterator](){return this.entries.values();}
}
