// Spending allowance, separate from purchased coins. Only a distinct Twitch stream refills it.
export const STREAM_GAME_CREDIT=4000;
export const DAILY_GAME_LIMIT=STREAM_GAME_CREDIT;
export const GAME_BUDGET_CAP=8000;
const datePattern=/^\d{4}-\d{2}-\d{2}$/;
export function allowanceDay(wall){return new Date(wall).toLocaleDateString('en-CA',{timeZone:'Europe/Lisbon'});}
function validDate(day){return typeof day==='string'&&datePattern.test(day)&&Number.isFinite(Date.parse(day))&&new Date(Date.parse(day)).toISOString().slice(0,10)===day;}
export function validateAllowance(p){const a=p.actionAllowance;if(a!==undefined&&(!a||!Number.isInteger(a.remaining)||a.remaining<0||a.remaining>GAME_BUDGET_CAP||!(Number.isSafeInteger(a.epoch)&&a.epoch>=0||a.epoch===undefined&&validDate(a.day))))throw Error('Reserva de ações inválida.');}
export function spendingBudget(w,p,wall=w.wall){
 const epoch=w.streamEpoch||0;if(!p)return{daily:STREAM_GAME_CREDIT,cap:GAME_BUDGET_CAP,remaining:0,epoch,spent:0};
 validateAllowance(p);const a=p.actionAllowance||{remaining:Math.max(0,Math.min(STREAM_GAME_CREDIT,STREAM_GAME_CREDIT-(p.dailySpent||0)))},streams=a.epoch===undefined?0:Math.max(0,epoch-a.epoch);
 return{daily:STREAM_GAME_CREDIT,cap:GAME_BUDGET_CAP,remaining:Math.min(GAME_BUDGET_CAP,a.remaining+Math.min(2,streams)*STREAM_GAME_CREDIT),epoch:Math.max(epoch,a.epoch||0),spent:streams?0:p.dailySpent||0};
}
export function syncAllowance(w,p,wall=w.wall){const value=spendingBudget(w,p,wall);p.actionAllowance={epoch:value.epoch,remaining:value.remaining};p.dailySpent=value.spent;return value;}
export function migrateStreamAllowance(w){if(!Number.isSafeInteger(w.streamEpoch)){w.streamEpoch=0;w.creditStreams=w.streamId&&w.streamId!=='offline'?[String(w.streamId)]:[];}w.creditStreams??=[];for(const p of Object.values(w.players||{}))syncAllowance(w,p);}
export function registerStreamAllowance(w,id){migrateStreamAllowance(w);id=String(id||'').slice(0,160);if(!id||w.creditStreams.includes(id))return false;w.creditStreams.push(id);w.streamEpoch++;for(const p of Object.values(w.players||{}))syncAllowance(w,p);return true;}
export function startAllowance(p,wall,epoch=0){p.actionAllowance={epoch,remaining:STREAM_GAME_CREDIT};}
export function chargeAllowance(w,p,cost,wall=w.wall){if(!Number.isInteger(cost)||cost<=0||cost>GAME_BUDGET_CAP)throw Error('Custo de ações inválido.');const value=syncAllowance(w,p,wall);if(value.remaining<cost)throw Error('Limite disponível insuficiente: +4.000 por stream, com reserva máxima de 8.000.');p.actionAllowance.remaining-=cost;}
