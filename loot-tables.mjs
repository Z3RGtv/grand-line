// Weights apply to an item's selection after a successful equipment roll.
// Four completion pieces have exactly one normal-island source each.
export const EXCLUSIVE_ITEMS={tools:'I-FAROL',cargo:'I-FORNALHA',bastion_hull:'I-BASALTO',aurora_compass:'I-ATOL'};
export const FINAL_EQUIPMENT=['abyss_cannon','abyss_hull','abyss_compass','abyss_cargo'];
export const SITE_LOOT={
 'I-CORAL':{chance:.55,rarities:[65,25,9,1,0],items:{cannon:24,hull:20,compass:18,harpoon:12,anchor:10,bastion_cannon:6,aurora_hull:10}},
 'I-GARRA':{chance:.48,rarities:[70,23,6,1,0],items:{harpoon:27,anchor:23,sail:20,cannon:10,bastion_tools:8,aurora_harpoon:12}},
 'I-MAREAS':{chance:.60,rarities:[60,29,10,1,0],items:{aurora_harpoon:25,aurora_hull:24,aurora_cargo:20,compass:12,hull:8,sail:6,bastion_compass:5}},
 'I-CORSARIO':{chance:.68,rarities:[12,28,42,17,1],items:{bastion_cannon:23,bastion_compass:20,bastion_tools:18,harpoon:12,anchor:9,cannon:7,hull:5,aurora_hull:6}},
 'I-CAVEIRA':{chance:.62,rarities:[15,30,38,15,2],items:{harpoon:21,anchor:20,sail:18,bastion_cannon:14,bastion_tools:12,aurora_harpoon:9,compass:6}},
 'I-FAROL':{chance:.65,rarities:[15,25,40,18,2],items:{cannon:22,hull:22,compass:19,tools:4,sail:10,bastion_compass:8,aurora_cargo:8,aurora_harpoon:7}},
 'I-BASALTO':{chance:.78,rarities:[0,8,39,43,10],items:{bastion_cannon:20,bastion_compass:16,bastion_tools:16,bastion_hull:4,cannon:9,hull:8,compass:6,anchor:7,sail:5,aurora_hull:5,aurora_cargo:4}},
 'I-ATOL':{chance:.72,rarities:[0,5,40,43,12],items:{aurora_harpoon:20,aurora_hull:19,aurora_cargo:18,aurora_compass:4,cannon:7,hull:5,compass:7,harpoon:6,anchor:5,sail:4,bastion_cannon:3,bastion_compass:2}},
 'I-FORNALHA':{chance:.75,rarities:[0,8,42,42,8],items:{harpoon:19,anchor:18,sail:17,cargo:4,cannon:7,hull:6,compass:5,bastion_cannon:5,bastion_compass:4,bastion_tools:4,aurora_harpoon:4,aurora_hull:4,aurora_cargo:3}}
};
export const FINAL_TABLE={chance:.30,rarities:[0,0,0,75,25],items:Object.fromEntries(FINAL_EQUIPMENT.map(t=>[t,1]))};
export function sourceLoot(source){return typeof source==='object'?(source.final||source.id==='I-COROA'?FINAL_TABLE:SITE_LOOT[source.id]):null;}
export function weightedPick(weights,random){const entries=Array.isArray(weights)?weights.map((w,i)=>[i,w]):Object.entries(weights),total=entries.reduce((n,[,w])=>n+w,0);if(!(total>0))return null;let n=random()*total;for(const[key,w]of entries){n-=w;if(n<0)return key;}return entries.at(-1)[0];}
export function boostedRarities(weights,bonus=0){const out=[...weights],total=out.reduce((a,b)=>a+b,0),rare=out.slice(2).reduce((a,b)=>a+b,0),low=total-rare;if(!rare||!low)return out;const increase=Math.min(low,rare*Math.max(0,Math.min(10,bonus))/100);return out.map((w,i)=>i>=2?w*(rare+increase)/rare:w*(low-increase)/low);}
