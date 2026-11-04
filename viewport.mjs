// Layout follows the device, rather than the open menu or map canvas.
export function viewportMode({width,height,screenWidth,screenHeight,touch=false,coarse=false,orientation=''}){const short=Math.min(screenWidth||width,screenHeight||height),phone=(touch||coarse)&&short<=600;return{phone,landscape:phone&&(orientation?orientation.startsWith('landscape'):screenWidth&&screenHeight?screenWidth>screenHeight:width>height),compact:width<=650||phone};}
export function installViewport(win,doc){
 function update(){const width=win.innerWidth,height=win.innerHeight,screen=win.screen||{},mode=viewportMode({width,height,screenWidth:screen.width,screenHeight:screen.height,orientation:screen.orientation?.type,touch:(win.navigator?.maxTouchPoints||0)>0,coarse:win.matchMedia?.('(pointer: coarse)').matches});doc.documentElement.classList.toggle('phone-device',mode.phone);doc.documentElement.classList.toggle('phone-landscape',mode.landscape);doc.documentElement.style.setProperty('--visual-height',Math.round(win.visualViewport?.height||height)+'px');return mode;}
 update();win.addEventListener('resize',update,{passive:true});win.addEventListener('orientationchange',update,{passive:true});win.addEventListener('pageshow',update,{passive:true});win.visualViewport?.addEventListener('resize',update,{passive:true});return update;
}

if(typeof window!=='undefined'&&typeof document!=='undefined')installViewport(window,document);
