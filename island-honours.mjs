import{BOSS_SITES}from'./adventure.mjs?v=0.27.2&rev=duels1';
import{sessionProtected}from'./game-session.mjs?v=0.27.2';
import{itemArt,itemName,RARITIES}from'./equipment.mjs?v=0.27.2&rev=progress1';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function protection(w,p,wall=w.wall){
 if(!p||p.hibernating)return null;
 if(p.protectedUntil>wall)return{kind:'initial',label:'Proteção inicial',until:p.protectedUntil};
 if(sessionProtected(w,p))return{kind:'session',label:w.live?'Proteção até ao fim da stream':'Proteção desta sessão',until:null};
 if(p.shieldUntil>wall)return{kind:'shield',label:'Proteção após ataque',until:p.shieldUntil};
 return null;
}
export function protectionBubble(w,p,wall=w.wall){const shield=protection(w,p,wall);return shield?'<i class="island-protection-bubble" data-protection-kind="'+shield.kind+'" role="img" aria-label="'+shield.label+'"><span>⛨</span></i>':'';}
export function protectionLabel(w,p,wall=w.wall){const shield=protection(w,p,wall);if(!shield)return'';const mins=Math.max(1,Math.ceil((shield.until-wall)/60000)),time=mins>=1440?Math.ceil(mins/1440)+' d':mins>=60?Math.ceil(mins/60)+' h':mins+' min';return'<span class="protection-label">⛨ '+shield.label+(shield.until?' · '+time:'')+'</span>';}

export function bossBadge(id,{locked=false}={}){const b=BOSS_SITES.find(b=>b.id===id);return b?'<img class="boss-badge'+(locked?' badge-locked':'')+'" src="assets/badges/'+b.id+'.svg" width="128" height="144" alt="'+esc(b.bossName)+(locked?' · por conquistar':' · derrotado')+'" title="'+esc(b.bossName)+'">':'';}
export function playerHonours(w,p){
 const wins=new Set(p.badges||p.bossWins||[]),badges=BOSS_SITES.filter(b=>wins.has(b.id)).sort((a,b)=>a.level-b.level);
 return(badges.length?'<section class="player-honours"><h3>Conquistas <small>'+badges.length+'/'+BOSS_SITES.length+'</small></h3><div class="boss-badge-grid">'+badges.map(b=>'<button data-object="'+b.id+'" title="'+esc(b.bossName)+'">'+bossBadge(b.id)+'</button>').join('')+'</div></section>':'')+playerItemCollection(p);
}
export function relicHolders(w,type){const r=w?.relics?.[type];return r?'<small class="relic-owners">'+r.holders.length+'/3 no mundo'+(r.holders.length?' · '+r.holders.map(h=>esc(h.name)).join(', '):'')+'</small>':'';}

export function playerItemCollection(p){const c=p.itemCollection;if(!c)return'';return'<section class="player-relics player-item-collection"><h3>Itens <b>'+c.total+'</b></h3>'+c.featured.map(i=>'<button data-item-type="'+esc(i.type)+'" style="--rarity:'+esc(RARITIES[i.rarity]?.color||'#efbb51')+'"><img src="'+esc(itemArt(i))+'" alt=""><span>'+esc(itemName(i))+'</span><b>×'+i.count+'</b></button>').join('')+'</section>';}
