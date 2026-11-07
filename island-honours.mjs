import{BOSS_SITES}from'./adventure.mjs?v=0.27.2&rev=world1';
import{sessionProtected}from'./game-session.mjs?v=0.27.2';
import{itemArt,itemName}from'./equipment.mjs?v=0.27.2&rev=world1';
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

const emblems={
 crab:'<path d="M39 62 27 54 17 58 16 44 22 35 25 47 33 42 31 57 42 68M89 62 101 54 111 58 112 44 106 35 103 47 95 42 97 57 86 68"/><path d="m42 79-14 3-6 9m22-4-10 9m52-17 14 3 6 9M84 87l10 9"/><path d="M39 68q25-24 50 0l-5 15q-20 17-40 0Z"/><path d="m53 63-3-10m25 10 3-10"/><circle cx="50" cy="51" r="4"/><circle cx="78" cy="51" r="4"/>',
 captain:'<path d="M29 54 42 30l22 8 22-8 13 24-35-7Z"/><path d="M45 57q19-14 38 0v20l-9 9v10H54V86l-9-9Z"/><path d="m38 95 52-8m-50-3 50 14"/><circle cx="55" cy="67" r="5" fill="#10212e"/><circle cx="73" cy="67" r="5" fill="#10212e"/><path d="m64 74-4 7h8Z" fill="#10212e"/><path d="M59 88v7m10-7v7"/>',
 golem:'<path d="m40 44 15-12h18l15 12-4 33-20 16-20-16Z"/><path d="m40 44 24 10 24-10M64 54v39M45 61l12 4m26-4-12 4" fill="none"/><path d="M24 57h10l7 31-15 8-9-17Zm80 0H94l-7 31 15 8 9-17Z"/><path d="M56 30h16V20H56Z"/>',
 leviathan:'<path d="M30 90q-4-18 16-25l30-8q10-6 0-13l-8 2-6-13 16-11 21 15 4 18q-3 15-25 22l-26 6q-12 5-3 12 12 10 26-4l17-4q-10 28-36 22-22-4-26-19Z"/><path d="m76 25 3-12 9 13m-3 40 11 4-15 9m-24-1 1-13-13 12M66 95l-1 13"/><circle cx="87" cy="41" r="3" fill="#10212e"/>'
};
const palettes={
 'I-CORAL':['#ef6759','#791e2a','sun'], 'I-GARRA':['#efbf6d','#673622','claw'],
 'I-MAREAS':['#65e0d1','#155466','wave'], 'I-CORSARIO':['#edab6d','#662e21','swords'],
 'I-CAVEIRA':['#d4dbe2','#5c2b40','skull'], 'I-FAROL':['#fff0be','#215565','star'],
 'I-BASALTO':['#9abce9','#263c64','anchor'], 'I-ATOL':['#bba5f1','#472f77','swirl'],
 'I-FORNALHA':['#ff9654','#802926','flame'], 'I-COROA':['#edd285','#443279','crown']
};
export function bossBadge(id,{locked=false}={}){
 const b=BOSS_SITES.find(b=>b.id===id);if(!b)return'';
 const[light,dark,mark]=palettes[id],uid='badge-'+id,spokes=Array.from({length:12},(_,n)=>'<path d="M64 8v5" transform="rotate('+n*30+' 64 64)"/>').join('');
 return'<svg class="boss-badge'+(locked?' locked':'')+'" viewBox="0 0 128 144" role="img" aria-label="'+esc(b.bossName)+(locked?' · por conquistar':' · derrotado')+'"><title>'+esc(b.bossName)+'</title><defs><linearGradient id="'+uid+'-metal" x2=".8" y2="1"><stop stop-color="#fff4c2"/><stop offset=".4" stop-color="'+light+'"/><stop offset="1" stop-color="#92663b"/></linearGradient><radialGradient id="'+uid+'-enamel"><stop stop-color="'+dark+'"/><stop offset="1" stop-color="#10212e"/></radialGradient></defs><path d="m33 102-9 36 23-10 13 13 9-37m26-2 9 36-23-10-13 13-9-37" fill="'+dark+'" stroke="'+light+'" stroke-width="2"/><circle cx="64" cy="64" r="59" fill="url(#'+uid+'-metal)" stroke="#6a5035" stroke-width="2"/><circle cx="64" cy="64" r="51" fill="url(#'+uid+'-enamel)" stroke="#ead393" stroke-width="2"/><g stroke="#ffedb5" stroke-width="2" opacity=".8">'+spokes+'</g><g fill="'+light+'" stroke="'+light+'" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round">'+emblems[b.boss]+'</g><path d="m64 5 4 9-4 5-4-5Z" fill="'+light+'"/><g class="badge-mark" fill="'+light+'">'+(mark==='crown'?'<path d="m44 112-4-10 16 6 8-12 8 12 16-6-4 10Z"/>':mark==='wave'||mark==='swirl'?'<path d="M44 109q7-8 14 0t14 0 14 0v4q-7-7-14 0t-14 0-14 0Z"/>':'<path d="m64 100 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z"/>')+'</g></svg>';
}
export function playerHonours(w,p){
 const wins=new Set(p.badges||p.bossWins||[]),badges=BOSS_SITES.filter(b=>wins.has(b.id)).sort((a,b)=>a.level-b.level);
 const relics=Object.values(w.relics||{}).filter(r=>r.holders.some(h=>h.user===p.id));
 return(badges.length?'<section class="player-honours"><h3>Conquistas <small>'+badges.length+'/'+BOSS_SITES.length+'</small></h3><div class="boss-badge-grid">'+badges.map(b=>'<button data-object="'+b.id+'" title="'+esc(b.bossName)+'">'+bossBadge(b.id)+'</button>').join('')+'</div></section>':'')+(relics.length?'<section class="player-relics"><h3>Relíquias do Abismo</h3>'+relics.map(r=>'<button data-item-type="'+r.type+'"><img src="'+itemArt(r)+'" alt=""><span>'+esc(itemName(r))+'</span><b>'+r.holders.filter(h=>h.user===p.id).length+' / 3</b></button>').join('')+'</section>':'');
}
export function relicHolders(w,type){const r=w?.relics?.[type];return r?'<small class="relic-owners">'+r.holders.length+'/3 no mundo'+(r.holders.length?' · '+r.holders.map(h=>esc(h.name)).join(', '):'')+'</small>':'';}
