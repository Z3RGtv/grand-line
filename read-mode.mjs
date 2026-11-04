import{gameRunning}from'./game-session.mjs?v=0.25.0';
export function canReadFallback(error){return !error?.authRequired&&(!error?.status||[408,429].includes(error.status)||error.status>=500);}
export function consultationState(data,user,source='snapshot'){
 if(!data?.world||!data.world.players||!Number.isFinite(data.publishedAt))throw Error('Cópia de consulta inválida.');
 if(data.user&&data.user.id!==user.id)throw Error('A cópia pertence a outra conta.');
 const state=structuredClone(data);state.world.live=false;state.world.serverOnline=false;state.user={id:user.id,name:user.name};state.readOnly=true;state.consultationSource=source;state.snapshotAt=data.snapshotAt||data.publishedAt;state.now=Date.now();state.csrf='';state.github=true;state.realtime=false;delete state.order;return state;
}
export function writeRestriction(state){return state?.readOnly||!gameRunning(state?.world)?'Servidor desligado. Podes consultar a última atualização.':'';}
export function oauthReturn({hash,sessionState,localState,now=Date.now()}){const value=new URLSearchParams(hash.replace(/^#/,''));if(!value.has('access_token')&&!value.has('error'))return null;const incoming=value.get('state'),local=localState&&typeof localState==='object'&&now-localState.at<=600000&&now-localState.at>=-30000?localState.nonce:null;if(!incoming||incoming!==sessionState&&incoming!==local)throw Error('Resposta de login inválida. Volta a entrar.');if(value.has('error'))throw Error('Login Twitch cancelado.');const token=value.get('access_token');if(!token||token.length>2048)throw Error('Sessão Twitch inválida.');return{token,state:incoming};}
