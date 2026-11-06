import{BOSS_MOTION,motionMesh,poseVertices}from'./boss-motion.mjs?v=0.27.2';

// One shared GPU surface, rather than a WebGL context per boss or per refresh.
// Individual visible canvases retain their last frame while assets load.
const meshes=motionMesh(),sprites=new Map(),images=new Map(),reduced=matchMedia('(prefers-reduced-motion: reduce)');
let gpu=null,request=0,observer=null,intersections=null,started=false,unavailable=false;
const phaseOf=id=>[...id].reduce((n,c)=>(n*31+c.charCodeAt(0))>>>0,7)%628/100;
function compile(gl,type,source){const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error('Shader unavailable');return shader;}
function renderer(){
 if(gpu)return gpu;if(unavailable)return null;
 try{
  const surface=document.createElement('canvas');surface.width=surface.height=256;
  const gl=surface.getContext('webgl',{alpha:true,antialias:false,premultipliedAlpha:true,depth:false,stencil:false,preserveDrawingBuffer:false});if(!gl)throw Error('WebGL unavailable');
  const program=gl.createProgram();gl.attachShader(program,compile(gl,gl.VERTEX_SHADER,'attribute vec2 position;attribute vec2 uv;varying vec2 vUV;void main(){gl_Position=vec4(position,0.,1.);vUV=uv;}'));gl.attachShader(program,compile(gl,gl.FRAGMENT_SHADER,'precision mediump float;uniform sampler2D art;varying vec2 vUV;void main(){vec4 c=texture2D(art,vUV);gl_FragColor=vec4(c.rgb*c.a,c.a);}'));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Program unavailable');gl.useProgram(program);
  const vertex=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,vertex);gl.bufferData(gl.ARRAY_BUFFER,meshes.vertices.byteLength,gl.DYNAMIC_DRAW);
  const index=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,index);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,meshes.indices,gl.STATIC_DRAW);
  for(const[name,offset]of[['position',0],['uv',8]]){const at=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(at);gl.vertexAttribPointer(at,2,gl.FLOAT,false,16,offset);}
  gl.uniform1i(gl.getUniformLocation(program,'art'),0);gl.viewport(0,0,256,256);gl.clearColor(0,0,0,0);gl.disable(gl.DEPTH_TEST);gl.disable(gl.BLEND);
  surface.addEventListener('webglcontextlost',event=>{event.preventDefault();gpu=null;unavailable=true;for(const s of sprites.values()){s.el.classList.remove('idle-ready');s.canvas?.remove();s.canvas=null;s.ctx=null;}if(request)cancelAnimationFrame(request);request=0;});
  gpu={gl,surface,vertex,textures:new Map(),positions:new Float32Array(meshes.vertices.length)};return gpu;
 }catch{unavailable=true;return null;}
}
function load(key){
 if(images.has(key))return images.get(key);
 const image=new Image(),entry={image,ready:false};images.set(key,entry);
 image.onload=()=>{entry.ready=true;wake();};image.onerror=()=>{entry.failed=true;};image.src=new URL('assets/bosses/'+key+'-idle.png',import.meta.url).href;return entry;
}
function texture(g,key,image){
 if(g.textures.has(key))return g.textures.get(key);
 const gl=g.gl,t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);g.textures.set(key,t);return t;
}
function draw(s,time){
 const entry=load(s.key);if(!entry.ready)return;
 const g=renderer();if(!g)return;
 if(!s.canvas){s.canvas=document.createElement('canvas');s.canvas.width=s.canvas.height=256;s.canvas.setAttribute('aria-hidden','true');s.ctx=s.canvas.getContext('2d',{alpha:true});if(!s.ctx){s.canvas=null;return;}s.el.append(s.canvas);}
 const gl=g.gl;gl.bindTexture(gl.TEXTURE_2D,texture(g,s.key,entry.image));gl.bindBuffer(gl.ARRAY_BUFFER,g.vertex);gl.bufferSubData(gl.ARRAY_BUFFER,0,poseVertices(meshes.vertices,s.key,time,s.phase,g.positions));gl.clear(gl.COLOR_BUFFER_BIT);gl.drawElements(gl.TRIANGLES,meshes.indices.length,gl.UNSIGNED_SHORT,0);
 s.ctx.clearRect(0,0,256,256);s.ctx.drawImage(g.surface,0,0);s.el.classList.add('idle-ready');
}
function frame(now){
 request=0;if(document.hidden||reduced.matches||unavailable)return;
 let active=false;for(const[el,s]of sprites){if(!el.isConnected){intersections?.unobserve(el);sprites.delete(el);continue;}if(s.visible&&!el.closest('.sunk')){active=true;draw(s,now/1000);}}
 if(active)request=requestAnimationFrame(frame);
}
function wake(){if(!request&&!document.hidden&&!reduced.matches&&!unavailable&&[...sprites.values()].some(s=>s.visible))request=requestAnimationFrame(frame);}
function scan(){
 for(const el of document.querySelectorAll('.boss-sprite[data-boss]')){
  if(sprites.has(el)||!BOSS_MOTION[el.dataset.boss])continue;
  const key=el.dataset.boss,s={el,key,phase:phaseOf(el.dataset.idleId||key),visible:!intersections,canvas:null,ctx:null};sprites.set(el,s);intersections?.observe(el);load(key);if(images.get(key)?.ready&&!reduced.matches)draw(s,performance.now()/1000);
 }
 for(const[el]of sprites)if(!el.isConnected){intersections?.unobserve(el);sprites.delete(el);}
 wake();
}
export function startBossIdles(){
 if(started)return;started=true;
 if('IntersectionObserver'in window)intersections=new IntersectionObserver(entries=>{for(const e of entries){const s=sprites.get(e.target);if(s)s.visible=e.isIntersecting;}wake();},{rootMargin:'20px'});
 observer=new MutationObserver(records=>{if(records.some(r=>[...r.addedNodes,...r.removedNodes].some(n=>n.nodeType===1&&n.nodeName!=='CANVAS')))scan();});observer.observe(document.body,{childList:true,subtree:true});
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&request){cancelAnimationFrame(request);request=0;}else wake();});
 reduced.addEventListener('change',()=>{for(const s of sprites.values())s.el.classList.toggle('idle-still',reduced.matches);if(reduced.matches&&request){cancelAnimationFrame(request);request=0;}else wake();});
 scan();
}
if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',startBossIdles,{once:true});else startBossIdles();}
