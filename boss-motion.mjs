// Continuous skinning of the first, planted pose in each Photoshop atlas.
// Coordinates remain in the original 256 px frame; no frame-to-frame resizing.
export const BOSS_MOTION=Object.freeze({
 captain:{period:3.7,breath:.0042,arms:.032,head:.012,cloth:.013,phase:.2},
 guard:{period:3.3,breath:.0045,arms:.028,head:.014,cloth:.009,phase:1.1},
 golem:{period:4.8,breath:.0035,arms:.021,head:.009,cloth:.004,phase:2.3},
 leviathan:{period:4.2,breath:.004,arms:.035,head:.012,cloth:.017,phase:3.1},
 crab:{period:3.6,breath:.0038,arms:.043,head:0,cloth:0,phase:4.2},
 tentacle:{period:5.2,breath:0,arms:0,head:0,cloth:0,phase:5.4}
});
const TAU=Math.PI*2;
const smooth=(a,b,n)=>{const v=Math.max(0,Math.min(1,(n-a)/(b-a)));return v*v*(3-2*v);};
const bell=(x,y,cx,cy,rx,ry)=>Math.exp(-2*((x-cx)/rx)**2-2*((y-cy)/ry)**2);
const rotated=(x,y,px,py,a,w)=>{const dx=x-px,dy=y-py,c=Math.cos(a),s=Math.sin(a);return[(dx*c-dy*s-dx)*w,(dx*s+dy*c-dy)*w];};
export function motionOffset(key,x,y,seconds,phase=0){
 const p=BOSS_MOTION[key];if(!p)return[0,0];
 const t=seconds*TAU/p.period+p.phase+phase,feet=1-smooth(.84,.95,y);
 if(!feet)return[0,0];
 let dx=0,dy=0;
 if(key==='tentacle'){
  const h=1-smooth(.10,.91,y),curl=bell(x,y,.31,.18,.5,.34);
  dx=(.037*Math.sin(t)*h*h+.013*Math.sin(2*t-.7)*h*curl)*feet;
  dy=(.009*Math.cos(t-.5)*curl+.004*Math.sin(2*t+y*3)*h)*feet;
 }else{
  const chest=bell(x,y,.51,key==='crab'?.49:.43,.48,.49),breath=Math.sin(t);
  dx=(x-.5)*p.breath*2.5*breath*chest;
  dy=-p.breath*breath*chest;
  const left=rotated(x,y,key==='crab'?.38:.35,key==='crab'?.56:.40,p.arms*Math.sin(t+.4),bell(x,y,.23,key==='crab'?.70:.59,.27,.34));
  const right=rotated(x,y,.68,key==='crab'?.58:.42,-p.arms*Math.sin(t-.8),bell(x,y,.80,key==='crab'?.69:.60,.25,.32));
  dx+=left[0]+right[0];dy+=left[1]+right[1];
  const head=rotated(x,y,.52,.29,p.head*Math.sin(t-.6),bell(x,y,.51,.17,.31,.25));
  dx+=head[0];dy+=head[1];
  const tail=bell(x,y,.5,.73,.55,.23)*smooth(.10,.39,Math.abs(x-.5));
  dx+=p.cloth*tail*(Math.sin(t-.8)+.25*Math.sin(2*t+y*4));
  dy+=p.cloth*.23*tail*Math.cos(t+x*4);
  if(key==='leviathan'){
   const tendril=bell(x,y,.24,.62,.24,.28)+bell(x,y,.83,.62,.22,.28);
   dx+=.010*tendril*Math.sin(2*t+y*6);dy+=.005*tendril*Math.cos(t+x*7);
  }
  if(key==='crab'){
   const legs=bell(x,y,.5,.85,.7,.15)*smooth(.19,.4,Math.abs(x-.5));
   dx+=.005*legs*Math.sin(2*t+x*7);
  }
  dx*=feet;dy*=feet;
 }
 return[dx,dy];
}
export function motionMesh(columns=24,rows=28){
 const vertices=new Float32Array((columns+1)*(rows+1)*4),indices=new Uint16Array(columns*rows*6);let i=0;
 for(let y=0;y<=rows;y++)for(let x=0;x<=columns;x++){vertices[i++]=x/columns;vertices[i++]=y/rows;vertices[i++]=(x/columns*255+.5)/512;vertices[i++]=(y/rows*255+.5)/512;}
 i=0;for(let y=0;y<rows;y++)for(let x=0;x<columns;x++){const a=y*(columns+1)+x,b=a+1,c=a+columns+1,d=c+1;indices.set([a,c,b,b,c,d],i);i+=6;}
 return{vertices,indices};
}
export function poseVertices(base,key,seconds,phase=0,out=new Float32Array(base.length)){
 for(let i=0;i<base.length;i+=4){const x=base[i],y=base[i+1],[dx,dy]=motionOffset(key,x,y,seconds,phase);out[i]=2*(x+dx)-1;out[i+1]=1-2*(y+dy);out[i+2]=base[i+2];out[i+3]=base[i+3];}return out;
}
