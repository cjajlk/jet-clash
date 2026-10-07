import test from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG as C } from '../src/config.js';
import { createBall, integrateBall } from '../src/ball.js';
import { createPlayer } from '../src/player.js';
import { solids } from '../src/arena.js';
import { circlePolygonContact } from '../src/collision-shapes.js';
import { movePlayer, collideBall } from '../src/physics.js';
import { goalScorer, goalEntryDepth } from '../src/goals.js';

const middle=(C.goalTop+C.goalBottom)/2;
test('cages actuelles : verticales, hautes et rampes symétriques',()=>{
  const ball=createBall();
  assert.equal(C.goalLeft,C.width-C.goalRight);
  assert.ok(C.goalBottom-C.goalTop>=ball.r*4);
  assert.equal(C.goalRampBottom,C.goalBottom);
  const bases=solids.filter(s=>s.kind==='goalBase');assert.equal(bases.length,2);
  const left=bases.find(s=>s.side==='left'),right=bases.find(s=>s.side==='right');
  assert.ok(left.vertices.length>4);assert.ok(right.vertices.length>4);
  assert.deepEqual(right.vertices,[...left.vertices].map(p=>({x:C.width-p.x,y:p.y})).reverse());
  assert.deepEqual(right.surface,left.surface.map(p=>({x:C.width-p.x,y:p.y})));
});
for(const side of ['left','right']){
  const left=side==='left',line=left?C.goalLeft:C.goalRight,sign=left?-1:1;
  test(`cage ${side} : le ballon doit réellement pénétrer avant le but`,()=>{
    const b=createBall();b.y=middle;b.x=line+sign*5;assert.equal(goalScorer(b),null);
    b.x=line+sign*goalEntryDepth(b.r);assert.equal(goalScorer(b),left?'bot':'player');
  });
  test(`cage ${side} : aucun but hors de l'ouverture verticale`,()=>{
    const b=createBall();b.x=line+sign*60;b.y=C.goalTop+b.r-1;assert.equal(goalScorer(b),null);
    b.y=C.goalBottom-b.r+1;assert.equal(goalScorer(b),null);
  });
  test(`cage ${side} : personnage aérien admis dans la profondeur`,()=>{
    const p=createPlayer('fluid');Object.assign(p,{x:line-sign*30,y:middle,vx:sign*300,grounded:false});
    for(let i=0;i<50;i++)movePlayer(p,solids,C.step);
    assert.ok(left?p.x<line:p.x>line);
  });
}


for(const side of [-1,1])test(`rampe ${side} : balle basse sans but, entrée levée avec but`,()=>{
  const line=side<0?C.goalLeft:C.goalRight,b=createBall();
  // Begin on the flat pitch, outside the curved approach.
  Object.assign(b,{x:line-side*220,y:C.floor-b.r,vx:side*500,vy:0});
  let touchedRamp=false;
  const ramp=solids.find(s=>s.kind==='goalBase'&&s.side===(side<0?'left':'right'));
  for(let i=0;i<120;i++){
    integrateBall(b,C.step);
    if(circlePolygonContact(b,ramp.vertices))touchedRamp=true;
    collideBall(b,solids);
    assert.equal(goalScorer(b),null,'cette approche basse ne doit pas marquer');
  }
  assert.ok(touchedRamp,'la simulation doit rencontrer la rampe');
  Object.assign(b,{x:line-side*20,y:middle,vx:side*500,vy:0});
  let scorer=null;
  for(let i=0;i<60&&!scorer;i++){
    integrateBall(b,C.step);collideBall(b,solids);scorer=goalScorer(b);
    if(side*(b.x-line)<goalEntryDepth(b.r))assert.equal(scorer,null);
  }
  assert.equal(scorer,side<0?'bot':'player');
});
