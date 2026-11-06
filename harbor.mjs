import{MAX_RESEARCH_LEVEL}from'./progression.mjs?v=0.27.2';
import{storageCapacityAt}from'./economy.mjs?v=0.27.2';
import{workerCount,workerCapacity,workerState}from'./workers.mjs?v=0.27.2';
import{populationState,populationCapacity}from'./population.mjs?v=0.27.2';
export const hasWall=p=>(p?.levels?.muralha||1)>=2;
export const storageCapacity=p=>p?storageCapacityAt(p.levels.armazem):0;
export const sailorCapacity=populationCapacity;
export const defendingTroops=p=>hasWall(p)?Math.max(0,p.garrison||0):0;
export function sailorState(w,p){if(!p)return{total:0,capacity:0,used:0,free:0,defending:0,deployed:0,pending:0};const deployed=(w.missions||[]).filter(m=>m.user===p.id).reduce((n,m)=>n+(m.troops||0),0),defending=defendingTroops(p),pending=(w.jobs||[]).filter(j=>j.user===p.id&&['tropas','recuperar'].includes(j.action)).reduce((n,j)=>n+j.payload.count,0),total=(p.troops||0)+deployed,pop=populationState(w,p);return{total,capacity:total+pending+pop.free,used:defending+deployed,free:Math.max(0,(p.troops||0)-defending),defending,deployed,pending};}
export function harborMetrics(w,p){const sailors=sailorState(w,p),workers=workerState(p,w.clock),population=populationState(w,p);return{storage:storageCapacity(p),population,sailors,workers:{total:workerCount(p),capacity:population.workers+population.pendingWorkers+population.workerRoom,used:workers.active?workers.woodWorkers+workers.stoneWorkers:0,pending:(w.jobs||[]).filter(j=>j.user===p?.id&&j.action==='trabalhadores').reduce((n,j)=>n+j.payload.count,0)}};}
// Old saves started with guards despite having no physical wall. Release those
// guards without removing sailors. Do not rewrite an encounter already in flight.
export function migrateHarbor(w){for(const p of Object.values(w.players||{})){p.levels.academia??=Math.min(MAX_RESEARCH_LEVEL,Math.max(0,...Object.values(p.tech||{})));p.damage.academia??=0;}for(const p of Object.values(w.players||{}))if(!hasWall(p)&&!w.encounters?.[p.id]){p.garrison=0;if(p.damage)p.damage.muralha=0;}return w;}
