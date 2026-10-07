import test from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG as C } from '../src/config.js';
import { goalEntryDepth, goalScorer } from '../src/goals.js';
import { createBall } from '../src/ball.js';
import { Match, STATES as S } from '../src/match.js';
import { Renderer } from '../src/renderer.js';
const make=()=>{const m=new Match({award(){throw Error('no reward expected');}});m.start();m.state=S.PLAYING;return m;};
for(const side of ['left','right']){
 const left=side==='left',line=left?C.goalLeft:C.goalRight,sign=left?-1:1,scorer=left?'bot':'player';
 test(`${side}: seuil profond, ouverture verticale et score sans faux but`,()=>{
  const b=createBall(),depth=goalEntryDepth(b.r);b.y=(C.goalTop+C.goalBottom)/2;
  assert.ok(depth>b.r);assert.ok(depth+b.r<=Math.min(C.goalLeft,C.width-C.goalRight));
  for(const d of [1,b.r,depth-.01]){b.x=line+sign*d;assert.equal(goalScorer(b),null);}
  b.x=line+sign*depth;assert.equal(goalScorer(b),scorer);
  for(const y of [C.goalTop+b.r,C.goalBottom-b.r]){b.y=y;assert.equal(goalScorer(b),null);}
  const m=make();Object.assign(m.ball,{x:line+sign*(depth-1),y:245,vx:0,vy:0});m.update(C.step);
  assert.deepEqual(m.score,{player:0,bot:0});assert.equal(m.goalEffect,null);
  Object.assign(m.ball,{x:line+sign*(depth+1),y:245,vx:0,vy:0});m.update(C.step);
  assert.equal(m.score[scorer],1);assert.equal(m.goalEffect.side,side);assert.equal(m.goalEffect.remaining,C.goalEffectDuration);
  const ball={...m.ball},score={...m.score},players=[{...m.player},{...m.bot}];
  assert.equal(m.goal(scorer),false);
  m.update(C.goalEffectDuration/2);assert.deepEqual(m.ball,ball);assert.deepEqual(m.score,score);
  assert.deepEqual([m.player,m.bot],players);assert.ok(m.goalEffect.remaining>0);
  m.update(C.goalEffectDuration/2+.01);assert.equal(m.goalEffect,null);assert.deepEqual(m.ball,ball);
  m.update(C.goalPause);assert.equal(m.state,S.PRE_ROUND);assert.equal(m.ball.x,640);
 });
 test(`${side}: Canvas pulse discret, couleur et clipping de la cage`,()=>{
  const calls=[];const ctx=new Proxy({}, {get:(o,k)=>o[k]??((...args)=>calls.push([k,...args])),set:(o,k,v)=>{o[k]=v;calls.push([k,v]);return true;}});
  const r=Object.create(Renderer.prototype);r.ctx=ctx;r.goalPulse(null);assert.equal(calls.length,0);
  r.goalPulse({side,x:line+sign*50,y:245,remaining:C.goalEffectDuration});
  assert.ok(calls.some(c=>c[0]==='fillStyle'&&c[1]===(left?'#4ad8ff':'#ff5c88')));
  assert.ok(calls.some(c=>c[0]==='rect'&&c[1]===(left?0:C.goalRight)&&c[3]===165));
  assert.ok(calls.some(c=>c[0]==='arc'));assert.equal(calls.at(-1)[0],'restore');
 });
}
test('entraînement : même seuil, effet sans score, remise à zéro habituelle et Fluid intact',()=>{
 const m=make();m.start('training');Object.assign(m.player,{x:640,y:C.floor-m.player.h/2});const p={...m.player};
 Object.assign(m.ball,{x:C.goalRight+goalEntryDepth(m.ball.r)+1,y:245,vx:0,vy:0});
 m.update(C.step);assert.equal(m.goalEffect.side,'right');assert.deepEqual(m.score,{player:0,bot:0});assert.equal(m.reward,0);
 assert.equal(m.ball.x,640);assert.equal(m.player.x,p.x);assert.equal(m.player.y,p.y);assert.equal(m.state,S.PLAYING);
 m.menu();assert.equal(m.goalEffect,null);m.start();assert.equal(m.goalEffect,null);
});
