import{ITEM_TYPES,ITEM_SETS,RARITIES,EQUIPMENT_SLOTS,STAT_NAMES,itemName,itemArt,itemBonus,equipmentBonuses,lootOdds,EXCLUSIVE_ITEMS}from'./equipment.mjs?v=0.27.0';
import{BOSS_SITES}from'./adventure.mjs?v=0.27.0';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const percent=n=>(n*100).toLocaleString('pt-PT',{maximumFractionDigits:2})+'%';
export function itemDetailsView(item,p,{catalog=false,marked=false}={}){
 const type=ITEM_TYPES[item.type];if(!type)return'<h2>Item indisponível</h2>';
 const set=ITEM_SETS[type.set],rarity=RARITIES[item.rarity],inBag=!catalog&&p?.inventory?.some(i=>i.id===item.id),pending=!catalog&&p?.lootStash?.some(i=>i.id===item.id),owned=inBag||pending,sources=BOSS_SITES.flatMap(b=>{const odds=lootOdds(b).find(o=>o.type===item.type);return odds?[{...odds,name:b.name,id:b.id}]:[];});
 const statistics=catalog?'<div class="item-rarity-ranges">'+RARITIES.filter((_,i)=>!type.finalOnly||i>=3).map(r=>{const low=itemBonus({...item,value:r.range[0]}),high=itemBonus({...item,value:r.range[1]});return '<div><span style="color:'+r.color+'">'+r.name+' · N'+r.level+'</span><b>+'+low[type.stat]+(low[type.stat]!==high[type.stat]?'–'+high[type.stat]:'')+'% '+STAT_NAMES[type.stat]+'</b></div>';}).join('')+'</div>':'<div class="item-main-stat">'+Object.entries(itemBonus(item)).map(([k,v])=>'<strong>+'+v+'% '+STAT_NAMES[k]+'</strong>').join('')+'<small>'+rarity.name+' · Requer sede N'+rarity.level+'</small></div>';
 const bonuses=Object.entries(set.bonus).map(([k,v])=>'+'+v+'% '+STAT_NAMES[k]).join(' · ');
 const incompatible=type.set==='bastiao'?'Aurora':type.set==='aurora'?'Bastião':'';
 const canMark=owned&&!type.unique&&!Object.values(p.equipment||{}).includes(item.id);
 return `<button class="item-back" data-item-back="1">← Voltar</button>
  <div class="item-detail-hero" style="--set-color:${set.color}">
   <img src="${itemArt(item)}" alt="">
   <span class="item-set-badge">${set.emblem} ${set.name}</span>
  </div>
  <h2>${esc(itemName(item))}</h2><div class="item-slot-label">${EQUIPMENT_SLOTS[type.slot]}</div>
  ${statistics}
  ${owned?comparisonView(item,pending?{...p,inventory:[...p.inventory,item]}:p):''}
  ${type.stat==='rareFind'?'<p class="item-explanation">Aumenta a hipótese de Raro ou melhor nas ilhas normais. Não altera as probabilidades da ilha final.</p>':''}
  <section class="item-set-detail" style="--set-color:${set.color}">
   <h3>Conjunto ${set.name}</h3><p><strong>Bónus com 4 peças</strong> · ${bonuses}</p>
   ${incompatible?'<small>Incompatível com '+incompatible+'</small>':''}
  </section>
  ${inBag?`<button class="primary wide" data-item-select="${esc(item.id)}">Selecionar para a configuração</button>`:''}
  ${pending?`<button class="primary wide" data-claim-loot="${esc(item.id)}">Recolher · 90 moedas</button>`:''}
  ${canMark?`<button class="item-back" data-mark-salvage="${esc(item.id)}">${marked?'Desmarcar desmontagem':'Marcar para desmontar'}</button>`:''}
  ${type.unique?'<p class="item-exclusive-note">Único por capitão · não pode ser desmontado.</p>':
   sources.length?`<h3>Onde encontrar</h3><div class="item-source-list">${sources.map(s=>`<button data-item-source="${s.id}"><span>${esc(s.name)}${EXCLUSIVE_ITEMS[item.type]?' · Exclusivo':''}</span><b>${percent(s.chance)}</b></button>`).join('')}</div>`:''}`;
}
export function discoveryDetailsView(record){return '<button class="item-back" data-item-back="1">← Voltar</button><div class="item-detail-hero"><img src="'+esc(record.art)+'" alt=""></div><h2>'+esc(record.name)+'</h2><p class="item-exclusive-note">'+(record.global?'Tesouro único · conquistado por ':'Primeiro descobridor: ')+esc(record.playerName)+'</p>';}

function comparisonView(item,p){const type=ITEM_TYPES[item.type],before=equipmentBonuses(p),after=equipmentBonuses({...p,equipment:{...p.equipment,[type.slot]:item.id}});return '<div class="item-comparison">'+Object.keys(after).filter(k=>after[k]!==before[k]).map(k=>{const d=after[k]-before[k];return '<span class="'+(d>0?'stat-up':'stat-down')+'">'+(d>0?'+':'')+d+'% '+STAT_NAMES[k]+'</span>';}).join('')+'</div>';}
