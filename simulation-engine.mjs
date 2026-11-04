import{ensureAdventure,bossAlive,bossAccess,bossUnits,bossFormation,refreshBosses,report}from'./adventure.mjs?v=0.19.0';
import{equipmentOrder,equipmentBonuses,applyFleetEquipment,rollItem,dismantleYield,itemName}from'./equipment.mjs?v=0.19.0';
import{npcFlag,npcProfile,standardizeNpcFlags}from'./npc-flags.mjs?v=0.19.0';
import{emitActivity}from'./activity-hooks.mjs';
import{ECONOMY_VERSION,INITIAL_RESOURCES,buildingCost,requiredWarehouse}from'./economy.mjs?v=0.19.0';
import{hasWall,storageCapacity,sailorState,defendingTroops,migrateHarbor}from'./harbor.mjs?v=0.19.0';
import{defaultFlag,normalizeFlag}from'./flags.mjs?v=0.19.0';
import{NPC_MAX,NPC_LEVEL_RANGE,NAVAL_ROUND_SECONDS,npcShipCount,seaFields,npcRoute,makeNpcFleet,navalUnits,rollNavalRound,distributeSeaLoot,createWreck,battleSnapshot,npcAccess,botPoint,interceptionPoint,fleetPoint,wreckPoint,routeLootBonus,resourceTotal}from'./sea-system.mjs?v=0.19.0';
import{recordOrder,recordReturn,recordJobCompletion}from'./onboarding.mjs?v=0.19.0';
import {DEFAULT_SLOTS,waterPoint,seaRoute,routePoint,routeLength,harbor,coastPoint,nearestWater} from './navigation.mjs?v=0.19.0';
import {WORKER_POOL,WORK_SHIFT_SECONDS,PRODUCTION_MODEL,workerCount,workerCapacity,workerState,workOrder,productionBetween} from './workers.mjs?v=0.19.0';
export {WORKER_POOL,WORK_SHIFT_SECONDS,workerState} from './workers.mjs?v=0.19.0';
import{populationState}from'./population.mjs?v=0.19.0';
import{maxBuildingLevel,queueDelay,researchSpec}from'./progression.mjs?v=0.19.0';
export{maxBuildingLevel,queueDelay}from'./progression.mjs?v=0.19.0';
import{MIN_CREW_PER_SHIP,PERMIT_BANK_MAX,PERMIT_DAILY_MAX,PERMIT_RECHARGE,PERMIT_CATCHUP_RECHARGE,PERMIT_CATCHUP_GAP,licenseCost,plannedWarehouse,spawnAnchor}from'./pace-rules.mjs?v=0.19.0';
export const BUILDINGS=['sede','serraria','pedreira','armazem','estaleiro','muralha','academia'];
export const SHIPS={pesqueiro:{wood:80,stone:20,minutes:5,slots:1,capacity:20,cargo:20,speed:1},cargueiro:{wood:120,stone:60,minutes:7,slots:2,capacity:60,cargo:350,speed:.85},explorador:{wood:100,stone:40,minutes:6,slots:1,capacity:15,cargo:30,speed:1.35},combate:{wood:180,stone:120,minutes:10,slots:4,capacity:40,cargo:80,speed:1}};
export const SHIP_UNLOCKS={pesqueiro:1,cargueiro:1,explorador:5,combate:8};
export function fishingOrder(p){return{seconds:Math.round(Math.max(180,300-30*(p.levels.sede-1))*(1-.07*p.tech.navegacao)),foodPerBoat:Math.round(55*(1+.05*p.tech.logistica))};}
export const DAILY_GAME_LIMIT=3500;
export const HIBERNATION_LIVE_DAYS=7;
export const activePlayers=w=>Object.values(w.players).filter(p=>!p.hibernating);
export const COSTS={entrar:500,construcoes:350,navegar:200,aliancas:100,gestao:100};
export const NAMES=['Brisa Rubra','Vento Sul','Gaivota Negra','Dente de Ferro','Estrela do Norte','Maré Alta','Pérola Cinzenta','Sombra do Mar','Nau da Aurora','Coral Bravo','Trovão Azul','Vela do Destino'];
const copy=x=>structuredClone(x),sum=x=>Object.values(x).reduce((a,b)=>a+b,0), clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const ok=(v,msg)=>{if(!v)throw new Error(msg);};
const int=(v,min=0,max=1e5)=>{ok(Number.isInteger(v)&&v>=min&&v<=max,'Quantidade inválida.');return v;};
export function world(seed=(globalThis.crypto.getRandomValues(new Uint32Array(1))[0]>>>0)||1,layout){const w={version:5,economyVersion:ECONOMY_VERSION,seaVersion:2,wrecks:[],battleHistory:[],clock:0,wall:Date.now(),live:false,streamId:'',date:'',liveDays:0,rng:seed,serial:0,players:{},alliances:{},missions:[],encounters:{},jobs:[],bots:[],events:[],exposure:Array(30).fill(0),nextSpawn:0,slots:structuredClone(layout||DEFAULT_SLOTS)};ensureAdventure(w);return w;}
function rnd(w){if(w.secureRandom)return globalThis.crypto.getRandomValues(new Uint32Array(1))[0]/4294967296;let t=w.rng=(w.rng+0x6D2B79F5)>>>0;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;}
const uid=(w,p)=>p+(++w.serial).toString(36).toUpperCase();
function event(w,text,details={}){w.events.push({at:w.clock,text,...details});if(w.events.length>500)w.events.shift();}
const level=p=>p.levels.sede;
const same=(w,a,b)=>!!a?.alliance&&a.alliance===b?.alliance;
const slot=(w,p)=>w.slots[p.slot];
const home=(w,p)=>harbor(w.slots,slot(w,p));
function allocSlot(w,l,random=false,avoid=null){const occupied=activePlayers(w).filter(p=>Number.isInteger(p.slot)&&p.slot>=0&&p.slot<w.slots.length),used=new Set(occupied.map(p=>p.slot));let candidates=w.slots.map((s,i)=>({s,i})).filter(x=>!used.has(x.i));ok(candidates.length,'O arquipélago está cheio.');const alternate=candidates.filter(x=>x.i!==avoid);if(alternate.length)candidates=alternate;const spread=candidates.filter(x=>occupied.every(p=>Math.hypot(x.s.x-w.slots[p.slot].x,x.s.y-w.slots[p.slot].y)>=.20));if(spread.length)candidates=spread;return candidates[random?Math.min(candidates.length-1,Math.floor(rnd(w)*candidates.length)):0].i;}
export function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y)*5000;}
export function travel(w,p,a,b,fleet){const types=Object.keys(fleet).filter(k=>fleet[k]>0);let speed=Math.min(...types.map(k=>SHIPS[k].speed));return Math.max(120,Math.ceil((120+routeLength(seaRoute(w.slots,nearestWater(w.slots,a),nearestWater(w.slots,b)))*5000/6)/speed*(1-.07*p.tech.navegacao)/(1+equipmentBonuses(p).speed/100)));}
function lootBaseline(p){p.dayBase??={};p.lost??={wood:0,stone:0,food:0};for(const k of ['wood','stone','food'])p.dayBase[k]=Math.max(p.dayBase[k]||0,p.resources[k]+(p.lost[k]||0));}
function add(p,resources){const cap=storageCapacity(p);let overflow=0;for(const [k,n]of Object.entries(resources)){const v=p.resources[k]+n;if(p.resources[k]>=cap){overflow+=n;}else{p.resources[k]=Math.min(cap,v);overflow+=Math.max(0,v-cap);}}lootBaseline(p);return overflow;}
function pay(p,res){for(const[k,v]of Object.entries(res))ok(p.resources[k]>=v,'Recursos insuficientes.');for(const[k,v]of Object.entries(res))p.resources[k]-=v;}
function shielded(w,p){return p.protectedUntil>w.wall||p.shieldUntil>w.wall||p.liveShield===w.streamId;}
function validPvp(w,a,b){ok(level(a)>=4&&level(b)>=4,'PvP desbloqueia na sede nível 4.');ok(a.id!==b.id&&!same(w,a,b),'Esse destino pertence à tua aliança.');ok(Math.abs(level(a)-level(b))<=3,'Diferença de sede superior a 3.');ok(!shielded(w,a)&&!shielded(w,b),'Proteção ativa.');ok((a.repeat[b.id]||0)<=w.wall,'Ainda não podes repetir esse alvo.');}
function target(w,raw){const q=String(raw||'').trim().toLocaleLowerCase('pt');const all=[...(w.bosses||[]).map(b=>({type:'boss',id:b.id,name:b.name,...harbor(w.slots,b)})),...activePlayers(w).map(p=>({type:'player',id:p.id,name:p.islandName,...home(w,p)})),...w.bots.map(b=>({type:'bot',id:b.id,name:b.name,...botPosition(w,b)})),...(w.wrecks||[]).map(r=>({type:'wreck',id:r.id,name:r.name,...wreckPoint(w,r)}))];let hits=all.filter(t=>t.id.toLowerCase()===q||t.name.toLocaleLowerCase('pt')===q);ok(hits.length===1,'Destino inexistente ou ambíguo. Seleciona-o no mapa.');return hits[0];}
export function botPosition(w,b){return botPoint(w,b);}
function spawn(w){if(npcShipCount(w)>=NPC_MAX)return 0;const players=activePlayers(w);if(!players.length)return;const anchor=spawnAnchor(w,players,()=>rnd(w)),anchorSlot=slot(w,anchor);const used=new Set(w.bots.flatMap(b=>b.near));const scores=w.slots.map((s,i)=>({s,i,score:(w.exposure[i]||0)+rnd(w)*3+(used.has(i)?2:0)+Math.hypot(s.x-anchorSlot.x,s.y-anchorSlot.y)*2})).sort((a,b)=>a.score-b.score);const near=[anchor.slot,...scores.filter(v=>v.i!==anchor.slot).slice(0,2).map(v=>v.i)];near.forEach(i=>w.exposure[i]++);
 const l=level(anchor),passage=npcRoute(w,near,()=>rnd(w)),seconds=840+360*(rnd(w)+rnd(w)),bonus=routeLootBonus(routeLength(passage.route),seconds),id=uid(w,'B'),fleet=makeNpcFleet(l,rnd(w)),troops=Math.min(8+l*5,Object.entries(fleet).reduce((n,[k,v])=>n+v*SHIPS[k].capacity,0));
 if(npcShipCount(w)+sum(fleet)>NPC_MAX)return 0;
 const b={id,name:NAMES[Math.floor(rnd(w)*NAMES.length)]+' '+id,level:l,cannons:Math.min(3,Math.floor(l/4)),troops,wall:0,fleet,flag:npcFlag({fleet}),npcRole:npcProfile({fleet}).id,loot:{wood:Math.round(250*l*bonus),stone:Math.round(180*l*bonus),food:Math.round(100*l*bonus)},lootBonus:bonus,start:w.clock,end:w.clock+seconds,near,...passage,seaVersion:2};b.naval=navalUnits(fleet,troops,l,id,'npc');w.bots.push(b);event(w,'Uma frota de corsários entrou no mar.',{target:id});return sum(fleet);}
function invitation(){return Array.from(globalThis.crypto.getRandomValues(new Uint8Array(16)),n=>n.toString(16).padStart(2,'0')).join('');}
function refreshInvites(w,a){for(const member of a.members){w.players[member].allianceInvites=copy(a.invites);delete w.players[member].allianceInvite;}}
function availableTroops(p){return p.troops-defendingTroops(p);}
function allianceInPvp(w,a){
 const members=new Set(a.members);
 return w.missions.some(m=>m.targetType==='player'&&m.role==='ataque'&&['ida','muralha','batalha','loot'].includes(m.phase)&&(members.has(m.user)||members.has(m.target)))||Object.values(w.encounters).some(e=>e.type==='player'&&(members.has(e.target)||w.missions.some(m=>m.encounter===e.id&&members.has(m.user))));
}
export function quote(w,id,request){ensureAdventure(w);const p=w.players[id];const kind=request.kind;ok(kind in COSTS,'Grupo de ação inválido.');if(kind==='entrar'){ok(!p,'Esta conta já criou uma ilha.');ok(activePlayers(w).length<30,'O mapa está cheio.');return{kind,action:'entrar',cost:COSTS.entrar,seconds:0,payload:{flag:request.payload?.flag?normalizeFlag(request.payload.flag,{strict:true}):defaultFlag(id)},description:'Criar a tua ilha; proteção inicial de 72 horas.'};}ok(p,'Cria a ilha primeiro.');ok(!p.hibernating||(kind==='gestao'&&['regressar','ligar'].includes(request.action)),'A tua ilha está em hibernação. Prepara o regresso no resgate Gestão.');ok((p.dailySpent||0)+COSTS[kind]<=DAILY_GAME_LIMIT,'Limite diário de 3.500 pontos atingido. A entrada não conta para este teto.');let q={kind,action:request.action,cost:COSTS[kind],seconds:0,payload:copy(request.payload||{}),description:''};const v=q.payload;
 if(kind==='construcoes'){
  ok(w.jobs.filter(j=>j.user===id&&j.action!=='pescar').length<6,'Fila cheia.');
  if(q.action==='edificio'){ok(BUILDINGS.includes(v.building),'Edifício inválido.');let queued=w.jobs.filter(j=>j.user===id&&j.action==='edificio'&&j.payload.building===v.building).length;let n=p.levels[v.building]+queued+1;ok(n<=maxBuildingLevel(v.building),'Nível máximo.');if(v.building==='academia'){ok(level(p)>=n*3,`Requer casa principal N${n*3}.`);ok(plannedWarehouse(w,id)>=n*3,`Requer armazém N${n*3}.`);}else{ok(v.building==='sede'||n<=level(p)+1,'Melhora a sede primeiro.');if(v.building!=='armazem')ok(plannedWarehouse(w,id)>=n,`Requer armazém N${n}.`);}v.level=n;v.resources=buildingCost(v.building,n);q.seconds=v.building==='academia'?[0,180,600,1500,2700][n]:60*[0,0,2,5,10,15,25,35,50,60,80,100,120][n];q.description=`${v.building}: nível ${n}`;}
  else if(q.action==='navios'){ok(v.ship in SHIPS,'Barco inválido.');int(v.count,1,8);const unlock=SHIP_UNLOCKS[v.ship];ok(p.levels.estaleiro>=unlock,`Requer estaleiro N${unlock}.`);const pending=w.jobs.filter(j=>j.user===id&&j.action==='navios').reduce((n,j)=>n+SHIPS[j.payload.ship].slots*j.payload.count,0);ok(fleetSlots(p)+pending+SHIPS[v.ship].slots*v.count<=8+level(p)*4,'Sem espaço na frota.');v.resources={wood:SHIPS[v.ship].wood*v.count,stone:SHIPS[v.ship].stone*v.count};q.seconds=SHIPS[v.ship].minutes*60*v.count*(1-Math.max(0,p.levels.estaleiro-3)*.03);q.description=`${v.count} ${v.ship}`;}
  else if(q.action==='trabalhadores'){int(v.count,1,20);ok(v.count<=populationState(w,p).workerRoom,'Sem população livre: cada trabalhador ocupa 2 vagas. Melhora a sede.');v.resources={wood:10*v.count,stone:5*v.count,food:2*v.count};q.seconds=15*v.count;q.description=`Recrutar ${v.count} trabalhadores`;}
  else if(q.action==='tropas'){int(v.count,1,60);ok(v.count<=populationState(w,p).sailorRoom,'Sem população livre para marinheiros. Melhora a sede.');v.resources={wood:8*v.count,stone:5*v.count,food:3*v.count};q.seconds=30*v.count;q.description=`Treinar ${v.count} marinheiros`;}
  else if(q.action==='pesquisa'){ok(['navegacao','logistica','artilharia'].includes(v.tech),'Pesquisa inválida.');v.level=p.tech[v.tech]+1;ok(v.level<=4,'Pesquisa no nível máximo.');ok(level(p)>=v.level*3,`Requer casa principal N${v.level*3}.`);ok((p.levels.academia||0)>=v.level,`Requer Academia Náutica N${v.level}.`);ok(!w.jobs.some(j=>j.user===id&&j.action==='pesquisa'&&j.payload.tech===v.tech),'Pesquisa já na fila.');const spec=researchSpec(v.tech,v.level);v.resources=spec.resources;q.seconds=spec.seconds;q.description=`Pesquisa ${v.tech} ${v.level}`;}
  else if(q.action==='reparar'){if(v.building!==undefined)ok(BUILDINGS.includes(v.building),'Edifício inválido.');const keys=v.building?[v.building]:BUILDINGS;ok(!w.jobs.some(j=>j.user===id&&j.action==='reparar'&&keys.some(k=>(j.payload.repaired?.[k]||0)>0)),'Reparação já na fila.');v.repaired=Object.fromEntries(keys.map(k=>[k,p.damage[k]||0]));const damage=sum(v.repaired);ok(damage>0,'Sem danos para reparar.');v.resources={wood:Math.ceil(damage*3),stone:Math.ceil(damage*2)};q.seconds=Math.max(120,damage*10);q.description='Reparar edifícios';}
  else throw new Error('Construção inválida.');
  q.permits=licenseCost(q.action,v);if(q.permits)ok(p.permits>=q.permits&&p.submitted<PERMIT_DAILY_MAX,'Limite de projetos desta data.');
  const need=requiredWarehouse(v.resources);ok(need<=12,'Quantidade demasiado grande. Reduz a encomenda.');ok(p.levels.armazem>=need,`Requer armazém N${need}; reduz a quantidade ou melhora o armazém.`);for(const[k,n]of Object.entries(v.resources))ok(p.resources[k]>=n,'Recursos insuficientes.');q.resources=v.resources;
 }else if(kind==='gestao'){
  if(['equipar','desmontar'].includes(q.action)){if(q.action==='equipar')ok(!w.missions.some(m=>m.user===id),'Espera pelo regresso das frotas para mudar o equipamento.');Object.assign(v,equipmentOrder(p,q.action,v));q.description=q.action==='equipar'?'Atualizar equipamento':'Desmontar '+v.items.length+' itens';}
  else if(q.action==='bandeira'){v.flag=normalizeFlag(v.flag,{strict:true});q.description='Atualizar a bandeira da tua ilha';}
  else if(q.action==='regressar'){ok(p.hibernating,'A tua ilha já está ativa.');v.slot=allocSlot(w,level(p));q.description='Regressar ao mapa com a ilha e o progresso guardados';}
  else if(q.action==='guarnicao'){ok(hasWall(p),'Constrói a muralha N2 antes de atribuir defensores.');ok(!w.encounters[id],'Não podes alterar a guarnição durante um ataque ativo à tua ilha.');int(v.count,0,p.troops);q.description=`Deixar ${v.count} tropas a defender`;}
  else if(q.action==='ligar'){q.description='Autorizar este navegador para ver a tua ilha';}
  else if(q.action==='produzir'||q.action==='trabalhar'){const order=workOrder(p,w.clock,v);v.woodWorkers=order.woodWorkers;v.stoneWorkers=order.stoneWorkers;q.seconds=order.seconds;q.description=`Enviar ${v.woodWorkers} lenhadores e ${v.stoneWorkers} mineiros por 15 minutos de live`;}
  else if(q.action==='pescar'){ok(p.fleet.pesqueiro>0,'Sem pesqueiros livres.');v.count=p.fleet.pesqueiro;const fishing=fishingOrder(p);q.seconds=fishing.seconds;v.foodPerBoat=fishing.foodPerBoat;q.description=`Pescar com ${v.count} barcos`;}
  else throw new Error('Gestão inválida.');
 }else if(kind==='aliancas'){
  ok(level(p)>=4,'Alianças desbloqueiam na sede nível 4.');ok(!w.missions.some(m=>m.user===id||m.target===id),'Não podes mudar de aliança durante viagens ou ataques.');
  if(q.action==='criar'){ok(!p.alliance,'Já pertences a uma aliança.');ok(/^[\p{L}\p{N} -]{3,24}$/u.test(v.name||''),'Nome entre 3 e 24 caracteres.');q.description='Criar aliança '+v.name;}
  else if(q.action==='entrar'){const a=w.alliances[v.alliance];ok(!p.alliance&&a&&a.members.length<3,'Aliança indisponível ou cheia.');ok(!allianceInPvp(w,a),'Não podes entrar numa aliança com membros em viagem de PvP ou sob ataque.');if(a.invites)ok(typeof v.invite==='string'&&a.invites[id]&&v.invite===a.invites[id],'Convite inválido para esta conta. Pede um convite pessoal a um membro.');q.description='Entrar em '+a.name;}
  else if(q.action==='sair'){ok(p.alliance,'Não pertences a uma aliança.');ok(!w.missions.some(m=>m.user===id)&&!Object.values(w.encounters).some(e=>e.target===id),'Não podes sair durante uma missão ou ataque.');q.description='Sair da aliança';}
  else throw new Error('Ação de aliança inválida.');
 }else if(kind==='navegar'){
  const t=target(w,v.target);ok(t.id!==id,'Seleciona outra ilha ou barco.');v.target=t.id;v.targetType=t.type;
  ok(q.action==='enviar','Ação de navegação inválida.');let totalShips=0,capacity=0;v.fleet=Object.fromEntries(Object.keys(SHIPS).map(k=>[k,int(v.fleet?.[k]||0,0,p.fleet[k])]));for(const[k,n]of Object.entries(v.fleet)){totalShips+=n;capacity+=n*SHIPS[k].capacity;}ok(totalShips>0,'Escolhe barcos.');v.troops=int(v.troops||0,0,Math.min(availableTroops(p),capacity));
  if(t.type==='player'&&!same(w,p,w.players[t.id]))validPvp(w,p,w.players[t.id]);
  ok(t.type==='wreck'||v.troops>=totalShips*MIN_CREW_PER_SHIP,`Embarca pelo menos ${totalShips*MIN_CREW_PER_SHIP} marinheiros (${MIN_CREW_PER_SHIP} por barco).`);if(t.type==='wreck'){const r=w.wrecks.find(r=>r.id===t.id);ok(!r.lockedBy,'Loot ainda em recolha.');}
  if(t.type==='boss'){const b=w.bosses.find(b=>b.id===t.id),access=bossAccess(w,p,b);ok(access.ok,access.label);if(b.final&&!maxSolo(p))ok(v.troops>=80&&(v.fleet.combate||0)>=2,'Envia pelo menos 2 barcos de combate e 80 marinheiros para o desafio final em aliança.');}
  if(t.type==='bot')ok(npcAccess(p,w.bots.find(b=>b.id===t.id)).ok,'Só podes atacar NPCs com diferença de nível até 3, acima ou abaixo.');
  ok(p.resources.food>=totalShips*2,'Falta comida para a viagem.');let destination=t;q.seconds=travel(w,p,home(w,p),destination,v.fleet);
  if(t.type==='bot'){const b=w.bots.find(b=>b.id===t.id),intercept=interceptNpc(w,p,b,v.fleet);destination=intercept.destination;q.seconds=intercept.seconds;v.mayEscape=intercept.mayEscape;}
  if(t.type==='bot'){const b=w.bots.find(b=>b.id===t.id);v.targetExpires=b.end;v.mayEscape=!!v.mayEscape||w.clock+q.seconds>=b.end;}if(t.type==='wreck'){const r=w.wrecks.find(r=>r.id===t.id);destination=wreckPoint(w,r,w.clock+q.seconds);v.targetExpires=r.end;v.mayEscape=w.clock+q.seconds>=r.end;}v.destination=nearestWater(w.slots,destination);v.route=seaRoute(w.slots,home(w,p),v.destination);q.description=`Navegar para ${t.name}`;q.role=t.type==='player'&&same(w,p,w.players[t.id])?'defesa':'ataque';
 }
 return q;
}
function fleetSlots(p){return Object.entries(p.fleet).reduce((n,[k,v])=>n+SHIPS[k].slots*v,0)+Object.values(p.reserved||{}).reduce((n,v)=>n+v,0);}
export function execute(w,id,name,request,wall=Date.now()){
 ok(w.live,'O jogo só aceita ordens durante a transmissão.');migrateHarbor(w);ensureAdventure(w);w.wall=wall;const q=quote(w,id,request);let p=w.players[id];const v=q.payload;
 if(q.kind==='entrar'){p={id,name,flag:v.flag,islandName:'Ilha de '+name,slot:allocSlot(w,1,true),levels:Object.fromEntries(BUILDINGS.map(k=>[k,k==='academia'?0:1])),damage:Object.fromEntries(BUILDINGS.map(k=>[k,0])),tech:{navegacao:0,logistica:0,artilharia:0},resources:{...INITIAL_RESOURCES},fleet:{pesqueiro:2,cargueiro:1,explorador:0,combate:0},reserved:{},workers:WORKER_POOL,troops:20,garrison:0,alliance:null,protectedUntil:wall+72*3600000,shieldUntil:0,liveShield:'',attacks:0,repeat:{},farmUntil:0,permits:6,submitted:0,spent:0,dailySpent:0};w.players[id]=p;for(const a of Object.values(w.alliances)){a.invites??={};a.invites[id]=invitation();refreshInvites(w,a);}ensureAdventure(w);report(w,p,'ilha','A tua ilha está pronta');event(w,name+' fundou uma ilha.',{user:id});}
 else if(q.kind==='construcoes'){
  if(q.permits){ok(p.permits>=q.permits&&p.submitted<PERMIT_DAILY_MAX,'Limite de projetos desta data.');p.permits-=q.permits;p.submitted++;}
  pay(p,v.resources);const last=w.clock+queueDelay(w,id,q.action);w.jobs.push({id:uid(w,'O'),user:id,action:q.action,payload:v,start:last,end:last+q.seconds});
 }else if(q.kind==='gestao'){if(q.action==='equipar'){p.equipment=v.equipment;report(w,p,'equipamento','Equipamento atualizado');}else if(q.action==='desmontar'){p.inventory=p.inventory.filter(i=>!v.items.includes(i.id));const overflow=add(p,v.resources);report(w,p,'reciclagem','Itens transformados em recursos',{resources:v.resources,overflow});}
  else if(q.action==='bandeira'){p.flag=v.flag;event(w,name+' atualizou a bandeira.',{user:id});}else if(q.action==='regressar'){p.slot=allocSlot(w,level(p),true);p.hibernating=false;delete p.hibernatedAt;event(w,`${name} regressou ao arquipélago.`,{user:id});}else if(q.action==='guarnicao'){p.garrison=v.count;}else if(q.action==='produzir'||q.action==='trabalhar'){p.work={model:PRODUCTION_MODEL,woodWorkers:v.woodWorkers,stoneWorkers:v.stoneWorkers,start:w.clock,until:w.clock+q.seconds,gathered:{wood:0,stone:0},completed:false,gearBonus:equipmentBonuses(p).production};p.farmUntil=0;event(w,`${name} enviou trabalhadores para um turno de 15 minutos.`,{user:id});}else if(q.action==='pescar'){p.fleet.pesqueiro-=v.count;p.reserved.pesqueiro=(p.reserved.pesqueiro||0)+v.count;w.jobs.push({id:uid(w,'P'),user:id,action:'pescar',payload:v,start:w.clock,end:w.clock+q.seconds});}}
 else if(q.kind==='aliancas'){
  if(q.action==='criar'){let a={id:uid(w,'A'),name:v.name,members:[id],invites:Object.fromEntries(Object.keys(w.players).filter(uid=>uid!==id).map(uid=>[uid,invitation()]))};w.alliances[a.id]=a;p.alliance=a.id;refreshInvites(w,a);}
  else if(q.action==='entrar'){w.alliances[v.alliance].members.push(id);p.alliance=v.alliance;delete w.alliances[v.alliance].invites[id];refreshInvites(w,w.alliances[v.alliance]);}
  else {const a=w.alliances[p.alliance];a.members=a.members.filter(x=>x!==id);if(!a.members.length)delete w.alliances[a.id];else{a.invites=Object.fromEntries(Object.keys(w.players).filter(uid=>!a.members.includes(uid)).map(uid=>[uid,invitation()]));refreshInvites(w,a);}p.alliance=null;delete p.allianceInvites;delete p.allianceInvite;}
 }else if(q.kind==='navegar'){
  const t=target(w,v.target);for(const[k,n]of Object.entries(v.fleet)){p.fleet[k]-=n;p.reserved[k]=(p.reserved[k]||0)+n*SHIPS[k].slots;}p.troops-=v.troops;p.resources.food-=sum(v.fleet)*2;const m={id:uid(w,'V'),user:id,target:t.id,targetType:t.type,role:q.role,level:level(p),flag:copy(p.flag||defaultFlag(p.id)),fleet:v.fleet,troops:v.troops,from:home(w,p),to:v.destination,route:v.route,depart:w.clock,arrive:w.clock+q.seconds,duration:q.seconds,phase:'ida',initialFleet:copy(v.fleet),initialTroops:v.troops,gear:equipmentBonuses(p),cargo:{wood:0,stone:0,food:0}};w.missions.push(m);if(t.type==='player'&&q.role==='ataque')report(w,w.players[t.id],'ataque',name+' está a atacar a tua ilha',{mission:m.id,attacker:id,arrival:m.arrive});event(w,`${name} partiu para ${t.name}.`,{user:id,mission:m.id});
 }
 recordOrder(p,q);p.lastActiveLiveDay=w.liveDays||1;p.spent+=q.cost;if(q.kind!=='entrar')p.dailySpent=(p.dailySpent||0)+q.cost;return{ok:true,cost:q.cost,description:q.description};
}
export function setLive(w,live,streamId,wall=Date.now()){
 const date=new Date(wall).toLocaleDateString('en-CA',{timeZone:'Europe/Lisbon'});
 if(live&&date!==w.date){w.liveDays=(w.liveDays||0)+1;const reference=Math.max(1,...activePlayers(w).map(p=>level(p)));for(const p of Object.values(w.players)){p.lastActiveLiveDay??=w.liveDays;p.permits=Math.min(PERMIT_BANK_MAX,(p.permits||0)+(reference-level(p)>=PERMIT_CATCHUP_GAP?PERMIT_CATCHUP_RECHARGE:PERMIT_RECHARGE));p.submitted=0;p.dailySpent=0;p.dayBase={...p.resources};p.lost={wood:0,stone:0,food:0};}w.date=date;}
 if(live&&!w.liveDays){w.liveDays=1;for(const p of Object.values(w.players))p.lastActiveLiveDay??=1;}
 if(live&&streamId!==w.streamId){w.streamId=streamId;for(const p of Object.values(w.players))p.attacks=0;}
 w.live=!!live;w.wall=wall;hibernateInactive(w);
}
export function hibernateInactive(w){
 if(!w.live)return 0;let count=0;
 for(const p of activePlayers(w)){
  if((w.liveDays||0)-(p.lastActiveLiveDay??w.liveDays)<HIBERNATION_LIVE_DAYS)continue;
  if(w.encounters[p.id]||w.jobs.some(j=>j.user===p.id)||w.missions.some(m=>m.user===p.id||m.target===p.id)||workerState(p,w.clock).active)continue;
  p.hibernating=true;p.slot=null;p.hibernatedAt=w.liveDays;count++;
  event(w,p.name+' entrou em hibernação; o progresso foi guardado.',{user:p.id});
 }
 return count;
}
function returnHome(w,m){if(!sum(m.fleet)){report(w,w.players[m.user],'expedicao','A frota foi perdida',{target:m.target});recordReturn(w.players[m.user],m);event(w,'A frota de '+w.players[m.user].name+' perdeu todos os barcos.',{user:m.user});w.missions=w.missions.filter(v=>v.id!==m.id);return;}let current=fleetPoint(w,m);const chase=w.bots.find(b=>b.id===m.target);if(chase&&!waterPoint(w.slots,current))current=chase.exitGate||interceptionPoint(w,chase,w.clock);m.phase='regresso';m.depart=w.clock;m.from=nearestWater(w.slots,current);m.to=home(w,w.players[m.user]);m.route=seaRoute(w.slots,m.from,m.to);m.duration=travel(w,w.players[m.user],m.from,m.to,m.fleet);m.arrive=w.clock+m.duration;}
function arrive(w,m){
 const p=w.players[m.user];if(m.targetType==='wreck'){const r=w.wrecks.find(r=>r.id===m.target);if(!r){event(w,'Os destroços já desapareceram; a frota regressa.',{user:p.id});return returnHome(w,m);}m.phase='salvage';m.salvageEnd=Math.max(w.clock,w.encounters[r.lockedBy]?.lootEnd||w.clock)+90;m.to=wreckPoint(w,r);return;}let t=m.targetType==='player'?w.players[m.target]:m.targetType==='boss'?w.bosses.find(b=>b.id===m.target):w.bots.find(b=>b.id===m.target);if(!t){const remains=(w.wrecks||[]).find(r=>r.sourceId===m.target);if(remains){m.target=remains.id;m.targetType='wreck';return arrive(w,m);}event(w,'O alvo desapareceu; a frota regressa.',{user:p.id});return returnHome(w,m);}
 if(m.targetType==='boss'){if(!bossAlive(w,t)||!bossAccess(w,p,t).ok){report(w,p,'expedicao','O boss já não está disponível',{target:t.id});return returnHome(w,m);}return arriveBoss(w,m,t);}
 if(m.targetType==='bot'&&!npcAccess(p,t).ok){event(w,'Nível do alvo incompatível; frota de regresso.',{user:p.id});return returnHome(w,m);}if(m.targetType==='player'&&!same(w,p,t)){try{validPvp(w,p,t);}catch{event(w,'Ataque impedido pela proteção ou nível; frota de regresso.',{user:p.id});return returnHome(w,m);}}
 let e=w.encounters[m.target];if(!e&&m.targetType==='player'&&same(w,p,t)){m.phase='apoio';m.arrive=w.clock+1800;event(w,`${p.name} está a defender o aliado durante 30 minutos de live.`,{target:t.id});return;}if(!e){
  e={id:uid(w,'E'),target:m.target,type:m.targetType,phase:'muralha',wallHP:m.targetType==='player'&&hasWall(t)?Math.max(0,Math.round(t.levels.muralha*20*(1-(t.damage.muralha||0)/100))):0,attackers:[],defenders:[],next:w.clock+20,started:w.clock,lootEnd:0,round:0,attackingTroopsCommitted:0,initialDefenders:0,defenderLosses:0};
  if(m.targetType==='player')e.homeTroops=defendingTroops(t);else{e.homeTroops=t.troops;e.phase='batalha';e.next=w.clock+NAVAL_ROUND_SECONDS;e.name=t.name;e.position=interceptionPoint(w,t,w.clock);e.log=[];t.fleet??=makeNpcFleet(t.level);t.naval??=navalUnits(t.fleet,t.troops,t.level,t.id,'npc');e.naval={attackers:[],defenders:t.naval};}
  e.initialDefenders=e.homeTroops;w.encounters[m.target]=e;for(const ally of w.missions.filter(v=>v.target===m.target&&v.phase==='apoio')){ally.phase=e.phase;ally.encounter=e.id;e.defenders.push(ally.id);e.initialDefenders+=ally.troops;}
 }
 if(e.phase==='fim'){return returnHome(w,m);}
 if(m.targetType==='bot'){if(!m.naval){m.naval=navalUnits(m.fleet,m.troops,m.level||level(p),m.id,m.user);for(const u of m.naval)u.attack=Math.round(u.attack*(1+.05*p.tech.artilharia));applyFleetEquipment(m.naval,m.gear||equipmentBonuses(p));}e.naval.attackers.push(...m.naval);m.to=interceptionPoint(w,t,w.clock);}
 const originalRole=m.targetType==='player'&&same(w,p,w.players[m.target])?'defesa':'ataque';m.role=originalRole;
 if(originalRole==='defesa'&&e.phase==='loot'){e.phase='batalha';e.next=w.clock+20;}
 m.phase=e.phase;m.encounter=e.id;(m.role==='defesa'?e.defenders:e.attackers).push(m.id);if(m.role==='defesa')e.initialDefenders=(e.initialDefenders||0)+m.troops;else e.attackingTroopsCommitted=(e.attackingTroopsCommitted||0)+m.troops;
 event(w,`${p.name} chegou ao encontro ${e.id}.`,{target:e.target});
}
function forces(w,e,side){return (side==='defesa'?e.homeTroops:0)+w.missions.filter(m=>(side==='defesa'?e.defenders:e.attackers).includes(m.id)).reduce((n,m)=>n+m.troops,0);}
function lose(w,e,side,count){
 const home=side==='defesa'?{home:true,n:e.homeTroops}:null;const groups=[...(home&&home.n>0?[home]:[]),...w.missions.filter(m=>(side==='defesa'?e.defenders:e.attackers).includes(m.id)&&m.troops>0).map(m=>({m,n:m.troops}))];
 let available=groups.reduce((n,g)=>n+g.n,0);count=Math.min(count,available);if(side==='defesa')e.defenderLosses=(e.defenderLosses||0)+count;
 while(count-->0&&available>0){let pick=rnd(w)*available;let group;for(const g of groups){if(pick<g.n){group=g;break;}pick-=g.n;}if(!group)group=groups.find(g=>g.n>0);group.n--;available--;if(group.home){e.homeTroops--;if(e.type==='player'){w.players[e.target].troops--;w.players[e.target].garrison--;}}else group.m.troops--;}
}
function armedShips(w,e,side){let count=0;if(side==='defesa'&&e.homeTroops>0)count=e.type==='player'?(w.players[e.target].fleet.combate||0):(w.bots.find(b=>b.id===e.target)?.cannons||0);for(const m of w.missions.filter(m=>(side==='defesa'?e.defenders:e.attackers).includes(m.id)&&m.troops>0))count+=m.fleet.combate||0;return Math.min(3,count);}

function finish(w,e,won){if(e.type==='boss')return finishBoss(w,e,won);if(e.type==='bot')return finishNaval(w,e,won);archiveBattle(w,e,won?'attack':'defense');
 const participants=w.missions.filter(m=>m.encounter===e.id);const targetP=e.type==='player'?w.players[e.target]:null;
 if(targetP){report(w,targetP,'defesa',won?'A tua ilha foi saqueada':'A defesa venceu',{battle:e.id,attackers:[...new Set(participants.filter(m=>m.role==='ataque').map(m=>m.user))],rounds:e.round});targetP.garrison=e.homeTroops;if(e.attackers.length){const significant=won||((e.attackingTroopsCommitted||0)>=20&&(e.defenderLosses||0)>=Math.max(5,Math.ceil((e.initialDefenders||0)*.2)));if(significant){targetP.attacks++;targetP.shieldUntil=w.wall+2*3600000;if(targetP.attacks>=3)targetP.liveShield=w.streamId;}
  for(const m of participants.filter(m=>m.role==='ataque')){w.players[m.user].repeat[targetP.id]=w.wall+2*3600000;}
  if(won){for(const k of BUILDINGS)if((k!=='muralha'||hasWall(targetP))&&(k!=='academia'||targetP.levels.academia>0))targetP.damage[k]=Math.min(80,targetP.damage[k]+5+Math.floor(rnd(w)*11));}}
 }else w.bots=w.bots.filter(b=>b.id!==e.target);
 event(w,`Encontro ${e.id}: ${won?'atacantes':'defensores'} venceram.`,{target:e.target,rounds:e.round});
 for(const m of participants){report(w,w.players[m.user],'batalha',m.role==='defesa'?(won?'A defesa perdeu':'A defesa venceu'):(won?'Ataque vitorioso':'Ataque derrotado'),{battle:e.id,target:e.target,resources:m.cargo,rounds:e.round,losses:missionLosses(m),survivors:m.troops});returnHome(w,m);}delete w.encounters[e.target];
}
function combat(w,e){if(e.type==='boss')return combatBoss(w,e);if(e.type==='bot')return combatNaval(w,e);
 const a=forces(w,e,'ataque'),d=forces(w,e,'defesa');if(a<=0)return finish(w,e,false);
 if(e.phase==='muralha'){
  if(e.wallHP>0){e.wallHP=Math.max(0,e.wallHP-Math.max(1,Math.min(20,a)));e.next=w.clock+20;return;}
  e.phase='batalha';
 }
 if(e.phase==='batalha'){
  if(!d){e.phase='loot';e.lootEnd=w.clock+120+Math.min(300,Math.ceil(a/5)*15);for(const m of w.missions.filter(m=>m.encounter===e.id))m.phase='loot';e.next=e.lootEnd;return;}
  // Both sides roll simultaneously. At most 10 units fight in each 20-second round.
  const atkTech=Math.max(0,...e.attackers.map(id=>{const m=w.missions.find(m=>m.id===id);return m?.troops>0?w.players[m.user].tech.artilharia:0}));const defTech=Math.max(e.type==='player'?w.players[e.target].tech.artilharia:0,...e.defenders.map(id=>{const m=w.missions.find(m=>m.id===id);return m?.troops>0?w.players[m.user].tech.artilharia:0}));
  let hitA=0,hitD=0;for(let i=0;i<Math.min(10,a);i++)if(rnd(w)<Math.min(.90,.50+atkTech*.04+armedShips(w,e,'ataque')*.08))hitA++;for(let i=0;i<Math.min(10,d);i++)if(rnd(w)<Math.min(.90,.50+defTech*.04+armedShips(w,e,'defesa')*.08))hitD++;
  emitActivity(w,'battle.pvp_roll','battle',e.id,{round:e.round,attackers:a,defenders:d,hitAttack:hitA,hitDefense:hitD,attackTech:atkTech,defenseTech:defTech},[e.target,...w.missions.filter(m=>m.encounter===e.id).map(m=>m.user)]);
  lose(w,e,'defesa',Math.min(d,hitA));lose(w,e,'ataque',Math.min(a,hitD));e.round++;e.next=w.clock+20;
  for(const m of w.missions.filter(m=>m.encounter===e.id))m.phase='batalha';return;
 }
 if(e.phase==='loot'){
  const targetP=e.type==='player'?w.players[e.target]:null;const b=w.bots.find(b=>b.id===e.target);const stock=targetP?.resources||b?.loot||{wood:0,stone:0,food:0};const attackers=w.missions.filter(m=>e.attackers.includes(m.id)&&m.troops>0);const pool={};if(targetP)lootBaseline(targetP);
  for(const k of ['wood','stone','food']){let amount=stock[k]||0;if(targetP){targetP.dayBase??={...targetP.resources};targetP.lost??={wood:0,stone:0,food:0};amount=Math.min(amount*.08,Math.max(0,targetP.dayBase[k]*.25-(targetP.lost[k]||0)));}pool[k]=Math.floor(amount);}
  // Per-resource water filling: never exceed a participant's remaining ship cargo.
  const capacities=new Map(attackers.map(m=>[m.id,Object.entries(m.fleet).reduce((n,[k,v])=>n+v*SHIPS[k].cargo,0)*(1+.05*w.players[m.user].tech.logistica)*(1+(m.gear?.cargo||0)/100)]));
  for(const k of ['wood','stone','food']){let left=pool[k];let active=attackers.filter(m=>capacities.get(m.id)>0);let taken=0;while(left>0&&active.length){const totalWeight=active.reduce((n,m)=>n+Math.max(1,m.contribution||0),0),available=left;for(const m of active){const share=Math.max(1,Math.floor(available*Math.max(1,m.contribution||0)/totalWeight));const n=Math.min(share,left,Math.floor(capacities.get(m.id)));m.cargo[k]+=n;left-=n;taken+=n;capacities.set(m.id,capacities.get(m.id)-n);}active=active.filter(m=>capacities.get(m.id)>=1);}stock[k]-=taken;if(targetP)targetP.lost[k]=(targetP.lost[k]||0)+taken;}
  finish(w,e,true);
 }
}
export function advance(w,seconds,wall=Date.now()){
 migrateSea(w);migrateHarbor(w);ensureAdventure(w);w.wall=wall;if(!w.live||seconds<=0)return;ok(seconds<=3600,'Avanço máximo de uma hora por chamada.');
 for(let remaining=seconds;remaining>0;){const dt=Math.min(5,remaining);remaining-=dt;w.clock+=dt;refreshBosses(w);
  for(const p of Object.values(w.players)){if(p.hibernating)continue;const produced=productionBetween(p,w.clock-dt,w.clock),before={...p.resources};add(p,produced);for(const resource of ['wood','stone'])if(produced[resource]>0)emitActivity(w,'production.batch','player',p.id,{resource,attempted:produced[resource],credited:p.resources[resource]-before[resource],overflow:produced[resource]-(p.resources[resource]-before[resource]),from:w.clock-dt,to:w.clock,model:p.work?.model||'legacy',workers:p.work?.[resource+'Workers']??10},[p.id]);if(p.work){p.work.gathered.wood+=p.resources.wood-before.wood;p.work.gathered.stone+=p.resources.stone-before.stone;if(!p.work.completed&&p.work.until<=w.clock){p.work.completed=true;report(w,p,'trabalhadores','Os trabalhadores regressaram',{resources:p.work.gathered,building:'serraria'});event(w,`${p.name}: os trabalhadores regressaram. É preciso resgatar um novo turno.`,{user:p.id});}}}
  for(const m of w.missions)if(m.role==='ataque'&&['muralha','batalha','loot'].includes(m.phase))m.contribution=(m.contribution||0)+m.troops*dt;
  if(npcShipCount(w)<4&&w.clock>=(w.coverageRetryAt||0)&&activePlayers(w).some(p=>!w.bots.some(b=>Math.abs(b.level-level(p))<=1)&&w.clock-(w.npcCoverage?.[p.id]||0)>=180)){w.nextSpawn=Math.min(w.nextSpawn,w.clock);w.coverageRetryAt=w.clock+90+rnd(w)*90;}
  if(w.clock>=w.nextSpawn){const ships=spawn(w)||1;w.nextSpawn=w.clock+(npcShipCount(w)<3?30+rnd(w)*90:(240+rnd(w)*240)*ships*1.15);}
  for(const b of [...w.bots])if(b.end<=w.clock){const e=w.encounters[b.id];if(e){e.position=b.exitGate||interceptionPoint(w,b,w.clock);finishNaval(w,e,false,true);}w.bots=w.bots.filter(v=>v.id!==b.id);scheduleNpcRecovery(w);event(w,b.name+' saiu pela margem do mapa.',{target:b.id});}
  w.wrecks=w.wrecks.filter(r=>r.end>w.clock&&resourceTotal(r.resources)>0);w.battleHistory=w.battleHistory.filter(e=>e.expires>w.clock).slice(-30);
  for(const j of [...w.jobs])if(j.end<=w.clock){const p=w.players[j.user],v=j.payload;if(j.action==='edificio')p.levels[v.building]=v.level;else if(j.action==='navios')p.fleet[v.ship]+=v.count;else if(j.action==='tropas')p.troops+=v.count;else if(j.action==='trabalhadores')p.workers=workerCount(p)+v.count;else if(j.action==='pesquisa')p.tech[v.tech]=v.level;else if(j.action==='pescar'){p.fleet.pesqueiro+=v.count;p.reserved.pesqueiro-=v.count;add(p,{food:v.count*(v.foodPerBoat??90*(1+.05*p.tech.logistica))});}else if(j.action==='reparar')for(const k of BUILDINGS)p.damage[k]=Math.max(0,p.damage[k]-(v.repaired?.[k]||0));recordJobCompletion(p,j);report(w,p,'ordem',j.action==='edificio'?'Edifício melhorado':j.action==='pescar'?'Pesca concluída':'Ordem concluída',{building:v.building||(['tropas','trabalhadores'].includes(j.action)?'sede':j.action==='pesquisa'?'academia':'estaleiro'),action:j.action,level:v.level,count:v.count});w.jobs=w.jobs.filter(x=>x!==j);event(w,'Ordem concluída: '+j.action,{user:p.id});}
  for(const m of [...w.missions])if(m.arrive<=w.clock){if(m.phase==='ida')arrive(w,m);else if(m.phase==='apoio')returnHome(w,m);else if(m.phase==='regresso'){const p=w.players[m.user];for(const[k,n]of Object.entries(m.fleet)){p.fleet[k]+=n;p.reserved[k]-=n*SHIPS[k].slots;}p.troops+=m.troops;const overflow=add(p,m.cargo);recordReturn(p,m);deliverAdventureLoot(w,p,m);report(w,p,'regresso','A frota regressou',{target:m.target,resources:m.cargo,overflow});event(w,'A frota regressou à ilha.',{user:p.id,overflow});w.missions=w.missions.filter(x=>x!==m);}}
  for(const m of [...w.missions])if(m.phase==='salvage'&&m.salvageEnd<=w.clock){const r=w.wrecks.find(r=>r.id===m.target);if(r&&!r.lockedBy){distributeSeaLoot(w,[m],r.resources,SHIPS);event(w,w.players[m.user].name+' recolheu recursos dos destroços.',{user:m.user});if(!resourceTotal(r.resources))w.wrecks=w.wrecks.filter(v=>v.id!==r.id);}returnHome(w,m);}
  for(const e of Object.values(w.encounters))if(e.next<=w.clock||e.type==='boss'&&e.phase==='rally'&&bossFormation(w,e,navalMissions(w,e)))combat(w,e);
 }
 hibernateInactive(w);validate(w);
}
export function validate(w){const used=new Set();for(const p of Object.values(w.players)){if(p.hibernating)ok(p.slot===null,'Ilha em hibernação não pode ocupar posição.');else{ok(Number.isInteger(p.slot)&&p.slot>=0&&p.slot<w.slots.length,'Posição inválida.');ok(!used.has(p.slot),'Posição repetida.');used.add(p.slot);}ok(p.troops>=p.garrison&&p.garrison>=0,'Guarnição inválida.');for(const n of Object.values(p.resources))ok(Number.isFinite(n)&&n>=0,'Recursos inválidos.');if(p.workers!==undefined)int(p.workers,WORKER_POOL,100000);if(p.work){int(p.work.woodWorkers,0,workerCount(p));int(p.work.stoneWorkers,0,workerCount(p));ok(p.work.woodWorkers+p.work.stoneWorkers<=workerCount(p),'Trabalhadores acima da capacidade.');}for(const n of Object.values(p.fleet))ok(Number.isInteger(n)&&n>=0,'Frota inválida.');}for(const a of Object.values(w.alliances))ok(a.members.length<=3,'Aliança com mais de 3.');}
export function publicState(w,user=null){const safe=copy(w);delete safe.rng;delete safe.secureRandom;delete safe.exposure;delete safe.nextSpawn;delete safe.npcCoverage;delete safe.coverageRetryAt;for(const a of Object.values(safe.alliances)){delete a.invite;delete a.invites;}for(const p of Object.values(safe.players)){delete p.repeat;if(p.id!==user){delete p.onboarding;delete p.allianceInvite;delete p.allianceInvites;delete p.lastActiveLiveDay;delete p.dailySpent;delete p.dayBase;delete p.lost;delete p.work;delete p.farmUntil;delete p.workers;delete p.resources;delete p.fleet;delete p.troops;delete p.garrison;delete p.spent;delete p.inventory;delete p.equipment;delete p.reports;delete p.reportSerial;}}for(const m of safe.missions){if(m.user!==user){delete m.pendingReward;delete m.gear;}}return safe;}
export function regroup(w){hibernateInactive(w);return false;}
export function redistributeIslands(w){ok(!w.missions.length&&!Object.keys(w.encounters).length,'Há viagens ou batalhas em curso.');const players=activePlayers(w),before=players.map(p=>({user:p.id,from:p.slot}));for(const p of players)p.slot=-1;for(const p of players)p.slot=allocSlot(w,level(p),true,before.find(x=>x.user===p.id).from);event(w,'As ilhas foram distribuídas pelo arquipélago.');return before.map(x=>({...x,to:w.players[x.user].slot}));}

function missionLosses(m){return{troops:Math.max(0,(m.initialTroops??m.troops)-m.troops),ships:Math.max(0,sum(m.initialFleet||m.fleet)-sum(m.fleet))};}
function archiveBattle(w,e,outcome){seaFields(w);const item={...battleSnapshot(w,e),name:e.name||w.players[e.target]?.islandName||'Batalha',outcome,ended:w.clock,expires:w.clock+1800};w.battleHistory.push(item);w.battleHistory=w.battleHistory.slice(-30);}
function navalMissions(w,e){return w.missions.filter(m=>e.attackers.includes(m.id));}
function syncNaval(w,m){for(const u of m.naval||[])if(u.hp<=0&&!u.sunk){u.sunk=true;m.fleet[u.type]=Math.max(0,(m.fleet[u.type]||0)-1);const p=w.players[m.user];p.reserved[u.type]=Math.max(0,(p.reserved[u.type]||0)-SHIPS[u.type].slots);}m.troops=(m.naval||[]).filter(u=>!u.sunk).reduce((n,u)=>n+u.crew,0);let capacity=Object.entries(m.fleet).reduce((n,[k,v])=>n+v*SHIPS[k].cargo,0)*(1+.05*w.players[m.user].tech.logistica)*(1+(m.gear?.cargo||0)/100);for(const k of['wood','stone','food']){m.cargo[k]=Math.min(m.cargo[k]||0,Math.floor(capacity));capacity-=m.cargo[k];}}
function finishNaval(w,e,won,escaped=false){const b=w.bots.find(b=>b.id===e.target),r=w.wrecks.find(r=>r.id===e.wreckId),ms=navalMissions(w,e);if(won&&r){distributeSeaLoot(w,ms.filter(m=>m.troops>0),r.resources,SHIPS);delete r.lockedBy;if(!resourceTotal(r.resources))w.wrecks=w.wrecks.filter(v=>v.id!==r.id);}if(b)b.troops=e.homeTroops;archiveBattle(w,e,escaped?'escaped':won?'attack':'defense');event(w,escaped?'O corsário escapou pela margem; as frotas regressam.':won?'Corsário vencido. Os recursos que sobraram ficam nos destroços.':'O corsário venceu; os sobreviventes regressam.',{target:e.target,battle:e.id});for(const m of ms){report(w,w.players[m.user],'batalha',escaped?'O corsário escapou':won?'Corsário vencido':'O corsário venceu',{battle:e.id,target:e.target,rounds:e.round,resources:m.cargo,losses:missionLosses(m),survivors:m.troops});returnHome(w,m);}delete w.encounters[e.target];}
function combatNaval(w,e){const b=w.bots.find(b=>b.id===e.target),ms=navalMissions(w,e);if(e.phase==='loot'){if(w.clock>=e.lootEnd)finishNaval(w,e,true);return;}if(!b)return finishNaval(w,e,false,true);const attackers=ms.flatMap(m=>m.naval||[]);e.naval={attackers,defenders:b.naval};if(!ms.some(m=>m.troops>0&&sum(m.fleet)>0))return finishNaval(w,e,false);if(!b.troops||!b.naval.some(u=>u.hp>0&&u.crew>0)){const r=createWreck(w,b,()=>rnd(w),uid(w,'W'));r.lockedBy=e.target;e.wreckId=r.id;e.position=wreckPoint(w,r);w.bots=w.bots.filter(v=>v.id!==b.id);scheduleNpcRecovery(w);e.phase='loot';e.lootEnd=w.clock+120+Math.min(180,Math.ceil(ms.reduce((n,m)=>n+m.troops,0)/10)*10);e.next=e.lootEnd;for(const m of ms){m.phase='loot';m.to=e.position;}event(w,'O corsário foi derrotado; começou a recolha.',{battle:e.id,target:r.id});return;}
const round=rollNavalRound(attackers,b.naval,()=>rnd(w),e.round);round.at=w.clock;emitActivity(w,'battle.naval_roll','battle',e.id,{round},ms.map(m=>m.user));e.round++;e.log.push(round);e.log=e.log.slice(-12);for(const m of ms)syncNaval(w,m);e.homeTroops=b.troops=b.naval.filter(u=>u.hp>0).reduce((n,u)=>n+u.crew,0);e.next=w.clock+NAVAL_ROUND_SECONDS;e.position=interceptionPoint(w,b,w.clock);for(const m of ms){m.phase='batalha';m.to=e.position;}if(e.round>=90)return finishNaval(w,e,false,true);if(!b.troops||!ms.some(m=>m.troops>0&&sum(m.fleet)>0))combatNaval(w,e);
}


function interceptNpc(w,p,b,fleet){const start=home(w,p),remaining=b.end-w.clock;const feasible=t=>{const target=botPoint(w,b,w.clock+t);return waterPoint(w.slots,target)&&travel(w,p,start,target,fleet)<=t;};for(let t=120;t<=remaining;t+=15){if(!feasible(t))continue;let left=Math.max(120,t-15),right=t;for(let i=0;i<12;i++){const mid=(left+right)/2;if(feasible(mid))right=mid;else left=mid;}const seconds=Math.ceil(right);return{seconds,destination:botPoint(w,b,w.clock+seconds),mayEscape:false};}const destination=b.exitGate||interceptionPoint(w,b,b.end);return{seconds:Math.max(120,travel(w,p,start,destination,fleet)),destination,mayEscape:true};}


function scheduleNpcRecovery(w){if(npcShipCount(w)<3)w.nextSpawn=Math.min(w.nextSpawn,w.clock+30+rnd(w)*90);}

function migrateSea(w){seaFields(w);if(w.seaVersion===2&&w.version>=5){standardizeNpcFlags(w);return;}for(const b of w.bots){b.fleet??=makeNpcFleet(b.level);b.naval??=navalUnits(b.fleet,b.troops,b.level,b.id,'npc');}for(const e of Object.values(w.encounters)){if(e.type!=='bot')continue;const b=w.bots.find(b=>b.id===e.target),ms=navalMissions(w,e);e.log??=[];for(const m of ms)m.naval??=navalUnits(m.fleet,m.troops,m.level||level(w.players[m.user]),m.id,m.user);e.naval={attackers:ms.flatMap(m=>m.naval),defenders:b?.naval||e.naval?.defenders||[]};if(e.phase==='muralha'){e.phase='batalha';e.next=w.clock+12;for(const m of ms)m.phase='batalha';}if(e.phase==='loot'&&b&&!e.wreckId){const r=createWreck(w,b,()=>.5,uid(w,'W'));r.lockedBy=e.target;e.wreckId=r.id;e.position=wreckPoint(w,r);w.bots=w.bots.filter(v=>v.id!==b.id);}}w.version=5;w.seaVersion=2;standardizeNpcFlags(w);}


function maxSolo(p){return ['sede','serraria','pedreira','armazem','estaleiro','muralha'].every(k=>p.levels[k]>=12)&&p.levels.academia>=4&&Object.values(p.tech).every(n=>n>=4);}
function arriveBoss(w,m,b){
 let e=w.encounters[b.id];const p=w.players[m.user];
 if(!e){e={id:uid(w,'E'),target:b.id,type:'boss',name:b.bossName,boss:b.boss,bossLife:b.life,position:harbor(w.slots,b),phase:b.final&&!maxSolo(p)?'rally':'batalha',attackers:[],defenders:[],round:0,next:w.clock+(b.final&&!maxSolo(p)?Math.min(900,Math.max(300,...w.missions.filter(v=>v.target===b.id&&v.phase==='ida').map(v=>v.arrive-w.clock+45))):12),started:w.clock,log:[],naval:{attackers:[],defenders:bossUnits(b)}};w.encounters[b.id]=e;}
 if(e.phase==='loot'||e.phase==='fim')return returnHome(w,m);
 m.naval=applyFleetEquipment(navalUnits(m.fleet,m.troops,m.level,m.id,m.user),m.gear||equipmentBonuses(p));for(const u of m.naval)u.attack=Math.round(u.attack*(1+.05*p.tech.artilharia));
 e.attackers.push(m.id);e.naval.attackers.push(...m.naval);m.phase=e.phase;m.to=e.position;m.encounter=e.id;m.foughtRounds=0;
 report(w,p,'boss',e.phase==='rally'?'A aguardar a aliança':'Combate com '+b.bossName,{battle:e.id,target:b.id});
}
function combatBoss(w,e){
 const b=w.bosses.find(b=>b.id===e.target),ms=navalMissions(w,e),alive=ms.filter(m=>m.troops>0&&sum(m.fleet)>0);
 if(e.phase==='loot')return finishBoss(w,e,true);
 if(!alive.length)return finishBoss(w,e,false);
 if(e.phase==='rally'){if(!bossFormation(w,e,alive)){for(const m of ms)report(w,w.players[m.user],'boss','A aliança não se reuniu; frota de regresso',{target:e.target,battle:e.id});return finishBoss(w,e,false);}e.formed=true;e.phase='batalha';}
 const attackers=ms.flatMap(m=>m.naval||[]);e.naval.attackers=attackers;
 if(!e.naval.defenders.some(u=>u.hp>0&&u.crew>0)){e.phase='loot';e.lootEnd=w.clock+180;e.next=e.lootEnd;for(const m of alive)m.phase='loot';return;}
 const r=rollNavalRound(attackers,e.naval.defenders,()=>rnd(w),e.round);r.at=w.clock;e.round++;e.log.push(r);e.log=e.log.slice(-12);e.next=w.clock+12;
 emitActivity(w,'battle.boss_roll','battle',e.id,{round:r,boss:b.id},ms.map(m=>m.user));
 for(const m of alive){m.foughtRounds++;syncNaval(w,m);m.phase='batalha';}
 if(!ms.some(m=>m.troops>0&&sum(m.fleet)>0))return finishBoss(w,e,false);
 if(e.round>=120)return finishBoss(w,e,false);
 if(!e.naval.defenders.some(u=>u.hp>0&&u.crew>0))combatBoss(w,e);
}
function finishBoss(w,e,won){
 const b=w.bosses.find(b=>b.id===e.target),ms=navalMissions(w,e),survivors=ms.filter(m=>m.troops>0&&sum(m.fleet)>0),eligible=survivors.filter(m=>(m.foughtRounds||0)>=Math.min(3,e.round));
 if(won){const stock={wood:400*b.level,stone:300*b.level,food:120*b.level};distributeSeaLoot(w,survivors,stock,SHIPS);b.respawnAt=w.clock+b.respawn;const rewarded=new Set();for(const m of [...survivors].sort((a,b)=>(b.foughtRounds||0)-(a.foughtRounds||0))){if(rewarded.has(m.user))continue;rewarded.add(m.user);const item=eligible.includes(m)?rollItem(b.grade,()=>rnd(w),uid(w,'IT')):null;m.pendingReward={boss:b.id,name:b.bossName,life:b.life,item,resources:{...m.cargo}};emitActivity(w,'loot.item_roll','player',m.user,{boss:b.id,life:b.life,item},[m.user]);}}
 archiveBattle(w,e,won?'attack':'defense');for(const m of ms){report(w,w.players[m.user],'boss',won?b.bossName+' derrotado':'A frota recuou de '+b.bossName,{target:b.id,battle:e.id,rounds:e.round,resources:m.cargo,losses:missionLosses(m),survivors:m.troops});returnHome(w,m);}delete w.encounters[e.target];
}
function deliverAdventureLoot(w,p,m){const reward=m.pendingReward;if(!reward)return;const item=reward.item;let recycled=null;if(item){if(p.inventory.length>=200){recycled=dismantleYield(item);add(p,recycled);}else p.inventory.push(item);}report(w,p,'recompensa',item?itemName(item):'Recursos recolhidos',{target:reward.boss,boss:reward.name,item:recycled?null:item,resources:recycled?{wood:m.cargo.wood+recycled.wood,stone:m.cargo.stone+recycled.stone,food:m.cargo.food}:m.cargo,recycled,noEquipment:!item});delete m.pendingReward;}
