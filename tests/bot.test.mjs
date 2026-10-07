import test from 'node:test';
import assert from 'node:assert/strict';
import { Bot } from '../src/bot.js';
import { createPlayer, drive } from '../src/player.js';
import { createBall } from '../src/ball.js';
import { CONFIG as C, DIFFICULTIES } from '../src/config.js';
import { solids } from '../src/arena.js';
import { movePlayer, collideBall, hitPlayer } from '../src/physics.js';
const body=values=>Object.assign(createPlayer('heavy'),{x:850,y:450,grounded:true},values);
const ball=values=>Object.assign(createBall(),{x:700,y:450,vx:0,vy:0},values);
test('bot : anticipe une balle rapide vers sa cage et dégage vers la gauche',()=>{
 const ai=new Bot('elite',()=>.5),p=body({x:1080,y:245}),b=ball({x:970,y:245,vx:600});
 assert.equal(ai.update(p,b,C.step).axis,1);
 ai.reset();Object.assign(b,{x:1040,vx:0});assert.equal(ai.update(p,b,C.step).axis,-1);
});
test('bot : freine avant de dépasser une balle libre',()=>{
 const ai=new Bot('elite',()=>.5),p=body({x:800,vx:-300}),b=ball({x:725});
 assert.equal(ai.update(p,b,C.step).axis,1);
});
test('bot : relâche le saut puis utilise le double saut pour une balle haute',()=>{
 const ai=new Bot('elite',()=>.5),p=body({x:750}),b=ball({y:170});
 assert.equal(ai.update(p,b,C.step).jump,true);
 Object.assign(p,{grounded:false,jumpHeld:true,vy:-20});assert.equal(ai.update(p,b,.1).jump,false);
 p.jumpHeld=false;assert.equal(ai.update(p,b,.1).jump,true);
 p.impulseReady=false;assert.equal(ai.update(p,b,.1).jump,false);
});
test('bot : garde le carburant pour une interception utile',()=>{
 for(const [values,expected] of [[{y:170},true],[{y:560},false],[{x:100,y:170},false]]){
  const ai=new Bot('elite',()=>.5),p=body({x:750,grounded:false,vy:0});
  assert.equal(ai.update(p,ball(values),C.step).boost,expected);
  ai.reset();p.fuel=5;assert.equal(ai.update(p,ball(values),C.step).boost,false);
 }
});
test('bot : conserve la réaction des difficultés, sans modifier les acteurs',()=>{
 for(const level of Object.keys(DIFFICULTIES)){
  const ai=new Bot(level,()=>.5),p=body(),b=ball(),before=structuredClone({p,b});
  const input=ai.update(p,b,C.step);assert.deepEqual({p,b},before);
  assert.equal(ai.update(p,b,DIFFICULTIES[level].reaction/2),input);
  ai.reset();assert.equal(ai.wait,0);assert.deepEqual(ai.input,{axis:0,jump:false,boost:false});
 }
});
test('bot : rejoint réellement une balle libre et la pousse vers le camp adverse',()=>{
 const ai=new Bot('elite',()=>.5),p=body({x:850,y:C.floor-C.playerHeight/2}),b=ball({x:700,y:C.floor-28.5});
 let cleared=false;
 for(let i=0;i<600;i++){
  drive(p,ai.update(p,b,C.step),C.step);movePlayer(p,solids,C.step);
  if(hitPlayer(b,p)&&b.vx<-50){cleared=true;break;}
  collideBall(b,solids);
 }
 assert.equal(cleared,true);
});
