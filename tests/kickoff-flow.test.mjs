import test from 'node:test';
import assert from 'node:assert/strict';
import {Match,STATES as S} from '../src/match.js';
import {ProfileStore} from '../src/profile-store.js';
import {CONFIG as C} from '../src/config.js';
for(const mode of ['duel','2v2'])test(`${mode} : balle au sol, countdown initial seulement, reprise après animation`,()=>{
  const m=new Match(new ProfileStore({getItem(){},setItem(){}}));m.start(mode);
  assert.equal(m.state,S.PRE_ROUND);assert.equal(m.ball.x,C.width/2);assert.equal(m.ball.y+m.ball.r,C.floor);assert.equal(m.ball.vy,0);
  m.update(C.countdown+.01);assert.equal(m.state,S.PLAYING);
  for(const scorer of ['player','bot','player']){
    Object.assign(m.ball,{x:scorer==='player'?1200:80,y:260,vx:100,vy:20});
    assert.equal(m.goal(scorer),true);const ball={...m.ball},time=m.remaining;
    m.update(C.goalPause/2);assert.equal(m.state,S.GOAL_SCORED);assert.deepEqual(m.ball,ball);assert.equal(m.remaining,time);
    m.update(C.goalPause/2+.01);assert.equal(m.state,S.PLAYING);assert.equal(m.phase,0);assert.equal(m.ball.x,C.width/2);assert.equal(m.ball.y+m.ball.r,C.floor);assert.equal(m.ball.vx,0);assert.equal(m.ball.vy,0);assert.equal(m.remaining,time);
  }
  assert.deepEqual(m.score,{player:2,bot:1});m.start(mode);assert.equal(m.state,S.PRE_ROUND);
});
