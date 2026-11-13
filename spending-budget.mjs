import { MAX_LEVEL } from './progression.mjs?v=0.27.2';

// The base limits also apply to legacy saves without a headquarters level.
export const STREAM_GAME_CREDIT=4000;
export const DAILY_GAME_LIMIT=STREAM_GAME_CREDIT;
export const GAME_BUDGET_CAP = 2 * STREAM_GAME_CREDIT;
const BONUS_PER_LEVEL = 250;
const MAX_SAVED_ALLOWANCE = 2 * (STREAM_GAME_CREDIT + (MAX_LEVEL - 1) * BONUS_PER_LEVEL);

function streamCredit(player) {
 const headquarters = player?.levels?.sede;
 const level = Number.isInteger(headquarters) ? Math.max(1, Math.min(MAX_LEVEL, headquarters)) : MAX_LEVEL;
 return STREAM_GAME_CREDIT + (MAX_LEVEL - level) * BONUS_PER_LEVEL;
}
const datePattern=/^\d{4}-\d{2}-\d{2}$/;
export function allowanceDay(wall){return new Date(wall).toLocaleDateString('en-CA',{timeZone:'Europe/Lisbon'});}
function validDate(day){return typeof day==='string'&&datePattern.test(day)&&Number.isFinite(Date.parse(day))&&new Date(Date.parse(day)).toISOString().slice(0,10)===day;}
export function validateAllowance(p){const a=p.actionAllowance;if(a!==undefined&&(!a||!Number.isInteger(a.remaining)||a.remaining<0||a.remaining>MAX_SAVED_ALLOWANCE||!(Number.isSafeInteger(a.epoch)&&a.epoch>=0||a.epoch===undefined&&validDate(a.day))))throw Error('Reserva de ações inválida.');}
export function spendingBudget(w,p,wall=w.wall){
 const epoch = w.streamEpoch || 0;
 const daily = streamCredit(p);
 const cap = 2 * daily;
 if (!p) return { daily, cap, remaining: 0, epoch, spent: 0 };
 validateAllowance(p);const a=p.actionAllowance||{remaining:Math.max(0,Math.min(STREAM_GAME_CREDIT,STREAM_GAME_CREDIT-(p.dailySpent||0)))},streams=a.epoch===undefined?0:Math.max(0,epoch-a.epoch);
 const accrued = a.remaining + Math.min(2, streams) * daily;
 // A headquarters upgrade lowers future refills and preserves previously awarded allowance.
 const remaining = Math.min(Math.max(cap, a.remaining), accrued);
 return { daily, cap, remaining, epoch: Math.max(epoch, a.epoch || 0), spent: streams ? 0 : p.dailySpent || 0 };
}
export function syncAllowance(w,p,wall=w.wall){const value=spendingBudget(w,p,wall);p.actionAllowance={epoch:value.epoch,remaining:value.remaining};p.dailySpent=value.spent;return value;}
export function migrateStreamAllowance(w){if(!Number.isSafeInteger(w.streamEpoch)){w.streamEpoch=0;w.creditStreams=w.streamId&&w.streamId!=='offline'?[String(w.streamId)]:[];}w.creditStreams??=[];for(const p of Object.values(w.players||{}))syncAllowance(w,p);}
export function registerStreamAllowance(w,id){migrateStreamAllowance(w);id=String(id||'').slice(0,160);if(!id||w.creditStreams.includes(id))return false;w.creditStreams.push(id);w.streamEpoch++;for(const p of Object.values(w.players||{}))syncAllowance(w,p);return true;}
export function startAllowance(p,wall,epoch=0){p.actionAllowance={epoch,remaining:streamCredit(p)};}
export function chargeAllowance(w,p,cost,wall=w.wall){if(!Number.isInteger(cost)||cost<=0||cost>MAX_SAVED_ALLOWANCE)throw Error('Custo de ações inválido.');const value=syncAllowance(w,p,wall);if(value.remaining<cost)throw Error('Limite disponível insuficiente.');p.actionAllowance.remaining-=cost;}
