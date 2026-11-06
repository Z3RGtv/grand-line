// A bounded, shareable flag description. Only this whitelist becomes SVG.
export const FLAG_COLORS=Object.freeze(['#102C3A','#174E78','#147D92','#39B7C0','#155C4A','#4B8B45','#A7C957','#692B48','#A72E42','#DF4C5B','#CC6031','#EFAD41','#D9B65F','#F3DFB1','#F6F1DD','#3A2858','#8554A1','#D58BC0','#342C2A','#737A83','#BFC6C7','#111820']);
const COLOR_NAMES=['Azul-noite','Azul-real','Azul-petróleo','Turquesa','Verde-mar','Verde-floresta','Verde-lima','Bordô','Vermelho','Coral','Cobre','Âmbar','Dourado','Areia','Marfim','Violeta-escuro','Roxo','Rosa','Castanho','Cinza','Prateado','Preto'];
const CLASSIC_SYMBOLS=[{id:'anchor',label:'Âncora'},{id:'skull',label:'Caveira'},{id:'swords',label:'Espadas'},{id:'star',label:'Estrela'},{id:'crown',label:'Coroa'},{id:'wave',label:'Ondas'},{id:'sun',label:'Sol'},{id:'moon',label:'Lua'},{id:'compass',label:'Bússola'},{id:'flame',label:'Chama'},{id:'fish',label:'Peixe'},{id:'diamond',label:'Diamante'}];
const ANIMAL_SYMBOLS=[{id:'rabbit',label:'Coelho'},{id:'dog',label:'Cão de orelha caída'},{id:'cat',label:'Gato'},{id:'fox',label:'Raposa'},{id:'octopus',label:'Polvo'},{id:'parrot',label:'Papagaio'},{id:'turtle',label:'Tartaruga'}];
const EXTRA_SYMBOLS=[{id:'z3rg',label:'Z3RG · Silhueta'},{id:'pasta',label:'Massa · Farfalle'},{id:'hourglass',label:'Ampulheta'},{id:'island',label:'Ilha'}];
export const FLAG_SYMBOLS=Object.freeze([...CLASSIC_SYMBOLS,...ANIMAL_SYMBOLS,...EXTRA_SYMBOLS].map(Object.freeze));
export const FLAG_PATTERNS=Object.freeze([{id:'plain',label:'Lisa'},{id:'vertical',label:'Vertical'},{id:'horizontal',label:'Horizontal'},{id:'diagonal',label:'Diagonal'},{id:'cross',label:'Cruz'}].map(Object.freeze));
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function hash(seed){let n=2166136261;for(const c of String(seed??'')){n^=c.codePointAt(0);n=Math.imul(n,16777619);}return n>>>0;}
export function defaultFlag(seed='grand-line'){const h=hash(seed),fields=['#102C3A','#174E78','#155C4A','#692B48','#A72E42','#3A2858','#342C2A','#111820'];return{field:fields[h%fields.length],accent:['#F3DFB1','#D9B65F','#39B7C0','#F6F1DD'][(h>>>4)%4],symbol:CLASSIC_SYMBOLS[(h>>>7)%CLASSIC_SYMBOLS.length].id,pattern:FLAG_PATTERNS[(h>>>11)%FLAG_PATTERNS.length].id};}
export function normalizeFlag(raw,{strict=false}={}){
 const fallback=defaultFlag();if(raw==null){if(strict)throw Error('Escolhe uma bandeira válida.');return fallback;}
 if(typeof raw!=='object'||Array.isArray(raw)){if(strict)throw Error('Bandeira inválida.');return fallback;}
 if(strict&&Object.keys(raw).some(k=>!['field','accent','symbol','pattern','stripe'].includes(k)))throw Error('A bandeira tem opções inválidas.');
 const flag={};for(const key of['field','accent','symbol','pattern']){let v=raw[key];if(key==='field'||key==='accent')v=typeof v==='string'?v.toUpperCase():v;const valid=(key==='field'||key==='accent')?FLAG_COLORS.includes(v):(key==='symbol'?FLAG_SYMBOLS:FLAG_PATTERNS).some(x=>x.id===v);if(!valid&&strict)throw Error('Escolhe uma opção válida para a bandeira.');flag[key]=valid?v:fallback[key];}
 if(Object.hasOwn(raw,'stripe')){
  const stripe=typeof raw.stripe==='string'?raw.stripe.toUpperCase():null;
  if(FLAG_COLORS.includes(stripe))flag.stripe=stripe;
  else if(strict)throw Error('Escolhe uma cor válida para a faixa.');
 }
 return flag;
}
export function sameFlag(left,right){
 const a=normalizeFlag(left),b=normalizeFlag(right);
 return a.field===b.field&&a.accent===b.accent&&a.symbol===b.symbol&&a.pattern===b.pattern&&(a.pattern==='plain'||a.stripe===b.stripe);
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
 diamond:'<path d="M43 23H77L91 38L60 67L29 38ZM30 38H90M43 23L50 38L60 67L70 38L77 23M50 38L60 23L70 38"/>',
 // Original Z3RG Illustrator artboard silhouette.
 z3rg:'<path transform="translate(47.5 63.625) scale(.25)" stroke="none" d="M0,0 C-43.723,-11.197 -56.753,-68.868 -56.753,-68.868 C-65.519,-103.607 -42.804,-137.636 -36.214,-146.554 C-35.454,-147.582 -33.94,-147.401 -33.386,-146.239 C-31.044,-141.335 -27.889,-137.86 -24.808,-135.423 C-19.866,-131.514 -15.116,-130.269 -14.219,-130.06 C-14.121,-130.037 -14.024,-130.025 -13.924,-130.021 C30.907,-128.534 38.025,-97.12 38.692,-80.855 C38.819,-77.744 35.021,-76.32 33.183,-78.78 C22.427,-93.182 -0.974,-114.643 -20.006,-86.606 C-35.82,-63.311 -22.16,-35.286 2.422,-22.592 C17.189,-14.966 42.677,-12.541 63.165,-33.261 C85.326,-55.672 82.775,-96.174 65.033,-124.434 C53.598,-142.648 26.6,-155.221 26.719,-156.441 C26.951,-158.8 32.997,-162.214 35.523,-163.312 C35.542,-163.32 35.552,-163.325 35.552,-163.325 C72.691,-177.716 132.568,-187.223 161.72,-117.473 C162.447,-115.733 160.329,-114.219 159.028,-115.549 C147.04,-127.813 112.693,-159.351 88.396,-141.893 C87.873,-141.517 126.711,-106.005 111.386,-54.403 C97.539,-7.78 61.848,4.857 20.593,4.857 C6.372,4.857 -11.363,-3.674 -23.4,-11.657 Z"/>',
 rabbit:'<path d="M42 40C36 28 34 11 41 9C49 7 53 24 53 34C58 32 62 32 67 34C67 22 71 7 79 9C86 11 82 28 77 40C86 47 84 61 75 66C66 72 54 72 45 66C36 61 34 47 42 40Z"/><circle cx="51" cy="49" r="3" class="flag-hole"/><circle cx="69" cy="49" r="3" class="flag-hole"/><path d="M56 57H64L60 61Z" class="flag-hole"/>',
 dog:'<path d="M39 42C36 36 35 23 38 13C46 12 52 22 54 30C60 28 68 29 73 32C78 29 88 32 91 40C94 49 92 62 86 64C81 66 77 61 76 58C72 65 65 69 57 68C44 68 37 60 37 51C37 47 38 44 39 42Z"/><circle cx="48" cy="45" r="3" class="flag-hole"/><circle cx="66" cy="45" r="3" class="flag-hole"/><path d="M52 53Q57 50 62 53Q62 57 57 60Q52 57 52 53Z" class="flag-hole"/><path d="M76 39Q81 45 78 54" class="flag-cut"/>',
 cat:'<path d="M37 40L39 19L54 29Q60 27 66 29L81 19L83 40C91 57 75 66 60 66S29 57 37 40Z"/><path d="M46 44L53 46M74 44L67 46M32 48L42 51M30 57L42 55M88 48L78 51M90 57L78 55" fill="none"/><path d="M47 43L54 46L47 49ZM73 43L66 46L73 49ZM56 54H64L60 58Z" class="flag-hole"/>',
 fox:'<path d="M33 16L52 30L60 27L68 30L87 16L83 46L60 67L37 46Z"/><path d="M40 43L54 51L60 59L66 51L80 43L74 53L60 64L46 53Z" class="flag-hole"/><path d="M44 36L53 42L47 43ZM76 36L67 42L73 43Z" class="flag-hole"/>',
 octopus:'<path d="M44 41C41 21 55 14 68 18C79 21 83 30 79 43C84 50 91 51 94 44C99 57 87 62 77 56C83 66 75 72 69 67L62 56C62 69 55 72 50 65C47 61 51 56 50 54C44 64 33 64 29 56C39 58 43 50 44 41Z"/><circle cx="54" cy="37" r="3" class="flag-hole"/><circle cx="69" cy="37" r="3" class="flag-hole"/>',
 parrot:'<path d="M43 60C44 50 44 43 51 36C45 29 47 17 56 13C69 7 82 16 81 26C91 26 96 33 91 41L84 35L76 34C77 48 67 55 60 57L43 71Z"/><circle cx="69" cy="22" r="3" class="flag-hole"/><path d="M65 38C64 47 56 48 52 51" class="flag-cut"/>',
 turtle:'<path d="M31 43L39 37L38 27L51 31C60 27 68 28 76 32L84 25L87 32C96 31 98 38 92 43L81 45L79 54L68 50C59 57 49 55 42 50L34 55L34 48L26 49Z"/><path d="M53 34L49 43L58 49L68 46L70 36L61 32Z" class="flag-cut"/><circle cx="89" cy="36" r="2" class="flag-hole"/>',
 pasta:'<path d="M34 21L42 23L47 21L59 34L72 21L78 23L86 21L85 30L89 36L85 42L89 49L85 55L86 63L78 61L72 63L60 50L47 63L42 61L34 63L35 55L31 49L35 42L31 36L35 30Z"/><path d="M47 33L56 40M46 50L56 44M73 33L64 40M74 50L64 44" class="flag-cut"/>',
 hourglass:'<path d="M42 16H78M42 66H78M46 18C46 34 54 35 60 41C66 35 74 34 74 18M46 64C46 48 54 47 60 41C66 47 74 48 74 64" fill="none"/><path d="M50 61L60 49L70 61Z"/>',
 island:'<path d="M30 61C40 51 53 49 63 51C74 49 85 54 90 61C71 67 49 67 30 61Z"/><path d="M58 54Q60 39 70 27" fill="none"/><path d="M70 27C61 15 51 16 47 21C55 20 61 25 67 30C56 24 47 28 44 34C53 30 60 31 67 33C74 25 81 25 89 29C86 20 77 19 70 27ZM70 28C78 28 85 33 87 40C80 35 75 34 69 33Z"/>'
};
export function flagSVG(raw,{className='',label='Bandeira'}={}){
 const f=normalizeFlag(raw),classSafe=String(className).replace(/[^a-zA-Z0-9_ -]/g,'');
 const patterns={plain:'',vertical:'<path d="M12 7H35V73H12Z"/>',horizontal:'<path d="M7 50H113V68H7Z"/>',diagonal:'<path d="M7 7H29L113 51V73H91L7 29Z"/>',cross:'<path d="M28 7H42V73H28ZM7 32H113V46H7Z"/>'};
 return `<svg xmlns="http://www.w3.org/2000/svg" class="captain-flag ${esc(classSafe)}" viewBox="0 0 120 80" role="img" aria-label="${esc(label)}"><title>${esc(label)}</title><rect x="4" y="4" width="112" height="72" rx="3" fill="${f.field}" stroke="#E8D4A3" stroke-width="3"/><g fill="${f.stripe??f.accent}"${f.stripe?'':' opacity=".32"'}>${patterns[f.pattern]}</g><g fill="${f.accent}" stroke="${f.accent}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round">${ART[f.symbol].replaceAll('class="flag-hole"',`fill="${f.field}" stroke="none"`).replaceAll('class="flag-cut"',`fill="none" stroke="${f.field}" stroke-width="2.5"`)}</g></svg>`;
}
function options(rows,value){return rows.map(r=>`<option value="${esc(r.id)}"${r.id===value?' selected':''}>${esc(r.label)}</option>`).join('');}
export function flagEditor(raw){
 const f=normalizeFlag(raw),colors=FLAG_COLORS.map((id,i)=>({id,label:COLOR_NAMES[i]}));
 const groups=[['Clássicos',CLASSIC_SYMBOLS],['Animais',ANIMAL_SYMBOLS],['Especiais',EXTRA_SYMBOLS]];
 return `<div class="flag-editor"><div class="flag-preview" aria-live="polite">${flagSVG(f,{label:'Pré-visualização da tua bandeira'})}</div>
 <div class="flag-editor-fields">
  <label>Cor da bandeira<select data-flag-field>${options(colors,f.field)}</select></label>
  <label>Cor do símbolo<select data-flag-accent>${options(colors,f.accent)}</select></label>
  <label>Símbolo<select data-flag-symbol>${groups.map(([label,rows])=>`<optgroup label="${label}">${options(rows,f.symbol)}</optgroup>`).join('')}</select></label>
  <label>Padrão<select data-flag-pattern>${options(FLAG_PATTERNS,f.pattern)}</select></label>
  <label>Cor da faixa<select data-flag-stripe${f.pattern==='plain'?' disabled':''}>${options([{id:'',label:'Automática'},...colors],f.stripe??'')}</select></label>
 </div></div>`;
}
export function readFlagEditor(root=document){
 const value=key=>root.querySelector('[data-flag-'+key+']')?.value;
 const stripe=value('stripe');
 return normalizeFlag({field:value('field'),accent:value('accent'),symbol:value('symbol'),pattern:value('pattern'),...(stripe?{stripe}:{})},{strict:true});
}
export function updateFlagEditor(root=document){
 const f=readFlagEditor(root),preview=root.querySelector('.flag-preview'),stripe=root.querySelector('[data-flag-stripe]');
 if(stripe)stripe.disabled=f.pattern==='plain';
 if(preview)preview.innerHTML=flagSVG(f,{label:'Pré-visualização da tua bandeira'});
 return f;
}

// The island keeps the game's gilded shield frame and its captain's own flag symbol.
export function crestSVG(raw,{className='',label='Brasão da ilha'}={}){
 const f=normalizeFlag(raw),classSafe=String(className).replace(/[^a-zA-Z0-9_ -]/g,''),key='island-crest-'+hash(JSON.stringify(f)),shape='M95 36C112 44 132 49 151 50L150 83C146 119 126 143 95 157C64 143 45 120 40 83L39 50C58 48 78 44 95 36Z',title=label+' · '+FLAG_SYMBOLS.find(s=>s.id===f.symbol).label;
 const symbol=ART[f.symbol].replaceAll('class="flag-hole"',`fill="${f.field}" stroke="none"`).replaceAll('class="flag-cut"',`fill="none" stroke="${f.field}" stroke-width="2.5"`);
 return `<svg xmlns="http://www.w3.org/2000/svg" class="island-crest ${esc(classSafe)}" viewBox="0 0 192 192" width="192" height="192" role="img" aria-label="${esc(title)}"><title>${esc(title)}</title><defs><clipPath id="${key}-field"><path d="${shape}"/></clipPath><linearGradient id="${key}-shade" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#fff" stop-opacity=".2"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".3"/></linearGradient></defs><image href="assets/ui/shield.png" x="0" y="0" width="192" height="192"/><g clip-path="url(#${key}-field)"><path d="${shape}" fill="${f.field}"/><path d="${shape}" fill="url(#${key}-shade)"/><g transform="translate(5 30) scale(1.5)" fill="${f.accent}" stroke="${f.accent}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round">${symbol}</g></g><path d="${shape}" fill="none" stroke="#B18A48" stroke-width="1.6"/></svg>`;
}
