import test from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG as C } from '../src/config.js';
import { solids } from '../src/arena.js';
import { createBall, integrateBall } from '../src/ball.js';
import { createPlayer } from '../src/player.js';
import { collideBall, movePlayer, ballOutsideArena } from '../src/physics.js';
import { goalScorer } from '../src/goals.js';

for(const side of ['left','right']){
  const left=side==='left',line=left?C.goalLeft:C.goalRight,sign=left?-1:1;
  test(`${side} : poche de but reste dans les limites extérieures`,()=>{
    const p=createPlayer('fluid');Object.assign(p,{x:line-sign*60,y:(C.goalTop+C.goalBottom)/2,vx:sign*800});
    for(let i=0;i<120;i++)movePlayer(p,solids,C.step);
    assert.ok(p.x>=p.w/2&&p.x<=C.width-p.w/2);
  });
  test(`${side} : balle dans ouverture ne rebondit pas sur l'ancienne ligne de but`,()=>{
    const b=createBall();Object.assign(b,{x:line-sign*5,y:(C.goalTop+C.goalBottom)/2,vx:sign*500});
    integrateBall(b,C.step);collideBall(b,solids);assert.equal(Math.sign(b.vx),sign);
  });
  test(`${side} : balle derrière ligne mais trop haute ne marque pas`,()=>{
    const b=createBall();Object.assign(b,{x:line+sign*60,y:C.goalTop+b.r-2});assert.equal(goalScorer(b),null);
  });
}
test('limites plafond/sol utilisent C.ceiling et C.floor',()=>{
  const r=C.ballRadius*C.ballScale;
  assert.equal(ballOutsideArena({x:640,y:C.ceiling-r-1,r}),true);
  assert.equal(ballOutsideArena({x:640,y:C.floor+r+1,r}),true);
  assert.equal(ballOutsideArena({x:640,y:C.ceiling-r/2,r}),false);
});
