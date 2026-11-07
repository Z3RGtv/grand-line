let secrets=[],ledger={hasUnique:()=>false};
export function configureFinalCatalog(catalog){secrets=catalog.map(v=>Object.freeze({...v}));}
export function configureFinalLedger(value){ledger=value;}
export function finalSecretSlots(w){return (w?.finalSecretSlots||FINAL_SECRET_SLOTS.map(id=>({id,enabled:secrets.some(s=>s.id===id&&s.enabled!==false)}))).filter(s=>FINAL_SECRET_SLOTS.includes(s.id));}
export const FINAL_SECRET_SLOTS=['trophy_1','trophy_2','trophy_3'];
const FINAL_REWARD_SLOTS=['fortune',...FINAL_SECRET_SLOTS];
// Retained for older clients that import this availability function.
export function finalLootReady(){return true;}
export function rollFinalReward(w,p,random,makeEquipment,id){
 const roll=random();let item=null,special=null;
 if(roll<.10){
  const pick=FINAL_REWARD_SLOTS[Math.min(FINAL_REWARD_SLOTS.length-1,Math.floor(random()*FINAL_REWARD_SLOTS.length))],definition=secrets.find(s=>s.id===pick);
  // Taken global treasures and already-owned personal treasures become no drop;
  // their probability is never redistributed into other prizes.
  if(definition?.enabled!==false&&definition&&!p.uniqueLoot?.[pick]&&!ledger.hasUnique(pick,definition.global?'*':p.id)&&(!definition.global||!w.finalDiscoveries?.[pick])){
   const equipment=definition.item?{...definition.item,displayName:definition.name}:null;
   if(definition.global)special={id:pick,name:definition.name,art:definition.art,global:true,equipment};
   if(equipment)item={...equipment,id};
   p.uniqueLoot??={};p.uniqueLoot[pick]={at:w.wall,name:definition.name,art:definition.art,global:!!definition.global,equipment};w.finalDiscoveries??={};
   w.finalDiscoveries[pick]??={id:pick,name:definition.name,art:definition.art,user:p.id,playerName:p.name,at:w.wall,global:!!definition.global,equipment};
  }
 }else if(roll<.40)item=makeEquipment();
 return{item,special,reason:item||special?'won':'none'};
}
export function publicFinalDiscoveries(w){return Object.fromEntries(Object.entries(w.finalDiscoveries||{}).filter(([id])=>FINAL_SECRET_SLOTS.includes(id)).map(([id,v])=>[id,{id,name:v.name,art:v.art,user:v.user,playerName:v.playerName,at:v.at,global:!!v.global,equipment:v.equipment||null}]));}
