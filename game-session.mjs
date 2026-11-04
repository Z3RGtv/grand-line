// Availability and Twitch broadcasting are separate server-authoritative states.
export const gameRunning=w=>!!(w&&(typeof w.serverOnline==='boolean'?w.serverOnline:w.live));
export const fundingOpen=state=>!state?.readOnly&&gameRunning(state?.world)&&!!state.world.live;
export const combatWindow=w=>w.live?String(w.streamId||'live'):'server:'+new Date(w.wall).toLocaleDateString('en-CA',{timeZone:'Europe/Lisbon'});
export function noteAttack(w,p){
 const window=combatWindow(w);p.attackWindows??={};
 if(p.attacks&&p.attackWindow===undefined&&w.streamId)p.attackWindows[w.streamId]??=p.attacks;
 p.attacks=(p.attackWindows[window]||0)+1;p.attackWindows[window]=p.attacks;p.attackWindow=window;
 const keys=Object.keys(p.attackWindows);if(keys.length>64)for(const k of keys.slice(0,-64))delete p.attackWindows[k];
 if(p.attacks>=3)p.liveShield=window;
}
export const sessionProtected=(w,p)=>!!(p.liveShield&&p.liveShield===combatWindow(w)||(p.attackWindows?.[combatWindow(w)]||0)>=3);
