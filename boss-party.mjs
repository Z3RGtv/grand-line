// A party belongs to this expedition, never to a client-supplied owner.
export function bossParty(w,target){
 const encounter=w.encounters?.[target];if(encounter?.bossParty)return encounter.bossParty;
 const first=w.missions?.find(m=>m.target===target&&m.phase!=='regresso');
 return first?(first.bossParty||{mode:'open',leader:first.user,invitees:[]}):null;
}
export const partyAllows=(party,user)=>!party||party.mode==='open'||party.leader===user||party.invitees.includes(user);
export function bossPartyOrder(w,p,b,input={}){
 const existing=bossParty(w,b.id);if(existing){if(!partyAllows(existing,p.id))throw Error('Grupo por convite.');return structuredClone(existing);}
 if(!input||Array.isArray(input)||typeof input!=='object')throw Error('Grupo inválido.');
 const mode=input.mode??'open';if(!['open','invite'].includes(mode))throw Error('Grupo inválido.');
 const invitees=mode==='invite'?(input.invitees??[]):[];
 if(!Array.isArray(invitees)||invitees.length>2||new Set(invitees).size!==invitees.length||invitees.some(id=>typeof id!=='string'||id===p.id||!w.players[id]||w.players[id].hibernating||w.players[id].levels.sede<(b.final?10:Math.max(1,b.level-3))))throw Error('Escolhe até dois capitães com nível suficiente.');
 return {mode,leader:p.id,invitees:[...invitees]};
}
const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function bossPartyView(w,p,b){
 const party=bossParty(w,b.id);if(party)return '<div class="boss-party-status" title="Organizador: '+esc(w.players[party.leader]?.name||'Capitão')+'">'+(party.mode==='invite'?'🔒 Por convite':'🌐 Grupo aberto')+'</div>';
 const choices=Object.values(w.players).filter(q=>q.id!==p.id&&!q.hibernating&&q.levels.sede>=(b.final?10:Math.max(1,b.level-3)));
 return '<label>Grupo<select id="send-party-mode"><option value="open">🌐 Aberto</option><option value="invite">🔒 Por convite</option></select></label><fieldset id="boss-invitees" hidden><legend>Convidados · até 2</legend>'+choices.map(q=>'<label><input type="checkbox" data-boss-invite="'+esc(q.id)+'">'+esc(q.name)+' <small>N'+q.levels.sede+'</small></label>').join('')+(choices.length?'':'<small>Sem capitães elegíveis.</small>')+'</fieldset>';
}
