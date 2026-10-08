import test from 'node:test';
import assert from 'node:assert/strict';
import {createPlayer,drive} from '../src/player.js';
import {TouchInput,combineTouch} from '../src/touch-input.js';
import {prepareAerialShot} from '../src/aerial-shots.js';
import {CONFIG as C} from '../src/config.js';
import {GamepadInput} from '../src/gamepad-input.js';
test('DOS retourne une seule fois sans saut, flip ou consommation',()=>{
  const p=createPlayer('fluid');p.facing=1;const readiness={jump:p.jumpReady,impulse:p.impulseReady,flip:p.flipReady};
  drive(p,{backPose:true},C.step);assert.equal(p.facing,-1);assert.equal(p.flipTimer,0);assert.equal(p.jumpReady,readiness.jump);assert.equal(p.impulseReady,readiness.impulse);assert.equal(p.flipReady,readiness.flip);assert.equal(p.fuel,100);
  for(let i=0;i<20;i++)drive(p,{backPose:true,axis:1},C.step);assert.equal(p.facing,-1);assert.ok(p.vx>0);assert.equal(p.flipTimer,0);
  drive(p,{axis:1},C.step);assert.equal(p.facing,1);
});
test('DOS maintenu permet un tir or avec déplacement opposé sans flip',()=>{
  const p=Object.assign(createPlayer('fluid'),{x:500,y:300,facing:1,impulseReady:false});drive(p,{backPose:true},C.step);
  const b={x:550,y:300,r:C.ballRadius*C.ballScale};const shot=prepareAerialShot(p,b,{backPose:true,jump:true,axis:-1});assert.equal(shot.type,'gold');assert.equal(p.flipTimer,0);
});
test('DOS tactile indépendant et relâchement propre',()=>{
  const t=new TouchInput();assert.equal(t.start(1,'back'),true);assert.equal(t.read().backPose,true);assert.equal(combineTouch({rotate:false},t.read()).rotate,false);t.end(1);assert.equal(t.read().backPose,false);
});
test('R1/RB active DOS sans activer le bouton FLIP',()=>{
  const buttons=Array.from({length:16},()=>({value:0,pressed:false}));buttons[5]={value:1,pressed:true};
  const input=new GamepadInput({addEventListener(){}},{getGamepads:()=>[{index:0,id:'DualSense',connected:true,mapping:'standard',buttons,axes:[0,0,0,0]}]});
  assert.equal(input.read().backPose,true);assert.equal(input.read().rotate,false);buttons[5]={value:0,pressed:false};assert.equal(input.read().backPose,false);
});
