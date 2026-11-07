import{sidePlayers}from'./combat-party.mjs?v=0.27.2&rev=duels1';
import{bossParty,bossMinimumLevel,partyAllows}from'./boss-party.mjs?v=0.27.2';
export const BOSS_RESPAWN_SECONDS=3600,BOSS_ATTACK_INTERVAL=1800;
export const bossAttackRemaining=(w,p)=>Math.max(0,(p?.bossAttackReadyAt||0)-w.clock);
export const BOSS_SITES=[
{id:'I-CORAL',name:'Recife Escarlate',boss:'crab',bossName:'Pinça Rubra',level:3,x:.20,y:.17,width:155,rx:.027,ry:.028,respawn:BOSS_RESPAWN_SECONDS,grade:0,lootSet:'brisa'},
{id:'I-GARRA',name:'Ilhéu das Garras',boss:'crab',bossName:'Casco de Coral',level:3,x:.30,y:.57,width:155,rx:.027,ry:.028,respawn:BOSS_RESPAWN_SECONDS,grade:0,lootSet:'corsario'},
{id:'I-CORSARIO',name:'Enseada dos Saqueadores',boss:'captain',bossName:'Capitão Ferrugem',level:6,x:.74,y:.45,width:205,rx:.036,ry:.035,respawn:BOSS_RESPAWN_SECONDS,grade:1,lootSet:'bastiao'},
{id:'I-CAVEIRA',name:'Cova da Bandeira Rubra',boss:'captain',bossName:'Almirante da Cinza',level:6,x:.37,y:.20,width:205,rx:.036,ry:.035,respawn:BOSS_RESPAWN_SECONDS,grade:1,lootSet:'corsario'},
{id:'I-BASALTO',name:'Bastião de Basalto',boss:'golem',bossName:'Guardião da Âncora',level:9,x:.72,y:.82,width:230,rx:.040,ry:.037,respawn:BOSS_RESPAWN_SECONDS,grade:2,lootSet:'bastiao'},
{id:'I-COROA',name:'Coroa do Abismo',boss:'leviathan',bossName:'Soberano do Abismo',level:15,x:.515,y:.52,width:600,rx:.102,ry:.094,respawn:BOSS_RESPAWN_SECONDS,grade:3,final:true,lootSet:'all'},
{id:'I-MAREAS',name:'Recife das Marés',boss:'crab',bossName:'Mandíbula Rubra',level:3,x:.085,y:.28,width:155,rx:.027,ry:.028,respawn:BOSS_RESPAWN_SECONDS,grade:0,lootSet:'aurora'},
{id:'I-FAROL',name:'Fortaleza do Farol',boss:'captain',bossName:'Capitão da Bruma',level:6,x:.87,y:.55,width:205,rx:.036,ry:.035,respawn:BOSS_RESPAWN_SECONDS,grade:1,lootSet:'brisa'},
{id:'I-ATOL',name:'Atol das Correntes',boss:'golem',bossName:'Guardião da Aurora',level:9,x:.67,y:.245,width:230,rx:.040,ry:.037,respawn:BOSS_RESPAWN_SECONDS,grade:2,lootSet:'aurora'},
{id:'I-FORNALHA',name:'Fornalha dos Corsários',boss:'golem',bossName:'Sentinela Rubra',level:12,x:.215,y:.70,width:230,rx:.040,ry:.037,respawn:BOSS_RESPAWN_SECONDS,grade:2,lootSet:'corsario'}];
export const FINAL_BOSS_CLEARING={"east-10":{"from":{"x":0.39,"y":0.545},"to":{"x":0.355,"y":0.48}},"north-06":{"from":{"x":0.46,"y":0.44},"to":{"x":0.465,"y":0.33}},"north-07":{"from":{"x":0.65,"y":0.44},"to":{"x":0.65,"y":0.38}},"north-09":{"from":{"x":0.57,"y":0.6},"to":{"x":0.55,"y":0.69}}};
export const EXPANDED_BOSS_SITES=BOSS_SITES.slice(0,6);
export const LEGACY_BOSS_SITES=EXPANDED_BOSS_SITES.map(s=>s.final?{...s,width:300,rx:.051,ry:.047}:s);

export function ensureAdventure(w){
for(const p of Object.values(w.players||{})){p.inventory??=[];p.equipment??={};p.equipmentRevision??=0;p.inventoryTier??=0;p.inventoryProgress??=0;p.reports??=[];p.reportSerial??=0;}
if(!w.bossQualificationVersion){for(const p of Object.values(w.players||{})){const wins=[...new Set(p.reports.filter(r=>r.type==='boss'&&BOSS_SITES.some(b=>b.id===r.target&&r.title===b.bossName+' derrotado')).map(r=>r.target))];if(wins.length&&!p.bossWins)p.bossWins=wins;}w.bossQualificationVersion=1;}
if(!w.adventureVersion&&(w.missions?.length||Object.keys(w.encounters||{}).length))return false;
if(!w.adventureVersion)w.bots=[];w.adventureVersion=1;w.bosses??=BOSS_SITES.map(s=>({...s,life:1,respawnAt:0}));
// Change coastlines only after every player voyage and encounter is over.
if(w.adventureGeometryVersion!==3&&!w.missions?.length&&!Object.keys(w.encounters||{}).length){for(const slot of w.slots||[]){const move=FINAL_BOSS_CLEARING[slot.id];if(move&&Math.abs(slot.x-move.from.x)<1e-8&&Math.abs(slot.y-move.from.y)<1e-8)Object.assign(slot,move.to);}for(const site of BOSS_SITES){let b=w.bosses.find(b=>b.id===site.id);if(!b){b={...site,life:1,respawnAt:0};w.bosses.push(b);}else Object.assign(b,{width:site.width,rx:site.rx,ry:site.ry,lootSet:site.lootSet});}w.bots=[];w.nextSpawn=w.clock;w.mapVersion=7;w.adventureGeometryVersion=3;}
// Existing missions retain their target rules until all boss expeditions return.
if(w.bossBalanceVersion!==2&&!w.missions?.some(m=>m.targetType==='boss')&&!Object.values(w.encounters||{}).some(e=>e.type==='boss')){for(const site of BOSS_SITES){const b=w.bosses.find(b=>b.id===site.id);if(b)Object.assign(b,{level:site.level,grade:site.grade});}w.bossBalanceVersion=2;}
// Shorten existing waits by preserving time already spent, once per save.
if(w.bossCadenceVersion!==1){
 for(const b of w.bosses){const old=b.respawn||BOSS_RESPAWN_SECONDS;if(b.respawnAt>w.clock)b.respawnAt=Math.min(b.respawnAt,b.respawnAt-old+BOSS_RESPAWN_SECONDS);b.respawn=BOSS_RESPAWN_SECONDS;if(b.respawnAt&&b.respawnAt<=w.clock&&!w.encounters?.[b.id]){b.respawnAt=0;b.life++;}}
 for(const m of w.missions||[])if(m.targetType==='boss'&&Number.isFinite(m.depart)&&w.players[m.user]){const p=w.players[m.user];p.bossAttackReadyAt=Math.max(p.bossAttackReadyAt||0,m.depart+BOSS_ATTACK_INTERVAL);}
 w.bossCadenceVersion=1;
}
if(w.slots?.length)w.slots[0].adventureSea=w.adventureGeometryVersion>=2?w.adventureGeometryVersion:1;return true;
}
export const bossAlive=(w,b)=>!!b&&!(b.respawnAt>w.clock);
export function maxedCaptain(p){return !!p&&['sede','serraria','pedreira','armazem','estaleiro','muralha'].every(k=>p.levels[k]>=15)&&p.levels.academia>=5&&Object.values(p.tech).every(n=>n>=5);}
export function bossAccess(w,p,b,{arrival=false}={}){
if(!p)return{ok:false,label:'Cria a ilha',kind:'blocked'};
if(!arrival&&!w.live)return{ok:false,label:'Durante a live',kind:'blocked'};
const remaining=bossAttackRemaining(w,p);if(!arrival&&remaining>0)return{ok:false,label:'Próximo ataque em '+Math.ceil(remaining/60)+' min',kind:'personal-cooldown',readyAt:p.bossAttackReadyAt};
const occupied=sidePlayers(w,b.id,'ataque');if(!occupied.has(p.id)&&occupied.size>=3)return{ok:false,label:'3/3 capitães em combate',kind:'full'};
const capacity=bossCapacity(w,b);if(!capacity.freeShips||capacity.freeTroops<5)return{ok:false,label:'Capacidade da ilha ocupada',kind:'full'};
const minimum=bossMinimumLevel(b);
if(p.levels.sede<minimum)return{ok:false,label:'Requer N'+minimum,kind:'blocked'};
if(!partyAllows(bossParty(w,b.id),p.id))return{ok:false,label:'Grupo por convite',kind:'blocked'};
if(b?.final){

 if(!(p.bossWins?.some(id=>(w.bosses||BOSS_SITES).some(site=>site.id===id&&site.level===b.level-3))))return{ok:false,label:'Vence uma ilha N'+(b.level-3),kind:'blocked'};
 if(p.levels.sede<b.level&&!w.missions.some(m=>m.target===b.id&&m.phase!=='regresso'&&(!arrival||m.phase!=='ida')&&m.troops>0&&w.players[m.user]?.levels.sede>=b.level))return{ok:false,label:'Requer capitão N'+b.level,kind:'blocked'};
}
if(!bossAlive(w,b))return{ok:false,label:'A recuperar',kind:'cooldown'};
if(w.encounters?.[b.id]?.phase==='loot')return{ok:false,label:'Saque em curso',kind:'cooldown'};
const delta=b.level-p.levels.sede;return{ok:true,label:delta>=3?'Desafio difícil':delta>0?'Desafio':'Atacar',kind:delta>0?'hard':'ok'};
}
export function bossFormation(w,e,ms){const users=new Set(ms.filter(m=>m.troops>0&&Object.values(m.fleet).some(n=>n>0)).map(m=>m.user));if(!(users.size>0&&users.size<=3))return false;
 const site=w.bosses?.find(b=>b.id===e.target);if(!site||![...users].every(id=>w.players[id]?.levels.sede>=bossMinimumLevel(site)&&partyAllows(e.bossParty||bossParty(w,e.target),id)))return false;
 if(!site.final)return true;
 const party=[...users].map(id=>w.players[id]);return party.every(p=>p?.levels.sede>=site.level-2&&p.bossWins?.some(id=>(w.bosses||BOSS_SITES).some(b=>b.id===id&&b.level===site.level-3)))&&party.some(p=>p.levels.sede>=site.level);}

export function bossUnits(b,{rule='fixed-hit-v1'}={}){const base=[{hp:220,attack:60,count:1},{hp:420,attack:115,count:2},{hp:600,attack:155,count:3},{hp:720,attack:200,count:5}][b.grade],v=b.final&&b.level>=15?{hp:1000,attack:255,count:5}:!b.final&&b.level>=12?{hp:900,attack:220,count:4}:base;return Array.from({length:v.count},(_,i)=>({id:b.id+'-boss-'+i,type:'boss',sprite:i&&b.boss==='captain'?'guard':i&&b.boss==='leviathan'?'tentacle':b.boss,name:i?(b.boss==='leviathan'?'Tentáculo '+i:b.boss==='golem'?'Sentinela '+i:'Guarda '+i):b.bossName,owner:'boss',level:b.level,hp:Math.round(v.hp*1.06*(rule==='duel-v1'?(b.level===6?.5:b.level===3?1.03:1):1)*(rule!=='legacy'&&b.level===9?.82:1)),maxHP:Math.round(v.hp*1.06*(rule==='duel-v1'?(b.level===6?.5:b.level===3?1.03:1):1)*(rule!=='legacy'&&b.level===9?.82:1)),attack:Math.round(v.attack*1.04*(rule==='duel-v1'&&b.level===6?.55:1)*(rule!=='legacy'&&b.level===9?1.28:1)),crew:100,initialCrew:100,capacity:100}));}
export function refreshBosses(w){for(const b of w.bosses||[])if(b.respawnAt&&b.respawnAt<=w.clock&&!w.encounters[b.id]){b.respawnAt=0;b.life++;}}
export function report(w,p,type,title,details={}){if(!p)return null;p.reports??=[];p.reportSerial=(p.reportSerial||0)+1;const r={id:p.reportSerial,at:w.clock,type,title,...structuredClone(details)};p.reports.push(r);p.reports=p.reports.slice(-200);return r;}

export function bossCapacity(w,b){const ships=b.level>=15?30:b.level>=12?24:b.level>=9?18:b.level>=6?12:6,troops=b.level>=9?ships*40:ships*30,ms=(w.missions||[]).filter(m=>m.target===b.id&&m.phase!=='ida'&&m.phase!=='regresso'&&m.troops>0),usedShips=ms.reduce((n,m)=>n+Object.values(m.fleet).reduce((a,v)=>a+v,0),0),usedTroops=ms.reduce((n,m)=>n+m.troops,0);return{ships,troops,usedShips,usedTroops,freeShips:Math.max(0,ships-usedShips),freeTroops:Math.max(0,troops-usedTroops)};}
export function bossFleetAdmission(w,b,m,rules){
 const limit=bossCapacity(w,b),priority=['combate','explorador','cargueiro','pesqueiro'],boats=priority.flatMap(type=>Array.from({length:m.fleet[type]||0},()=>type)),capacity=boats.reduce((n,type)=>n+rules[type].capacity,0);
 for(let count=Math.min(boats.length,limit.freeShips,Math.floor(limit.freeTroops/5));count>0;count--){const chosen=boats.slice(0,count),ownCapacity=chosen.reduce((n,type)=>n+rules[type].capacity,0),crew=Math.min(m.troops,limit.freeTroops,ownCapacity),returnCrew=m.troops-crew,returnCapacity=capacity-ownCapacity;if(crew<count*5||returnCrew>returnCapacity)continue;
 const fleet=Object.fromEntries(Object.keys(m.fleet).map(type=>[type,chosen.filter(x=>x===type).length]));return{fleet,troops:crew,returnFleet:Object.fromEntries(Object.entries(m.fleet).map(([type,n])=>[type,n-fleet[type]])),returnTroops:returnCrew};}
 return null;
}
