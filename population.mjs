export const WORKER_SPACE=2,SAILOR_SPACE=1;
export const populationCapacity=p=>p?100+40*(p.levels.sede-1):0;
export const civilianCount=p=>p?Math.max(20,Number.isInteger(p.workers)?p.workers:20):0;
export const RECRUITMENT_TIERS=Object.freeze({trabalhadores:{base:100,step:25,percent:25,resources:{wood:10,stone:5,food:2}},tropas:{base:200,step:50,percent:10,resources:{wood:8,stone:5,food:3}}});
// Count the current population, including voyages and reserved recruitment or
// recovery. Losses lower the tier again; this is not a lifetime hiring tax.
export function recruitmentCost(w,p,action,count){
 const rule=RECRUITMENT_TIERS[action];if(!rule||!Number.isInteger(count)||count<1||count>(action==='trabalhadores'?20:60))throw Error('Recrutamento inválido.');
 const pop=populationState(w,p),current=action==='trabalhadores'?pop.workers+pop.pendingWorkers:pop.sailors+pop.pendingSailors;
 const premium=n=>n<=rule.base?0:Math.ceil((n-rule.base)/rule.step)*rule.percent;
 let extra=0;for(let n=current+1;n<=current+count;n++)extra+=premium(n);
 const units=count+extra/100;
 return{resources:Object.fromEntries(Object.entries(rule.resources).map(([k,n])=>[k,Math.ceil(n*units-1e-9)])),costMultiplier:units/count,first:current+1,last:current+count,minPremium:premium(current+1),maxPremium:premium(current+count)};
}
export function populationState(w,p){
 if(!p)return{capacity:0,used:0,reserved:0,free:0,workers:0,sailors:0,pendingWorkers:0,pendingSailors:0,workerRoom:0,sailorRoom:0};
 const workers=civilianCount(p),sailors=(p.troops||0)+(w.missions||[]).filter(m=>m.user===p.id).reduce((n,m)=>n+(m.troops||0),0),jobs=(w.jobs||[]).filter(j=>j.user===p.id);
 const pendingWorkers=jobs.filter(j=>j.action==='trabalhadores').reduce((n,j)=>n+j.payload.count,0),pendingSailors=jobs.filter(j=>['tropas','recuperar'].includes(j.action)).reduce((n,j)=>n+j.payload.count,0);
 const capacity=populationCapacity(p),used=workers*WORKER_SPACE+sailors*SAILOR_SPACE,reserved=pendingWorkers*WORKER_SPACE+pendingSailors*SAILOR_SPACE,free=Math.max(0,capacity-used-reserved);
 return{capacity,used,reserved,free,workers,sailors,pendingWorkers,pendingSailors,workerRoom:Math.floor(free/WORKER_SPACE),sailorRoom:Math.floor(free/SAILOR_SPACE)};
}
