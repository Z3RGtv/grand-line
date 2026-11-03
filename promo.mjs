import{PROMO_INTERVAL,PROMO_DURATION,PROMO_FIRST_DELAY,eligible,nextSlot}from'./promo-schedule.mjs?v=1';
const params=new URLSearchParams(location.search),preview=params.get('preview')==='1',card=document.querySelector('.invitation'),storage='grand-line-promo-next-v1';
let streaming=false,open=false,active=false,visible=false,configAt=0,statusAt=0,lastLive=false,leaving;
let next;try{next=nextSlot(localStorage.getItem(storage),Date.now());}catch{next=Date.now()+PROMO_FIRST_DELAY;}
function remember(){try{localStorage.setItem(storage,String(next));}catch{}}
function hide(){if(!visible)return;visible=false;card.classList.remove('visible');card.classList.add('leaving');card.setAttribute('aria-hidden','true');clearTimeout(leaving);leaving=setTimeout(()=>card.classList.remove('leaving'),600);}
function show(){if(visible)return;visible=true;card.classList.remove('leaving');card.classList.add('visible');card.setAttribute('aria-hidden','false');if(!preview){next=Date.now()+PROMO_INTERVAL;remember();}setTimeout(hide,PROMO_DURATION);}
async function refreshConfig(){try{const r=await fetch('config.json?promo='+Date.now(),{cache:'no-store'});if(!r.ok)throw Error();const c=await r.json();open=c.launchEnabled===true;document.querySelector('#price').textContent=String(c.costs.entrar);configAt=Date.now();}catch{open=false;}}
function readStatus(){if(typeof window.obsstudio?.getStatus!=='function'){streaming=false;return;}try{window.obsstudio.getStatus(status=>{streaming=status.streaming===true;statusAt=Date.now();});}catch{streaming=false;}}
function update(){if(preview)return;if(Date.now()-statusAt>30000)streaming=false;if(Date.now()-configAt>90000)open=false;if(!streaming||!open||!active){hide();lastLive=false;return;}if(!lastLive){next=Math.max(next,Date.now()+PROMO_FIRST_DELAY);remember();lastLive=true;}if(eligible({now:Date.now(),next,streaming,open,active}))show();}
window.addEventListener('obsSourceActiveChanged',e=>{active=e.detail.active===true;if(!active)hide();update();});
window.addEventListener('obsStreamingStopped',()=>{streaming=false;hide();});
window.addEventListener('obsStreamingStarted',()=>{readStatus();update();});
if(preview){document.body.dataset.preview='true';show();setInterval(()=>{if(!visible)show();},18000);}else{active=typeof window.obsstudio==='object';remember();await refreshConfig();readStatus();setInterval(()=>{readStatus();update();},5000);setInterval(refreshConfig,30000);setInterval(update,1000);}
