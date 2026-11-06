import{gameRunning}from'./game-session.mjs?v=0.27.0';
import{workerState,workProgress}from'./workers.mjs?v=0.27.0';
import{storageCapacity}from'./harbor.mjs?v=0.27.0';
const clamp=n=>Math.max(0,Math.min(1,n));
// Navigation lives in world.missions. The local queue contains jobs and paid resource shifts only.
export function productionEntries(w,id,clock=w.clock){
 const p=w.players?.[id];if(!p)return[];
 const entries=(w.jobs||[]).filter(j=>j.user===id&&j.end>clock).map(j=>({id:j.id,kind:'order',job:j,start:j.start,end:j.end,status:j.start>clock?'queued':gameRunning(w)?'active':'paused',progress:clamp((clock-j.start)/Math.max(1,j.end-j.start))}));
 const work=workerState(p,clock),capacity=storageCapacity(p);
 if(work.active)for(const resource of ['wood','stone']){
  const workers=work[resource+'Workers'];if(!workers)continue;
  const cycle=work.cycles[resource],due=clock+cycle.nextIn,full=(p.resources?.[resource]||0)>=capacity,damaged=cycle.amount<=0,hasBatch=!work.legacy&&due<=work.until+1e-7&&!full&&!damaged,progress=workProgress(p,resource,clock),completed=Math.floor(progress+1e-9),amount=Math.max(0,Math.min(capacity-(p.resources?.[resource]||0),Math.floor((completed+1)*cycle.amount+1e-9)-Math.floor(completed*cycle.amount+1e-9)));
  entries.push({id:'work-'+resource,kind:'resource',resource,workers,amount:hasBatch?amount:null,start:work.start,end:hasBatch?due:work.until,shiftEnd:work.until,status:gameRunning(w)?'active':'paused',blocked:full?'storage':damaged?'damage':null,nextBatch:hasBatch,progress:hasBatch?clamp(progress-completed):clamp((clock-work.start)/Math.max(1,work.until-work.start))});
 }
 return entries.sort((a,b)=>Number(a.status==='queued')-Number(b.status==='queued')||a.end-b.end||a.id.localeCompare(b.id));
}
