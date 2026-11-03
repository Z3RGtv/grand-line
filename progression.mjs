export const BUILDING_CAPS={sede:12,serraria:12,pedreira:12,armazem:12,estaleiro:12,muralha:12,academia:4};
export const academyAtHeadquarters=n=>Math.min(4,Math.floor(n/3));
export const maxBuildingLevel=key=>BUILDING_CAPS[key]||12;
export const buildingTier=(key,level)=>key==='academia'?Math.min(3,Math.max(1,level)):Math.min(3,Math.ceil(Math.max(1,level)/4));
export const jobLane=action=>action==='pesquisa'?'academia':['tropas','trabalhadores'].includes(action)?'sede':action==='navios'?'estaleiro':action==='pescar'?'pesca':'obras';
export function queueDelay(w,id,action){return Math.max(0,...(w.jobs||[]).filter(j=>j.user===id&&jobLane(j.action)===jobLane(action)).map(j=>j.end-w.clock));}
export function researchSpec(key,level){
 if(!['navegacao','logistica','artilharia'].includes(key)||!Number.isInteger(level)||level<1||level>4)return null;
 return{level,academy:level,headquarters:level*3,cost:350,seconds:[600,1800,3600,7200][level-1],resources:{wood:180*2**(level-1),stone:140*2**(level-1)}};
}
export function researchBenefits(key,level){
 const n=Math.min(4,Math.max(0,level)),next=Math.min(4,n+1),range=(factor,sign,suffix='%')=>n===4?`${sign}${n*factor}${suffix}`:`${sign}${n*factor}${suffix} → ${sign}${next*factor}${suffix}`;
 return key==='navegacao'?[{label:'Tempo de viagem e pesca',value:range(7,'−')}]:key==='logistica'?[{label:'Carga e provisões da pesca',value:range(5,'+')}]:[{label:'Força no combate naval',value:range(5,'+')},{label:'Acerto no combate em ilhas',value:range(4,'+',' p.p.')}];
}
