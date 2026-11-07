import{equippedItems,FINAL_EQUIPMENT}from'./equipment.mjs?v=0.27.2&rev=progress1';
import{inventoryCapacity}from'./inventory-capacity.mjs?v=0.27.2';
import{report}from'./adventure.mjs?v=0.27.2&rev=duels1';

export const ABYSS_COPY_LIMIT=3;
export const islandTheftChance=p=>.30-.03*Math.min(5,Math.max(0,p.levels?.academia||0));
export function deployedEquipment(w,user){return new Set((w.missions||[]).filter(m=>m.user===user&&!m.equipmentLost).flatMap(m=>m.equipmentIds||[]));}
export function fleetEquipment(w,p,use=true){
 if(!use)return{};
 const slots=p.attackEquipment||{},busy=deployedEquipment(w,p.id);
 if(Object.values(slots).some(id=>busy.has(id)))throw Error('O equipamento da frota está em viagem. Desmarca «Levar equipamento» ou espera pelo regresso.');
 return slots;
}
function removeItem(p,id){
 let item;
 for(const key of['inventory','lootStash']){const found=(p[key]||[]).find(i=>i.id===id);if(found){if(item)throw Error('Equipamento duplicado.');item=found;p[key]=p[key].filter(i=>i.id!==id);}}
 if(!item)return null;
 for(const key of['equipment','attackEquipment'])for(const[slot,value]of Object.entries(p[key]||{}))if(value===id)delete p[key][slot];
 p.equipmentRevision=(p.equipmentRevision||0)+1;
 return item;
}
export function storeCapturedItem(p,item){
 // Captured relics must survive a full bag. The stash never destroys equipment.
 if((p.inventory||[]).length<inventoryCapacity(p))(p.inventory??=[]).push(item);
 else(p.lootStash??=[]).push(item);
}
export function loseFleetEquipment(w,m,{recipient=null,battle=null}={}){
 if(m.equipmentLost||m.troops>0&&Object.values(m.fleet||{}).some(n=>n>0))return[];
 const p=w.players[m.user],lost=(m.equipmentIds||[]).map(id=>removeItem(p,id)).filter(Boolean);
 m.equipmentLost=true;
 if(lost.length){
  report(w,p,'item-loss','Equipamento perdido com a frota',{items:lost,battle,target:m.target,capturedBy:recipient?.id||null});
  if(recipient){for(const item of lost)storeCapturedItem(recipient,item);report(w,recipient,'item-capture','Equipamento capturado',{items:lost,battle,from:p.id});}
 }
 return lost;
}
export function stealIslandEquipment(w,p,attackers,random,battle){
 const candidates=attackers.filter(m=>m.troops>0&&Object.values(m.fleet||{}).some(n=>n>0));
 if(!candidates.length)return[];
 const stolen=[];
 const away=deployedEquipment(w,p.id),exposed=new Map(equippedItems(p).map(i=>[i.id,i]));
 // A scarce relic cannot be made permanently unstealable by hoarding it in storage.
 for(const item of[...(p.inventory||[]),...(p.lootStash||[])])if(FINAL_EQUIPMENT.includes(item.type)&&!away.has(item.id))exposed.set(item.id,item);
 for(const item of exposed.values())if(random()<islandTheftChance(p)){
  const weight=candidates.reduce((n,m)=>n+Math.max(1,m.contribution||m.initialTroops||1),0);let pick=random()*weight;
  const recipient=candidates.find(m=>(pick-=Math.max(1,m.contribution||m.initialTroops||1))<0)||candidates.at(-1);
  const removed=removeItem(p,item.id);if(!removed)continue;
  (recipient.stolenItems??=[]).push(removed);stolen.push(removed);
  report(w,w.players[recipient.user],'item-plunder','Equipamento saqueado · a caminho da base',{items:[removed],battle,target:p.id,mission:recipient.id});
 }
 if(stolen.length)report(w,p,'item-loss','Equipamento roubado da ilha',{items:stolen,battle,target:p.id});
 return stolen;
}
export function deliverCapturedEquipment(w,p,m){
 for(const item of m.stolenItems||[]){storeCapturedItem(p,item);report(w,p,'item-capture','Equipamento saqueado recebido',{items:[item],target:m.target});}
 delete m.stolenItems;
}
export function abyssCopies(w,type){
 const ids=new Set();
 for(const p of Object.values(w.players||{}))for(const i of[...(p.inventory||[]),...(p.lootStash||[]),p.pendingUniqueItem].filter(Boolean))if(i.type===type)ids.add(i.id);
 for(const m of w.missions||[])for(const i of[m.pendingReward?.item,...(m.stolenItems||[])].filter(Boolean))if(i.type===type)ids.add(i.id);
 return ids.size;
}
export function publicRelics(w){
 const result=Object.fromEntries(FINAL_EQUIPMENT.map(type=>[type,{type,limit:ABYSS_COPY_LIMIT,count:abyssCopies(w,type),holders:[]}]));
 const seen=new Set();
 const add=(user,i)=>{if(!result[i?.type]||seen.has(i.id))return;seen.add(i.id);result[i.type].holders.push({user,name:w.players[user]?.name||'Capitão'});};
 for(const p of Object.values(w.players||{}))for(const i of[...(p.inventory||[]),...(p.lootStash||[]),p.pendingUniqueItem])add(p.id,i);
 for(const m of w.missions||[])for(const i of m.stolenItems||[])add(m.user,i);
 // Pending boss rewards reserve a copy, but their identity stays hidden until home.
 for(const relic of Object.values(result))relic.count=relic.holders.length;
 return result;
}
