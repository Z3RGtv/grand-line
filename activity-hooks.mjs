// Optional server observer. Nothing is attached to world/player state or exported to the map.
const observers=new WeakMap();
export function emitActivity(world,type,entityType,entityId,data={},users=[]){observers.get(world)?.({type,entityType,entityId:String(entityId??''),data,users:[...new Set(users.filter(Boolean))].map(String)});}
export function captureActivity(world,operation){const events=[],previous=observers.get(world);observers.set(world,e=>events.push(e));try{return{value:operation(),events};}finally{if(previous)observers.set(world,previous);else observers.delete(world);}}
