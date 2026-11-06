import{EQUIPMENT_SLOTS,ITEM_TYPES,bestSetSlots}from'./equipment.mjs?v=0.27.1';
export const equipmentSlots=equipment=>Object.fromEntries(Object.keys(EQUIPMENT_SLOTS).map(slot=>[slot,equipment?.[slot]??null]));
export const equipmentSignature=equipment=>JSON.stringify(equipmentSlots(equipment));
export const equipmentRevision=p=>p.equipmentRevision??0;
export function createEquipmentDraft(p){return{user:p.id,base:equipmentSignature(p.equipment),revision:equipmentRevision(p),slots:equipmentSlots(p.equipment),pending:null,confirmed:true};}
export const draftChanged=d=>equipmentSignature(d.slots)!==d.base;
export function selectEquipment(d,p,{item,slot,set,reset}={}){
 let slots={...d.slots};
 if(reset)slots=equipmentSlots(p.equipment);
 else if(set){const best=bestSetSlots(p,set);if(!best)throw Error('Ainda não tens as quatro peças deste conjunto.');slots=equipmentSlots(best);}
 else if(item){
  const i=p.inventory.find(i=>i.id===item);
  if(!i)throw Error('Esse item já não está disponível.');
  const compatibleSlot=ITEM_TYPES[i.type].slot;
  if(slot && slot!==compatibleSlot)throw Error('Este item encaixa em '+EQUIPMENT_SLOTS[compatibleSlot]+'.');
  slots[compatibleSlot]=i.id;
 }
 else if(Object.hasOwn(EQUIPMENT_SLOTS,slot))slots[slot]=null;
 else throw Error('Seleção inválida.');
 return{...d,slots,pending:null,confirmed:equipmentSignature(slots)===d.base};
}
export function equipmentDraftOrder(d){return{kind:'gestao',action:'equipar',payload:{slots:{...d.slots},expectedRevision:d.revision}};}
export function markEquipmentPending(d,code){return{...d,pending:{code,signature:equipmentSignature(d.slots)},confirmed:false};}
export function reconcileEquipmentDraft(d,p,order){
 if(!d||d.user!==p.id)return createEquipmentDraft(p);
 const actual=equipmentSignature(p.equipment),revision=equipmentRevision(p);
 if(d.pending&&order?.code===d.pending.code&&['canceled','expired'].includes(order.status))return{...d,pending:null,confirmed:false};
 if(actual!==d.base||revision!==d.revision){
  const confirmed=!!d.pending&&actual===d.pending.signature;
  if(confirmed||!draftChanged(d))return createEquipmentDraft(p);
  return{...d,base:actual,revision,pending:null,confirmed:equipmentSignature(d.slots)===actual};
 }
 if(d.pending&&order?.code===d.pending.code&&order.status==='fulfilled')return equipmentSignature(d.slots)===actual?createEquipmentDraft(p):{...d,pending:null};
 return d;
}
