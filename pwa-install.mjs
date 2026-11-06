export function standalone(win){
 return !!(win.navigator?.standalone||win.matchMedia?.('(display-mode: standalone)')?.matches);
}

export function installAppControls(win,doc){
 const button=doc.getElementById('install-grand-line');
 if(!button)return;
 let installPrompt=null;
 const dialog=doc.createElement('dialog');
 dialog.className='install-dialog';
 dialog.setAttribute('aria-labelledby','install-title');
 const ios=/iPad|iPhone|iPod/.test(win.navigator.userAgent)||win.navigator.platform==='MacIntel'&&win.navigator.maxTouchPoints>1;
 const android=/Android/.test(win.navigator.userAgent);
 const steps=ios
  ?'Abre o jogo no <b>Safari</b>. Toca em <b>Partilhar → Adicionar ao ecrã principal</b> e escolhe <b>Abrir como app web</b>, se aparecer.'
  :android
  ?'Abre o jogo no <b>Chrome</b>. Toca em <b>⋮ → Instalar aplicação</b> ou <b>Adicionar ao ecrã principal</b>.'
  :'No <b>Chrome</b> ou <b>Edge</b>, usa o ícone de instalação junto ao endereço ou a opção de instalar no menu. No Safari do Mac, usa <b>Ficheiro → Adicionar à Dock</b>.';
 dialog.innerHTML='<button type="button" class="install-close" aria-label="Fechar">×</button><img src="assets/ui/app-icon-192.png" alt=""><h2 id="install-title">Instalar Grand Line</h2><p>'+steps+'</p><p>Se abriste o jogo dentro da Twitch, abre o endereço no navegador do dispositivo.</p><button type="button" class="primary install-done">Entendido</button>';
 doc.body.append(dialog);

 const close=()=>typeof dialog.close==='function'?dialog.close():dialog.removeAttribute('open');
 const show=()=>{if(!dialog.open){if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');}};
 const display=win.matchMedia?.('(display-mode: standalone)');
 const update=()=>{button.hidden=standalone(win);};
 update();
 display?.addEventListener?.('change',update);
 for(const control of dialog.querySelectorAll('button'))control.addEventListener('click',close);
 win.addEventListener('beforeinstallprompt',event=>{
  event.preventDefault();
  installPrompt=event;
  update();
 });
 win.addEventListener('appinstalled',()=>{
  button.hidden=true;
  installPrompt=null;
  if(dialog.open)close();
 });
 button.addEventListener('click',async()=>{
  if(!installPrompt){show();return;}
  const prompt=installPrompt;
  installPrompt=null;
  try{await prompt.prompt();}catch{show();}
 });

 if(win.navigator.serviceWorker){
  win.navigator.serviceWorker.register(new URL('service-worker.js',doc.baseURI),{
   scope:new URL('./',doc.baseURI).pathname,
   updateViaCache:'none',
  }).catch(()=>{});
 }
 return {button,dialog};
}
if(typeof window!=='undefined'&&typeof document!=='undefined')installAppControls(window,document);
