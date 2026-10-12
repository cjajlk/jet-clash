import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveFluidAirOrientation,coherentAirVisual} from '../src/renderer.js';
import {createPlayer,drive} from '../src/player.js';
import {CONFIG as C} from '../src/config.js';
const limit=Math.PI/10;
test('ordinary Fluid flight stays upright for jump, vertical and horizontal boost without mutating physics',()=>{
 for(const [x,y,boost] of [[0,0,false],[0,-1,true],[1,0,true],[-1,0,true],[.7,-.7,true]]){
 const p=createPlayer('fluid'),cache={};p.y=300;
 for(let frame=0;frame<120;frame++){drive(p,{axis:x,directionX:x,directionY:y,boost},1/60);const before=structuredClone(p);const visual=resolveFluidAirOrientation(p,cache,1/60);assert.ok(Math.abs(visual.rotation)<=limit+1e-10);assert.deepEqual(p,before);}
 if(x===0)assert.ok(Math.abs(cache.lean)<.001);else assert.equal(Math.sign(cache.lean),Math.sign(x));
 }
});
test('neutral stick eases gradually back to upright',()=>{
 const p=createPlayer('fluid'),cache={};for(let i=0;i<120;i++){drive(p,{axis:1,directionX:1,directionY:0,boost:true},1/60);resolveFluidAirOrientation(p,cache);}
 const start=cache.lean;drive(p,{axis:0,boost:true},1/60);resolveFluidAirOrientation(p,cache);assert.ok(cache.lean>0&&cache.lean<=start);
 for(let i=0;i<180;i++){drive(p,{axis:0,boost:true},1/60);resolveFluidAirOrientation(p,cache);}assert.ok(Math.abs(cache.lean)<.001);
});
test('technical flip, back pose, impulse and ceiling retain their existing full orientation',()=>{
 for(const state of [{flipTimer:C.airFlipDuration/2},{rotateHeld:true},{backPoseHeld:true},{impulseCooldown:C.airImpulseCooldown},{contactSurface:'ceiling'}]){
 const p=Object.assign(createPlayer('fluid'),{footX:-1,footY:0},state),before=structuredClone(p);assert.deepEqual(resolveFluidAirOrientation(p,{}),coherentAirVisual(p));assert.deepEqual(p,before);
 }
});
