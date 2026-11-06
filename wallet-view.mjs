const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num = value => Number(value ?? 0).toLocaleString('pt-PT');
const fundingNotice = 'Só podes carregar moedas durante a transmissão.';
export const coinIcon=()=>'<svg class="coin-icon" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="14" fill="#c18b2b" stroke="#f5d982" stroke-width="2"/><circle cx="16" cy="16" r="10.5" fill="#e4b54d" stroke="#92601f"/><path d="M16 11v13m-6-8H7c0 5 4 8 9 8s9-3 9-8h-3M12 15h8" fill="none" stroke="#704a1d" stroke-width="2.3" stroke-linecap="round"/><circle cx="16" cy="8" r="2.5" fill="none" stroke="#704a1d" stroke-width="2"/></svg>';

export function walletHud(balance, budget) {
 const exhausted = budget.remaining === 0;
 const limit = exhausted ? 'Limite atingido' : 'Limite '+num(budget.remaining);
 const description = exhausted ? 'Limite de gasto atingido' : 'Limite de gasto restante '+num(budget.remaining);
 return `<button id="hud-wallet" class="hud-resource points hud-wallet" data-wallet-open="1"
   aria-label="Carteira, ${num(balance)} moedas. ${description}." title="${description}. Abrir carteira.">
  ${coinIcon()}<div><small>Moedas</small><strong>${num(balance)}</strong></div>
  <small class="wallet-hud-limit${exhausted ? ' limit-hit' : ''}">${limit}</small>
 </button>`;
}

export function walletOrderMessage(message, budget) {
 if (!message?.startsWith('Limite disponível insuficiente')) return message;
 return budget?.remaining === 0
  ? 'Limite de gasto atingido. Renova na próxima transmissão.'
  : 'Esta ação excede o teu limite de gasto.';
}

export function entryWalletView({balance, cost, paid, canLoad, pack, demo, welcome=false}) {
 const needsCoins = !paid && balance < cost;
 let funding = '<span class="entry-availability">Só durante a transmissão</span>';
 if (demo) {
  funding = '<button class="primary" data-wallet-open="1" data-entry-load>Carregar carteira</button>';
 } else if (canLoad) {
  funding = '<a class="primary" href="https://www.twitch.tv/z3rgtv" target="_blank" rel="noopener" data-entry-load>Resgatar na Twitch ↗</a><span class="entry-availability">Só durante a transmissão</span>';
 }
 return `<section class="welcome-port entry-port">
  <div>
   <h2>Criar a tua ilha</h2>
   <p class="entry-balance">${coinIcon()} <span>Saldo</span> <strong>${num(balance)} moedas</strong></p>
   ${welcome ? '<small class="entry-availability">Inclui 500 moedas de boas-vindas</small>' : ''}
   ${needsCoins ? `<div class="entry-step" id="entry-funding" tabindex="-1">
    <b aria-hidden="true">1</b><div><strong>Grand Line · Moedas</strong><small>${num(pack)} pontos → ${num(pack)} moedas</small></div>${funding}
   </div>` : ''}
   <div class="entry-step">
    ${needsCoins ? '<b aria-hidden="true">2</b>' : ''}
    <button class="${needsCoins ? 'entry-create' : 'primary'}" data-action="found">Criar ilha${paid ? '' : ' · '+num(cost)+' moedas'}</button>
   </div>
  </div>
 </section>`;
}
const labels={trabalhar:'Produção',produzir:'Produção',edificio:'Edifício',navios:'Barcos',trabalhadores:'Trabalhadores',tropas:'Marinheiros',pesquisa:'Pesquisa',pescar:'Pesca',enviar:'Expedição',guarnicao:'Defesa',bandeira:'Bandeira',equipar:'Equipamento',desmontar:'Desmontar itens','ampliar-inventario':'Inventário',regressar:'Regresso ao mapa',criar:'Aliança',sair:'Aliança'};
export function walletView(wallet, {demo=false, readOnly=false, canLoad=true, pack=500, budget}={}) {
 const load = demo
  ? `<button class="primary wide" data-wallet-topup="1">+ ${num(pack)} moedas de teste</button>`
  : `<p class="wallet-offline">${fundingNotice}</p>
    ${!readOnly && !wallet.offline && canLoad ? `<a class="primary wallet-load" href="https://www.twitch.tv/z3rgtv" target="_blank" rel="noopener">Carregar · ${num(pack)} Pontos de Canal ↗</a>
    <small class="wallet-instruction">Resgata <b>Grand Line · Moedas</b> na Twitch.</small>` : ''}`;
 const limit = budget ? `<section class="wallet-budget${budget.remaining === 0 ? ' limit-hit' : ''}">
  <h3>Limite de gasto</h3>
  <strong>${budget.remaining === 0 ? 'Limite atingido' : num(budget.remaining)+' disponíveis'}</strong>
  <small>+${num(budget.daily)} por transmissão · máximo de ${num(budget.cap)}</small>
 </section>` : '';
 const pending = wallet.pending ? `<section class="wallet-pending">
  <strong>Compra por confirmar</strong>
  <p>Se já foi efetuada, repetir verifica a mesma ordem e não cobra novamente.</p>
  ${!readOnly && !wallet.offline ? '<button class="primary wide" data-wallet-retry="1">Verificar / reenviar a mesma ordem</button>' : '<small>Verifica quando o servidor voltar.</small>'}
 </section>` : '';
 const moves = (wallet.transactions || []).map(t => {
  const label = t.kind === 'credit'
   ? ({'balance-refund':'Devolução de equilíbrio',welcome:'Bónus de boas-vindas','reset-refund':'Devolução do reset'}[t.request?.kind]||'Carregamento')
   : t.request?.kind === 'entrar' ? 'Criar ilha' : labels[t.request?.action] || 'Ação';
  const date = new Date(t.created).toLocaleString('pt-PT', {day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
  return `<div><span><b>${esc(label)}</b><small>${date}</small></span>
   <strong class="${t.delta > 0 ? 'credit' : 'debit'}">${t.delta > 0 ? '+' : '−'}${num(Math.abs(t.delta))}</strong></div>`;
 });
 return `<h2>Carteira</h2>
  <div class="wallet-amount">${coinIcon()}<strong>${num(wallet.balance)}</strong><span>moedas</span></div>
  ${limit}${load}
  ${readOnly ? '<p class="wallet-offline">Podes consultar a carteira com o servidor desligado.</p>' : ''}
  ${pending}<h3>${wallet.offline ? 'Movimentos guardados' : 'Movimentos'}</h3>
  ${moves.length ? '<div class="wallet-transactions">'+moves.join('')+'</div>' : '<p class="wallet-empty">'+(wallet.offline ? 'Sem histórico guardado neste dispositivo.' : 'Sem movimentos.')+'</p>'}`;
}
