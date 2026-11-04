let sequence=0;const messages=new WeakMap(),animations=new WeakMap();
export function setButtonRequirement(button,reason=''){
 if(!button)return;reason=String(reason||'');
 if(button.dataset.inlineCode||button.dataset.inlineExecute)reason='';
 button.classList.toggle('action-unavailable',!!reason);button.setAttribute('aria-disabled',reason?'true':'false');
 if(reason){button.disabled=false;button.dataset.requirement=reason;}else{delete button.dataset.requirement;if(!button.dataset.orderBusy)button.disabled=false;}
 let message=messages.get(button);if(!reason){message?.remove();messages.delete(button);button.removeAttribute('aria-describedby');return;}
 if(!message?.isConnected){
  const parent=button.parentElement;
  // Reuse the same requirement instead of displaying it twice.
  message=parent?[...parent.children].find(el=>el!==button&&el.matches?.('p.requirement,.recruit-reason')&&el.textContent.trim()===reason):null;
  if(!message){message=button.ownerDocument.createElement('p');message.className='action-requirement requirement';}
  message.id||='action-requirement-'+(++sequence);message.classList.add('action-requirement');messages.set(button,message);button.before(message);
 }
 message.textContent=reason;message.setAttribute('role','status');button.setAttribute('aria-describedby',message.id);
}
export function highlightRequirement(button){
 const message=messages.get(button);if(!message)return;
 message.scrollIntoView?.({block:'nearest',behavior:'smooth'});
 const reduced=button.ownerDocument.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 for(const node of [message,...button.parentElement.querySelectorAll('.cost-short')]){
  animations.get(node)?.cancel();
  const frames=reduced?[{outlineColor:'#cf663b',backgroundColor:'#f8d3a8'},{outlineColor:'transparent',backgroundColor:'transparent'}]:[
   {transform:'translateX(0)',backgroundColor:'#f8d3a8'},{transform:'translateX(-7px)',backgroundColor:'#f8d3a8',offset:.15},
   {transform:'translateX(7px)',offset:.3},{transform:'translateX(-5px)',offset:.45},{transform:'translateX(5px)',offset:.6},
   {transform:'translateX(0)',backgroundColor:'transparent'}];
  if(node.animate)animations.set(node,node.animate(frames,{duration:reduced?950:600,easing:'ease-out'}));
 }
}
export function interceptRequirement(event,highlight=highlightRequirement){
 const button=event.target?.closest?.('button');if(!button?.dataset.requirement||button.dataset.inlineCode||button.dataset.inlineExecute)return false;
 event.preventDefault();event.stopImmediatePropagation();highlight(button);return true;
}
