// A code is an intention. Only the Twitch redemption authorizes and pays for it.
const b64 = bytes => typeof Buffer!=='undefined'?Buffer.from(bytes).toString('base64url'):btoa(String.fromCharCode(...bytes)).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');
const bytes = text => typeof Buffer!=='undefined'?new Uint8Array(Buffer.from(text,'base64url')):Uint8Array.from(atob(text.replaceAll('-','+').replaceAll('_','/')),c=>c.charCodeAt(0));
export function encodeOrder(user,request,now=Date.now()) {
 const nonce=b64(crypto.getRandomValues(new Uint8Array(9)));
 const code='MC1.'+b64(new TextEncoder().encode(JSON.stringify({u:String(user),t:Math.floor(now/1000),n:nonce,r:request})));
 if(code.length>500)throw Error('Ordem demasiado longa. Reduz o nome ou a seleção.');
 return code;
}
export function decodeOrder(code,user,now=Date.now()) {
 if(typeof code!=='string'||code.length>500||!/^MC1\.[A-Za-z0-9_-]+$/.test(code))throw Error('Formato de ordem inválido.');
 let v;try{v=JSON.parse(new TextDecoder().decode(bytes(code.slice(4))));}catch{throw Error('Código ilegível.');}
 if(v.u!==String(user))throw Error('O código pertence a outra conta Twitch.');
 if(!Number.isInteger(v.t)||now/1000-v.t>600||v.t-now/1000>30)throw Error('Código expirado ou relógio incorreto.');
 if(!/^[A-Za-z0-9_-]{12}$/.test(v.n)||!v.r||typeof v.r!=='object'||Array.isArray(v.r))throw Error('Ordem inválida.');
 if(v.r.clientKey&&(!Array.isArray(v.r.clientKey)||v.r.clientKey.length!==2||!v.r.clientKey.every(x=>typeof x==='string'&&/^[A-Za-z0-9_-]{43}$/.test(x))))throw Error('Chave do navegador inválida.');
 return {request:v.r,nonce:v.n,expires:(v.t+600)*1000};
}
export {b64,bytes};
