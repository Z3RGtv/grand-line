export const PROMO_INTERVAL=20*60*1000,PROMO_DURATION=15*1000,PROMO_FIRST_DELAY=90*1000;
export function eligible({now,next,streaming,open,active}){return Boolean(streaming&&open&&active&&Number.isFinite(next)&&now>=next);}
export function nextSlot(saved,now){const n=Number(saved);return n>now&&n<=now+PROMO_INTERVAL?n:now+PROMO_FIRST_DELAY;}
