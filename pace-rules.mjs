export const WAREHOUSE_HEADROOM=1.6;
export const MIN_CREW_PER_SHIP=5;
export const PERMIT_BANK_MAX=10,PERMIT_DAILY_MAX=8;
export const PERMIT_RECHARGE=4,PERMIT_CATCHUP_RECHARGE=6,PERMIT_CATCHUP_GAP=3;
export function licenseCost(action,payload){return action==='pesquisa'||action==='edificio'&&(payload.building==='academia'||payload.level>=4)?1:0;}
export function plannedWarehouse(w,id){let level=w.players[id]?.levels?.armazem||0;const jobs=(w.jobs||[]).filter(j=>j.user===id&&j.action==='edificio'&&j.payload.building==='armazem').sort((a,b)=>a.end-b.end);for(const j of jobs)if(j.payload.level===level+1)level++;return level;}
export function spawnAnchor(w,players,rng){
 const seen=w.npcCoverage??={},covered=p=>w.bots.some(b=>Math.abs(b.level-p.levels.sede)<=1&&b.end>w.clock);
 for(const p of players)if(covered(p))seen[p.id]=w.clock;
 const missing=players.filter(p=>!covered(p));
 if(missing.length){missing.sort((a,b)=>(seen[a.id]??0)-(seen[b.id]??0)||a.levels.sede-b.levels.sede||a.id.localeCompare(b.id));return missing[0];}
 return players[Math.floor(rng()*players.length)];
}
