const pendingError=message=>Object.assign(Error(message||'Confirmação pendente. Verifica a compra na carteira.'),{purchasePending:true});
export function createWalletOrders({read,save,clear,send,record=async()=>{},uuid=()=>crypto.randomUUID(),locks=globalThis.navigator?.locks}){
 const active=new Map();
 function submit(account,request){
  const signature=JSON.stringify(request),running=active.get(account);
  if(running)return running.signature===signature?running.promise:Promise.reject(pendingError('Há uma compra a confirmar.'));
  const operation=async()=>{
   const pending=await read(account);if(pending&&JSON.stringify(pending.request)!==signature)throw pendingError('Há uma compra a confirmar. Abre a carteira.');
   const order=pending||{id:uuid(),request:structuredClone(request)};
   if(!pending)try{await save(account,order);}catch{throw Object.assign(Error('Não foi possível guardar a ordem. Nenhuma moeda foi gasta.'),{orderState:'not_sent'});}
   try{
    const result=await send(order,account);
    if(!['fulfilled','canceled'].includes(result?.status))throw pendingError();
    await record(account,result).catch(()=>{});await clear(account).catch(()=>{});return result;
   }catch(error){
    if(error.orderState==='not_sent'&&!pending){await clear(account).catch(()=>{});throw error;}
    throw Object.assign(pendingError(),{cause:error});
   }
  };
  const promise=Promise.resolve().then(()=>locks?.request?locks.request('grand-line-purchase:'+account,{ifAvailable:true},lock=>{if(!lock)throw pendingError('Há uma compra a confirmar noutro separador.');return operation();}):operation()).finally(()=>active.delete(account));
  active.set(account,{signature,promise});return promise;
 }
 return{submit};
}
export function purchaseFeedback(result){
 if(result?.status==='fulfilled')return{state:'confirmed',title:result.replayed?'Já efetuada · sem nova cobrança':result.cost===0?'Alteração confirmada · grátis':'Compra confirmada · −'+Number(result.cost||0).toLocaleString('pt-PT')+' moedas',detail:Number.isSafeInteger(result.wallet?.balance)?'Saldo: '+result.wallet.balance.toLocaleString('pt-PT')+' moedas':''};
 if(result?.status==='canceled'||result?.orderState==='not_sent')return{state:'rejected',title:'Não efetuada · 0 moedas gastas',detail:result.error||result.message||''};
 return{state:'pending',title:'A aguardar confirmação',detail:'Verifica o resultado na carteira antes de repetir.'};
}
