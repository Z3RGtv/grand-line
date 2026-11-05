export const WORKER_SPACE=2,SAILOR_SPACE=1;
export const populationCapacity=p=>p?100+40*(p.levels.sede-1):0;
export const civilianCount=p=>p?Math.max(20,Number.isInteger(p.workers)?p.workers:20):0;
export function populationState(w,p){
 if(!p)return{capacity:0,used:0,reserved:0,free:0,workers:0,sailors:0,pendingWorkers:0,pendingSailors:0,workerRoom:0,sailorRoom:0};
 const workers=civilianCount(p),sailors=(p.troops||0)+(w.missions||[]).filter(m=>m.user===p.id).reduce((n,m)=>n+(m.troops||0),0),jobs=(w.jobs||[]).filter(j=>j.user===p.id);
 const pendingWorkers=jobs.filter(j=>j.action==='trabalhadores').reduce((n,j)=>n+j.payload.count,0),pendingSailors=jobs.filter(j=>['tropas','recuperar'].includes(j.action)).reduce((n,j)=>n+j.payload.count,0);
 const capacity=populationCapacity(p),used=workers*WORKER_SPACE+sailors*SAILOR_SPACE,reserved=pendingWorkers*WORKER_SPACE+pendingSailors*SAILOR_SPACE,free=Math.max(0,capacity-used-reserved);
 return{capacity,used,reserved,free,workers,sailors,pendingWorkers,pendingSailors,workerRoom:Math.floor(free/WORKER_SPACE),sailorRoom:Math.floor(free/SAILOR_SPACE)};
}
