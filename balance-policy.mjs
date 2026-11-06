// Prices are server-authoritative; channel-point loads remain 500 for 500 coins.
export const BALANCE_RELEASE='0.27.1';
export const WORK_PRICE=90;
export function actionPrice(kind,action,v={}){
 if(kind==='gestao'&&['trabalhar','produzir'].includes(action)&&v.redistribution)return 0;
 return Math.ceil(basePrice(kind,action,v)*9/10);
}
function basePrice(kind,action,v={}){
 if(kind==='entrar')return 500;if(kind==='navegar')return 200;if(kind==='aliancas')return 100;
 if(kind==='gestao')return 100;
 if(kind==='construcoes'){
  if(action==='tropas')return Math.min(350,50+5*v.count);
  if(action==='trabalhadores')return Math.min(250,50+10*v.count);
  if(action==='navios')return Math.min(350,100+50*v.count);
  if(action==='reparar')return Math.min(250,50+10*Math.ceil(Object.values(v.repaired||{}).reduce((a,b)=>a+b,0)/10));
  return 350;
 }
 throw Error('Ação inválida.');
}
export const RECOVERY_SECONDS=1800,RECOVERY_RATE=.5,STASH_LIMIT=8,FRAGMENTS_REQUIRED=10;
