import{allowanceDay}from'./spending-budget.mjs?v=0.27.2';
import{BOSS_SITES}from'./adventure.mjs?v=0.27.2&rev=cadence1';
export const ACHIEVEMENT_REWARDS={visit:30,work:30,voyage:30,boss:60,streak3:30,streak7:60};
const dayNumber=day=>Date.parse(day)/86400000;
export function recordPresence(w,p){
 const data=p.achievements??={version:1,claims:{},stats:{}};data.claims??={};data.stats??={};const day=allowanceDay(w.wall);
 if(!data.lastDay||day>data.lastDay){data.dayStreak=data.lastDay&&dayNumber(day)-dayNumber(data.lastDay)===1?(data.dayStreak||0)+1:1;data.lastDay=day;data.daily={day,work:0,voyage:0};}
 if(w.live&&w.streamId&&w.streamEpoch>0&&(data.lastStreamEpoch||0)<w.streamEpoch){data.streamStreak=data.lastStreamEpoch===w.streamEpoch-1?(data.streamStreak||0)+1:1;data.lastStreamEpoch=w.streamEpoch;data.lastStream=w.streamId;const coins=streakReward(data.streamStreak);if(coins){data.streamRewards??={};data.streamRewards[w.streamEpoch]={coins,streak:data.streamStreak};}}
 return data;
}
export function recordAchievementOrder(w,p,q){
 const a=recordPresence(w,p);if(q.kind==='gestao'&&['trabalhar','produzir'].includes(q.action)&&!q.payload.redistribution)a.daily.work++;
 if(q.kind==='navegar')a.daily.voyage++;
 if(q.kind==='aliancas'&&['criar','entrar'].includes(q.action))a.stats.alliance=true;
}
const streakReward=n=>n>0&&n%7===0?60:n>0&&n%3===0?30:0;
export function achievementList(w,p){
 if(!p)return[];const a=p.achievements||{},day=allowanceDay(w.wall),daily=a.daily?.day===day?a.daily:{},present=a.lastDay===day,claims=a.claims||{},epoch=w.streamEpoch||0;
 const out=[],row=(id,key,title,coins,ready,group,progress=null,art='treasure')=>out.push({id,key,title,coins,ready:!!ready,claimed:!!claims[key],group,progress,art});
 row('visit','day:'+day+':visit','Visita o porto',30,present,'daily',present?1:0,'compass');
 row('work','day:'+day+':work','Põe a ilha a trabalhar',30,(daily.work||0)>0,'daily',Math.min(1,daily.work||0),'workers');
 row('voyage','day:'+day+':voyage','Envia uma expedição',30,(daily.voyage||0)>0,'daily',Math.min(1,daily.voyage||0),'compass');
 const ds=present?a.dayStreak||0:a.lastDay&&dayNumber(day)-dayNumber(a.lastDay)<=1?a.dayStreak||0:0,ss=a.lastStreamEpoch>=epoch-1?a.streamStreak||0:0;
 const dr=streakReward(ds),sr=streakReward(ss);
 row('day-streak','day:'+day+':streak','Dias seguidos',dr||30,present&&dr>0,'streak',{count:ds,next:ds+Math.min(3-ds%3,7-ds%7)},'food');
 const pending=Object.entries(a.streamRewards||{}).find(([key])=>!claims['stream:'+key+':streak']);
 row('stream-streak','stream:'+(pending?.[0]||epoch)+':streak','Streams seguidas',pending?.[1].coins||sr||30,!!pending,'streak',{count:ss,next:ss+Math.min(3-ss%3,7-ss%7)},'shield');
 row('port','milestone:port','Porto em crescimento',45,p.levels?.sede>=2,'milestone',Math.min(2,p.levels?.sede||1)+'/2','scroll');
 row('crew','milestone:crew','Tripulação pronta',45,(p.onboarding?.recruitedCompleted||0)>=10||(p.troops||0)>=30,'milestone',null,'crew');
 row('navigator','milestone:navigator','Primeiro regresso',60,p.onboarding?.return,'milestone',null,'compass');
 row('alliance','milestone:alliance','Sob a mesma bandeira',45,a.stats?.alliance||p.alliance,'milestone',null,'shield');
 row('captain','milestone:captain','Capitão experiente',90,p.levels?.sede>=6,'milestone',Math.min(6,p.levels?.sede||1)+'/6','scroll');
 for(const boss of BOSS_SITES)row(boss.id,'boss:'+boss.id,boss.bossName,60,p.bossWins?.includes(boss.id),'boss',null,boss.id);
 return out;
}
export function achievementReward(w,p,key){
 if(typeof key!=='string'||key.length>100)throw Error('Conquista inválida.');
 if(p.achievements?.claims?.[key])throw Error('Recompensa já recolhida.');const entry=achievementList(w,p).find(v=>v.key===key);if(!entry||!entry.ready)throw Error('Conquista ainda indisponível.');
 return{key:entry.key,title:entry.title,coins:entry.coins,reference:'achievement:'+p.id+':'+(w.season||'legacy')+':'+entry.key};
}
export function collectAchievement(w,p,key){const reward=achievementReward(w,p,key),a=recordPresence(w,p);a.claims[key]={at:w.wall,coins:reward.coins};if(key.startsWith('stream:'))delete a.streamRewards[key.split(':')[1]];const temporary=Object.keys(a.claims).filter(k=>k.startsWith('day:')||k.startsWith('stream:'));for(const old of temporary.slice(0,-512))delete a.claims[old];return reward;}
