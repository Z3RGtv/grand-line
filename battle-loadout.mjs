import{equippedItems,validItem,EQUIPMENT_CAPS}from'./equipment.mjs?v=0.27.0';
import{defaultFlag}from'./flags.mjs?v=0.27.0';
export function combatLoadout(p){return equippedItems(p).map(({type,rarity,value,displayName})=>({type,rarity,value,...(displayName?{displayName}:{})}));}
const items=list=>(list||[]).filter(validItem).slice(0,4).map(({type,rarity,value,displayName})=>({type,rarity,value,...(displayName?{displayName}:{})}));
const stats=gear=>Object.fromEntries(Object.entries(EQUIPMENT_CAPS).map(([key,cap])=>[key,Math.min(cap,Math.max(0,Number(gear?.[key])||0))]));
const count=fleet=>Object.values(fleet||{}).reduce((n,v)=>n+(Number.isFinite(v)?Math.max(0,v):0),0);
export function battleParticipants(w,e){
 if(!e||e.outcome)return e?.participants?structuredClone(e.participants):[];
 const grouped=new Map();
 for(const [role,ids]of[['ataque',e.attackers||[]],['defesa',e.defenders||[]]])for(const mission of ids){const m=w.missions.find(m=>m.id===mission);if(!m)continue;const key=role+':'+m.user,p=w.players[m.user],old=grouped.get(key);if(old){old.troops+=m.troops||0;old.initialTroops+=m.initialTroops??m.troops??0;old.ships+=count(m.fleet);old.initialShips+=count(m.initialFleet||m.fleet);continue;}grouped.set(key,{user:m.user,name:p?.name||'Capitão',flag:m.flag||p?.flag||defaultFlag(m.user),role,level:m.level||p?.levels.sede||1,troops:m.troops||0,initialTroops:m.initialTroops??m.troops??0,ships:count(m.fleet),initialShips:count(m.initialFleet||m.fleet),items:items(m.gearItems??combatLoadout(p)),bonuses:stats(m.gear)});}
 if(e.type==='player'){const p=w.players[e.target];grouped.set('defesa:'+e.target,{user:e.target,name:e.homeName||p?.name||'Defensor',flag:e.homeFlag||p?.flag||defaultFlag(e.target),role:'defesa',level:e.homeLevel||p?.levels.sede||1,troops:e.homeTroops||0,initialTroops:e.initialHomeTroops??e.homeTroops??0,ships:null,initialShips:null,items:items(e.homeGearItems??combatLoadout(p)),bonuses:stats(e.homeGear)});}
 return [...grouped.values()];
}
