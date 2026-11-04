// A cue describes the next interaction, never performs the action or changes the game.
const cue=(selectors,label,kind='button')=>({selectors:Array.isArray(selectors)?selectors:[selectors],label,kind});
export function nextMissionCue(id,c={}){
 if(c.complete)return null;
 if(c.prepared){
  if(!c.copied)return cue('[data-inline-code]','Copiar código');
  if(!c.ownerPreview)return cue('.inline-order-hint','Colar na Twitch','status');
  if(!c.testCode)return cue('#owner-code','Colar código','field');
  if(!c.correctReward)return cue('#owner-reward','Escolher o resgate','field');
  return cue('[data-owner-redeem]','Resgatar');
 }
 if(!id||c.complete)return null;
 if(c.view==='missoes')return cue('.current-mission [data-guide="continue"]','Continuar');
 if(c.waiting){if(c.inspectorOpen&&!c.waitingInInspector)return cue('.inspector-close','Ver progresso');return cue([c.waitingSelector,'.queue-panel .job-row [data-end]','#mission-dock [data-guide="continue"]'].filter(Boolean),'Em curso','status');}
 if(id==='return'){
  if(c.inspectorOpen)return c.selectedMission?cue(['#detail [data-end]','.inspector-close'],'Em viagem','status'):cue('.inspector-close','Ver expedições');
  if(c.view==='viagens')return cue(['.expedition-row.own [data-object]','.expedition-row.own strong'],'Acompanhar a frota');
  return cue(c.view==='mundo'?'#sea-navigation-slot [data-tab="viagens"]':'.primary-navigation [data-tab="mundo"]','Ver expedições');
 }
 if(id==='expedition'){
  if(c.view!=='mundo')return cue('.primary-navigation [data-tab="mundo"]','Abrir o mar');
  if(c.inspectorOpen&&!c.targetOpen)return cue('.inspector-close','Ver o mar');
  if(!c.targetOpen)return c.npcId?cue('#view [data-object="'+c.npcId+'"]','Escolher corsário','object'):cue('#mission-dock [data-guide="continue"]','Procurar corsário');
  if(!c.hasShips)return cue(c.shipSelector||'#send-cargueiro','Escolher barcos','field');
  return cue('#detail [data-action="sail"]','Enviar frota');
 }
 const building={work:'serraria',storage:'armazem',headquarters:'sede',fishing:'estaleiro',crew:'sede'}[id];
 if(!building)return cue('.primary-navigation [data-tab="ilha"]','Ver a ilha');
 if(c.building!==building){
  if(c.inspectorOpen)return cue('.inspector-close','Voltar à ilha');
  if(c.view==='ilha')return cue('.island-stage [data-build="'+building+'"]','Abrir '+({serraria:'serraria',armazem:'armazém',sede:'sede',estaleiro:'estaleiro'}[building]),'object');
  return cue('.primary-navigation [data-tab="ilha"]','Ver a ilha');
 }
 if(id==='crew'){
  if(!c.recruitOpen)return cue('#detail [data-building-section="recrutar"]>summary','Abrir recrutamento');
  if(c.crewCount<10)return cue('#train-count','Escolher 10 marinheiros','field');
  return cue('#detail [data-recruit="tropas"]','Recrutar marinheiros');
 }
 if(id==='work')return cue('#detail [data-action="work"]','Iniciar produção');
 if(id==='fishing')return cue('#detail [data-action="fish"]','Mandar pescar');
 return cue('#detail [data-upgrade="'+building+'"]','Melhorar edifício');
}
export function createMissionPointer(doc){
 let target,kind,label,pointer;
 function clear(){target?.classList.remove('mission-cue-target','mission-cue-object','mission-cue-status');target?.removeAttribute('data-mission-cue');target=null;pointer?.remove();pointer=null;}
 function position(){if(!target?.isConnected||!pointer)return;const r=target.getBoundingClientRect(),win=doc.defaultView,w=win?.innerWidth||1280,h=win?.innerHeight||720;
  pointer.hidden=r.width===0||r.height===0||r.bottom<0||r.top>h||r.right<0||r.left>w;
  const below=r.top<62;pointer.classList.toggle('mission-cue-below',below);
  const center=r.left+r.width/2,left=Math.max(84,Math.min(w-84,center));pointer.style.left=left+'px';pointer.querySelector('b').style.left=(center-left)+'px';pointer.style.top=(below?r.bottom+9:r.top-8)+'px';
 }
 function mark(el,info){if(!el){clear();return;}if(target!==el){clear();target=el;}kind=info.kind;label=info.label;
  target.classList.add('mission-cue-target');target.classList.toggle('mission-cue-object',kind==='object');target.classList.toggle('mission-cue-status',kind==='status');target.setAttribute('data-mission-cue',label);
  if(!pointer){pointer=doc.createElement('div');pointer.className='mission-cue-pointer';pointer.setAttribute('aria-hidden','true');const text=doc.createElement('span'),arrow=doc.createElement('b');arrow.textContent='↓';pointer.append(text,arrow);doc.body.append(pointer);}
  pointer.querySelector('span').textContent=label;position();
 }
 return{mark,clear,position};
}
