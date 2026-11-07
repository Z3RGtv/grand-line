export const BOSS_ORDERS=Object.freeze(['steady','brace','press']);
export function specialKind(boss){return boss==='crab'?'shell':boss==='captain'?'barrage':boss==='leviathan'?'wave':'quake';}
export function prepareBossSpecial(w,e){
 if(e.specialRule!=='telegraph-v1'||e.phase!=='batalha')return true;
 e.orders??={};const state=e.turnState,nextCycle=!state?1:(state.index>=state.pairs.length?state.cycle+1:state.cycle);
 if(e.special&&nextCycle>e.special.cycle)delete e.special;
 if(nextCycle%3===2&&!e.special){const ships=e.naval.attackers.filter(u=>u.hp>0&&u.crew>0).length;e.special={cycle:nextCycle+1,kind:specialKind(e.boss),readyAt:w.clock+Math.max(10,ships*3),chosen:{},locked:false};}
 if(e.special&&nextCycle===e.special.cycle&&!e.special.locked){if(w.clock<e.special.readyAt){e.next=e.special.readyAt;return false;}e.special.locked=true;e.special.orders={...e.orders};}
 return true;
}
export function battleOrderQuote(w,user,payload){
 const e=Object.values(w.encounters||{}).find(e=>e.id===payload.battle);
 if(!e||e.type!=='boss'||e.phase!=='batalha'||e.specialRule!=='telegraph-v1'||!e.special||e.special.locked||w.clock>=e.special.readyAt)throw Error('A janela de resposta já terminou.');
 if(!w.missions.some(m=>m.user===user&&m.encounter===e.id&&m.phase==='batalha'&&m.troops>0&&Object.values(m.fleet).some(n=>n>0)&&!m.withdrawRequested))throw Error('Só podes dar ordens à tua frota em combate.');
 if(!BOSS_ORDERS.includes(payload.order))throw Error('Ordem inválida.');
 if(e.special.chosen?.[user])throw Error('Já escolheste a resposta a este especial.');
 if((e.orders?.[user]||'steady')===payload.order)throw Error('Essa ordem já está ativa.');
 return e;
}
export function setBattleOrder(w,user,payload){const e=battleOrderQuote(w,user,payload);e.orders??={};e.orders[user]=payload.order;e.special.chosen??={};e.special.chosen[user]=true;}
export function tacticalFactors(special,owner,cycle){if(!special?.locked||special.cycle!==cycle)return{attack:1,damage:1,area:1};const order=special.orders?.[owner]||'steady';return order==='brace'?{attack:.55,damage:.9,area:.75}:order==='press'?{attack:1.2,damage:1.05,area:1.08}:{attack:1,damage:1,area:1};}
