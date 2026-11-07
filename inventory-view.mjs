import{coinIcon}from'./wallet-view.mjs?v=0.27.2';
import{EXCLUSIVE_ITEMS}from'./equipment.mjs?v=0.27.2&rev=world2';
import{FRAGMENTS_REQUIRED}from'./balance-policy.mjs?v=0.27.2';
import{EQUIPMENT_SLOTS,ITEM_TYPES,ITEM_SETS,RARITIES,MAX_EQUIPPED,equippedItems,equipmentSets,itemName,itemArt,dismantleYield}from'./equipment.mjs?v=0.27.2&rev=world2';
import{inventoryExpansion}from'./inventory-capacity.mjs?v=0.27.2';
import{createEquipmentDraft,draftChanged}from'./equipment-draft.mjs?v=0.27.2&rev=world2';
import{islandTheftChance}from'./equipment-risk.mjs?v=0.27.2&rev=world2';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const image=i=>'<button class="item-art-button" data-item-id="'+esc(i.id)+'" aria-label="Ver '+esc(itemName(i))+'"><img class="equipment-art" src="'+itemArt(i)+'" alt=""></button>';

export function inventoryView(p, selection=new Set(), {draft=createEquipmentDraft(p),deployed=new Set()}={}) {
 const bag = p.inventory || [];
 const preview = {...p,equipment:draft.slots};
 const completeSet = equipmentSets(preview).find(set => set.count === MAX_EQUIPPED);
 const dirty = draftChanged(draft);
 const savedIds = [...Object.values(p.equipment || {}),...Object.values(p.attackEquipment||{})];
 const expansion = inventoryExpansion(p);
 const status = draft.pending
  ? '<span class="equipment-pending" role="status">A guardar configuração…</span>'
  : dirty
   ? '<span class="equipment-unsaved" role="status">Alterações por confirmar</span>'
   : p.equipmentRevision
    ? '<span class="equipment-confirmed">✓ Configuração confirmada</span>'
    : '';

 const slots = Object.entries(EQUIPMENT_SLOTS).map(([slot,name]) => {
  const item = bag.find(i => i.id === draft.slots[slot]);
  return `<article class="equipment-slot${item ? ' has-item' : ''}" data-drop-slot="${slot}"
    style="--set-color:${item ? ITEM_SETS[ITEM_TYPES[item.type].set].color : '#8c836d'};--rarity:${item ? RARITIES[item.rarity].color : '#8c836d'}">
   <small>${name}</small>
   ${item ? image(item)+`<button class="equipment-remove" data-unequip="${slot}" aria-label="Retirar ${esc(itemName(item))}">×</button>`
    : '<span class="empty-slot" aria-hidden="true">＋</span>'}
  </article>`;
 }).join('');

 const tiles = bag.slice().sort((a,b) => b.rarity-a.rarity || a.type.localeCompare(b.type)).map(item => {
  const type = ITEM_TYPES[item.type];
  const set = ITEM_SETS[type.set];
  const title = esc(itemName(item));
  const chosen = draft.slots[type.slot] === item.id;
  return `<article class="equipment-tile${chosen ? ' chosen' : ''}${selection.has(item.id) ? ' salvage-marked' : ''}" style="--set-color:${set.color}">
   <button class="equipment-piece" data-equip="${esc(item.id)}" data-drag-slot="${type.slot}" ${deployed.has(item.id)?'disabled':''}
    aria-label="Selecionar ${title} para ${EQUIPMENT_SLOTS[type.slot]}" aria-pressed="${chosen}" title="${title}">
    <span class="equipment-set-emblem" aria-hidden="true">${set.emblem}</span>
    <img src="${itemArt(item)}" alt="" draggable="false">
    ${deployed.has(item.id)?'<small class="equipment-location">⛵ Em viagem</small>':Object.values(p.attackEquipment||{}).includes(item.id)?'<small class="equipment-location">⛵ Frota</small>':Object.values(p.equipment||{}).includes(item.id)?'<small class="equipment-location">⛨ Ilha</small>':''}
    ${chosen ? `<span class="equipment-mark" aria-hidden="true">${savedIds.includes(item.id) ? '✓' : '●'}</span>` : ''}
   </button>
   <button class="equipment-details" data-item-id="${esc(item.id)}" aria-label="Ver ${title} · ${set.name}" title="${title} · ${set.name}"><span>${title}</span></button>
  </article>`;
 }).join('');

 const vacancies = Math.max(0, expansion.capacity - bag.length);
 const emptyTiles = '<div class="equipment-vacancy" aria-hidden="true"></div>'.repeat(Math.max(0,vacancies-Number(!expansion.max)));
 const plusTile = expansion.max ? '' : `<button class="equipment-vacancy inventory-add" data-inventory-expansion="1" aria-label="Expandir inventário">
  <span aria-hidden="true">+</span>${expansion.paid ? `<small>${expansion.paid}/${expansion.required}</small>` : ''}
 </button>`;
 const dismantle = [...bag,...(p.lootStash||[])].filter(item => !savedIds.includes(item.id) && !deployed.has(item.id) && !ITEM_TYPES[item.type].unique);
 const selected = dismantle.filter(item => selection.has(item.id));
 const yieldTotal = selected.reduce((total,item) => {
  const resources = dismantleYield(item);
  return {wood:total.wood+resources.wood,stone:total.stone+resources.stone};
 },{wood:0,stone:0});
 return `<h2>Equipamento <small>${equippedItems(preview).length}/4</small></h2>
  <div class="equipment-loadouts" role="group" aria-label="Local do equipamento"><button data-equipment-loadout="island" aria-pressed="${draft.loadout!=='fleet'}">⛨ Ilha</button><button data-equipment-loadout="fleet" aria-pressed="${draft.loadout==='fleet'}">⛵ Frota</button></div>
  <small class="equipment-risk-note">${draft.loadout==='fleet'?'Perdes os itens se a frota for destruída.':Math.round(islandTheftChance(p)*100)+'% de risco por item se a ilha perder · Academia reduz até 15%.'}</small>
  <section class="equipment-editor" data-form-revision="${draft.revision}">
   ${status}
   <div class="equipment-selection"${completeSet ? ` data-complete-set="${completeSet.id}" style="--set-color:${completeSet.color}"` : ''}>
    <div class="equipment-slots">${slots}</div>
    ${completeSet ? `<span class="equipment-set-complete" role="status">${completeSet.emblem} ${completeSet.name} · Bónus de conjunto</span>` : ''}
   </div>
   ${dirty ? `<div class="equipment-confirm-panel">
    <button class="primary wide equipment-confirm-callout" data-action="confirm-equipment">Confirmar configuração · 90 moedas</button>
    <button class="equipment-reset" data-equipment-reset="1">Repor</button>
   </div>` : ''}
   <h3>Itens <small>${bag.length}/${expansion.capacity}</small></h3>
   ${bag.length ? '<p class="equipment-hint">Arrasta ou toca na imagem para selecionar.</p>' : ''}
   <div class="equipment-bag">${tiles}${emptyTiles}${plusTile}</div>
   ${p.pendingUniqueItem ? '<p class="inventory-full">Uma relíquia única aguarda um lugar livre.</p>' : ''}
   ${bag.length>=expansion.capacity?'<small class="inventory-full">Inventário cheio</small>':''}
   ${pendingLootView(p,selection)}
   ${selected.length ? `<div class="dismantle-panel"><span>+${yieldTotal.wood} madeira · +${yieldTotal.stone} pedra</span>
    <button data-dismantle="1">Desmontar ${selected.length} · 90 moedas</button>
    <button data-clear-salvage="1">Limpar seleção</button>
   </div>` : ''}
  </section>`;
}

export function inventoryExpansionView(p) {
 const e = inventoryExpansion(p);
 return `<button class="item-back" data-adventure="inventory">← Inventário</button>
  <h2>Expandir inventário</h2>
  ${e.max ? '<p>Capacidade máxima · 12 lugares</p>' : `<div class="inventory-expansion">
   <strong>${e.capacity} → ${e.next} lugares</strong>
   ${e.required>1 ? `<span>Prestação ${e.paid+1}/${e.required}</span>` : ''}
   <button class="primary wide" data-action="expand-inventory">Confirmar · 90 moedas</button>
  </div>`}`;
}

export function bindEquipmentDrag(panel, {canEdit,onEquip,onInvalid}) {
 let drag = null;
 let suppressClick = false;
 const scroll = panel.closest('.inspector');
 const doc = panel.ownerDocument;
 const window = doc.defaultView;

 function cancel() {
  if (!drag) return;
  const {source,pointer,ghost,frame,target} = drag;
  drag = null;
  if (frame) window.cancelAnimationFrame(frame);
  ghost?.remove();
  source.classList.remove('equipment-drag-source');
  target?.classList.remove('equipment-drop-active');
  panel.querySelectorAll('.equipment-drop-ready').forEach(slot => slot.classList.remove('equipment-drop-ready'));
  if (source.hasPointerCapture(pointer)) source.releasePointerCapture(pointer);
 }

 function follow() {
  if (!drag?.ghost) return;
  const bounds = scroll.getBoundingClientRect();
  if (drag.y < Math.max(0,bounds.top)+80) scroll.scrollTop -= 7;
  else if (drag.y > Math.min(window.innerHeight,bounds.bottom)-36) scroll.scrollTop += 7;
  drag.ghost.style.left = drag.x+'px';
  drag.ghost.style.top = drag.y+'px';
  const hovered = doc.elementFromPoint(drag.x,drag.y)?.closest('[data-drop-slot]');
  const target = hovered?.dataset.dropSlot === drag.slot ? hovered : null;
  if (target !== drag.target) {
   drag.target?.classList.remove('equipment-drop-active');
   target?.classList.add('equipment-drop-active');
   drag.target = target;
  }
  drag.frame = window.requestAnimationFrame(follow);
 }

 panel.addEventListener('pointerdown', event => {
  suppressClick = false;
  const source = event.target.closest('button[data-drag-slot]');
  if (drag || !source || !event.isPrimary || event.button !== 0 || !canEdit()) return;
  drag = {source,pointer:event.pointerId,item:source.dataset.equip,slot:source.dataset.dragSlot,
   startX:event.clientX,startY:event.clientY,x:event.clientX,y:event.clientY};
  source.setPointerCapture(event.pointerId);
 });
 panel.addEventListener('pointermove', event => {
  if (drag?.pointer !== event.pointerId) return;
  drag.x = event.clientX;
  drag.y = event.clientY;
  if (drag.ghost || Math.hypot(drag.x-drag.startX,drag.y-drag.startY)<8) return;
  drag.ghost = drag.source.querySelector('img').cloneNode();
  drag.ghost.className = 'equipment-drag-ghost';
  drag.source.classList.add('equipment-drag-source');
  panel.querySelector('[data-drop-slot="'+drag.slot+'"]')?.classList.add('equipment-drop-ready');
  doc.body.append(drag.ghost);
  follow();
 });
 panel.addEventListener('pointerup', event => {
  if (drag?.pointer !== event.pointerId) return;
  const {item,slot,ghost} = drag;
  const drop = ghost && doc.elementFromPoint(event.clientX,event.clientY)?.closest('[data-drop-slot]');
  suppressClick = !!ghost;
  cancel();
  if (!drop || !canEdit()) return;
  if (drop.dataset.dropSlot !== slot) onInvalid('Este item encaixa em '+EQUIPMENT_SLOTS[slot]+'.');
  else onEquip(item,slot);
 });
 for (const name of ['pointercancel','lostpointercapture']) {
  panel.addEventListener(name,event => {if (drag?.pointer === event.pointerId) cancel();});
 }
 panel.addEventListener('click', event => {
  if (!suppressClick || event.detail === 0) return;
  suppressClick = false;
  event.preventDefault();
  event.stopImmediatePropagation();
 },true);
 return {get active(){return !!drag;},cancel};
}

export function pendingLootView(p,selection=new Set()){
 const stash=p.lootStash||[],fragments=Object.entries(EXCLUSIVE_ITEMS).filter(([,boss])=>(p.fragments?.[boss]||0)>0);
 return (stash.length?'<h3>Espólio <small>'+stash.length+'</small></h3><div class="pending-loot-grid">'+stash.map(i=>'<article class="pending-loot-item '+(selection.has(i.id)?'salvage-marked':'')+'"><button data-item-id="'+esc(i.id)+'" title="Ver '+esc(itemName(i))+'" aria-label="Ver '+esc(itemName(i))+'"><img src="'+itemArt(i)+'" alt=""></button><button data-claim-loot="'+esc(i.id)+'" title="Recolher '+esc(itemName(i))+' · 90 moedas" aria-label="Recolher '+esc(itemName(i))+' por 90 moedas"><span class="loot-price">↓ '+coinIcon()+'90</span></button></article>').join('')+'</div>':'')+(fragments.length?'<h3>Fragmentos</h3><div class="pending-loot-grid">'+fragments.map(([type,boss])=>'<button data-craft-boss="'+boss+'" title="Criar '+esc(ITEM_TYPES[type].name)+' raro · 10 fragmentos e 90 moedas" aria-label="Criar '+esc(ITEM_TYPES[type].name)+' raro por 10 fragmentos e 90 moedas"><img src="'+itemArt({type})+'" alt=""><span>'+p.fragments[boss]+'/'+FRAGMENTS_REQUIRED+'</span><span class="loot-price">'+coinIcon()+'90</span></button>').join('')+'</div>':'');
}
