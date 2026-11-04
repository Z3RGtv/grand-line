// Layout follows the device, rather than the open menu or map canvas.
export function viewportMode({width,height,screenWidth,screenHeight,touch=false,coarse=false,orientation=''}){const short=Math.min(screenWidth||width,screenHeight||height),phone=(touch||coarse)&&short<=600;return{phone,landscape:phone&&(orientation?orientation.startsWith('landscape'):screenWidth&&screenHeight?screenWidth>screenHeight:width>height),compact:width<=650||phone};}
// Recover the wide overview some Android tabs restore. Pinch zoom changes the
// visual viewport, so use the layout width and only repair an extreme mismatch.
export function phoneViewportWidth(input){const mode=viewportMode(input);if(!mode.phone)return 0;const dimensions=[input.screenWidth,input.screenHeight].filter(n=>Number.isFinite(n)&&n>0);return Math.round(dimensions.length===2?(mode.landscape?Math.max(...dimensions):Math.min(...dimensions)):dimensions[0]||input.width);}
export function viewportRecovery(input){const target=phoneViewportWidth(input),layout=input.layoutWidth||input.width,scale=input.scale??1;return target>0&&layout>=target*1.5&&scale<.85?target:0;}
export function installViewport(win,doc){
 let repaired=false,interacted=false,settling=true,retry=1;
 function metrics(){const width=win.innerWidth,height=win.innerHeight,screen=win.screen||{};return{width,height,layoutWidth:doc.documentElement.clientWidth||width,screenWidth:screen.width,screenHeight:screen.height,orientation:screen.orientation?.type,touch:(win.navigator?.maxTouchPoints||0)>0,coarse:win.matchMedia?.('(pointer: coarse)').matches,scale:win.visualViewport?.scale??1};}
 function update(){const input=metrics(),mode=viewportMode(input);doc.documentElement.classList.toggle('phone-device',mode.phone);doc.documentElement.classList.toggle('phone-landscape',mode.landscape);doc.documentElement.style.setProperty('--visual-height',Math.round(win.visualViewport?.height||input.height)+'px');return mode;}
 function recover(rotation=false){const input=metrics(),target=rotation&&repaired?phoneViewportWidth(input):viewportRecovery(input),meta=doc.querySelector?.('meta[name="viewport"]');if(target&&meta&&(!interacted||rotation&&input.scale<=1.05)){const content='width='+target+', initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content';if(retry>0||meta.getAttribute('content')!==content){retry=0;meta.setAttribute('content',content);}repaired=true;}return update();}
 function ready(rotation=false){settling=true;retry=1;recover(rotation);if(win.requestAnimationFrame)win.requestAnimationFrame(()=>win.requestAnimationFrame(()=>{recover(rotation);settling=false;}));else settling=false;}
 const resize=()=>settling&&!interacted?recover():update();
 ready();win.addEventListener('resize',resize,{passive:true});win.addEventListener('orientationchange',()=>ready(true),{passive:true});win.addEventListener('pageshow',()=>{interacted=false;ready();},{passive:true});win.addEventListener('load',()=>ready(),{passive:true});win.addEventListener('grand-line:ready',()=>ready(),{passive:true});win.visualViewport?.addEventListener('resize',resize,{passive:true});for(const event of ['pointerdown','touchstart','wheel'])win.addEventListener(event,()=>{interacted=true;},{passive:true});return update;
}

if(typeof window!=='undefined'&&typeof document!=='undefined')installViewport(window,document);
