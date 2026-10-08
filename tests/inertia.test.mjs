import test from 'node:test';
import assert from 'node:assert/strict';
import {CONFIG as C} from '../src/config.js';
import {createPlayer,drive} from '../src/player.js';
import {createBall,integrateBall} from '../src/ball.js';
import {collideBall,hitPlayer} from '../src/physics.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
test('airborne impulse retains momentum for both characters and both directions',()=>{
 for(const skin of ['fluid','heavy'])for(const sign of [-1,1]){
 const p=createPlayer(skin);p.vx=560*sign;drive(p,{axis:sign},C.step);near(p.vx,560*sign);
 drive(p,{axis:-sign},C.step);near(p.vx,(560-C.airAcceleration*C.step)*sign);
 }
});
test('neutral air drag decays smoothly without clipping the impulse',()=>{
 const p=createPlayer('fluid');p.vx=560;for(let i=0;i<120;i++)drive(p,{},C.step);
 near(p.vx,560*Math.exp(-C.airHorizontalDrag));
});
test('walking remains capped and releasing movement stops progressively',()=>{
 const p=createPlayer('fluid');p.grounded=true;for(let i=0;i<120;i++)drive(p,{axis:1},C.step);near(p.vx,C.runSpeed);
 for(let i=0;i<30;i++)drive(p,{},C.step);assert.ok(p.vx>0&&p.vx<12);
});
test('directional flip keeps its extra speed on the following frame',()=>{
 const p=createPlayer('fluid');p.vx=C.runSpeed;drive(p,{axis:1,directionX:1,directionY:0,jump:true},C.step);
 near(p.vx,C.runSpeed+C.airImpulseSpeed);drive(p,{axis:1,jump:false},C.step);near(p.vx,C.runSpeed+C.airImpulseSpeed);
});
test('ball airborne horizontal damping is independent of timestep',()=>{
 const speeds=[];for(const steps of [60,120,240]){const b=createBall();b.vx=200;b.vy=-500;for(let i=0;i<steps;i++)integrateBall(b,1/steps);speeds.push(b.vx);}
 for(const v of speeds)near(v,200*Math.exp(-.13));
});
test('flat floor rolling slows without reversal or jitter',()=>{
 const b=createBall();Object.assign(b,{x:640,y:C.floor-b.r,vx:100,vy:0});let speed=b.vx;
 for(let i=0;i<240;i++){integrateBall(b,C.step);collideBall(b,[]);assert.ok(b.vx>=0&&b.vx<=speed);speed=b.vx;near(b.y,C.floor-b.r);near(b.vy,0);}
 assert.ok(b.vx<6);
});
test('ordinary contact conserves horizontal momentum and loses collision energy',()=>{
 const p=createPlayer('fluid');Object.assign(p,{x:500,y:300,vx:200});const b=createBall();Object.assign(b,{x:p.x+p.w/2+b.r-1,y:p.y,vx:-100,vy:0});const momentum=b.vx+p.vx/.18,energy=b.vx**2+p.vx**2/.18;
 assert.equal(hitPlayer(b,p),true);near(b.vx+p.vx/.18,momentum);assert.ok(b.vx**2+p.vx**2/.18<energy);
});

test('sustained horizontal jet is bounded and retains its momentum after release',()=>{for(const sign of [-1,1]){const p=createPlayer('fluid');p.footX=-sign;p.footY=0;for(let i=0;i<240;i++)drive(p,{boost:true,axis:sign,directionX:sign,directionY:0},C.step);near(p.vx,sign*(C.runSpeed+C.airImpulseSpeed));drive(p,{},C.step);near(Math.abs(p.vx),(C.runSpeed+C.airImpulseSpeed)*Math.exp(-C.airHorizontalDrag*C.step));}});
