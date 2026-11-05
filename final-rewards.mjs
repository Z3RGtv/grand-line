import{allowanceDay}from'./spending-budget.mjs?v=0.26.0';
let secrets=[],ledger={hasUnique:()=>false,hasDaily:()=>false};
export function configureFinalCatalog(catalog){secrets=catalog.map(v=>Object.freeze({...v}));}
export function configureFinalLedger(value){ledger=value;}
export function finalSecretSlots(w){return w?.finalSecretSlots||FINAL_SECRET_SLOTS.map(id=>({id,enabled:secrets.some(s=>s.id===id&&s.enabled!==false)}));}
export const FINAL_SECRET_SLOTS=['fortune','trophy_1','trophy_2','trophy_3'];
export function finalLootReady(w,p){return p.finalLootDay!==allowanceDay(w.wall)&&!ledger.hasDaily(p.id,allowanceDay(w.wall));}
export function rollFinalReward(w,p,random,makeEquipment,id){
 if(!finalLootReady(w,p))return{item:null,special:null,reason:'daily'};
 const roll=random();let item=null,special=null;
 if(roll<.10){
  const pick=FINAL_SECRET_SLOTS[Math.min(3,Math.floor(random()*4))],definition=secrets.find(s=>s.id===pick);
  // Taken global treasures and already-owned personal treasures become no drop;
  // their probability is never redistributed into other prizes.
  if(definition?.enabled!==false&&definition&&!p.uniqueLoot?.[pick]&&!ledger.hasUnique(pick,definition.global?'*':p.id)&&(!definition.global||!w.finalDiscoveries?.[pick])){
   special={id:pick,name:definition.name,art:definition.art,global:!!definition.global,equipment:definition.item?{...definition.item,displayName:definition.name}:null};
   if(definition.item)item={...definition.item,id,displayName:definition.name};
   p.uniqueLoot??={};p.uniqueLoot[pick]={at:w.wall,name:definition.name,art:definition.art,global:!!definition.global,equipment:special.equipment||null};w.finalDiscoveries??={};
   w.finalDiscoveries[pick]??={id:pick,name:definition.name,art:definition.art,user:p.id,playerName:p.name,at:w.wall,global:!!definition.global,equipment:special.equipment||null};
  }
 }else if(roll<.40)item=makeEquipment();
 if(item||special){p.finalLootDay=allowanceDay(w.wall);p.finalLootReceipt={at:w.wall,item,special};}
 return{item,special,reason:item||special?'won':'none'};
}
export function publicFinalDiscoveries(w){return Object.fromEntries(Object.entries(w.finalDiscoveries||{}).map(([id,v])=>[id,{id,name:v.name,art:v.art,user:v.user,playerName:v.playerName,at:v.at,global:!!v.global,equipment:v.equipment||null}]));}
