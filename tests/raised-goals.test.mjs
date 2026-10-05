import test from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG as C } from '../src/config.js';
import { createBall } from '../src/ball.js';
import { createPlayer } from '../src/player.js';
import { solids } from '../src/arena.js';
import { movePlayer, collideBall } from '../src/physics.js';
import { goalScorer } from '../src/goals.js';

const middle=(C.goalTop+C.goalBottom)/2;
test('cages V2 : verticales, hautes, symétriques et sans rampe',()=>{
  const ball=createBall();
  assert.equal(C.goalLeft,C.width-C.goalRight);
  assert.ok(C.goalBottom-C.goalTop>=ball.r*4);
  assert.equal(C.goalRampBottom,C.goalBottom);
  assert.equal(solids.some(s=>s.vertices),false);
  assert.equal(solids.filter(s=>s.kind==='goalBase').length,2);
});
for(const side of ['left','right']){
  const left=side==='left',line=left?C.goalLeft:C.goalRight,sign=left?-1:1;
  test(`cage ${side} : le ballon doit réellement pénétrer avant le but`,()=>{
    const b=createBall();b.y=middle;b.x=line+sign*5;assert.equal(goalScorer(b),null);
    b.x=line+sign*36;assert.equal(goalScorer(b),left?'bot':'player');
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


test('Arène V3 : le seuil bas impose une vraie levée avant entrée dans le but',()=>{
  const b=createBall();
  // Au sol, même dirigée vers le but, la balle reste sous l'ouverture utile.
  Object.assign(b,{x:C.goalRight-20,y:C.floor-b.r,vx:700,vy:0});
  for(let i=0;i<60;i++){b.x+=b.vx*C.step;collideBall(b,solids);}
  assert.ok(b.x<=C.goalRight-b.r+1,'la base du but doit bloquer une balle au sol');
  assert.equal(goalScorer(b),null);
  // Une balle réellement levée au milieu de l'ouverture peut entrer et marquer.
  Object.assign(b,{x:C.goalRight+b.r,y:(C.goalTop+C.goalBottom)/2,vx:0,vy:0});
  assert.equal(goalScorer(b),'player');
});
