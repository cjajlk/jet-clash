import { CONFIG as C } from './config.js';
import { createPlayer, drive } from './player.js';
import { createBall, integrateBall } from './ball.js';
import { solids, resetPositions } from './arena.js';
import { movePlayer, collideBall, hitPlayer } from './physics.js';
import { Bot } from './bot.js';
import { goalScorer } from './goals.js';
export const STATES=Object.freeze({ MENU:'MENU', PRE_ROUND:'PRE_ROUND', PLAYING:'PLAYING', GOAL_SCORED:'GOAL_SCORED', POST_MATCH:'POST_MATCH' });
export class Match {
  constructor(profile) {
    this.profile=profile; this.player=createPlayer('fluid'); this.bot=createPlayer('heavy'); this.ball=createBall();
    this.state=STATES.MENU; this.remaining=C.duration; this.score={player:0,bot:0}; this.overtime=false; this.elapsed=0;
    resetPositions(this.player,this.bot,this.ball);
  }
  start(difficulty='normal') {
    this.difficulty=difficulty; this.ai=new Bot(difficulty);
    this.id=globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
    this.score={player:0,bot:0}; this.remaining=C.duration; this.overtime=false;
    this.finished=false; this.result=null; this.reward=0; this.elapsed=0; this.lastGoal=null; this.prepare();
  }
  prepare() { resetPositions(this.player,this.bot,this.ball); this.ai.reset(); this.state=STATES.PRE_ROUND; this.phase=C.countdown; }
  menu() { this.state=STATES.MENU; this.player.boosting=false; this.bot.boosting=false; }
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
    drive(this.player,input,dt); drive(this.bot,this.ai.update(this.bot,this.ball,dt),dt);
    movePlayer(this.player,solids,dt); movePlayer(this.bot,solids,dt);
    integrateBall(this.ball,dt);
    collideBall(this.ball,solids);
    hitPlayer(this.ball,this.player); hitPlayer(this.ball,this.bot);
    collideBall(this.ball,solids);
    const scorer=goalScorer(this.ball); if (scorer) this.goal(scorer);
  }
  goal(scorer) {
    if (this.state!==STATES.PLAYING || this.finished || !['player','bot'].includes(scorer)) return false;
    this.score[scorer]++; this.lastGoal=scorer;
    this.player.boosting=false; this.bot.boosting=false;
    if (this.overtime) this.finish();
    else { this.state=STATES.GOAL_SCORED; this.phase=C.goalPause; }
    return true;
  }
  finish() {
    if (this.finished || this.state!==STATES.PLAYING) return false;
    this.finished=true; this.state=STATES.POST_MATCH;
    this.player.boosting=false; this.bot.boosting=false;
    this.result=this.score.player>this.score.bot?'win':'loss';
    this.reward=this.profile.award(this.id,this.score.player,this.result==='win');
    return true;
  }
}
