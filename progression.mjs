export const MAX_LEVEL=15,MAX_RESEARCH_LEVEL=5;
// Preserve the first four levels; spread the old upper resource curve over eleven steps.
export const economyLevel=n=>n<=4?n:4+(n-4)*8/11;
export const BUILDING_CAPS={sede:15,serraria:15,pedreira:15,armazem:15,estaleiro:15,muralha:15,academia:5};
export const BUILDING_MINUTES=[0,0,2,5,10,15,20,25,35,45,55,65,80,95,110,120];
export function buildingSeconds(building,level){return building==='academia'?[0,180,600,1500,2700,3600][level]:60*BUILDING_MINUTES[level];}
export const academyAtHeadquarters=n=>Math.min(MAX_RESEARCH_LEVEL,Math.floor(n/3));
export const maxBuildingLevel=key=>BUILDING_CAPS[key]||MAX_LEVEL;
export const buildingTier=(key,level)=>key==='academia'?Math.min(3,Math.max(1,level)):Math.min(3,Math.ceil(Math.max(1,level)/4));
export const jobLane=action=>action.startsWith('recuperar')?'recuperacao':action==='pesquisa'?'academia':['tropas','trabalhadores'].includes(action)?'sede':action==='navios'?'estaleiro':action==='pescar'?'pesca':'obras';
export function queueDelay(w,id,action){return Math.max(0,...(w.jobs||[]).filter(j=>j.user===id&&jobLane(j.action)===jobLane(action)).map(j=>j.end-w.clock));}
export function researchSpec(key,level){
 if(!['navegacao','logistica','artilharia'].includes(key)||!Number.isInteger(level)||level<1||level>MAX_RESEARCH_LEVEL)return null;
 return{level,academy:level,headquarters:level*3,cost:315,seconds:[600,1800,3600,7200,10800][level-1],resources:{wood:180*2**(level-1),stone:140*2**(level-1)}};
}
export function researchBenefits(key,level){
 const n=Math.min(MAX_RESEARCH_LEVEL,Math.max(0,level)),next=Math.min(MAX_RESEARCH_LEVEL,n+1),range=(factor,sign,suffix='%')=>n===MAX_RESEARCH_LEVEL?`${sign}${n*factor}${suffix}`:`${sign}${n*factor}${suffix} → ${sign}${next*factor}${suffix}`;
 return key==='navegacao'?[{label:'Tempo de viagem e pesca',value:range(7,'−')}]:key==='logistica'?[{label:'Carga e provisões da pesca',value:range(5,'+')}]:[{label:'Força no combate naval',value:range(5,'+')},{label:'Acerto no combate em ilhas',value:range(4,'+',' p.p.')}];
}
