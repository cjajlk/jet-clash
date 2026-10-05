import test from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG as C } from '../src/config.js';
import { solids } from '../src/arena.js';
import { createBall, integrateBall } from '../src/ball.js';
import { createPlayer } from '../src/player.js';
import { collideBall, movePlayer } from '../src/physics.js';
import { goalScorer } from '../src/goals.js';

test('Arena V2 : aucune ancienne rampe, plateforme ou obstacle central',()=>{
  for(const kind of ['platform','obstacle','goalPocket'])assert.equal(solids.some(s=>s.kind===kind),false);
  assert.equal(solids.filter(s=>s.kind==='goalBase').length,2);
  assert.equal(solids.filter(s=>s.kind==='goalRoof').length,2);
});
for(const side of ['left','right']){
  const left=side==='left', line=left?C.goalLeft:C.goalRight, sign=left?-1:1;
  test(`Arena V2 ${side} : ballon aérien entre librement dans la cage`,()=>{
    const b=createBall();Object.assign(b,{x:line-sign*80,y:(C.goalTop+C.goalBottom)/2,vx:sign*500,vy:0});
    let scored=false;for(let i=0;i<80;i++){integrateBall(b,C.step);collideBall(b,solids);if(goalScorer(b)){scored=true;break;}}
    assert.ok(scored);assert.ok(left?b.x<C.goalLeft:b.x>C.goalRight);
  });
  test(`Arena V2 ${side} : Fluid peut entrer dans le but en l'air`,()=>{
    const p=createPlayer('fluid');Object.assign(p,{x:line-sign*90,y:(C.goalTop+C.goalBottom)/2,vx:sign*260,vy:0,grounded:false});
    for(let i=0;i<80;i++)movePlayer(p,solids,C.step);
    assert.ok(left?p.x<C.goalLeft:p.x>C.goalRight);
    assert.ok(p.x>=p.w/2&&p.x<=C.width-p.w/2);
  });
  test(`Arena V2 ${side} : montant haut ferme la zone au-dessus de l'ouverture`,()=>{
    const b=createBall();Object.assign(b,{x:line-sign*70,y:C.goalTop-b.r-4,vx:sign*500,vy:0});
    for(let i=0;i<60;i++){integrateBall(b,C.step);collideBall(b,solids);}
    assert.ok(left?b.x>=C.goalLeft-b.r-1:b.x<=C.goalRight+b.r+1);
    assert.equal(goalScorer(b),null);
  });
  test(`Arena V2 ${side} : socle ferme la zone sous l'ouverture`,()=>{
    const p=createPlayer('fluid');Object.assign(p,{x:line-sign*70,y:C.goalBottom+p.h/2+1,vx:sign*260,vy:0});
    for(let i=0;i<80;i++)movePlayer(p,solids,C.step);
    assert.ok(left?p.x>=C.goalLeft-p.w/2-1:p.x<=C.goalRight+p.w/2+1);
  });
}
test('Arena V2 : plafond physique au niveau configuré sous HUD',()=>{
  const p=createPlayer('fluid');Object.assign(p,{x:640,y:C.ceiling+p.h/2+2,vy:-500,grounded:false,footX:0,footY:-1});
  movePlayer(p,solids,.05);assert.equal(p.y,C.ceiling+p.h/2);assert.equal(p.contactSurface,'ceiling');
  const b=createBall();Object.assign(b,{x:640,y:C.ceiling+b.r+2,vy:-500});collideBall(b,solids);assert.ok(b.y>=C.ceiling+b.r);
});
