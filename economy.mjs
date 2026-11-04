import{WAREHOUSE_HEADROOM}from'./pace-rules.mjs?v=0.19.2';
export const ECONOMY_VERSION='warehouse-v2';
export const INITIAL_RESOURCES=Object.freeze({wood:45,stone:45,food:40});
const BUILDING_MULTIPLIERS=Object.freeze({sede:1,serraria:1,pedreira:1,armazem:.55,estaleiro:1,muralha:1,academia:.55});
export function buildingCost(building,level){if(!(building in BUILDING_MULTIPLIERS)||!Number.isInteger(level)||level<1||level>12)throw Error('Edifício ou nível inválido.');if(building==='academia'){if(level>4)throw Error('Nível máximo da academia.');level*=3;}const multiplier=BUILDING_MULTIPLIERS[building];return{wood:Math.ceil(Math.ceil(90*1.6**(level-2))*multiplier),stone:Math.ceil(Math.ceil(65*1.6**(level-2))*multiplier)};}
export function highestBuildingCost(level){return Object.values(buildingCost('sede',level)).reduce((a,b)=>Math.max(a,b),0);}
export function storageCapacityAt(level){return Math.max(150+20*(level-1),Math.ceil(highestBuildingCost(level)*WAREHOUSE_HEADROOM));}
export function requiredWarehouse(resources){const amount=Math.max(0,...Object.values(resources||{}));for(let n=1;n<=12;n++)if(storageCapacityAt(n)>=amount)return n;return 13;}
// Speed depends on worker count. Early levels have short, visible batches; the
// shallower later yield curve keeps late-game throughput near the previous rules.
export function productionBatch(level){return Math.round(20*1.5**(Math.min(level,3)-1)*1.24**Math.max(0,level-3));}
