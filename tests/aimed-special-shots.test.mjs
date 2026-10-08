import test from 'node:test';
import assert from 'node:assert/strict';
import {BallControl} from '../src/ball-control.js';
import {createPlayer} from '../src/player.js';
import {createBall} from '../src/ball.js';
import {Match} from '../src/match.js';
import {ProfileStore} from '../src/profile-store.js';
for(const [type,x,y] of [['gold',450,300],['purple',500,368]]){
  test(`${type} : TIR seul vise une diagonale libre sans saut`,()=>{
    const p=Object.assign(createPlayer('fluid'),{x:500,y:300,grounded:false,footX:0,footY:1}),b=Object.assign(createBall(),{x,y});
    const c=new BallControl();c.update(p,b,{shoot:true,aimIntent:true,aimX:1,aimY:-1},.7);
    c.update(p,b,{shoot:false,aimIntent:true,aimX:1,aimY:-1},0);
    assert.equal(b.shotColor,type);assert.ok(b.vx>0&&b.vy<0);assert.ok(Math.abs(b.vx+b.vy)<1e-6);assert.ok(b.shotTimer>0);assert.equal(p.jumpHeld,false);assert.equal(p.flipTimer,0);
  });
}
test('tir frontal et au sol restent normaux',()=>{
  for(const grounded of [false,true]){
    const p=Object.assign(createPlayer('fluid'),{x:500,y:300,grounded}),b=Object.assign(createBall(),{x:540,y:300});const c=new BallControl();
    c.update(p,b,{shoot:true,aimIntent:true,aimX:1,aimY:0},.7);c.update(p,b,{shoot:false},0);assert.equal(b.shotColor,undefined);
  }
});
for(const type of ['gold','purple'])test(`${type} : direction choisie conservée à travers la séparation du tireur`,()=>{
  const m=new Match(new ProfileStore({getItem(){},setItem(){}}));m.start('training');
  Object.assign(m.player,{x:600,y:290,grounded:false,contactSurface:null});Object.assign(m.ball,{x:type==='gold'?550:600,y:type==='gold'?290:357,vx:0,vy:0});
  const input={shoot:true,aimIntent:true,aimX:1,aimY:-1};m.update(1/120,input);m.update(1/120,{...input,shoot:false});
  assert.equal(m.ball.shotColor,type);assert.ok(m.ball.vx>0&&m.ball.vy<0);assert.ok(m.control.specialShotGrace>0);
  for(let i=0;i<35;i++)m.update(1/120,{});assert.equal(m.control.specialShotGrace,0);
});
