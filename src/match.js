import { BallControl, BALL_CONTROL } from './ball-control.js';
import { CONFIG as C } from './config.js';
import { createPlayer, drive } from './player.js';
import { createBall, integrateBall } from './ball.js';
import { solids, resetPositions } from './arena.js';
import { movePlayer, collideBall, hitPlayer, ballOutsideArena } from './physics.js';
import { Bot } from './bot.js';
import { goalScorer } from './goals.js';
export const STATES=Object.freeze({ MENU:'MENU', PRE_ROUND:'PRE_ROUND', PLAYING:'PLAYING', GOAL_SCORED:'GOAL_SCORED', POST_MATCH:'POST_MATCH' });
export class Match {
  constructor(profile) {
    this.control=new BallControl();this.profile=profile; this.player=createPlayer('fluid'); this.bot=createPlayer('heavy'); this.ball=createBall();
    this.state=STATES.MENU; this.remaining=C.duration; this.score={player:0,bot:0}; this.overtime=false; this.elapsed=0;
    resetPositions(this.player,this.bot,this.ball);
  }
  start(difficulty='normal') {
    this.difficulty=difficulty; this.ai=new Bot(difficulty);
    this.id=globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
    this.score={player:0,bot:0}; this.remaining=C.duration; this.overtime=false;
    this.finished=false; this.result=null; this.reward=0; this.elapsed=0; this.lastGoal=null; this.boundaryRecoveries=0; this.prepare();
  }
  prepare() { this.control.reset();resetPositions(this.player,this.bot,this.ball); this.ai.reset(); this.state=STATES.PRE_ROUND; this.phase=C.countdown; }
  menu() { this.control.reset();this.state=STATES.MENU; this.player.boosting=false; this.bot.boosting=false; }
  update(dt, input={}) {
    if (this.state===STATES.MENU || this.state===STATES.POST_MATCH) return;
    this.elapsed+=dt;
    if (this.state===STATES.PRE_ROUND || this.state===STATES.GOAL_SCORED) {
      this.phase-=dt;
      if (this.phase<=0) { if (this.state===STATES.PRE_ROUND) this.state=STATES.PLAYING; else this.prepare(); }
      return;
    }
    // The clock wins any same-tick conflict at 00:00; a tied match enters overtime.
    if (!this.overtime) {
      this.remaining=Math.max(0,this.remaining-dt);
      if (this.remaining<=1e-8) {
        this.remaining=0;
        if (this.score.player!==this.score.bot) { this.finish(); return; }
        this.overtime=true;
      }
    }
    if(this.recoverOutsideBall())return;
    drive(this.player,input,dt); drive(this.bot,this.ai.update(this.bot,this.ball,dt),dt);
    movePlayer(this.player,solids,dt); movePlayer(this.bot,solids,dt);
    this.control.update(this.player,this.ball,input,dt,this.bot);
    integrateBall(this.ball,dt);
    const beforeCollision={vx:this.ball.vx,vy:this.ball.vy};
    if(this.recoverOutsideBall())return;
    collideBall(this.ball,solids);
    this.control.impact(beforeCollision,this.ball,false);
    hitPlayer(this.ball,this.player,this.control.owned&&!this.control.pressure?BALL_CONTROL.contactBounce:.88);
    const beforeOtherContacts={vx:this.ball.vx,vy:this.ball.vy};
    const heavyContact=hitPlayer(this.ball,this.bot);
    collideBall(this.ball,solids);
    if(this.recoverOutsideBall())return;
    this.control.impact(beforeOtherContacts,this.ball,heavyContact);
    this.control.finishContacts(this.ball);
    const scorer=goalScorer(this.ball); if (scorer) this.goal(scorer);
  }
  recoverOutsideBall(){
    if(!ballOutsideArena(this.ball))return false;
    // Ultimate safety only: ordinary collisions must keep this counter at zero.
    this.boundaryRecoveries++;this.lastGoal=null;this.prepare();return true;
  }
  goal(scorer) {
    if (this.state!==STATES.PLAYING || this.finished || !['player','bot'].includes(scorer)) return false;
    this.control.reset();this.score[scorer]++; this.lastGoal=scorer;
    this.player.boosting=false; this.bot.boosting=false;
    if (this.overtime) this.finish();
    else { this.state=STATES.GOAL_SCORED; this.phase=C.goalPause; }
    return true;
  }
  finish() {
    if (this.finished || this.state!==STATES.PLAYING) return false;
    this.control.reset();this.finished=true; this.state=STATES.POST_MATCH;
    this.player.boosting=false; this.bot.boosting=false;
    this.result=this.score.player>this.score.bot?'win':'loss';
    this.reward=this.profile.award(this.id,this.score.player,this.result==='win');
    return true;
  }
}
