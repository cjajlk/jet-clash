import test from 'node:test';
import assert from 'node:assert/strict';
import {CONFIG as C} from '../src/config.js';
import {goalScorer,goalEntryDepth} from '../src/goals.js';
import {createBall} from '../src/ball.js';
import {Match,STATES as S} from '../src/match.js';
import {solids} from '../src/arena.js';

for(const side of ['left','right']){
  const left=side==='left',line=left?C.goalLeft:C.goalRight,sign=left?-1:1,scorer=left?'bot':'player';
  const ballAt=y=>{const b=createBall();Object.assign(b,{x:line+sign*(goalEntryDepth(b.r)+1),y,vx:0,vy:0});return b;};
  test(`${side} : anciennes bandes au-dessus et sous le filet ne marquent plus`,()=>{
    for(const y of [C.goalScoreTop+createBall().r-.1,C.goalScoreBottom-createBall().r+.1]){const b=ballAt(y);assert.equal(goalScorer(b),null);}
  });
  test(`${side} : ballon entier dans le filet, sans toucher ses bords`,()=>{
    const b=ballAt((C.goalScoreTop+C.goalScoreBottom)/2);assert.equal(goalScorer(b),scorer);
    for(const y of [C.goalScoreTop+b.r,C.goalScoreTop+b.r-.1,C.goalScoreBottom-b.r,C.goalScoreBottom-b.r+.1]){b.y=y;assert.equal(goalScorer(b),null);}
    for(const y of [C.goalScoreTop+b.r+.1,C.goalScoreBottom-b.r-.1]){b.y=y;assert.equal(goalScorer(b),scorer);}
    b.x=line+sign*(goalEntryDepth(b.r)-.1);assert.equal(goalScorer(b),null);
  });
  for(const mode of ['duel','2v2','training'])test(`${mode} ${side} : mêmes limites, aucun score ni effet au-dessus/en dessous`,()=>{
    const events=[],recorded=[],m=new Match({data:{completed:[]},award(){throw Error('no finish reward');},challenges:{record(kind){recorded.push(kind);}}},kind=>events.push(kind));
    m.start(mode);m.state=S.PLAYING;recorded.length=0;
    for(const entry of m.bots)Object.assign(entry.body,{x:640,y:400,vx:0,vy:0});
    for(const y of [C.goalScoreTop+createBall().r-.1,C.goalScoreBottom-createBall().r+.1]){
      Object.assign(m.ball,ballAt(y));m.update(C.step);
      assert.equal(m.state,S.PLAYING);assert.deepEqual(m.score,{player:0,bot:0});assert.equal(m.goalEffect,null);assert.equal(m.boundaryRecoveries,0);
    }
    assert.deepEqual(events,[]);assert.deepEqual(recorded,[]);
    Object.assign(m.ball,ballAt((C.goalScoreTop+C.goalScoreBottom)/2),{x:line+sign*(m.ball.r+12-1),vx:sign*500});m.lastTouch=m.player;m.update(C.step);
    assert.deepEqual(events,['goal']);assert.equal(m.goalEffect.side,side);
    assert.equal(m.score[scorer],mode==='training'?0:1);
    assert.equal(m.state,mode==='training'?S.PLAYING:S.GOAL_SCORED);
    assert.deepEqual(recorded,mode!=='training'&&!left?['goals']:[]);
  });
}
test('zone de score resserrée sans déplacer les cages ni les rampes physiques',()=>{
  assert.equal(C.goalTop,176);assert.equal(C.goalBottom,386);assert.equal(C.goalRampBottom,386);
  assert.ok(C.goalScoreTop>C.goalTop&&C.goalScoreBottom<C.goalBottom);
  assert.ok(C.goalScoreBottom-C.goalScoreTop>createBall().r*2);
  for(const base of solids.filter(s=>s.kind==='goalBase'))assert.equal(Math.min(...base.vertices.map(p=>p.y)),386);
});
