import test from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG as C } from '../src/config.js';
import { Match, STATES as S } from '../src/match.js';
import { ProfileStore } from '../src/profile-store.js';
import { createBall, integrateBall } from '../src/ball.js';
import { createPlayer } from '../src/player.js';
import { collideBall, movePlayer } from '../src/physics.js';
import { solids } from '../src/arena.js';
import { goalScorer } from '../src/goals.js';
const middle=(C.goalTop+C.goalBottom)/2;
function match(){const m=new Match(new ProfileStore({getItem:()=>null,setItem(){}}));m.start();for(let i=0;i<362;i++)m.update(C.step);assert.equal(m.state,S.PLAYING);return m;}
function flight(ball,steps=60){let bounced=false;const direction=Math.sign(ball.vx);for(let i=0;i<steps;i++){integrateBall(ball,C.step);collideBall(ball,solids);assert.equal(goalScorer(ball),null);if(Math.sign(ball.vx)===-direction)bounced=true;}return bounced;}
for(const side of ['left','right']){
  const left=side==='left',line=left?C.goalLeft:C.goalRight,sign=left?-1:1;
  test(`balle roulant au sol vers ${side} : rebond, aucun but`,()=>{
    const b=createBall();Object.assign(b,{x:line-sign*70,y:C.floor-b.r,vx:sign*250,vy:0});assert.ok(flight(b));
  });
  test(`balle frappée dans l’ouverture ${side} : vrai but, remise en jeu, score unique`,()=>{
    const m=match(),scorer=left?'bot':'player';Object.assign(m.ball,{x:line-sign*35,y:middle,vx:sign*500,vy:-45});
    for(let i=0;i<35&&m.state===S.PLAYING;i++)m.update(C.step);
    assert.equal(m.state,S.GOAL_SCORED);assert.equal(m.score[scorer],1);assert.equal(m.goal(scorer),false);
    for(let i=0;i<230;i++)m.update(C.step);
    assert.equal(m.state,S.PRE_ROUND);assert.equal(m.ball.x,640);assert.equal(m.score[scorer],1);
    for(let i=0;i<365;i++)m.update(C.step);
    assert.equal(m.state,S.PLAYING);assert.equal(m.score[scorer],1);
  });
  test(`rebond sous cage ${side} : aucun but à l’ancienne hauteur`,()=>{
    const b=createBall();Object.assign(b,{x:line-sign*50,y:570,vx:sign*350,vy:-50});assert.ok(flight(b,30));
    Object.assign(b,{x:left?40:1240,y:600});assert.equal(goalScorer(b),null);
  });
  test(`bords haut et bas ${side} : tangence ou chevauchement ne marquent pas`,()=>{
    for(const y of [C.goalTop+C.ballRadius-3,C.goalTop+C.ballRadius,C.goalBottom-C.ballRadius,C.goalBottom-C.ballRadius+3]){
      const b=createBall();Object.assign(b,{x:line+sign*(b.r+2),y,vx:sign*250,vy:0});assert.equal(goalScorer(b),null);collideBall(b,solids);assert.equal(goalScorer(b),null);
    }
    const b=createBall();Object.assign(b,{x:line-sign*40,y:C.goalBottom+4,vx:sign*400,vy:0});assert.ok(flight(b,25));
  });
  test(`Fluid et Heavy ne traversent pas le socle ${side}`,()=>{
    for(const skin of ['fluid','heavy']){
      const p=createPlayer(skin);Object.assign(p,{x:line-sign*25,y:C.floor-p.h/2,vx:sign*C.runSpeed,vy:0});
      for(let i=0;i<60;i++){p.vx=sign*C.runSpeed;movePlayer(p,solids,C.step);}
      if(left)assert.ok(p.x-p.w/2>=line);else assert.ok(p.x+p.w/2<=line);
    }
  });
}
test('géométrie symétrique, 25 % au-dessus du sol et ouverture haute de 120 px',()=>{
  assert.equal(C.floor-C.goalBottom,(C.floor-100)*.25);assert.equal(C.goalBottom-C.goalTop,120);
  const bases=solids.filter(r=>r.kind==='goalBase');assert.equal(bases.length,2);
  assert.equal(bases[0].w,bases[1].w);assert.equal(bases[0].y,bases[1].y);assert.equal(bases[0].h,bases[1].h);
  assert.equal(bases[0].x,C.width-bases[1].x-bases[1].w);
});
