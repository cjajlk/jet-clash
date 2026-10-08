import test from 'node:test';import assert from 'node:assert/strict';
import {createBall,limitBallSpeed} from '../src/ball.js';import {CONFIG as C} from '../src/config.js';
import {Match,STATES} from '../src/match.js';import {ProfileStore} from '../src/profile-store.js';
test('speed limit preserves direction and ordinary velocity',()=>{const b=createBall();Object.assign(b,{vx:1600,vy:1200});limitBallSpeed(b);assert.ok(Math.abs(Math.hypot(b.vx,b.vy)-C.maxBallSpeed)<1e-8);assert.ok(Math.abs(b.vx/b.vy-4/3)<1e-8);Object.assign(b,{vx:200,vy:-100});limitBallSpeed(b);assert.equal(b.vx,200);assert.equal(b.vy,-100);});
test('match caps velocity after contacts finish in the same tick',()=>{const m=new Match(new ProfileStore({getItem:()=>null,setItem:()=>{}}));m.start('training');m.control.finishContacts=()=>{m.ball.vx=1600;m.ball.vy=1200;};m.update(C.step,{});assert.ok(Math.hypot(m.ball.vx,m.ball.vy)<=C.maxBallSpeed+1e-8);});
