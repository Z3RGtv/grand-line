import{relicHolders,bossBadge}from'./island-honours.mjs?v=0.27.2&rev=progress1';
import{FINAL_SECRET_SLOTS}from'./final-rewards.mjs?v=0.27.2&rev=progress1';
import{ITEM_TYPES,RARITIES,EQUIPMENT_SLOTS,equipmentBonuses,itemBonus,itemName,dismantleYield,STAT_NAMES,ITEM_SETS,equipmentSets,equippedItems,bestSetSlots,incompatibility,lootPool,lootOdds,rarityOdds,lootTable,itemArt,DROP_TABLES}from'./equipment.mjs?v=0.27.2&rev=progress1';
import{bossAlive,bossAccess}from'./adventure.mjs?v=0.27.2&rev=progress1';
import{workerState}from'./workers.mjs?v=0.27.2&rev=resources1';
import{maxBuildingLevel}from'./progression.mjs?v=0.27.2';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const names={sede:'Casa principal',serraria:'Serraria',pedreira:'Pedreira',armazem:'Armazém',estaleiro:'Estaleiro',muralha:'Muralha',academia:'Academia Náutica'};
const image=i=>'<img class="equipment-art" src="'+itemArt(i)+'" alt="'+esc(itemName(i))+'">';
const attributes=i=>Object.entries(itemBonus(i)).map(([key,value])=>'<b>+'+value+'% '+STAT_NAMES[key]+'</b>').join('');
const quality=i=>'<span class="item-quality" style="color:'+RARITIES[i.rarity].color+'">'+RARITIES[i.rarity].name+' · N'+RARITIES[i.rarity].level+' · '+ITEM_SETS[ITEM_TYPES[i.type].set].name+'</span>';
export{inventoryView}from'./inventory-view.mjs?v=0.27.2&rev=progress1';
export function adventureReadiness(w,p,quote){if(!p||p.hibernating)return[];const out=[],work=workerState(p,w.clock);if(work.available>0)out.push({icon:'⚒',title:work.available+' trabalhadores livres',building:'serraria',section:'producao'});for(const building of Object.keys(names)){if(p.levels[building]>=maxBuildingLevel(building)||w.jobs.some(j=>j.user===p.id&&j.action==='edificio'&&j.payload.building===building))continue;try{const q=quote(w,p.id,{kind:'construcoes',action:'edificio',payload:{building}});out.push({icon:'⌂',title:names[building]+' → N'+q.payload.level,building});}catch{}}return out;}
const reportIcons={ataque:'⚔',defesa:'⛨',batalha:'⚔',boss:'⚔',regresso:'⚓',trabalhadores:'⚒',ordem:'⌂',recompensa:'◆',reciclagem:'♻',equipamento:'◆',ilha:'⚑',expedicao:'⚓'};
const mysteryItem='<span class="mystery-item" role="img" aria-label="Item por revelar">?</span>';
export function pendingRewardNotices(w,p){
 return (w.missions||[]).filter(m=>m.user===p.id&&m.phase==='regresso'&&(m.pendingReward?.item||m.pendingReward?.special)).map(m=>({
  id:'mystery:'+m.id,mission:m.id,mystery:true,title:'Item conquistado',boss:m.pendingReward.name
 }));
}
export function reportView(w,p,ready,clock){
 const reports=p.reports||[];
 const cards=reports.slice(-60).reverse().map(r=>{
  const pendingMission=r.type==='boss'&&r.rounds&&r.battle?
   (w.missions||[]).find(m=>m.user===p.id&&m.encounter===r.battle&&m.pendingReward&&(!r.item||m.pendingReward.item?.id===r.item.id)):null;
  const nextResult=r.type==='boss'&&r.rounds?
   reports.slice(reports.indexOf(r)+1).find(q=>q.target===r.target&&(q.type==='recompensa'||q.type==='boss'&&q.rounds&&q.battle!==r.battle)):null;
  const delivered=nextResult?.type==='recompensa'?nextResult:null;
  const item=r.item||pendingMission?.pendingReward?.item||delivered?.item;
  const mystery=!!(pendingMission&&(pendingMission.pendingReward.item||pendingMission.pendingReward.special));
  const noEquipment=r.noEquipment||pendingMission?.pendingReward?.item===null&&!pendingMission?.pendingReward?.special||delivered?.noEquipment&&!delivered?.special;
  let loot=(r.items||[]).map(i=>'<div class="report-item '+(r.type==='item-loss'?'lost-item':'')+'">'+image(i)+'<b>'+esc(itemName(i))+'</b></div>').join('');
  if(mystery)loot='<div class="report-item">'+mysteryItem+'<b>Item conquistado</b><small>A caminho</small></div>';
  else if(item)loot='<div class="report-item">'+image(item)+(r.type==='boss'?'<b>'+esc(itemName(item))+'</b>':'')+quality(item)+attributes(item)+'</div>';
  else if(noEquipment)loot='<small>Sem equipamento neste saque</small>';
  const mins=Math.max(0,Math.floor((clock-r.at)/60));
  const battle=Object.values(w.encounters).some(e=>e.id===r.battle)||(w.battleHistory||[]).some(e=>e.id===r.battle);
  return '<article class="private-report"><span class="report-symbol">'+(reportIcons[r.type]||'•')+'</span><div><strong>'+esc(r.title)+'</strong>'+
   '<small>'+mins+' min de live atrás'+(r.rounds?' · '+r.rounds+' rondas':'')+'</small>'+
   (r.type==='ataque'&&r.arrival>clock?'<small>Chegada <b data-end="'+r.arrival+'">—</b></small>':'')+
   (r.losses?'<small>Perdas: '+r.losses.ships+' barcos · '+r.losses.troops+' marinheiros</small>':'')+
   (r.resources?'<div class="report-resources">'+Object.entries(r.resources).filter(([,n])=>n>0).map(([k,n])=>'<span><img src="assets/ui/'+k+'.png" alt="'+k+'">'+Math.floor(n)+'</span>').join('')+'</div>':'')+loot+
   (r.overflow?'<small>Armazém cheio: '+Math.floor(r.overflow)+' de excesso</small>':'')+
   (battle?'<button data-report-battle="'+r.battle+'">Ver batalha →</button>':r.type==='convite'?'<button data-object="'+esc(r.target)+'">Abrir ilha →</button>':r.building?'<button data-build="'+r.building+'">Abrir edifício →</button>':'')+'</div></article>';
 });
 return '<span class="eyebrow">DIÁRIO DO CAPITÃO</span><h2>Relatórios</h2>'+
  (ready.length?'<section class="readiness-panel"><h3>Disponível agora</h3>'+ready.map(a=>'<button data-build="'+a.building+'" '+(a.section?'data-section="'+a.section+'"':'')+'><span>'+a.icon+'</span><b>'+a.title+'</b><i>→</i></button>').join('')+'</section>':'')+
  '<div class="private-report-list">'+cards.join('')+'</div>';
}
export function bossMapArt(w,p,t){return(w.bosses||[]).map(b=>{const alive=bossAlive(w,b),a=bossAccess(w,p,b);return '<button class="boss-island '+(b.final?'final-boss ':'')+(!alive?'recovering ':'')+(a.ok?'accessible':'inaccessible')+'" data-object="'+b.id+'" style="left:'+b.x*100+'%;top:'+b.y*100+'%;width:'+b.width/3000*100+'%" aria-label="'+esc(b.name)+' nível recomendado '+b.level+(alive?' · '+a.label:' · A recuperar')+'"><span class="boss-map-badge">'+bossBadge(b.id,{locked:!p?.bossWins?.includes(b.id)})+'</span><img src="assets/bosses/island-'+b.boss+'.png" alt=""><span class="boss-map-level">'+(alive?'N'+b.level:'◷')+'</span><span class="boss-map-name">'+esc(b.name)+'</span>'+(!alive?'<span class="boss-map-timer" data-end="'+b.respawnAt+'">—</span>':'')+'</button>';}).join('');}
export function bossPortrait(b){return '<div class="boss-portrait"><span class="boss-sprite" data-boss="'+esc(b.boss)+'" data-idle-id="'+esc(b.id||b.boss)+'" style="--boss-art:url(assets/bosses/'+b.boss+'-idle.png)" role="img" aria-label="'+esc(b.bossName)+'"></span></div>';}
export function rewardDialog(r){
 if(['item-loss','item-capture','item-plunder'].includes(r.type)){const lost=r.type==='item-loss';return'<section role="dialog" aria-modal="true" aria-labelledby="reward-title" class="reward-card equipment-event '+(lost?'lost-item':'captured-item')+'"><button class="reward-close" data-reward-close="1" aria-label="Fechar">×</button><span class="eyebrow">'+(lost?'Equipamento perdido':'Equipamento capturado')+'</span><div class="equipment-event-items">'+(r.items||[]).map(image).join('')+'</div><h2 id="reward-title">'+esc(r.title)+'</h2><button class="primary wide" data-reward-close="1">Continuar</button></section>';}

 if(r.mystery)return '<section role="dialog" aria-modal="true" aria-labelledby="reward-title" class="reward-card mystery-reward" style="--rarity:#d6ba6c"><div class="reward-rays"></div><button class="reward-close" data-reward-close="1" aria-label="Fechar recompensa">×</button><span class="eyebrow">'+esc(r.boss||'Espólio conquistado')+'</span><div class="reward-object">'+mysteryItem+'</div><h2 id="reward-title">Item conquistado</h2><small>A caminho da base</small><button class="primary wide" data-reward-close="1">Continuar</button></section>';
 const i=r.item;return '<section role="dialog" aria-modal="true" aria-labelledby="reward-title" class="reward-card '+(i?'gear-reward':'resource-reward')+'" style="--rarity:'+(i?RARITIES[i.rarity].color:'#d6ba6c')+'"><div class="reward-rays"></div><button class="reward-close" data-reward-close="1" aria-label="Fechar recompensa">×</button><span class="eyebrow">'+esc(r.boss||'Espólio recolhido')+'</span><div class="reward-object">'+(i?image(i):r.special?'<img src="'+esc(r.special.art)+'" alt="Tesouro descoberto">':'<img src="assets/ui/treasure.png" alt="Recursos recolhidos">')+'</div><h2 id="reward-title">'+esc(r.title)+'</h2>'+(i?quality(i)+attributes(i)+(r.pending?'<small>Liberta um lugar no inventário para recolher.</small>':''):'<div class="report-resources">'+Object.entries(r.resources||{}).filter(([,n])=>n>0).map(([k,n])=>'<span><img src="assets/ui/'+k+'.png" alt="'+k+'">'+Math.floor(n)+'</span>').join('')+'</div><small>'+(r.special?'Tesouro conquistado':r.reason==='daily'?'Item final já recebido hoje':r.reason==='participation'?'Recursos recolhidos':r.recycled?'Inventário cheio · equipamento desmontado':'Sem equipamento neste saque')+'</small>')+'<button class="primary wide" data-reward-close="1">Recolher ✓</button></section>';}

const pct=n=>(n*100).toLocaleString('pt-PT',{maximumFractionDigits:2})+'%';
export function bossLootView(b,w=null,p=null){
 const table=lootTable(b),pool=b.final?[...lootOdds(b),{type:'lucky_talisman',chance:.025,exclusive:true}]:lootOdds(b),luck=p?equipmentBonuses(p,p.attackEquipment||{}).rareFind:0;
 for(const o of pool)if(w?.relics?.[o.type]?.count>=3)o.chance=0;
 const cards='<div class="drop-item-list">'+pool.map(o=>{const set=ITEM_SETS[ITEM_TYPES[o.type].set];return '<button class="drop-item-card" data-item-type="'+o.type+'" style="--set-color:'+set.color+'"><img src="'+itemArt({type:o.type})+'" alt=""><span><strong>'+ITEM_TYPES[o.type].name+'</strong><small>'+set.emblem+' '+set.name+(ITEM_TYPES[o.type].unique?' · Um por capitão':o.exclusive?' · Exclusivo':'')+'</small>'+relicHolders(w,o.type)+'</span><b>'+pct(o.chance)+'</b></button>';}).join('')+'</div>';
 if(b.final){const found=w?.finalDiscoveries||{},slots=w?.finalSecretSlots||FINAL_SECRET_SLOTS.map(id=>({id,enabled:true})),available=slots.filter(s=>s.enabled&&!found[s.id]?.global).length,secretChance=available*.025;return '<section class="boss-drop-pool final-loot"><h3>Tesouros do Abismo</h3><div class="final-secret-grid">'+slots.map(slot=>{const d=found[slot.id];return d?'<button class="discovered-treasure" data-secret-details="'+slot.id+'"><img src="'+esc(d.art)+'" alt=""><strong>'+esc(d.name)+'</strong><small>'+esc(d.playerName)+'</small><b>'+(d.global?'Conquistado':'Descoberto')+'</b></button>':'<div class="sealed-treasure '+(slot.enabled?'':'unavailable')+'"><span>?</span><small>'+(slot.enabled?'Por descobrir':'Reservado')+'</small></div>';}).join('')+'</div><div class="final-drop-rates"><span>Até '+pct(secretChance)+' · tesouros</span><span>Até 35,5% · equipamento</span><span>'+pct(.645-secretChance)+' ou mais · sem item</span></div>'+ '<p class="daily-loot-limit">Prémios especiais únicos · até 3 exemplares de cada equipamento do Abismo</p>' +'<h3>Equipamento do Abismo</h3>'+cards+'<small>Probabilidades individuais. Um trio pode regressar sem itens.</small></section>';}
 return '<section class="boss-drop-pool"><h3>Espólio possível</h3>'+cards+'<details class="boss-drops"><summary>Raridades · '+pct(1-table.chance)+' sem item</summary><div class="drop-qualities">'+rarityOdds(b,luck).map((n,i)=>n?'<span style="color:'+RARITIES[i].color+'">'+RARITIES[i].name+' '+pct(n)+'</span>':'').join('')+'</div></details></section>';
}
