// One running callback plus one replaceable latest sample per subscription.
export class LatestMailbox {
  constructor(){this.inFlight=new Set();this.latest=new Map();}
  offer(key,deliver){if(this.inFlight.has(key)){this.latest.set(key,deliver);return false;}this.inFlight.add(key);deliver();return true;}
  done(key){this.inFlight.delete(key);const next=this.latest.get(key);this.latest.delete(key);if(next)this.offer(key,next);}
  remove(key){this.inFlight.delete(key);this.latest.delete(key);}
  clear(){this.inFlight.clear();this.latest.clear();}
}
