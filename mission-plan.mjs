import{workerState,workerCount,productionBetween}from'./workers.mjs?v=0.22.0';
import{buildingCost}from'./economy.mjs?v=0.22.0';
import{populationState}from'./population.mjs?v=0.22.0';
import{defendingTroops,storageCapacity}from'./harbor.mjs?v=0.22.0';
const names={wood:'madeira',stone:'pedra',food:'provisões'},houses={sede:'casa principal',armazem:'armazém',estaleiro:'estaleiro'};
const shortfall=(p,res)=>Object.fromEntries(Object.entries(res).map(([k,n])=>[k,Math.max(0,Math.ceil(n-(p.resources?.[k]||0)))]).filter(([,n])=>n>0));
const list=missing=>Object.entries(missing).map(([k,n])=>n+' '+names[k]).join(' e ');
const buildingId=k=>k==='armazem'?'storage':k==='sede'?'headquarters':'ship';
export function nextLearningStep(w,p,goal,{quote}={}){
 if(!p?.resources||!goal)return goal;
 const jobs=(w.jobs||[]).filter(j=>j.user===p.id),mission=(w.missions||[]).filter(m=>m.user===p.id),work=workerState(p,w.clock);
 const step=(id,title,body,building,request,extra={})=>({...goal,id,goalId:goal.id,title,short:title,body,building,view:building?'ilha':goal.view,icon:({work:'workers',storage:'treasure',headquarters:'scroll',fishing:'food',crew:'crew',ship:'compass',defense:'shield'}[id])||goal.icon,request,...extra});
 const wait=(title,body,building,end,kind='job',extra={})=>step(goal.id,title,body,building,null,{waiting:{title,building,end:Number.isFinite(end)?end:null,kind,...extra}});
 function check(result){if(!result?.request||!quote)return result;try{quote(w,p.id,result.request);return result;}catch(e){return step(result.id,'Requisito em falta',e.message,result.building,null,{blocked:e.message,waiting:{kind:'requirement',title:e.message,building:result.building,end:null}});}}
 function resources(res,next,depth=0){
  const missing=shortfall(p,res);if(!Object.keys(missing).length)return check(next);
  const max=Math.max(...Object.values(res));if(max>storageCapacity(p)&&p.levels.armazem<12&&depth<12)return upgrade('armazem',p.levels.armazem+1,depth+1);
  if(missing.food){const fishing=jobs.filter(j=>j.action==='pescar');if(fishing.length)return wait('Aguarda as provisões','Faltam '+list({food:missing.food})+'.','estaleiro',Math.min(...fishing.map(j=>j.end)),'resources');
   if(p.fleet.pesqueiro>0)return check(step('fishing','Recolhe provisões','Faltam '+list({food:missing.food})+'. Envia os pesqueiros.','estaleiro',{kind:'gestao',action:'pescar'}));
   const buildingBoat=jobs.find(j=>j.action==='navios'&&j.payload.ship==='pesqueiro');if(buildingBoat)return wait('Pesqueiro em construção','Aguarda o estaleiro.','estaleiro',buildingBoat.end);
   const voyage=mission.find(m=>m.fleet?.pesqueiro>0);if(voyage)return wait('Aguarda os pesqueiros','Os teus pesqueiros estão numa expedição.','estaleiro',voyage.phase==='regresso'?voyage.arrive:null,'fleet');
   return resources({wood:80,stone:20},step('ship','Constrói um pesqueiro','Precisas de um pesqueiro para obter provisões.','estaleiro',{kind:'construcoes',action:'navios',payload:{ship:'pesqueiro',count:1}}, {ship:'pesqueiro'}),depth+1);
  }
  const kinds=['wood','stone'].filter(k=>missing[k]);
  if(work.active){
   if(kinds.some(k=>!work[k+'Workers'])){const total=workerCount(p),both=kinds.length===2,woodWorkers=missing.wood?(both?Math.ceil(total/2):total):0,stoneWorkers=missing.stone?(both?Math.floor(total/2):total):0;return check(step('work','Redistribui os trabalhadores','Faltam '+list(missing)+'. Inicia um novo turno com a distribuição necessária.',kinds[0]==='stone'?'pedreira':'serraria',{kind:'gestao',action:'trabalhar',payload:{woodWorkers,stoneWorkers}},{missing}));}
   const allAssigned=kinds.every(k=>work[k+'Workers']>0),until=Math.max(w.clock,work.until);let end=until;
   const enough=t=>kinds.every(k=>productionBetween(p,w.clock,t)[k]>=missing[k]);
   if(allAssigned&&enough(until)){let lo=w.clock,hi=until;for(let i=0;i<30;i++){const mid=(lo+hi)/2;if(enough(mid))hi=mid;else lo=mid;}end=Math.ceil(hi-1e-6);}
   return wait(allAssigned?'Aguarda os recursos':'Prepara o próximo turno','Faltam '+list(missing)+'.'+(allAssigned?' Os trabalhadores estão a recolher.':' Depois deste turno, atribui trabalhadores aos recursos em falta.'),kinds[0]==='stone'?'pedreira':'serraria',end,'resources',{missing,needsNewShift:!allAssigned});
  }
  const total=workerCount(p),both=kinds.length===2,woodWorkers=missing.wood?(both?Math.ceil(total/2):total):0,stoneWorkers=missing.stone?(both?Math.floor(total/2):total):0;
  return check(step('work',both?'Recolhe madeira e pedra':'Recolhe '+names[kinds[0]],'Faltam '+list(missing)+'. Envia os trabalhadores.',kinds[0]==='stone'?'pedreira':'serraria',{kind:'gestao',action:'trabalhar',payload:{woodWorkers,stoneWorkers}},{missing}));
 }
 function upgrade(building,to,depth=0){
  if(depth>12)return wait('Requisito em falta','Verifica o nível dos edifícios.',building,null,'requirement');
  const pending=jobs.filter(j=>j.action==='edificio'&&j.payload.building===building&&j.payload.level>=to);if(pending.length)return wait('Construção em curso','Aguarda '+(houses[building]||building)+' N'+to+'.',building,Math.min(...pending.map(j=>j.end)));
  if(building!=='armazem'&&p.levels.armazem<to)return upgrade('armazem',p.levels.armazem+1,depth+1);
  if(building!=='sede'&&to>p.levels.sede+1)return upgrade('sede',p.levels.sede+1,depth+1);
  const req={kind:'construcoes',action:'edificio',payload:{building}};
  return resources(buildingCost(building,to),step(buildingId(building),'Melhora '+(houses[building]||building)+' para N'+to,'Os requisitos estão reunidos.',building,req,{targetLevel:to}),depth);
 }
 if(['storage','headquarters'].includes(goal.id)){const key=goal.id==='storage'?'armazem':'sede';return upgrade(key,2);}
 if(goal.id==='work')return check(step('work',goal.title,goal.body,'serraria',{kind:'gestao',action:'trabalhar',payload:{woodWorkers:Math.ceil(workerCount(p)/2),stoneWorkers:Math.floor(workerCount(p)/2)}}));
 if(goal.id==='fishing'){const pending=jobs.filter(j=>j.action==='pescar');if(pending.length)return wait('Pesqueiros no mar','Aguarda o regresso com provisões.','estaleiro',Math.min(...pending.map(j=>j.end)));if(!p.fleet.pesqueiro){const pendingBoat=jobs.find(j=>j.action==='navios'&&j.payload.ship==='pesqueiro');if(pendingBoat)return wait('Pesqueiro em construção','Aguarda o estaleiro.','estaleiro',pendingBoat.end);}
 if(!p.fleet.pesqueiro)return resources({wood:80,stone:20},step('ship','Constrói um pesqueiro','Precisas de um pesqueiro.','estaleiro',{kind:'construcoes',action:'navios',payload:{ship:'pesqueiro',count:1}},{ship:'pesqueiro'}));return check(step('fishing',goal.title,goal.body,'estaleiro',{kind:'gestao',action:'pescar'}));}
 if(goal.id==='crew'){
  const pending=jobs.filter(j=>j.action==='tropas');if(pending.length)return wait('Marinheiros a preparar','Aguarda o recrutamento.','sede',Math.min(...pending.map(j=>j.end)));
  const count=Math.max(1,10-(p.onboarding?.recruitedCompleted||0));
  if(populationState(w,p).sailorRoom<count){if(p.levels.sede<12)return upgrade('sede',p.levels.sede+1);return wait('Sem alojamento livre','Não há vagas para recrutar mais marinheiros.','sede',null,'requirement');}
  return resources({wood:8*count,stone:5*count,food:3*count},step('crew',goal.title,goal.body,'sede',{kind:'construcoes',action:'tropas',payload:{count}},{count}));
 }
 if(goal.id==='expedition'){
  const ship=['cargueiro','combate','pesqueiro','explorador'].find(k=>p.fleet[k]>0),free=p.troops-defendingTroops(p);
  if(!ship){const pendingBoat=jobs.filter(j=>['navios','pescar'].includes(j.action)).sort((a,b)=>a.end-b.end)[0];if(pendingBoat)return wait(pendingBoat.action==='pescar'?'Pesqueiros no mar':'Barco em construção','Aguarda um barco livre.','estaleiro',pendingBoat.end);if(mission.length)return wait('Aguarda a frota','Os teus barcos estão numa expedição.','estaleiro',mission.filter(m=>m.phase==='regresso').map(m=>m.arrive).sort((a,b)=>a-b)[0]||null,'fleet');return resources({wood:120,stone:60},step('ship','Constrói um cargueiro','Precisas de um barco livre para a expedição.','estaleiro',{kind:'construcoes',action:'navios',payload:{ship:'cargueiro',count:1}},{ship:'cargueiro'}));}
  if(free<5&&p.garrison>0)return check(step('defense','Liberta marinheiros','Retira alguns marinheiros da muralha para embarcarem.','muralha',{kind:'gestao',action:'guarnicao',payload:{count:Math.max(0,p.troops-20)}}));
  if(free<5){const pending=jobs.filter(j=>j.action==='tropas');if(pending.length)return wait('Marinheiros a preparar','Aguarda o recrutamento.','sede',Math.min(...pending.map(j=>j.end)));return resources({wood:40,stone:25,food:15},step('crew','Recruta tripulação','Precisas de 5 marinheiros livres para navegar.','sede',{kind:'construcoes',action:'tropas',payload:{count:5}},{count:5}));}
  return resources({food:2},step('expedition',goal.title,goal.body,null,null));
 }
 if(goal.id==='return'){const voyages=mission.filter(m=>['bot','wreck'].includes(m.targetType));if(voyages.length){const returning=voyages.filter(m=>m.phase==='regresso');return wait('Acompanha a frota','Aguarda o regresso à ilha.',null,returning.length?Math.min(...returning.map(m=>m.arrive)):Math.min(...voyages.filter(m=>m.phase==='ida').map(m=>m.arrive),...Object.values(w.encounters||{}).filter(e=>voyages.some(m=>m.encounter===e.id)).map(e=>e.phase==='loot'?e.lootEnd:e.next))||null,'fleet');}}
 return goal;
}
