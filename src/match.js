import { BallControl, BALL_CONTROL } from './ball-control.js';
import { CONFIG as C } from './config.js';
import { createPlayer, drive } from './player.js';
import { createBall, integrateBall } from './ball.js';
import { solids, resetPositions } from './arena.js';
import { movePlayer, collideBall, hitPlayer, ballOutsideArena } from './physics.js';
import { Bot } from './bot.js';
import { goalScorer } from './goals.js';
import { TeamBot, createTeamExtras, resetTeamPositions } from './team-mode.js';
export const STATES=Object.freeze({ MENU:'MENU', PRE_ROUND:'PRE_ROUND', PLAYING:'PLAYING', GOAL_SCORED:'GOAL_SCORED', POST_MATCH:'POST_MATCH' });
export class Match {
  constructor(profile,onEvent=()=>{}) {
    this.onEvent=onEvent;
    this.control=new BallControl(power=>{if(this.mode==='2v2')this.lastTouch=this.player;this.notify('shot',{power});});this.profile=profile; this.player=createPlayer('fluid'); this.bot=createPlayer('heavy'); this.ball=createBall();
    this.mode='duel';this.extraBots=[];this.humanGoals=0;this.lastTouch=null;
    this.state=STATES.MENU; this.remaining=C.duration; this.score={player:0,bot:0}; this.overtime=false; this.elapsed=0;
    this.goalEffect=null;
    resetPositions(this.player,this.bot,this.ball);
  }
  notify(kind,detail){
    // Optional presentation effects must never interrupt the simulation.
    try{this.onEvent(kind,detail);}catch{}
  }
  get players(){return [this.player,this.bot,...this.extraBots.map(entry=>entry.body)].filter(Boolean);}
  get bots(){return [...(this.bot&&this.ai?[{body:this.bot,ai:this.ai}]:[]),...this.extraBots];}
  get rewardGoals(){return this.mode==='2v2'?this.humanGoals:this.score.player;}
  start(modeOrDifficulty='normal',difficultyMaybe){
    this.mode=['training','2v2','duel'].includes(modeOrDifficulty)?modeOrDifficulty:'duel';
    this.training=this.mode==='training';
    this.difficulty=this.training?'normal':(difficultyMaybe||(['2v2','duel'].includes(modeOrDifficulty)?'normal':modeOrDifficulty));
    this.ai=this.training?null:this.mode==='2v2'?new TeamBot(this.difficulty,'bot'):new Bot(this.difficulty);
    this.extraBots=this.mode==='2v2'?createTeamExtras(this.difficulty):[];
    if(!this.training&&!this.bot)this.bot=createPlayer('heavy');
    this.id=globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
    this.score={player:0,bot:0}; this.remaining=C.duration; this.overtime=false;this.humanGoals=0;
    this.finished=false; this.result=null; this.reward=0; this.elapsed=0; this.lastGoal=null; this.boundaryRecoveries=0; this.prepare();
    if(this.training){this.state=STATES.PLAYING;this.phase=0;this.bot=null;this.remaining=0;this.profile.challenges?.record('training');}
  }
  prepare() {
    this.goalEffect=null;
    this.lastTouch=null;
    this.control.reset();
    if (this.training) Object.assign(this.player,{x:300,y:C.floor-C.playerHeight/2,vx:0,vy:0,grounded:true,fuel:100,boosting:false,jumpHeld:false,contactSurface:'floor',footX:0,footY:1,controlX:1,controlY:0,rotateHeld:false,jumpReady:true,impulseReady:true,impulseCooldown:0,flipIntent:0,flipHeld:false,flipReady:true,flipTimer:0,flipHit:false,flipX:1,flipY:0});
    else if(this.mode==='2v2')resetTeamPositions(this.player,this.bot,this.extraBots,this.ball);
    else resetPositions(this.player,this.bot,this.ball);
    for(const entry of this.bots)entry.ai.reset?.();
    this.state=this.training?STATES.PLAYING:STATES.PRE_ROUND; this.phase=this.training?0:C.countdown; if(this.training){this.bot=null;this.remaining=0;}
  }
  menu() { this.goalEffect=null;this.control.reset();this.state=STATES.MENU; for(const player of this.players)player.boosting=false; }
  resetTrainingBall(){ if(!this.training) return false; Object.assign(this.ball,{x:640,y:278,vx:0,vy:0,angle:0,flash:0}); return true; }
  update(dt, input={}) {
    if(this.goalEffect){
      this.goalEffect.remaining=Math.max(0,this.goalEffect.remaining-dt);
      if(!this.goalEffect.remaining)this.goalEffect=null;
    }
    if (this.state===STATES.MENU || this.state===STATES.POST_MATCH) return;
    this.elapsed+=dt;
    if (this.state===STATES.PRE_ROUND || this.state===STATES.GOAL_SCORED) {
      this.phase-=dt;
      if (this.phase<=0) { if (this.state===STATES.PRE_ROUND) this.state=STATES.PLAYING; else this.prepare(); }
      return;
    }
    // The clock wins any same-tick conflict at 00:00; a tied match enters overtime.
    if (!this.training&&!this.overtime) {
      this.remaining=Math.max(0,this.remaining-dt);
      if (this.remaining<=1e-8) {
        this.remaining=0;
        if (this.score.player!==this.score.bot) { this.finish(); return; }
        this.overtime=true;
      }
    }
    if(this.recoverOutsideBall())return;
    const bots=this.bots,players=this.players;
    drive(this.player,input,dt);for(const entry of bots)drive(entry.body,entry.ai.update(entry.body,this.ball,dt,players),dt);
    for(const player of players)movePlayer(player,solids,dt);
    const pressureOpponent=this.mode==='2v2'?(bots.find(entry=>entry.body.team==='bot'&&this.control.contact(entry.body,this.ball))?.body||this.bot):this.bot;
    this.control.update(this.player,this.ball,input,dt,pressureOpponent);
    if(this.mode==='2v2'&&this.control.owned&&this.control.contact(this.player,this.ball))this.lastTouch=this.player;
    integrateBall(this.ball,dt);
    const beforeCollision={vx:this.ball.vx,vy:this.ball.vy};
    if(this.recoverOutsideBall())return;
    collideBall(this.ball,solids);
    this.control.impact(beforeCollision,this.ball,false);
    const flipStrike=this.player.flipTimer>0&&!this.player.flipHit?{x:this.player.flipX,y:this.player.flipY}:null;
    const playerContact=hitPlayer(this.ball,this.player,this.control.softContact&&!this.control.pressure?BALL_CONTROL.contactBounce:.88,flipStrike);
    if(this.mode==='2v2'&&playerContact)this.lastTouch=this.player;
    if(flipStrike&&playerContact){this.player.flipHit=true;this.control.release();this.notify('shot',{power:.65});}
    const beforeOtherContacts={vx:this.ball.vx,vy:this.ball.vy};
    let heavyContact=false;
    for(const entry of bots)if(hitPlayer(this.ball,entry.body)){
      heavyContact=true;if(this.mode==='2v2')this.lastTouch=entry.body;
    }
    collideBall(this.ball,solids);
    if(this.recoverOutsideBall())return;
    this.control.impact(beforeOtherContacts,this.ball,heavyContact);
    this.control.finishContacts(this.ball,this.player,playerContact);
    const scorer=goalScorer(this.ball); if (scorer) this.goal(scorer);
  }
  recoverOutsideBall(){
    if(!ballOutsideArena(this.ball))return false;
    if(this.training){this.resetTrainingBall();return true;}
    // Ultimate safety only: ordinary collisions must keep this counter at zero.
    this.boundaryRecoveries++;this.lastGoal=null;this.prepare();return true;
  }
  goal(scorer) {
    if (this.state!==STATES.PLAYING || this.finished || !['player','bot'].includes(scorer)) return false;
    this.goalEffect={side:scorer==='bot'?'left':'right',x:this.ball.x,y:this.ball.y,remaining:C.goalEffectDuration};
    this.notify('goal',{scorer,training:this.training});
    if(this.training){this.resetTrainingBall();this.control.release();this.lastGoal=null;return true;}
    this.control.reset();this.score[scorer]++; this.lastGoal=scorer;
    if(scorer==='player'&&(this.mode!=='2v2'||this.lastTouch===this.player)){
      this.humanGoals++;this.profile.challenges?.record('goals');
    }
    for(const player of this.players)player.boosting=false;
    if (this.overtime) this.finish();
    else { this.state=STATES.GOAL_SCORED; this.phase=C.goalPause; }
    return true;
  }
  finish() {
    if (this.finished || this.state!==STATES.PLAYING) return false;
    if(this.training)return false;
    this.control.reset();this.finished=true; this.state=STATES.POST_MATCH;
    for(const player of this.players)player.boosting=false;
    this.result=this.score.player>this.score.bot?'win':'loss';
    const alreadyAwarded=this.profile.data?.completed?.includes(this.id);
    this.reward=this.profile.award(this.id,this.rewardGoals,this.result==='win');
    if(!alreadyAwarded){this.profile.challenges?.record('matches');if(this.result==='win')this.profile.challenges?.record('wins');}
    return true;
  }
}
