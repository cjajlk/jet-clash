import test from 'node:test';
import assert from 'node:assert/strict';
import {createPlayer,drive} from '../src/player.js';
import {GamepadInput,stickDirection} from '../src/gamepad-input.js';
import {BallInput} from '../src/ball-input.js';
import {TouchInput,combineTouch} from '../src/touch-input.js';
import {controlSettings} from '../src/control-settings.js';
import {CONFIG as C} from '../src/config.js';
const target={addEventListener(){}};
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
function inputs(){const pad={index:0,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({value:0}))},source={getGamepads:()=>[pad]};return {pad,padInput:new GamepadInput(target,source),ballInput:new BallInput(target,source,()=>{}),touch:new TouchInput()};}
const vectors=[[1,0],[-1,0],[0,1],[0,-1],[.7,.7],[.7,-.7],[-.7,.7],[-.7,-.7],[.75,.1],[-.2,.6]];
for(const [x,y] of vectors)test(`vol commun ${x},${y} : départ, maintien, inversion, relâchement et carburant`,()=>{
 const {pad,padInput,touch}=inputs(),a=createPlayer('fluid'),b=createPlayer('fluid');Object.assign(a,{vx:80,vy:-70});Object.assign(b,a);
 touch.start(1,'move',x,y);touch.start(2,'boost');pad.buttons[controlSettings.gamepad.boost].value=1;
 const offset=controlSettings.gamepad.movementStick==='left'?0:2;
 for(let tick=0;tick<120;tick++){
  const sign=tick<30?1:-1;pad.axes[offset]=tick<60?x*sign:0;pad.axes[offset+1]=tick<60?y*sign:0;
  if(tick<60)touch.move(1,x*sign,y*sign);else touch.move(1,0,0);
  if(tick===90){touch.end(2);pad.buttons[controlSettings.gamepad.boost].value=0;}
  drive(a,padInput.read(),C.step);drive(b,combineTouch({},touch.read()),C.step);
  assert.deepEqual(a,b,`tick ${tick}`);
 }
});
test('zone morte radiale : petites diagonales valides, bruit et valeurs invalides rejetés',()=>{
 assert.equal(stickDirection(.1,.1),null);assert.equal(stickDirection(NaN,1),null);assert.equal(stickDirection(1,Infinity),null);
 assert.ok(stickDirection(.14,.14));near(stickDirection(.75,.1).y/stickDirection(.75,.1).x,.1/.75);
});
test('tir manette : angles obliques identiques au tactile, même au relâchement',()=>{
 for(const [x,y] of vectors){const {pad,ballInput,touch}=inputs(),offset=controlSettings.gamepad.movementStick==='left'?0:2;pad.axes[offset]=x;pad.axes[offset+1]=y;pad.buttons[controlSettings.gamepad.shoot].value=1;touch.start(1,'shoot',x,y);let a=ballInput.read(0),b=touch.read();near(a.aimX,b.aimX);near(a.aimY,b.aimY);pad.axes[offset]=pad.axes[offset+1]=0;pad.buttons[controlSettings.gamepad.shoot].value=0;touch.end(1);a=ballInput.read(0);b=touch.read();near(a.aimX,b.aimX);near(a.aimY,b.aimY);assert.equal(a.aimIntent,true);}
});
test('joystick tactile propriétaire du vol, tir opposé indépendant et reprise clavier',()=>{
 const t=new TouchInput(),base={axis:-1,directionX:-1,directionY:0};t.start(1,'move',1,0);t.start(2,'boost');t.start(3,'shoot',-1,0);
 const input=combineTouch(base,t.read()),p=createPlayer('fluid');drive(p,input,C.step);assert.ok(p.vx>0);assert.equal(input.aimX,-1);assert.equal(p.controlX,1);
 t.move(1,0,0);const neutral=combineTouch(base,t.read());assert.equal(neutral.axis,0);assert.equal(neutral.directionX,0);
 t.end(1);assert.equal(combineTouch(base,t.read()).directionX,-1);
});
test('poussée commune immédiate, inertie existante conservée, sol toujours vertical',()=>{
 const p=createPlayer('fluid');drive(p,{boost:true,directionX:1,directionY:0},C.step);near(p.vx,C.thrust*C.step);near(p.vy,C.gravity*C.step);
 const ground=createPlayer('fluid');ground.grounded=true;drive(ground,{boost:true,directionX:1},C.step);near(ground.vx,0);near(ground.vy,(C.gravity-C.thrust)*C.step);
 const fast=createPlayer('fluid');fast.vx=600;drive(fast,{boost:true,axis:1,directionX:1},C.step);near(fast.vx,600);
});
