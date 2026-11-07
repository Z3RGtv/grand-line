export const MAX_BATTLE_PLAYERS=3;
export function assertCanRejoin(w,user,targetId){
 const encounter=w.encounters[targetId],wreck=w.wrecks?.find(r=>r.id===targetId);
 if(encounter?.withdrawnUsers?.includes(user)||wreck?.excludedCollectors?.includes(user))throw Error('Já pediste retirada deste encontro.');
}
const active=m=>m.phase!=='regresso';
export const arrivalSlots=(w,targetId)=>!!w.bosses?.some(b=>b.id===targetId);
const occupies=(w,m)=>active(m)&&(!arrivalSlots(w,m.target)||(m.phase!=='ida'&&m.troops>0&&Object.values(m.fleet||{}).some(n=>n>0)));
export function sidePlayers(w,targetId,side){const users=new Set(side==='defesa'&&w.players[targetId]?[targetId]:[]);for(const id of w.missions.filter(m=>m.target===targetId&&occupies(w,m)&&(m.role||'ataque')===side).map(m=>m.user))users.add(id);return users;}
export function participation(w,p,targetId,chosen){if(chosen!==undefined&&!['ataque','defesa'].includes(chosen))throw Error('Escolhe Atacar ou Defender.');const defender=w.players[targetId];if(!defender){if(chosen==='defesa')throw Error('Este alvo só permite ataque ou recolha.');return{role:'ataque',automatic:true};}let forced=null;if(p.alliance&&p.alliance===defender.alliance)forced='defesa';else if(p.alliance&&w.missions.some(m=>m.target===targetId&&active(m)&&(m.role||'ataque')==='ataque'&&w.players[m.user]?.alliance===p.alliance))forced='ataque';if(forced&&chosen&&chosen!==forced)throw Error(forced==='defesa'?'És aliado do defensor: deves defender.':'És aliado do atacante: deves atacar.');const role=forced||chosen||'ataque';if(role==='defesa'&&(!p.alliance||p.alliance!==defender.alliance))throw Error('Só podes defender membros da tua aliança.');return{role,automatic:!!forced};}
export function assertParticipation(w,p,targetId,chosen){const choice=participation(w,p,targetId,chosen);if(w.wrecks?.some(r=>r.id===targetId))return choice;const other=choice.role==='ataque'?'defesa':'ataque',own=sidePlayers(w,targetId,choice.role);if(sidePlayers(w,targetId,other).has(p.id))throw Error('Já estás no outro lado deste encontro.');if(!own.has(p.id)&&own.size>=MAX_BATTLE_PLAYERS)throw Error('Máximo de 3 jogadores neste lado do encontro.');return choice;}
export function combatSummary(w,targetId){return{attack:[...sidePlayers(w,targetId,'ataque')],defense:[...sidePlayers(w,targetId,'defesa')],limit:MAX_BATTLE_PLAYERS};}
