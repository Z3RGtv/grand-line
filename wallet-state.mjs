export const COIN_PACK=500;
export const emptyWallet=()=>({balance:0,revision:0,totalLoaded:0,totalSpent:0});
export function walletState(w,user){const a=w.wallets?.[user];return a?{balance:a.balance,revision:a.revision,totalLoaded:a.totalLoaded,totalSpent:a.totalSpent}:emptyWallet();}
export function changeWallet(w,user,name,delta,at=Date.now()){
 if(!Number.isSafeInteger(delta)||!delta)throw Error('Movimento de moedas inválido.');
 const old=walletState(w,user),balance=old.balance+delta;if(!Number.isSafeInteger(balance)||balance<0||balance>1e9)throw Error(delta<0?'Moedas insuficientes. Carrega a carteira na Twitch.':'Saldo acima do limite.');
 w.wallets??={};return w.wallets[user]={...old,name:String(name||user).slice(0,50),balance,revision:old.revision+1,totalLoaded:old.totalLoaded+Math.max(0,delta),totalSpent:old.totalSpent+Math.max(0,-delta),changedAt:at};
}
