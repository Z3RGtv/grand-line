import{BOSS_SITES,EXPANDED_BOSS_SITES,LEGACY_BOSS_SITES,FINAL_BOSS_CLEARING}from'./adventure.mjs?v=0.27.2&rev=cadence1';
// Shared sea geometry. Paths use water corridors, never island centres.
export const MAP_WIDTH=3000,MAP_HEIGHT=2000;
export const LAND_RX=.058,LAND_RY=.064;
const positions=[[.13,.14],[.30,.12],[.20,.29],[.095,.43],[.36,.36],[.25,.49],[.12,.64],[.32,.69],[.17,.83],[.38,.89],[.48,.10],[.66,.12],[.85,.11],[.56,.27],[.78,.28],[.46,.44],[.65,.44],[.89,.45],[.57,.60],[.79,.61],[.47,.77],[.64,.75],[.86,.76],[.53,.91],[.70,.91],[.89,.91],[.93,.285],[.95,.61],[.085,.93],[.39,.545]];
export const DEFAULT_SLOTS=positions.map(([x,y],i)=>({id:['west','north','east'][Math.floor(i/10)]+'-'+String(i%10+1).padStart(2,'0'),x,y,width:230+(i*7)%24})).sort((a,b)=>a.x-b.x||a.y-b.y).map(s=>({...s,...(FINAL_BOSS_CLEARING[s.id]?.to||{})}));
const obstacles=slots=>slots[0]?.adventureSea?[...slots.map(s=>({...s,rx:.047,ry:.050})),...(slots[0].adventureSea>=3?BOSS_SITES:slots[0].adventureSea>=2?EXPANDED_BOSS_SITES:LEGACY_BOSS_SITES)]:slots;
const length=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export const routeLength=route=>route.slice(1).reduce((n,p,i)=>n+length(route[i],p),0);
export function waterPoint(slots,p){return p.x>=.035&&p.x<=.965&&p.y>=.075&&p.y<=.945&&obstacles(slots).every(s=>((p.x-s.x)/(s.rx||LAND_RX))**2+((p.y-s.y)/(s.ry||LAND_RY))**2>=1.00001);}
// A complete small orbit must fit between the coastline and the map edge.
export function waterCircle(slots,p,rx,ry){return p.x-rx>=.035&&p.x+rx<=.965&&p.y-ry>=.075&&p.y+ry<=.945&&obstacles(slots).every(s=>Math.hypot((p.x-s.x)/(s.rx||LAND_RX),(p.y-s.y)/(s.ry||LAND_RY))>1+Math.max(rx/(s.rx||LAND_RX),ry/(s.ry||LAND_RY)));}
export function clearLeg(slots,a,b){
 const dx=b.x-a.x,dy=b.y-a.y;
 return obstacles(slots).every(s=>{const rx=s.rx||LAND_RX,ry=s.ry||LAND_RY,ax=(a.x-s.x)/rx,ay=(a.y-s.y)/ry,bx=dx/rx,by=dy/ry;const den=bx*bx+by*by,t=den?Math.max(0,Math.min(1,-(ax*bx+ay*by)/den)):0;return (ax+t*bx)**2+(ay+t*by)**2>=.999999;});
}
export function coastPoint(slots,s,angle=Math.PI/2){
 for(let ring=0;ring<5;ring++)for(let k=0;k<32;k++){const a=angle+(k%2?1:-1)*Math.ceil(k/2)*Math.PI/16,p={x:s.x+Math.cos(a)*((s.rx?s.rx+.012:.078)+ring*.012),y:s.y+Math.sin(a)*((s.ry?s.ry+.012:.082)+ring*.012)};if(waterPoint(slots,p))return p;}
 throw Error('Não foi encontrada uma entrada de porto navegável.');
}
export const harbor=(slots,s)=>coastPoint(slots,s,Math.PI/2);
export function nearestWater(slots,p){if(waterPoint(slots,p))return{x:p.x,y:p.y};const s=[...obstacles(slots)].sort((a,b)=>length(a,p)-length(b,p))[0];return coastPoint(slots,s,Math.atan2(p.y-s.y,p.x-s.x));}
export function routePoint(route,fraction){
 if(!route?.length)return{x:0,y:0,angle:0};if(route.length===1)return{...route[0],angle:0};
 const total=routeLength(route);let left=Math.max(0,Math.min(1,fraction))*total;
 for(let i=1;i<route.length;i++){const a=route[i-1],b=route[i],d=length(a,b);if(left<=d||i===route.length-1){const t=d?Math.max(0,Math.min(1,left/d)):0;return{x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,angle:Math.atan2((b.y-a.y)*MAP_HEIGHT,(b.x-a.x)*MAP_WIDTH)};}left-=d;}
}
class Heap{constructor(){this.a=[];}push(id,f){const a=this.a;let i=a.length;a.push({id,f});while(i){const p=(i-1)>>1;if(a[p].f<=f)break;a[i]=a[p];i=p;}a[i]={id,f};}pop(){const a=this.a,first=a[0],last=a.pop();if(a.length){let i=0;while(i*2+1<a.length){let c=i*2+1;if(c+1<a.length&&a[c+1].f<a[c].f)c++;if(a[c].f>=last.f)break;a[i]=a[c];i=c;}a[i]=last;}return first;}get size(){return this.a.length;}}
const cache=new Map(),NX=73,NY=49;
function grid(slots){
 const key=(slots[0]?.adventureSea?'boss'+slots[0].adventureSea+';':'')+slots.map(s=>s.x+','+s.y).join(';');if(cache.has(key))return cache.get(key);
 const points=Array.from({length:NX*NY},(_,i)=>({x:.012+(i%NX)/(NX-1)*.976,y:.012+Math.floor(i/NX)/(NY-1)*.976}));
 const free=points.map(p=>waterPoint(slots,p)),edges=points.map(()=>[]);
 for(let i=0;i<points.length;i++)if(free[i])for(const[dx,dy]of[[1,0],[0,1],[1,1],[-1,1]]){const x=i%NX+dx,y=Math.floor(i/NX)+dy,j=y*NX+x;if(x<0||x>=NX||y>=NY||!free[j]||!clearLeg(slots,points[i],points[j]))continue;const d=length(points[i],points[j]);edges[i].push([j,d]);edges[j].push([i,d]);}
 const value={points,free,edges};cache.set(key,value);if(cache.size>4)cache.delete(cache.keys().next().value);return value;
}
export function seaRoute(slots,from,to){
 if(!waterPoint(slots,from)||!waterPoint(slots,to))throw Error('A viagem tem de começar e terminar no mar.');
 if(clearLeg(slots,from,to))return[{x:from.x,y:from.y},{x:to.x,y:to.y}];
 const g=grid(slots),direct=p=>{let best=-1,d=Infinity;for(let i=0;i<g.points.length;i++){if(!g.free[i])continue;const next=length(p,g.points[i]);if(next<d&&clearLeg(slots,p,g.points[i])){best=i;d=next;}}return best;};
 // A moving boat can enter a narrow strip between a coast and a map edge.
 // Connect it by a short, collision-checked bend before joining the coarse grid.
 const nearest=p=>{const id=direct(p);if(id>=0)return{id,via:null};for(const radius of [.003,.006,.012,.024,.04])for(let k=0;k<32;k++){const angle=k*Math.PI/16,via={x:p.x+Math.cos(angle)*radius,y:p.y+Math.sin(angle)*radius};if(!waterPoint(slots,via)||!clearLeg(slots,p,via))continue;const id=direct(via);if(id>=0)return{id,via};}throw Error('Porto sem acesso ao canal.');};
 const entry=nearest(from),exit=nearest(to),start=entry.id,end=exit.id,cost=new Float64Array(g.points.length).fill(Infinity),prev=new Int32Array(g.points.length).fill(-1),closed=new Uint8Array(g.points.length),open=new Heap();cost[start]=0;open.push(start,length(g.points[start],g.points[end]));
 while(open.size){const{id}=open.pop();if(closed[id])continue;if(id===end)break;closed[id]=1;for(const[next,d]of g.edges[id]){const n=cost[id]+d;if(n<cost[next]){cost[next]=n;prev[next]=id;open.push(next,n+length(g.points[next],g.points[end]));}}}
 if(!Number.isFinite(cost[end]))throw Error('Não existe um canal navegável para esse destino.');
 const raw=[to];if(exit.via)raw.push(exit.via);for(let id=end;id!==-1;id=prev[id])raw.push(g.points[id]);if(entry.via)raw.push(entry.via);raw.push(from);raw.reverse();
 const smooth=[raw[0]];for(let i=0;i<raw.length-1;){let j=raw.length-1;while(j>i+1&&!clearLeg(slots,raw[i],raw[j]))j--;smooth.push(raw[j]);i=j;}return smooth;
}

// Old NPC patrols belong to the old shoreline. Never relocate an active encounter or voyage.
export function applyWorldLayout(w,slots,version=7){
 if(w.missions?.length||Object.keys(w.encounters||{}).length)return false;
 if(w.mapVersion!==version)w.bots=[];
 w.slots=slots.map(s=>({...s}));w.mapVersion=version;return true;
}
