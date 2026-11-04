// This is an allowance for game actions, not a Twitch Channel Points balance.
export const DAILY_GAME_LIMIT=3500;
export const GAME_BUDGET_CAP=DAILY_GAME_LIMIT*2;
const datePattern=/^\d{4}-\d{2}-\d{2}$/;
export function allowanceDay(wall){return new Date(wall).toLocaleDateString('en-CA',{timeZone:'Europe/Lisbon'});}
function validDate(day){return typeof day==='string'&&datePattern.test(day)&&Number.isFinite(Date.parse(day))&&new Date(Date.parse(day)).toISOString().slice(0,10)===day;}
export function validateAllowance(p){const a=p.actionAllowance;if(a!==undefined&&(!a||!validDate(a.day)||!Number.isInteger(a.remaining)||a.remaining<0||a.remaining>GAME_BUDGET_CAP))throw Error('Reserva de ações inválida.');}
export function spendingBudget(w,p,wall=w.wall){if(!p)return{daily:DAILY_GAME_LIMIT,cap:GAME_BUDGET_CAP,remaining:0,day:allowanceDay(wall),spent:0};validateAllowance(p);const today=allowanceDay(wall),a=p.actionAllowance||{day:validDate(w.date)?w.date:today,remaining:Math.max(0,Math.min(DAILY_GAME_LIMIT,DAILY_GAME_LIMIT-(p.dailySpent||0)))},days=Math.max(0,Math.floor((Date.parse(today)-Date.parse(a.day))/86400000));return{daily:DAILY_GAME_LIMIT,cap:GAME_BUDGET_CAP,remaining:Math.min(GAME_BUDGET_CAP,a.remaining+Math.min(2,days)*DAILY_GAME_LIMIT),day:days?today:a.day,spent:days?0:p.dailySpent||0};}
export function syncAllowance(w,p,wall=w.wall){const value=spendingBudget(w,p,wall);p.actionAllowance={day:value.day,remaining:value.remaining};p.dailySpent=value.spent;return value;}
export function startAllowance(p,wall){p.actionAllowance={day:allowanceDay(wall),remaining:DAILY_GAME_LIMIT};}
export function chargeAllowance(w,p,cost,wall=w.wall){if(!Number.isInteger(cost)||cost<=0||cost>GAME_BUDGET_CAP)throw Error('Custo de ações inválido.');const value=syncAllowance(w,p,wall);if(value.remaining<cost)throw Error('Limite disponível insuficiente: 3.500 por dia, com reserva máxima de 7.000.');p.actionAllowance.remaining-=cost;}
