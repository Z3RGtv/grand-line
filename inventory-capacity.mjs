export const INVENTORY_CAPACITIES=[8,10,12,14,16];
export const INVENTORY_PAYMENTS=[1,2,2,3];
export function inventoryExpansion(p){
 const tier=p?.inventoryTier??0,paid=p?.inventoryProgress??0;
 if(!Number.isInteger(tier)||tier<0||tier>=INVENTORY_CAPACITIES.length||!Number.isInteger(paid)||paid<0||paid>=(INVENTORY_PAYMENTS[tier]??1))throw Error('Capacidade do inventário inválida.');
 return{tier,paid,capacity:INVENTORY_CAPACITIES[tier],next:INVENTORY_CAPACITIES[tier+1]??null,required:INVENTORY_PAYMENTS[tier]??0,max:tier===INVENTORY_CAPACITIES.length-1};
}
export const inventoryCapacity=p=>inventoryExpansion(p).capacity;
export function expansionOrder(p,payload){
 const e=inventoryExpansion(p);
 if(e.max)throw Error('Inventário no máximo.');
 if(payload.tier!==e.tier||payload.payment!==e.paid)throw Error('O inventário já mudou. Prepara um novo código para a próxima prestação.');
 const paid=e.paid+1,complete=paid===e.required;
 return{inventoryTier:e.tier+(complete?1:0),inventoryProgress:complete?0:paid,complete,capacity:complete?e.next:e.capacity,paid,required:e.required,next:e.next};
}
