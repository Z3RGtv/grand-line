import{civilianCount,populationCapacity}from'./population.mjs?v=0.17.3';
import{productionBatch}from'./economy.mjs?v=0.17.3';
export const WORKER_POOL=20; // Starting civilians; separate from sailors.
export const WORK_SHIFT_SECONDS=2*60*60;
export const PRODUCTION_MODEL='batches-v2';
export const workerCount=civilianCount;
export const workerCapacity=p=>Math.floor(populationCapacity(p)/2);
const assignment=p=>p?.work||(p?.farmUntil>0?{woodWorkers:10,stoneWorkers:10,start:0,until:p.farmUntil}:null);
export function productionCycle(p,resource,workers,clock=0,model=PRODUCTION_MODEL){
 const building=resource==='wood'?'serraria':'pedreira',level=p.levels[building];
 const amount=Math.max(0,Math.floor((model==='batches-v1'?Math.round(20*1.5**(level-1)):productionBatch(level))*(1-(p.damage[building]||0)/100)));
 const interval=workers>0?(model==='batches-v1'?6000:1200)/workers:0,w=assignment(p),age=Math.max(0,clock-(w?.start||0));
 const nextIn=interval?Math.max(0,(Math.floor(age/interval+1e-9)+1)*interval-age):0;
 return{workers,level,amount,interval,nextIn,perHour:interval?amount*3600/interval:0};
}
export function workerRates(p,woodWorkers,stoneWorkers,model=PRODUCTION_MODEL){return{wood:productionCycle(p,'wood',woodWorkers,0,model).perHour,stone:productionCycle(p,'stone',stoneWorkers,0,model).perHour};}
function legacyRates(p,woodWorkers,stoneWorkers){const factor=k=>(1-(p.damage[k]||0)/100)*1.1**(p.levels[k]-1);return{wood:150*p.levels.serraria*factor('serraria')*woodWorkers/10,stone:110*p.levels.pedreira*factor('pedreira')*stoneWorkers/10};}
export function workerState(p,clock){const w=assignment(p),active=!!w&&w.until>clock,total=workerCount(p),legacy=!!w&&!['batches-v1','batches-v2'].includes(w.model);return{active,total,capacity:workerCapacity(p),available:active?total-w.woodWorkers-w.stoneWorkers:total,woodWorkers:active?w.woodWorkers:0,stoneWorkers:active?w.stoneWorkers:0,start:w?.start||0,until:active?w.until:0,remaining:active?w.until-clock:0,model:w?.model||PRODUCTION_MODEL,legacy,gathered:w?.gathered||{wood:0,stone:0},rates:active?(legacy?legacyRates:workerRates)(p,w.woodWorkers,w.stoneWorkers,w.model):{wood:0,stone:0},cycles:p?{wood:productionCycle(p,'wood',active?w.woodWorkers:0,clock,w?.model),stone:productionCycle(p,'stone',active?w.stoneWorkers:0,clock,w?.model)}:{}};}
export function workOrder(p,clock,payload={}){if(workerState(p,clock).active)throw Error('Os trabalhadores já estão num turno. Espera pelo regresso.');const total=workerCount(p),defaults=payload.woodWorkers===undefined&&payload.stoneWorkers===undefined;const woodWorkers=defaults?Math.ceil(total/2):payload.woodWorkers??0,stoneWorkers=defaults?Math.floor(total/2):payload.stoneWorkers??0;if(!Number.isInteger(woodWorkers)||!Number.isInteger(stoneWorkers)||woodWorkers<0||stoneWorkers<0||woodWorkers+stoneWorkers<1||woodWorkers+stoneWorkers>total)throw Error(`Distribui entre 1 e ${total} trabalhadores, sem ultrapassar os ${total} disponíveis.`);return{woodWorkers,stoneWorkers,seconds:WORK_SHIFT_SECONDS};}
export function productionBetween(p,from,to){const w=assignment(p);if(!w)return{wood:0,stone:0};const a=Math.max(from,w.start||0),b=Math.min(to,w.until);if(b<=a)return{wood:0,stone:0};if(!['batches-v1','batches-v2'].includes(w.model)){const rates=legacyRates(p,w.woodWorkers,w.stoneWorkers);return{wood:rates.wood*(b-a)/3600,stone:rates.stone*(b-a)/3600};}const result={wood:0,stone:0};for(const resource of ['wood','stone']){const c=productionCycle(p,resource,w[resource+'Workers'],0,w.model);if(c.interval){const batches=Math.floor((b-w.start)/c.interval+1e-9)-Math.floor((a-w.start)/c.interval+1e-9);result[resource]=Math.max(0,batches)*c.amount;}}return result;}
