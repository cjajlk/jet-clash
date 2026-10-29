import test from 'node:test';
import assert from 'node:assert/strict';
import {Match,STATES} from '../src/match.js';
import {CONFIG as C} from '../src/config.js';
import {goalEntryDepth} from '../src/goals.js';

function scene(mode){
  const events=[],m=new Match({data:{completed:[]},challenges:{record(){}},award(){return 0;}},kind=>events.push(kind));
  m.start(mode);m.state=STATES.PLAYING;
  for(const p of m.players)Object.assign(p,{x:640,y:500,vx:0,vy:0});
  for(const entry of m.bots)entry.ai.update=()=>({});
  return {m,events};
}
for(const mode of ['duel','2v2','training'])for(const side of [-1,1]){
  test(`${mode} cage ${side} : devant, tangence et entrée partielle sans score ni effet`,()=>{
    for(const depth of [-40,-28.5,0,14,28.5,56.9]){
      const {m,events}=scene(mode),mouth=side<0?m.arena.goalLeft:m.arena.goalRight;
      Object.assign(m.ball,{x:mouth+side*depth,y:281,vx:0,vy:0});
      m.update(C.step);
      assert.equal(m.state,STATES.PLAYING,`depth=${depth}`);assert.deepEqual(m.score,{player:0,bot:0});assert.equal(m.goalEffect,null);assert.equal(events.includes('goal'),false);
    }
  });
  for(const speed of [500,C.maxBallSpeed])test(`${mode} cage ${side} : trajectoire ${speed}, validation uniquement après entrée complète`,()=>{
    const {m,events}=scene(mode),mouth=side<0?m.arena.goalLeft:m.arena.goalRight,depth=goalEntryDepth(m.ball.r,m.arena);
    Object.assign(m.ball,{x:mouth-side*(m.ball.r+5),y:265,vx:side*speed,vy:0});
    let steps=0;
    while(m.state===STATES.PLAYING&&steps++<90){
      const before=side*(m.ball.x-mouth);m.update(C.step);
      const penetration=side*(m.ball.x-mouth);
      if(penetration<depth){assert.deepEqual(m.score,{player:0,bot:0});assert.equal(m.goalEffect,null);assert.equal(events.includes('goal'),false);}
      else{assert.ok(before<depth);assert.ok(penetration-m.ball.r>0);assert.ok(m.ball.y-m.ball.r>m.arena.goalScoreTop);assert.ok(m.ball.y+m.ball.r<m.arena.goalScoreBottom);assert.equal(m.state,STATES.GOAL_SCORED);}
    }
    assert.equal(m.state,STATES.GOAL_SCORED);assert.equal(events.filter(x=>x==='goal').length,1);assert.equal(m.score[side<0?'bot':'player'],mode==='training'?0:1);assert.equal(m.boundaryRecoveries,0);
  });
}
