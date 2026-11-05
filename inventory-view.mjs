import{EQUIPMENT_SLOTS,ITEM_TYPES,ITEM_SETS,RARITIES,STAT_NAMES,equippedItems,equipmentBonuses,equipmentSets,bestSetSlots,itemName,itemArt,dismantleYield}from'./equipment.mjs?v=0.25.1';
import{inventoryExpansion}from'./inventory-capacity.mjs?v=0.25.1';
import{createEquipmentDraft,draftChanged}from'./equipment-draft.mjs?v=0.25.1&rev=inventory1';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const image=i=>'<button class="item-art-button" data-item-id="'+esc(i.id)+'" aria-label="Ver '+esc(itemName(i))+'"><img class="equipment-art" src="'+itemArt(i)+'" alt=""></button>';
const bonusText=b=>Object.entries(b).map(([k,n])=>'+'+n+'% '+STAT_NAMES[k]).join(' · ');

export function inventoryView(p, selection=new Set(), {draft=createEquipmentDraft(p)}={}) {
 const bag = p.inventory || [];
 const preview = {...p,equipment:draft.slots};
 const dirty = draftChanged(draft);
 const savedIds = Object.values(p.equipment || {});
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
  const title = esc(itemName(item));
  const chosen = draft.slots[type.slot] === item.id;
  return `<article class="equipment-tile${chosen ? ' chosen' : ''}" style="--set-color:${ITEM_SETS[type.set].color}">
   <button class="equipment-piece" data-equip="${esc(item.id)}" data-drag-slot="${type.slot}"
    aria-label="Selecionar ${title} para ${EQUIPMENT_SLOTS[type.slot]}" aria-pressed="${chosen}" title="${title}">
    <img src="${itemArt(item)}" alt="" draggable="false">
    ${chosen ? `<span class="equipment-mark" aria-hidden="true">${savedIds.includes(item.id) ? '✓' : '●'}</span>` : ''}
   </button>
   <button class="equipment-details" data-item-id="${esc(item.id)}" aria-label="Ver ${title}" title="${title}"><span>${title}</span></button>
  </article>`;
 }).join('');

 const dismantle = bag.filter(item => !savedIds.includes(item.id) && !ITEM_TYPES[item.type].unique);
 const selected = dismantle.filter(item => selection.has(item.id));
 const yieldTotal = selected.reduce((total,item) => {
  const resources = dismantleYield(item);
  return {wood:total.wood+resources.wood,stone:total.stone+resources.stone};
 },{wood:0,stone:0});
 const manage = `<details class="equipment-extra"${selected.length ? ' open' : ''}>
  <summary>Gerir inventário</summary>
  ${expansionView(expansion)}
  ${p.pendingUniqueItem ? '<p class="inventory-full">Uma relíquia única aguarda um lugar livre.</p>' : ''}
  ${bag.length>=expansion.capacity ? '<p class="inventory-full">Inventário cheio: os novos drops são desmontados em recursos.</p>' : ''}
  ${dismantle.length ? `<div class="equipment-salvage"><h4>Desmontar itens</h4>
   ${dismantle.map(i => `<label class="dismantle-select"><input type="checkbox" data-salvage-item="${esc(i.id)}"
    ${selection.has(i.id) ? 'checked' : ''}> ${esc(itemName(i))}</label>`).join('')}
   ${selected.length ? `<div class="dismantle-panel"><span id="dismantle-yield">${yieldTotal.wood} madeira · ${yieldTotal.stone} pedra</span>
    <button data-dismantle="1">Desmontar ${selected.length} · 100 moedas</button></div>` : ''}
  </div>` : ''}
 </details>`;

 return `<h2>Equipamento <small>${equippedItems(preview).length}/4</small></h2>
  <section class="equipment-editor" data-form-revision="${draft.revision}">
   ${status}
   <div class="equipment-slots">${slots}</div>
   ${dirty ? `<div class="equipment-confirm-panel">
    <button class="primary wide equipment-confirm-callout" data-action="confirm-equipment">Confirmar configuração · 100 moedas</button>
    <button class="equipment-reset" data-equipment-reset="1">Repor</button>
   </div>` : ''}
   <h3>Itens <small>${bag.length}/${expansion.capacity}</small></h3>
   ${bag.length ? `<p class="equipment-hint">Arrasta ou toca na imagem para selecionar.</p><div class="equipment-bag">${tiles}</div>`
    : '<p class="equipment-hint">Ainda não tens itens. <button data-tab="mundo">Ver ilhas hostis →</button></p>'}
   <details class="equipment-extra" data-building-section="equipment-sets"><summary>Conjuntos e bónus</summary>
    <div class="equipment-totals" aria-label="${dirty ? 'Bónus previstos' : 'Bónus ativos'}">${Object.entries(equipmentBonuses(preview)).filter(([,n]) => n).map(([k,n]) => '<span>+'+n+'% '+STAT_NAMES[k]+'</span>').join('')}</div>
    ${setView(preview)}
   </details>
   ${manage}
  </section>`;
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
function expansionView(e){if(e.max)return '<div class="inventory-expansion"><small>Capacidade máxima</small></div>';return '<section class="inventory-expansion"><div><strong>'+e.capacity+' → '+e.next+' lugares</strong><span>'+e.paid+'/'+e.required+' pagamentos</span></div><progress value="'+e.paid+'" max="'+e.required+'" aria-label="Expansão do inventário"></progress><button data-action="expand-inventory">'+(e.required===1?'Expandir':'Pagar '+(e.paid+1)+'/'+e.required)+' · 100 moedas</button></section>';}
function setView(p){return '<div class="equipment-sets">'+equipmentSets(p).map(s=>{const slots=bestSetSlots(p,s.id),active=s.count===4;return '<details class="equipment-set" '+(s.count?'open':'')+' style="--set-color:'+s.color+'"><summary>'+s.name+' <b>'+s.count+'/4</b></summary><small class="'+(active?'set-active':'')+'">4 peças: '+bonusText(s.bonus)+'</small>'+(['bastiao','aurora'].includes(s.id)?'<small>Incompatível com '+(s.id==='bastiao'?'Aurora':'Bastião')+'</small>':'<small>Combina com todos os conjuntos</small>')+(slots&&!active?'<button data-equip-set="'+s.id+'">Selecionar conjunto</button>':'')+'</details>';}).join('')+'</div>';}
