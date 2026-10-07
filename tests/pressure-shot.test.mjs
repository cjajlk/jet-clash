import test from 'node:test';
import assert from 'node:assert/strict';
import { Match, STATES } from '../src/match.js';
import { ProfileStore } from '../src/profile-store.js';
import { CONFIG as C } from '../src/config.js';
import { hitPlayer } from '../src/physics.js';
function duel(){
  const m=new Match(new ProfileStore({getItem(){return null;},setItem(){}}));m.start();m.state=STATES.PLAYING;
  Object.assign(m.player,{x:450,y:C.floor-C.playerHeight/2,vx:0,vy:0,grounded:true,facing:1});
  Object.assign(m.ball,{x:497.5,y:C.floor-m.ball.r,vx:0,vy:0});
  Object.assign(m.bot,{x:545,y:C.floor-C.playerHeight/2,vx:0,vy:0,grounded:true,facing:-1});
  // Test fixture only: sustained opposing inputs, production AI is unchanged.
  m.ai.update=()=>({axis:-1});return m;
}
function charge(m,n){for(let i=0;i<n;i++)m.update(C.step,{axis:1,shoot:true,aimX:1,aimY:-1,aimIntent:true});}
test('duel : sans frappe, aucune éjection automatique ni réengagement',()=>{const m=duel();for(let i=0;i<120;i++)m.update(C.step,{axis:1});assert.ok(m.ball.y>C.floor-m.ball.r-5);assert.equal(m.boundaryRecoveries,0);assert.equal(m.score.player+m.score.bot,0);});
test('duel : charge et chevrons continus malgré les contacts de Heavy',()=>{const m=duel();for(let i=0;i<100;i++){m.update(C.step,{axis:1,shoot:true,aimX:1,aimY:-1,aimIntent:true});assert.ok(m.control.available);assert.ok(m.control.indicator);assert.ok(m.control.charging);}assert.equal(m.control.charge,.7);});
test('duel : frappe normale diagonale nette puis dégagement réel vers le haut',()=>{const m=duel();charge(m,4);m.update(C.step,{axis:1,aimX:1,aimY:-1,aimIntent:true});assert.ok(m.ball.vx>400&&m.ball.vy<-450);assert.equal(m.control.indicator,null);for(let i=0;i<35;i++)m.update(C.step,{axis:1});assert.ok(m.ball.y<C.floor-m.ball.r-30,`y=${m.ball.y}`);assert.equal(m.boundaryRecoveries,0);});
test('duel : frappe chargée supérieure, plafonnée et sans déplacement de balle par impulsion',()=>{const a=duel(),b=duel();charge(a,2);charge(b,90);a.update(C.step,{aimY:-1,aimIntent:true});const normal=Math.hypot(a.ball.vx,a.ball.vy);b.control.update(b.player,b.ball,{aimX:1,aimY:-1,aimIntent:true},C.step,b.bot);const before={x:b.ball.x,y:b.ball.y};b.control.finishContacts(b.ball);assert.deepEqual({x:b.ball.x,y:b.ball.y},before);assert.ok(Math.hypot(b.ball.vx,b.ball.vy)>normal*1.35);assert.ok(Math.hypot(b.ball.vx,b.ball.vy)<=C.maxBallSpeed);});
test('duel : Heavy reste solide après la frappe',()=>{const m=duel();charge(m,3);m.update(C.step,{aimX:1,aimIntent:true});Object.assign(m.ball,{x:m.bot.x-30,y:m.bot.y,vx:700,vy:0});assert.ok(hitPlayer(m.ball,m.bot));assert.ok(m.ball.vx<700);assert.ok(m.ball.x<=m.bot.x-m.bot.w/2-m.ball.r);});
test('duel : éloignement conserve la précharge mais ne frappe jamais à distance',()=>{
  const m=duel();charge(m,15);Object.assign(m.ball,{x:750,y:300,vx:0,vy:0});
  m.update(C.step,{shoot:true,aimX:1});assert.equal(m.control.owned,false);
  assert.equal(m.control.charging,true);assert.ok(m.control.indicator);
  m.update(C.step,{aimX:1,aimIntent:true});assert.equal(m.control.charging,false);assert.ok(m.control.pendingShot);
  for(let i=0;i<35;i++)m.update(C.step);
  assert.equal(m.control.pendingShot,null);assert.equal(m.control.indicator,null);
  assert.equal(m.ball.vx,0);assert.equal(m.boundaryRecoveries,0);
});
