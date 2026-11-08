import{WAREHOUSE_HEADROOM}from'./pace-rules.mjs?v=0.27.2&rev=collection1';
import{MAX_LEVEL,MAX_RESEARCH_LEVEL,economyLevel}from'./progression.mjs?v=0.27.2';
export const ECONOMY_VERSION='warehouse-v2';
export const INITIAL_RESOURCES=Object.freeze({wood:45,stone:45,food:40});
const BUILDING_MULTIPLIERS=Object.freeze({sede:1,serraria:1,pedreira:1,armazem:.55,estaleiro:1,muralha:1,academia:.55});
const WOOD_SHARE=Object.freeze({sede:.45,serraria:.65,pedreira:.35,armazem:.5,estaleiro:.7,muralha:.25,academia:.4});
function baseCost(building,level){const multiplier=BUILDING_MULTIPLIERS[building];return{wood:Math.ceil(Math.ceil(90*1.6**(economyLevel(level)-2))*multiplier),stone:Math.ceil(Math.ceil(65*1.6**(economyLevel(level)-2))*multiplier)};}
export function buildingCost(building,level){if(!(building in BUILDING_MULTIPLIERS)||!Number.isInteger(level)||level<1||level>MAX_LEVEL)throw Error('Edifício ou nível inválido.');if(building==='academia'){if(level>MAX_RESEARCH_LEVEL)throw Error('Nível máximo da academia.');level*=3;}const old=baseCost(building,level);if(level<6)return old;const total=old.wood+old.stone,wood=Math.round(total*WOOD_SHARE[building]);return{wood,stone:total-wood};}
export function highestBuildingCost(level){return Object.values(buildingCost('sede',level)).reduce((a,b)=>Math.max(a,b),0);}
// A resource mix change must never shrink existing storage or delete stock.
export function storageCapacityAt(level){return Math.max(150+20*(level-1),Math.ceil(baseCost('sede',level).wood*WAREHOUSE_HEADROOM));}
export function shipMaterialMultiplier(headquarters){return 1+.3*Math.max(0,Math.min(MAX_LEVEL,headquarters)-5);}
export function shipMaterials(ship,headquarters,count=1){const factor=shipMaterialMultiplier(headquarters);return{wood:Math.round(ship.wood*factor)*count,stone:Math.round(ship.stone*factor)*count};}
export function repairMaterials(p,repaired){let wood=0,stone=0;for(const[building,damage]of Object.entries(repaired)){wood+=damage*3;stone+=damage*2;const level=p.levels[building],effective=building==='academia'?level*3:level;if(p.levels.sede>=6&&effective>=6&&damage>0){const cost=buildingCost(building,level);wood+=cost.wood*.5*damage/100;stone+=cost.stone*.5*damage/100;}}return{wood:Math.ceil(wood),stone:Math.ceil(stone)};}
export function requiredWarehouse(resources){const amount=Math.max(0,...Object.values(resources||{}));for(let n=1;n<=MAX_LEVEL;n++)if(storageCapacityAt(n)>=amount)return n;return MAX_LEVEL+1;}
// Speed depends on worker count. Early levels have short, visible batches; the
// shallower later yield curve keeps late-game throughput near the previous rules.
export function productionBatch(level){return Math.round(20*1.5**(Math.min(level,3)-1)*1.24**Math.max(0,economyLevel(level)-3));}
