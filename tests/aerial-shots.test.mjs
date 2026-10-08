import test from 'node:test';
import assert from 'node:assert/strict';
import {createPlayer} from '../src/player.js';
import {createBall} from '../src/ball.js';
import {prepareAerialShot,applyAerialShot,aerialContact} from '../src/aerial-shots.js';
import {Match} from '../src/match.js';
import {ProfileStore} from '../src/profile-store.js';
import {CONFIG as C} from '../src/config.js';
import {setBackPose} from '../src/player.js';
const scene=()=>({p:Object.assign(createPlayer('fluid'),{x:500,y:300,impulseReady:false,flipReady:false}),b:Object.assign(createBall(),{x:450,y:300})});
test('dos plat tolérant : balle au niveau du haut/bas du jetpack',()=>{
  for(const y of [275,325]){const {p,b}=scene();b.y=y;b.x=440;assert.equal(aerialContact(p,b),'back');}
});
test('DOS + saut neutre déclenche le tir or adapté à JetClash',()=>{
  const {p,b}=scene();p.facing=-1;setBackPose(p,{backPose:true});
  assert.equal(prepareAerialShot(p,b,{backPose:true,jump:true}).type,'gold');
});
test('tactile : vecteur de déplacement prioritaire sur les zéros de la manette',()=>{
  const {p,b}=scene();assert.equal(prepareAerialShot(p,b,{jump:true,directionX:0,directionY:0,touchDirection:{x:1,y:0}}).type,'gold');
});
test('saut légèrement avant le contact : intention consommée une seule fois',()=>{
  const {p,b}=scene();b.x=410;assert.equal(prepareAerialShot(p,b,{jump:true,axis:1}),null);p.jumpHeld=true;b.x=450;
  assert.equal(prepareAerialShot(p,b,{jump:true,axis:1},.08).type,'gold');assert.equal(prepareAerialShot(p,b,{jump:true,axis:1}),null);
});
test('saut après rebond : contact récent proche, pas de tir à distance',()=>{
  const {p,b}=scene();prepareAerialShot(p,b,{});b.x=p.x-(p.w/2+b.r+16.5);b.y=p.y+p.h/2+17;
  assert.equal(prepareAerialShot(p,b,{jump:true,axis:1},.08).type,'gold');
  const other=scene();prepareAerialShot(other.p,other.b,{});other.b.x=200;assert.equal(prepareAerialShot(other.p,other.b,{jump:true,axis:1},.08),null);
});
test('intention expirée ne déclenche rien, contact frontal ne donne pas or',()=>{
  const {p,b}=scene();b.x=410;prepareAerialShot(p,b,{jump:true,axis:1});p.jumpHeld=true;b.x=450;assert.equal(prepareAerialShot(p,b,{jump:true,axis:1},.3),null);
  b.x=560;p.jumpHeld=false;assert.equal(prepareAerialShot(p,b,{jump:true,axis:-1}),null);
});
test('dos : réarme une fois par contact, pas de tir automatique, nouvel enchaînement après séparation',()=>{
  const {p,b}=scene();assert.equal(aerialContact(p,b),'back');assert.equal(prepareAerialShot(p,b,{}),null);assert.equal(p.impulseReady,true);
  p.impulseReady=false;p.flipReady=false;prepareAerialShot(p,b,{});assert.equal(p.impulseReady,false);
  b.x=300;prepareAerialShot(p,b,{});b.x=450;prepareAerialShot(p,b,{});assert.equal(p.impulseReady,true);
});
test('or : dos + saut dirigé loin du ballon, recul et effet',()=>{
  const {p,b}=scene();const shot=prepareAerialShot(p,b,{jump:true,axis:1});assert.equal(shot.type,'gold');applyAerialShot(p,b,shot);assert.equal(b.vx,-950);assert.equal(b.shotColor,'gold');assert.ok(p.vx>0);assert.equal(p.impulseReady,false);assert.equal(prepareAerialShot(p,b,{jump:true,axis:1}),null);
});
test('violet : pieds + saut neutre, direction du contact et effet',()=>{
  const {p,b}=scene();b.x=p.x;b.y=368;const shot=prepareAerialShot(p,b,{jump:true});assert.equal(shot.type,'purple');applyAerialShot(p,b,shot);assert.equal(b.vy,800);assert.equal(b.shotColor,'purple');assert.ok(p.vy<0);
});
test('pas de tir spécial au sol, à distance, devant ou avec mauvais geste',()=>{
  for(const kind of ['ground','far','front','wrong']){const {p,b}=scene();if(kind==='ground')p.grounded=true;if(kind==='far')b.x=300;if(kind==='front')b.x=550;assert.equal(prepareAerialShot(p,b,{jump:true,axis:kind==='wrong'?-1:1}),null);}
});
test('dos orienté : miroir et rotation à 90 degrés',()=>{
  const {p,b}=scene();p.facing=-1;b.x=550;assert.equal(aerialContact(p,b),'back');p.facing=1;p.footX=1;p.footY=0;b.x=500;b.y=365;assert.equal(aerialContact(p,b),'back');
});
for(const mode of ['duel','2v2','training'])test(`${mode} : tir or intégré sans double flip, reset entre matchs`,()=>{
  const m=new Match(new ProfileStore({getItem(){},setItem(){}}));m.start(mode);m.state='PLAYING';Object.assign(m.player,{x:500,y:300,footX:0,footY:1,grounded:false,contactSurface:null,impulseReady:false,flipReady:false});Object.assign(m.ball,{x:450,y:300,vx:0,vy:0});
  m.update(C.step,{jump:true,axis:1});assert.equal(m.ball.shotColor,'gold');assert.ok(m.ball.vx<0);assert.equal(m.player.flipTimer,0);m.start(mode);assert.equal(m.ball.shotTimer,0);assert.equal(m.player.aerialContactLatched,false);
});
