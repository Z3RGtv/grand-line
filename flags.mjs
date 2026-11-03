// A bounded, shareable flag description. Only this whitelist becomes SVG.
export const FLAG_COLORS=Object.freeze(['#102C3A','#174E78','#147D92','#39B7C0','#155C4A','#4B8B45','#A7C957','#692B48','#A72E42','#DF4C5B','#CC6031','#EFAD41','#D9B65F','#F3DFB1','#F6F1DD','#3A2858','#8554A1','#D58BC0','#342C2A','#737A83','#BFC6C7','#111820']);
const COLOR_NAMES=['Azul-noite','Azul-real','Azul-petróleo','Turquesa','Verde-mar','Verde-floresta','Verde-lima','Bordô','Vermelho','Coral','Cobre','Âmbar','Dourado','Areia','Marfim','Violeta-escuro','Roxo','Rosa','Castanho','Cinza','Prateado','Preto'];
export const FLAG_SYMBOLS=Object.freeze([{id:'anchor',label:'Âncora'},{id:'skull',label:'Caveira'},{id:'swords',label:'Espadas'},{id:'star',label:'Estrela'},{id:'crown',label:'Coroa'},{id:'wave',label:'Ondas'},{id:'sun',label:'Sol'},{id:'moon',label:'Lua'},{id:'compass',label:'Bússola'},{id:'flame',label:'Chama'},{id:'fish',label:'Peixe'},{id:'diamond',label:'Diamante'}].map(Object.freeze));
export const FLAG_PATTERNS=Object.freeze([{id:'plain',label:'Lisa'},{id:'vertical',label:'Faixa vertical'},{id:'horizontal',label:'Faixa horizontal'},{id:'diagonal',label:'Diagonal'},{id:'cross',label:'Cruz'}].map(Object.freeze));
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function hash(seed){let n=2166136261;for(const c of String(seed??'')){n^=c.codePointAt(0);n=Math.imul(n,16777619);}return n>>>0;}
export function defaultFlag(seed='grand-line'){const h=hash(seed),fields=['#102C3A','#174E78','#155C4A','#692B48','#A72E42','#3A2858','#342C2A','#111820'];return{field:fields[h%fields.length],accent:['#F3DFB1','#D9B65F','#39B7C0','#F6F1DD'][(h>>>4)%4],symbol:FLAG_SYMBOLS[(h>>>7)%FLAG_SYMBOLS.length].id,pattern:FLAG_PATTERNS[(h>>>11)%FLAG_PATTERNS.length].id};}
export function normalizeFlag(raw,{strict=false}={}){
 const fallback=defaultFlag();if(raw==null){if(strict)throw Error('Escolhe uma bandeira válida.');return fallback;}
 if(typeof raw!=='object'||Array.isArray(raw)){if(strict)throw Error('Bandeira inválida.');return fallback;}
 if(strict&&Object.keys(raw).some(k=>!['field','accent','symbol','pattern'].includes(k)))throw Error('A bandeira tem opções inválidas.');
 const flag={};for(const key of['field','accent','symbol','pattern']){let v=raw[key];if(key==='field'||key==='accent')v=typeof v==='string'?v.toUpperCase():v;const valid=(key==='field'||key==='accent')?FLAG_COLORS.includes(v):(key==='symbol'?FLAG_SYMBOLS:FLAG_PATTERNS).some(x=>x.id===v);if(!valid&&strict)throw Error('Escolhe uma opção válida para a bandeira.');flag[key]=valid?v:fallback[key];}
 return flag;
}
const ART={
 anchor:'<circle cx="60" cy="25" r="6" fill="none"/><path d="M60 31V63M45 40H75M39 50C39 68 81 68 81 50M32 54L39 47L46 54M74 54L81 47L88 54" fill="none"/>',
 skull:'<path d="M39 39C39 13 81 13 81 39C81 49 75 51 72 54V65H48V54C42 51 39 48 39 39Z"/><path d="M50 56V64M60 56V64M70 56V64" class="flag-cut"/><ellipse cx="50" cy="39" rx="5" ry="6" class="flag-hole"/><ellipse cx="70" cy="39" rx="5" ry="6" class="flag-hole"/><path d="M60 46L56 52H64Z" class="flag-hole"/>',
 swords:'<path d="M37 17L65 48L60 54L32 23ZM83 17L55 48L60 54L88 23ZM38 48L48 58M72 58L82 48M42 54L34 64M78 54L86 64"/>',
 star:'<path d="M60 16L68 32L86 35L73 48L76 66L60 57L44 66L47 48L34 35L52 32Z"/>',
 crown:'<path d="M34 29L48 40L60 20L72 40L86 29L79 59H41ZM42 65H78"/>',
 wave:'<path d="M33 32C42 19 50 43 60 30S78 43 87 29M33 45C42 32 50 56 60 43S78 56 87 42M33 58C42 45 50 69 60 56S78 69 87 55" fill="none"/>',
 sun:'<circle cx="60" cy="41" r="15"/><path d="M60 14V20M60 62V68M33 41H39M81 41H87M41 22L45 26M75 56L79 60M41 60L45 56M75 26L79 22" fill="none"/>',
 moon:'<path d="M72 17C48 22 46 56 73 64C47 75 28 49 41 28C47 19 59 14 72 17Z"/>',
 compass:'<path d="M60 14L66 34L86 41L66 47L60 68L54 47L34 41L54 34ZM42 23L52 31M78 23L68 31M42 59L52 51M78 59L68 51"/>',
 flame:'<path d="M63 14C68 31 83 35 82 50C80 72 41 73 38 51C37 41 46 31 48 27C46 41 56 40 56 31C56 24 61 18 63 14Z"/><path d="M59 45C47 57 56 66 65 62C74 58 66 48 64 44C64 51 60 53 59 45Z" class="flag-hole"/>',
 fish:'<path d="M35 42L24 28V56ZM36 42C48 18 80 20 92 42C80 64 48 66 36 42Z"/><circle cx="78" cy="38" r="3" class="flag-hole"/><path d="M58 27L65 17L72 27M58 56L65 65L72 56"/>',
 diamond:'<path d="M43 23H77L91 38L60 67L29 38ZM30 38H90M43 23L50 38L60 67L70 38L77 23M50 38L60 23L70 38"/>'
};
export function flagSVG(raw,{className='',label='Bandeira'}={}){
 const f=normalizeFlag(raw),classSafe=String(className).replace(/[^a-zA-Z0-9_ -]/g,'');
 const patterns={plain:'',vertical:'<path d="M12 7H35V73H12Z"/>',horizontal:'<path d="M7 50H113V68H7Z"/>',diagonal:'<path d="M7 7H29L113 51V73H91L7 29Z"/>',cross:'<path d="M28 7H42V73H28ZM7 32H113V46H7Z"/>'};
 return `<svg xmlns="http://www.w3.org/2000/svg" class="captain-flag ${esc(classSafe)}" viewBox="0 0 120 80" role="img" aria-label="${esc(label)}"><title>${esc(label)}</title><rect x="4" y="4" width="112" height="72" rx="3" fill="${f.field}" stroke="#E8D4A3" stroke-width="3"/><g fill="${f.accent}" opacity=".32">${patterns[f.pattern]}</g><g fill="${f.accent}" stroke="${f.accent}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round">${ART[f.symbol].replaceAll('class="flag-hole"',`fill="${f.field}" stroke="none"`).replaceAll('class="flag-cut"',`fill="none" stroke="${f.field}" stroke-width="2.5"`)}</g></svg>`;
}
function options(rows,value){return rows.map(r=>`<option value="${esc(r.id)}"${r.id===value?' selected':''}>${esc(r.label)}</option>`).join('');}
export function flagEditor(raw){const f=normalizeFlag(raw);const colors=FLAG_COLORS.map((id,i)=>({id,label:COLOR_NAMES[i]}));return `<div class="flag-editor"><div class="flag-preview" aria-live="polite">${flagSVG(f,{label:'Pré-visualização da tua bandeira'})}</div><div class="flag-editor-fields"><label>Cor da bandeira<select data-flag-field>${options(colors,f.field)}</select></label><label>Cor do símbolo<select data-flag-accent>${options(colors,f.accent)}</select></label><label>Símbolo<select data-flag-symbol>${options(FLAG_SYMBOLS,f.symbol)}</select></label><label>Padrão<select data-flag-pattern>${options(FLAG_PATTERNS,f.pattern)}</select></label></div></div>`;}
export function readFlagEditor(root=document){return normalizeFlag({field:root.querySelector('[data-flag-field]')?.value,accent:root.querySelector('[data-flag-accent]')?.value,symbol:root.querySelector('[data-flag-symbol]')?.value,pattern:root.querySelector('[data-flag-pattern]')?.value},{strict:true});}
export function updateFlagEditor(root=document){const f=readFlagEditor(root),preview=root.querySelector('.flag-preview');if(preview)preview.innerHTML=flagSVG(f,{label:'Pré-visualização da tua bandeira'});return f;}
