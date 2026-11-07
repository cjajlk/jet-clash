import test from 'node:test';
import assert from 'node:assert/strict';
import {BallControl} from '../src/ball-control.js';
import {createPlayer} from '../src/player.js';
import {createBall} from '../src/ball.js';
import {prepareAerialShot,applyAerialShot,markSpecialShot} from '../src/aerial-shots.js';
import {ContactFeedback} from '../src/contact-feedback.js';
import {Match} from '../src/match.js';
import {ProfileStore} from '../src/profile-store.js';
import {scheduleEffect} from '../src/gameplay-audio.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
function fixture(type){const p=Object.assign(createPlayer('fluid'),{x:500,y:300}),b=Object.assign(createBall(),{x:type==='gold'?450:500,y:type==='gold'?300:368,vx:0,vy:0}),c=new BallControl();return {p,b,c};}
for(const type of ['gold','purple']){
 test(`${type} : variantes distinctes, direction visée et puissance de charge inchangées`,()=>{
  for(const charge of [.1,.7]){const {p,b,c}=fixture(type);c.update(p,b,{shoot:true,aimIntent:true,aimX:1,aimY:-1},charge);c.update(p,b,{aimIntent:true,aimX:1,aimY:-1},0);assert.equal(b.shotMode,'aimed');assert.equal(b.shotColor,type);near(Math.hypot(b.vx,b.vy),520+480*charge/.7);near(b.vx,-b.vy);assert.equal(p.vx,0);assert.equal(p.vy,0);}
  const {p,b}=fixture(type),shot=prepareAerialShot(p,b,{jump:true,axis:type==='gold'?1:0});applyAerialShot(p,b,shot);assert.equal(b.shotMode,'impulse');near(Math.hypot(b.vx,b.vy),type==='gold'?950:800);near(Math.hypot(p.vx,p.vy),180);
 });
 test(`${type} : contact annoncé seulement à portée réelle, résultat distingue TIR et SAUT`,()=>{
  const {p,b,c}=fixture(type),m={state:'PLAYING',player:p,ball:b,control:c},f=new ContactFeedback();const initial=JSON.stringify([p,b]);f.update(m,1/120);assert.equal(f.specialType,type);assert.equal(f.resultLabel,null);assert.equal(JSON.stringify([p,b]),initial);
  b.x=900;f.update(m,1/120);assert.equal(f.specialType,null);assert.equal(f.contact,false);
  markSpecialShot(b,type,'aimed');f.update(m,1/120);assert.match(f.resultLabel,/VISÉ/);markSpecialShot(b,type,'impulse');f.update(m,1/120);assert.match(f.resultLabel,/IMPULSION/);b.shotTimer=.4;f.update(m,1/120);assert.equal(f.resultLabel,null);
 });
 test(`${type} : tir différé reclassé sur le contact final, sans ancienne couleur`,()=>{
  const {p,b,c}=fixture(type);c.pendingShot={vx:600,vy:-100,type};c.pendingShotTime=.2;
  b.x=900;const before={vx:b.vx,vy:b.vy};c.finishContacts(b,p,false);assert.deepEqual({vx:b.vx,vy:b.vy},before);assert.ok(c.pendingShot);
  p.grounded=true;b.x=540;b.y=300;c.finishContacts(b,p,true);assert.equal(b.shotColor,undefined);assert.equal(b.vx,600);assert.equal(b.vy,-100);assert.equal(c.pendingShot,null);
 });
 test(`${type} : un tir ordinaire remplace la traînée spéciale précédente`,()=>{
  const {p,b,c}=fixture(type);markSpecialShot(b,type,'aimed');p.grounded=true;b.x=540;b.y=300;c.update(p,b,{shoot:true,aimIntent:true,aimX:1},.1);c.update(p,b,{aimIntent:true,aimX:1},0);assert.equal(b.shotTimer,0);assert.equal(b.shotColor,null);assert.equal(b.shotMode,null);assert.deepEqual(b.shotTrail,[]);
 });
}
test('un tir différé adopte la nouvelle surface spéciale et garde sa direction',()=>{
 const {p,b,c}=fixture('purple');c.pendingShot={vx:600,vy:-200,type:'gold'};c.pendingShotTime=.2;c.finishContacts(b,p,true);assert.equal(b.shotColor,'purple');assert.equal(b.shotMode,'aimed');assert.equal(b.vx,600);assert.equal(b.vy,-200);
});
test('reset et nouveau match effacent la variante précédente',()=>{
 const m=new Match(new ProfileStore({getItem(){},setItem(){}}));m.start('training');markSpecialShot(m.ball,'gold','aimed');m.resetTrainingBall();assert.equal(m.ball.shotMode,null);markSpecialShot(m.ball,'purple','impulse');m.start('training');assert.equal(m.ball.shotMode,null);
});
test('or et violet ajoutent des sons distincts, frappe ordinaire inchangée',()=>{
 function sounds(type){const notes=[],value={setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}};
 const ctx={currentTime:0,createOscillator:()=>({frequency:{setValueAtTime(x){notes.push(x);},exponentialRampToValueAtTime(){}},connect(){},disconnect(){},start(){},stop(){}}),createGain:()=>({gain:value,connect(){},disconnect(){}})};scheduleEffect(ctx,{},'shot',{power:.5,type});return notes;}
 const normal=sounds(null),gold=sounds('gold'),purple=sounds('purple');assert.equal(normal.length,3);assert.deepEqual(gold.slice(0,3),normal);assert.deepEqual(purple.slice(0,3),normal);assert.notEqual(gold[3],purple[3]);
});
