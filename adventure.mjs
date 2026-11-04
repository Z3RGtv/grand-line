export const BOSS_SITES=[
{id:'I-CORAL',name:'Recife Escarlate',boss:'crab',bossName:'Pinça Rubra',level:3,x:.20,y:.17,width:155,rx:.027,ry:.028,respawn:7200,grade:0},
{id:'I-GARRA',name:'Ilhéu das Garras',boss:'crab',bossName:'Casco de Coral',level:3,x:.30,y:.57,width:155,rx:.027,ry:.028,respawn:7200,grade:0},
{id:'I-CORSARIO',name:'Enseada dos Saqueadores',boss:'captain',bossName:'Capitão Ferrugem',level:6,x:.74,y:.45,width:205,rx:.036,ry:.035,respawn:10800,grade:1},
{id:'I-CAVEIRA',name:'Cova da Bandeira Rubra',boss:'captain',bossName:'Almirante da Cinza',level:6,x:.37,y:.20,width:205,rx:.036,ry:.035,respawn:10800,grade:1},
{id:'I-BASALTO',name:'Bastião de Basalto',boss:'golem',bossName:'Guardião da Âncora',level:9,x:.72,y:.82,width:230,rx:.040,ry:.037,respawn:14400,grade:2},
{id:'I-COROA',name:'Coroa do Abismo',boss:'leviathan',bossName:'Soberano do Abismo',level:12,x:.515,y:.52,width:300,rx:.051,ry:.047,respawn:21600,grade:3,final:true}];
export function ensureAdventure(w){
for(const p of Object.values(w.players||{})){p.inventory??=[];p.equipment??={};p.reports??=[];p.reportSerial??=0;}
if(!w.adventureVersion&&(w.missions?.length||Object.keys(w.encounters||{}).length))return false;
if(!w.adventureVersion)w.bots=[];w.adventureVersion=1;w.bosses??=BOSS_SITES.map(s=>({...s,life:1,respawnAt:0}));if(w.slots?.length)w.slots[0].adventureSea=1;return true;
}
export const bossAlive=(w,b)=>!!b&&!(b.respawnAt>w.clock);
export function maxedCaptain(p){return !!p&&['sede','serraria','pedreira','armazem','estaleiro','muralha'].every(k=>p.levels[k]>=12)&&p.levels.academia>=4&&Object.values(p.tech).every(n=>n>=4);}
export function bossAccess(w,p,b){
if(!p)return{ok:false,label:'Cria a ilha',kind:'blocked'};
if(!bossAlive(w,b))return{ok:false,label:'A recuperar',kind:'cooldown'};
if(w.encounters?.[b.id]?.phase==='loot')return{ok:false,label:'Saque em curso',kind:'cooldown'};
if(b.final){const a=w.alliances[p.alliance],group=!!a&&a.members.filter(id=>w.players[id]&&!w.players[id].hibernating&&w.players[id].levels.sede>=9).length===3;return maxedCaptain(p)||group?{ok:true,label:maxedCaptain(p)?'Desafio final':'Reúne 3 aliados N9+',kind:'hard'}:{ok:false,label:'Máximo ou 3 aliados N9+',kind:'high'};}
const delta=b.level-p.levels.sede;return Math.abs(delta)<=3?{ok:true,label:delta>0?'Desafio':'Atacar',kind:delta>0?'hard':'ok'}:{ok:false,label:delta>0?'Nível superior':'Nível inferior',kind:delta>0?'high':'low'};
}
export function bossFormation(w,e,ms){const b=w.bosses.find(b=>b.id===e.target);if(!b?.final)return true;const players=[...new Set(ms.filter(m=>m.troops>0&&Object.values(m.fleet).some(n=>n>0)).map(m=>m.user))].map(id=>w.players[id]);if(players.some(maxedCaptain))return true;return players.some(p=>p.alliance&&players.filter(q=>q.alliance===p.alliance&&q.levels.sede>=9&&ms.some(m=>m.user===q.id&&m.troops>=80&&(m.fleet.combate||0)>=2)).length>=3);}
export function bossUnits(b){const v=[{hp:260,attack:75,count:1},{hp:420,attack:115,count:2},{hp:600,attack:155,count:3},{hp:760,attack:210,count:5}][b.grade];return Array.from({length:v.count},(_,i)=>({id:b.id+'-boss-'+i,type:'boss',sprite:i&&b.boss==='captain'?'guard':i&&b.boss==='leviathan'?'tentacle':b.boss,name:i?(b.boss==='leviathan'?'Tentáculo '+i:b.boss==='golem'?'Sentinela '+i:'Guarda '+i):b.bossName,owner:'boss',level:b.level,hp:v.hp,maxHP:v.hp,attack:v.attack,crew:100,initialCrew:100,capacity:100}));}
export function refreshBosses(w){for(const b of w.bosses||[])if(b.respawnAt&&b.respawnAt<=w.clock&&!w.encounters[b.id]){b.respawnAt=0;b.life++;}}
export function report(w,p,type,title,details={}){if(!p)return null;p.reports??=[];p.reportSerial=(p.reportSerial||0)+1;const r={id:p.reportSerial,at:w.clock,type,title,...structuredClone(details)};p.reports.push(r);p.reports=p.reports.slice(-200);return r;}
