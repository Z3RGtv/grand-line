export const MISSIONS=[
 {id:'island',title:'A tua ilha está pronta',short:'Conhece o teu porto.',icon:'shield',view:'ilha',body:'Seleciona um edifício para começar.',target:'.island-stage'},
 {id:'work',title:'Põe a ilha a trabalhar',short:'Envia um turno de trabalhadores.',icon:'workers',view:'ilha',body:'Na serraria, atribui 10 trabalhadores à madeira e 10 à pedra.',target:'[data-build="serraria"]',cost:100},
 {id:'storage',title:'Melhora o armazém primeiro',short:'Conclui o armazém N2.',icon:'treasure',view:'ilha',body:'Melhora o armazém para N2 para desbloquear as próximas construções.',target:'[data-build="armazem"]',cost:350},
 {id:'headquarters',title:'Faz crescer a casa principal',short:'Conclui a casa principal N2.',icon:'scroll',view:'ilha',body:'Seleciona a casa principal e melhora para N2.',target:'[data-build="sede"]',cost:350},
 {id:'fishing',title:'Abastece a tripulação',short:'Manda os pesqueiros buscar comida.',icon:'food',view:'ilha',body:'No estaleiro, envia os pesqueiros e espera pelo regresso.',target:'.fishing-card',cost:100},
 {id:'crew',title:'Prepara a primeira expedição',short:'Recruta 10 marinheiros.',icon:'crew',view:'ilha',body:'Na sede, recruta 10 marinheiros.',target:'[data-action="train"]',cost:350},
 {id:'expedition',title:'Larga as amarras',short:'Envia uma frota a um corsário.',icon:'compass',view:'mundo',body:'No mapa, procura um corsário de carga próximo do teu nível. Envia um cargueiro com até 20 marinheiros.',target:'.map-scroll',cost:200},
 {id:'return',title:'Acompanha o regresso',short:'Espera pela tua primeira frota.',icon:'treasure',view:'viagens',body:'Acompanha a frota em Mar e frotas → Expedições.',target:'.expedition-list'}
];
export function recordOrder(p,q){const m=p.onboarding??={version:1};if(q.kind==='entrar')m.island=true;if(q.kind==='gestao'&&['trabalhar','produzir'].includes(q.action))m.work=true;if(q.kind==='construcoes'&&q.action==='edificio'&&q.payload.building==='sede'&&q.payload.level>=2)m.headquarters=true;if(q.kind==='construcoes'&&q.action==='edificio'&&q.payload.building==='armazem'&&q.payload.level>=2)m.storage=true;if(q.kind==='gestao'&&q.action==='pescar')m.fishing=true;if(q.kind==='construcoes'&&q.action==='tropas')m.recruited=(m.recruited||0)+q.payload.count;if(q.kind==='navegar'&&q.payload.targetType==='bot')m.expedition=true;}
export function recordReturn(p,m){if(m.targetType!=='bot')return;const data=p.onboarding??={version:1};data.expedition=true;data.return=true;}
export function recordJobCompletion(p,j){const m=p.onboarding??={version:1};if(j.action==='pescar')m.fishingReturned=true;if(j.action==='tropas')m.recruitedCompleted=(m.recruitedCompleted||0)+j.payload.count;}
export function missionProgress(w,id){
 const p=w?.players?.[id],m=p?.onboarding||{},jobs=(w?.jobs||[]).filter(j=>j.user===id),missions=(w?.missions||[]).filter(q=>q.user===id&&q.targetType==='bot');
 const pendingCrew=jobs.filter(j=>j.action==='tropas').reduce((n,j)=>n+j.payload.count,0);
 const done={island:!!p,work:!!(m.work||p?.work),headquarters:p?.levels?.sede>=2,storage:p?.levels?.armazem>=2,fishing:!!(m.fishingReturned||m.fishing&&!jobs.some(j=>j.action==='pescar')),crew:!!((m.recruitedCompleted||0)>=10||(m.recruited||0)-pendingCrew>=10||p?.troops>=30),expedition:!!(m.expedition||missions.length),return:!!m.return};
 const rows=MISSIONS.map(q=>({...q,done:!!done[q.id]}));
 return{rows,completed:rows.filter(q=>q.done).length,total:rows.length,current:rows.find(q=>!q.done)||null,complete:rows.every(q=>q.done)};
}
export function missionWait(w,id){
 const step=missionProgress(w,id).current?.id,jobs=(w?.jobs||[]).filter(j=>j.user===id);
 const building={storage:'armazem',headquarters:'sede'}[step];
 const list=building?jobs.filter(j=>j.action==='edificio'&&j.payload.building===building&&j.payload.level>=2):step==='fishing'?jobs.filter(j=>j.action==='pescar'):step==='crew'?jobs.filter(j=>j.action==='tropas'):[];
 if(!list.length)return null;
 return{end:Math.min(...list.map(j=>j.end)),building:building|| (step==='fishing'?'estaleiro':'sede'),title:step==='fishing'?'Pesqueiros no mar':step==='crew'?'Marinheiros a preparar':'Construção em curso'};
}
