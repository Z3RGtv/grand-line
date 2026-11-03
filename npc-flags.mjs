// NPC identity describes the fleet, independently of level, route and dice results.
export const NPC_FLAGS=Object.freeze({
 cargo:Object.freeze({id:'cargo',label:'Carga',flag:Object.freeze({field:'#D9B65F',accent:'#102C3A',symbol:'diamond',pattern:'plain'})}),
 combat:Object.freeze({id:'combat',label:'Combate',flag:Object.freeze({field:'#A72E42',accent:'#F6F1DD',symbol:'swords',pattern:'plain'})})
});
export function npcProfile(npc){
 const fleet=npc?.fleet;
 if(fleet&&Object.values(fleet).some(n=>Number(n)>0))return Number(fleet.combate)>0?NPC_FLAGS.combat:NPC_FLAGS.cargo;
 const units=Array.isArray(npc?.naval)?npc.naval:npc?.naval?.defenders;
 if(units?.length)return units.some(u=>u.type==='combate')?NPC_FLAGS.combat:NPC_FLAGS.cargo;
 return Object.hasOwn(NPC_FLAGS,npc?.npcRole)?NPC_FLAGS[npc.npcRole]:NPC_FLAGS.cargo;
}
export const npcFlag=npc=>({...npcProfile(npc).flag});
function assign(npc,source=npc){const profile=npcProfile(source),flag=npc.flag;const changed=npc.npcRole!==profile.id||!flag||Object.keys(flag).length!==4||Object.entries(profile.flag).some(([k,v])=>flag[k]!==v);if(changed){npc.npcRole=profile.id;npc.flag={...profile.flag};}return Number(changed);}
export function standardizeNpcFlags(w){
 let changed=0;for(const b of w.bots||[])changed+=assign(b);
 for(const r of w.wrecks||[]){let source=r;if(!r.npcRole){source=(w.bots||[]).find(b=>b.id===r.sourceId)||Object.values(w.encounters||{}).find(e=>e.type==='bot'&&e.target===r.sourceId)||(w.battleHistory||[]).find(e=>e.type==='bot'&&e.target===r.sourceId)||r;}changed+=assign(r,source);}
 return changed;
}
