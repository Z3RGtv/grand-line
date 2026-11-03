import{buildingTier}from'./progression.mjs?v=0.17.2';
// Defence evolution is visual: level 1 is the unfortified founding stage.
export function wallTier(level=1){return level<=1?0:Math.min(3,Math.ceil(level/4));}
export const WALL_NAMES=['Sem muralha','Paliçada de madeira','Muralha de pedra','Muralha reforçada'];
export function buildingArt(key,level=1){return key==='muralha'?`assets/wall-card-tier-${wallTier(level)||1}.png`:`assets/building-${key}-tier-${buildingTier(key,level)}.png`;}
export function islandArt(levels,layout,{damaged=false}={}){
 const t=wallTier(levels.muralha),wall=part=>t?`<img class="island-overlay perimeter-wall wall-${part}" data-wall-tier="${t}" src="assets/wall-v2-tier-${t}-${part}.png" alt="${WALL_NAMES[t]} · ${part==='back'?'traseira':'frente'}">`:'';
 return wall('back')+Object.entries(levels).filter(([k,n])=>k!=='muralha'&&n>0&&layout[k]).map(([k,n])=>{const tier=buildingTier(k,n),b=layout[k][tier-1].bounds;return `<img class="individual-building" src="assets/building-${k}-tier-${tier}.png" alt="${k}, nível ${n}" style="left:${b[0]/1536*100}%;top:${b[1]/1024*100}%;width:${(b[2]-b[0])/1536*100}%;height:${(b[3]-b[1])/1024*100}%">`;}).join('')+wall('front')+(damaged?'<img class="island-overlay" src="assets/damage-overlay.png" alt="Danos na ilha">':'');
}
