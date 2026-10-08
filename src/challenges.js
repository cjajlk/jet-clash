const definition=(id,period,event,target,xp,title)=>Object.freeze({id,period,event,target,xp,title,description:title+'.'});
export const CHALLENGES=Object.freeze([
  definition('d-match-1','daily','matches',1,100,'Terminer 1 match'),
  definition('d-match-3','daily','matches',3,150,'Terminer 3 matchs'),
  definition('d-win','daily','wins',1,150,'Gagner 1 match'),
  definition('d-goals-2','daily','goals',2,100,'Marquer 2 buts en duel'),
  definition('d-goals-3','daily','goals',3,150,'Marquer 3 buts en duel'),
  definition('d-training','daily','training',1,75,'Lancer un entraînement'),
  definition('w-matches','weekly','matches',10,500,'Terminer 10 matchs'),
  definition('w-wins','weekly','wins',5,600,'Gagner 5 matchs'),
  definition('w-goals','weekly','goals',15,500,'Marquer 15 buts en duel'),
]);
// UTC dates make local resets independent of DST and timezone changes.
export function periodKeys(now){
  const day=new Date(now);if(!Number.isFinite(day.getTime()))throw new Error('Invalid challenge date');
  day.setUTCHours(0,0,0,0);const daily=day.toISOString().slice(0,10);
  day.setUTCDate(day.getUTCDate()-((day.getUTCDay()+6)%7));
  return {daily,weekly:day.toISOString().slice(0,10)};
}
export class ChallengeManager {
  constructor(profile,clock=()=>Date.now()){this.profile=profile;this.clock=clock;this.refresh();}
  refresh(){
    const data=this.profile.data,keys=periodKeys(this.clock());let changed=false;
    if(!Number.isSafeInteger(data.seasonXp)||data.seasonXp<0){data.seasonXp=0;changed=true;}
    if(!data.challenges||typeof data.challenges!=='object'||Array.isArray(data.challenges)){data.challenges={};changed=true;}
    for(const period of ['daily','weekly']){
      let state=data.challenges[period];
      // Do not reopen an older period when the machine clock moves backwards.
      if(!state||typeof state.key!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(state.key)||state.key<keys[period]){
        state=data.challenges[period]={key:keys[period],entries:{}};changed=true;
      }
      if(!state.entries||typeof state.entries!=='object'||Array.isArray(state.entries)){state.entries={};changed=true;}
      for(const def of CHALLENGES.filter(d=>d.period===period)){
        const old=state.entries[def.id];
        const claimed=old?.claimed===true;
        const progress=claimed?def.target:Math.min(def.target,Math.max(0,Number.isSafeInteger(old?.progress)?old.progress:0));
        if(!old||old.progress!==progress||old.claimed!==claimed){state.entries[def.id]={progress,claimed};changed=true;}
      }
    }
    if(changed)this.profile.save();
  }
  record(event,amount=1){
    this.refresh();if(!Number.isSafeInteger(amount)||amount<=0)return;
    let changed=false;
    for(const def of CHALLENGES.filter(d=>d.event===event)){
      const state=this.profile.data.challenges[def.period].entries[def.id];
      if(state.claimed)continue;
      const progress=Math.min(def.target,state.progress+amount);
      if(progress!==state.progress){state.progress=progress;changed=true;}
      if(progress===def.target){state.claimed=true;this.profile.pass.addXp(def.xp,{save:false});changed=true;}
    }
    if(changed)this.profile.save();
  }
  snapshot(){this.refresh();return {seasonXp:this.profile.data.seasonXp,periods:this.profile.data.challenges,items:CHALLENGES.map(def=>({...def,...this.profile.data.challenges[def.period].entries[def.id]}))};}
}
