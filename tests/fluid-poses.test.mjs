import test from 'node:test';
import assert from 'node:assert/strict';
import { FLUID_AIR_ASSETS, resolveFluidVisualPose, Renderer } from '../src/renderer.js';
import { CONFIG as C } from '../src/config.js';
import { createPlayer } from '../src/player.js';
import { createBall } from '../src/ball.js';

const expectedAssets=[
  'fluid_air_idle',
  'fluid_air_up',
  'fluid_air_diagonal_up',
  'fluid_air_horizontal',
  'fluid_air_turn',
  'fluid_ceiling',
  'fluid_air_diagonal_down',
  'fluid_air_dash',
];

test('Fluid : les huit assets aériens sont référencés',()=>{
  assert.deepEqual(FLUID_AIR_ASSETS,expectedAssets);
});

function air(overrides={}){
  return Object.assign(createPlayer('fluid'),{
    grounded:false,
    contactSurface:null,
    footX:0,
    footY:1,
    controlX:1,
    controlY:0,
    facing:1,
    vx:0,
    vy:0,
    flipIntent:0,
    impulseCooldown:0,
  },overrides);
}

test('Fluid : mapping aérien stable et lisible',()=>{
  const state={};
  assert.equal(resolveFluidVisualPose(air({footX:0,footY:.98}),state).key,'fluid_air_idle');
  assert.equal(resolveFluidVisualPose(air({footX:.714,footY:.7,vy:-200}),state).key,'fluid_air_up');
  assert.equal(resolveFluidVisualPose(air({footX:.917,footY:.4}),state).key,'fluid_air_diagonal_up');
  assert.equal(resolveFluidVisualPose(air({footX:1,footY:0}),state).key,'fluid_air_horizontal');
  assert.equal(resolveFluidVisualPose(air({footX:.917,footY:-.4}),state).key,'fluid_air_diagonal_down');
  assert.equal(resolveFluidVisualPose(air({footX:0,footY:-.84,flipIntent:C.airFlipIntentTime}),state).key,'fluid_air_turn');
  assert.equal(resolveFluidVisualPose(air({footX:0,footY:1,impulseCooldown:C.airImpulseCooldown-.01}),state).key,'fluid_air_dash');
  assert.equal(resolveFluidVisualPose(Object.assign(createPlayer('fluid'),{grounded:true,contactSurface:'ceiling',footX:0,footY:-1}),state).key,'fluid_ceiling');
});

test('Fluid : le flip animé effectue une rotation complète sans mutation physique',()=>{
  const p=air(),rest=resolveFluidVisualPose(p,{}).rotation;
  p.flipTimer=C.airFlipDuration/2;p.flipX=1;
  const pose=resolveFluidVisualPose(p,{});
  assert.ok(Math.abs(pose.rotation-rest-Math.PI)<1e-9);
  assert.equal(p.flipTimer,C.airFlipDuration/2);
});

test('Fluid : hystérésis visuelle et miroir sans mutation physique',()=>{
  const state={};
  const p=air({footX:.917,footY:.4,vx:140,vy:-30});
  const first=resolveFluidVisualPose(p,state);
  const before={x:p.x,y:p.y,vx:p.vx,vy:p.vy,w:p.w,h:p.h};
  const second=resolveFluidVisualPose(Object.assign(p,{footX:.9,footY:.44}),state);
  assert.equal(first.key,'fluid_air_diagonal_up');
  assert.equal(second.key,'fluid_air_diagonal_up');
  assert.equal(first.flip,false);
  assert.equal(resolveFluidVisualPose(air({footX:-.917,footY:.4}),state).flip,true);
  assert.ok(Math.abs(first.rotation)<=.16);
  assert.deepEqual({x:p.x,y:p.y,vx:p.vx,vy:p.vy,w:p.w,h:p.h},before);
});

test('Fluid : le rendu conserve les sprites terrestres et n’altère pas la physique',()=>{
  const noop=()=>{},ctx=new Proxy({createLinearGradient:()=>({addColorStop:noop})},{get:(o,k)=>o[k]??noop,set:(o,k,v)=>(o[k]=v,true)});
  const renderer=new Renderer({getContext:()=>ctx}),draws=[];
  renderer.camera.update=()=>({zoom:1,x:640,y:360});
  renderer.fit=(key,x,y,w,h,...rest)=>draws.push({key,x,y,w,h,kind:'fit'});
  renderer.drawSprite=(key,x,y,w,h,...rest)=>draws.push({key,x,y,w,h,kind:'draw'});
  renderer.goalRamp=()=>{};
  const m={player:createPlayer('fluid'),bot:createPlayer('heavy'),ball:createBall()};
  Object.assign(m.player,{x:300,y:606,vx:0,vy:0,grounded:true,boosting:false});
  renderer.render(m);
  assert.ok(draws.some(d=>d.key==='fluid_idle'||d.key==='fluid_walk'||d.key==='fluid_sprint'||d.key==='fluid_jetpack'));
  assert.ok(draws.some(d=>d.key==='fluid_walk'&&d.w===86*C.fluidVisualScale&&d.h===96*C.fluidVisualScale));
  draws.length=0;
  Object.assign(m.player,{grounded:false,footX:.917,footY:.4});
  renderer.render(m);
  assert.ok(draws.some(d=>d.key==='fluid_air_diagonal_up'&&d.w===86*C.fluidVisualScale&&d.h===96*C.fluidVisualScale));
  assert.equal(m.player.x,300);
  assert.equal(m.player.y,606);
  assert.equal(m.player.vx,0);
  assert.equal(m.player.vy,0);
});
