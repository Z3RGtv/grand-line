export const BOSS_SITES=[
{id:'I-CORAL',name:'Recife Escarlate',boss:'crab',bossName:'Pinça Rubra',level:3,x:.20,y:.17,width:155,rx:.027,ry:.028,respawn:7200,grade:0,lootSet:'brisa'},
{id:'I-GARRA',name:'Ilhéu das Garras',boss:'crab',bossName:'Casco de Coral',level:3,x:.30,y:.57,width:155,rx:.027,ry:.028,respawn:7200,grade:0,lootSet:'corsario'},
{id:'I-CORSARIO',name:'Enseada dos Saqueadores',boss:'captain',bossName:'Capitão Ferrugem',level:6,x:.74,y:.45,width:205,rx:.036,ry:.035,respawn:10800,grade:1,lootSet:'bastiao'},
{id:'I-CAVEIRA',name:'Cova da Bandeira Rubra',boss:'captain',bossName:'Almirante da Cinza',level:6,x:.37,y:.20,width:205,rx:.036,ry:.035,respawn:10800,grade:1,lootSet:'corsario'},
{id:'I-BASALTO',name:'Bastião de Basalto',boss:'golem',bossName:'Guardião da Âncora',level:9,x:.72,y:.82,width:230,rx:.040,ry:.037,respawn:14400,grade:2,lootSet:'bastiao'},
{id:'I-COROA',name:'Coroa do Abismo',boss:'leviathan',bossName:'Soberano do Abismo',level:12,x:.515,y:.52,width:600,rx:.102,ry:.094,respawn:21600,grade:3,final:true,lootSet:'all'},
{id:'I-MAREAS',name:'Recife das Marés',boss:'crab',bossName:'Mandíbula Rubra',level:3,x:.085,y:.28,width:155,rx:.027,ry:.028,respawn:7200,grade:0,lootSet:'aurora'},
{id:'I-FAROL',name:'Fortaleza do Farol',boss:'captain',bossName:'Capitão da Bruma',level:6,x:.87,y:.55,width:205,rx:.036,ry:.035,respawn:10800,grade:1,lootSet:'brisa'},
{id:'I-ATOL',name:'Atol das Correntes',boss:'golem',bossName:'Guardião da Aurora',level:9,x:.67,y:.245,width:230,rx:.040,ry:.037,respawn:14400,grade:2,lootSet:'aurora'},
{id:'I-FORNALHA',name:'Fornalha dos Corsários',boss:'golem',bossName:'Sentinela Rubra',level:9,x:.215,y:.70,width:230,rx:.040,ry:.037,respawn:14400,grade:2,lootSet:'corsario'}];
export const FINAL_BOSS_CLEARING={"east-10":{"from":{"x":0.39,"y":0.545},"to":{"x":0.355,"y":0.48}},"north-06":{"from":{"x":0.46,"y":0.44},"to":{"x":0.465,"y":0.33}},"north-07":{"from":{"x":0.65,"y":0.44},"to":{"x":0.65,"y":0.38}},"north-09":{"from":{"x":0.57,"y":0.6},"to":{"x":0.55,"y":0.69}}};
export const EXPANDED_BOSS_SITES=BOSS_SITES.slice(0,6);
export const LEGACY_BOSS_SITES=EXPANDED_BOSS_SITES.map(s=>s.final?{...s,width:300,rx:.051,ry:.047}:s);

export function ensureAdventure(w){
for(const p of Object.values(w.players||{})){p.inventory??=[];p.equipment??={};p.reports??=[];p.reportSerial??=0;}
if(!w.adventureVersion&&(w.missions?.length||Object.keys(w.encounters||{}).length))return false;
if(!w.adventureVersion)w.bots=[];w.adventureVersion=1;w.bosses??=BOSS_SITES.map(s=>({...s,life:1,respawnAt:0}));
// Change coastlines only after every player voyage and encounter is over.
if(w.adventureGeometryVersion!==3&&!w.missions?.length&&!Object.keys(w.encounters||{}).length){for(const slot of w.slots||[]){const move=FINAL_BOSS_CLEARING[slot.id];if(move&&Math.abs(slot.x-move.from.x)<1e-8&&Math.abs(slot.y-move.from.y)<1e-8)Object.assign(slot,move.to);}for(const site of BOSS_SITES){let b=w.bosses.find(b=>b.id===site.id);if(!b){b={...site,life:1,respawnAt:0};w.bosses.push(b);}else Object.assign(b,{width:site.width,rx:site.rx,ry:site.ry,lootSet:site.lootSet});}w.bots=[];w.nextSpawn=w.clock;w.mapVersion=7;w.adventureGeometryVersion=3;}
if(w.slots?.length)w.slots[0].adventureSea=w.adventureGeometryVersion>=2?w.adventureGeometryVersion:1;return true;
}
export const bossAlive=(w,b)=>!!b&&!(b.respawnAt>w.clock);
export function maxedCaptain(p){return !!p&&['sede','serraria','pedreira','armazem','estaleiro','muralha'].every(k=>p.levels[k]>=12)&&p.levels.academia>=4&&Object.values(p.tech).every(n=>n>=4);}
export function bossAccess(w,p,b){
if(!p)return{ok:false,label:'Cria a ilha',kind:'blocked'};
if(!bossAlive(w,b))return{ok:false,label:'A recuperar',kind:'cooldown'};
if(w.encounters?.[b.id]?.phase==='loot')return{ok:false,label:'Saque em curso',kind:'cooldown'};
const delta=b.level-p.levels.sede;return{ok:true,label:delta>=3?'Desafio difícil':delta>0?'Desafio':'Atacar',kind:delta>0?'hard':'ok'};
}
export function bossFormation(w,e,ms){const users=new Set(ms.filter(m=>m.troops>0&&Object.values(m.fleet).some(n=>n>0)).map(m=>m.user));return users.size>0&&users.size<=3;}

export function bossUnits(b){const v=[{hp:260,attack:75,count:1},{hp:420,attack:115,count:2},{hp:600,attack:155,count:3},{hp:760,attack:210,count:5}][b.grade];return Array.from({length:v.count},(_,i)=>({id:b.id+'-boss-'+i,type:'boss',sprite:i&&b.boss==='captain'?'guard':i&&b.boss==='leviathan'?'tentacle':b.boss,name:i?(b.boss==='leviathan'?'Tentáculo '+i:b.boss==='golem'?'Sentinela '+i:'Guarda '+i):b.bossName,owner:'boss',level:b.level,hp:v.hp,maxHP:v.hp,attack:v.attack,crew:100,initialCrew:100,capacity:100}));}
export function refreshBosses(w){for(const b of w.bosses||[])if(b.respawnAt&&b.respawnAt<=w.clock&&!w.encounters[b.id]){b.respawnAt=0;b.life++;}}
export function report(w,p,type,title,details={}){if(!p)return null;p.reports??=[];p.reportSerial=(p.reportSerial||0)+1;const r={id:p.reportSerial,at:w.clock,type,title,...structuredClone(details)};p.reports.push(r);p.reports=p.reports.slice(-200);return r;}
