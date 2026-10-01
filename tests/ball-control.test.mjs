import test from 'node:test';
import assert from 'node:assert/strict';
import { BallControl, BALL_CONTROL as T, aimDirection } from '../src/ball-control.js';
import { BallInput } from '../src/ball-input.js';
import { createPlayer } from '../src/player.js';
import { createBall } from '../src/ball.js';
import { Match, STATES } from '../src/match.js';
import { ProfileStore } from '../src/profile-store.js';
import { CONFIG as C } from '../src/config.js';
import { resolveFluidContactIndicator } from '../src/renderer.js';
import { resolveBallContactZone, drawBallContactZone } from '../src/ball-control.js';
import { Renderer } from '../src/renderer.js';
import { circlePolygonContact } from '../src/collision-shapes.js';
function setup(){const p=createPlayer('fluid'),b=createBall(),c=new BallControl();Object.assign(p,{x:300,y:606,grounded:true});Object.assign(b,{x:339,y:625,vx:0,vy:0});return {p,b,c};}
function tick(s,input={},dt=C.step){s.c.update(s.p,s.b,input,dt);}
test('contrôle : acquisition au contact devant Fluid sans déplacement de balle',()=>{const s=setup(),before={...s.b};tick(s);assert.ok(s.c.owned);assert.deepEqual(s.b,before);});
test('contrôle : zone de contact centralisée légèrement plus généreuse',()=>{const s=setup();s.b.x=355;tick(s);assert.ok(s.c.owned);assert.equal(C.ballContactScale,1.22);});
test('gabarits : balle un peu plus grosse et hitbox perso inchangée',()=>{const p=createPlayer('fluid'),b=createBall();assert.equal(C.ballScale,2.5);assert.equal(b.r,C.ballRadius*C.ballScale);assert.equal(p.w,38);assert.equal(p.h,76);assert.equal(p.w*p.h,2888);});
test('gabarits : l’ouverture des cages reste compatible avec le diamètre du ballon',()=>{assert.ok(C.goalRight-C.goalLeft>2*C.ballRadius*C.ballScale);});
test('zone ballon : contact frontal, arrière et éloigné réagissent correctement',()=>{const p=createPlayer('fluid'),zone=()=>resolveBallContactZone(p).vertices,b=createBall();Object.assign(p,{x:300,y:606,grounded:true,footX:0,footY:1,facing:1});Object.assign(b,{x:352,y:596,vx:0,vy:0});assert.ok(circlePolygonContact(b,zone()));b.x=265;assert.ok(circlePolygonContact(b,zone()));b.x=220;assert.equal(circlePolygonContact(b,zone()),false);b.x=410;assert.equal(circlePolygonContact(b,zone()),false);});
test('zone ballon : tourne avec Fluid à 90° et 180° avec miroir',()=>{const p=createPlayer('fluid');Object.assign(p,{x:300,y:300,grounded:false,footX:1,footY:0,facing:1});const a=resolveBallContactZone(p);assert.ok(a.vertices.some(v=>v.y>330));assert.ok(a.vertices.some(v=>v.y<270));Object.assign(p,{footX:0,footY:-1,facing:1});const b=resolveBallContactZone(p);assert.ok(b.vertices.some(v=>v.x<270));assert.ok(b.vertices.some(v=>v.y<270));Object.assign(p,{footX:0,footY:1,facing:1});const c=resolveBallContactZone(p);Object.assign(p,{facing:-1});const d=resolveBallContactZone(p);for(let i=0;i<c.vertices.length;i++)assert.ok(Math.abs((c.vertices[i].x-p.x)+(d.vertices[i].x-p.x))<1e-6);});
test('zone ballon : le debug visuel n’altère pas la physique',()=>{const p=createPlayer('fluid'),ball=createBall();Object.assign(p,{x:300,y:606,grounded:true,footX:0,footY:1,facing:1});Object.assign(ball,{x:352,y:596,vx:0,vy:0});const before={x:ball.x,y:ball.y,vx:ball.vx,vy:ball.vy};const calls=[];const ctx=new Proxy({}, {get:(_,prop)=>prop==='save'||prop==='restore'||prop==='beginPath'||prop==='closePath'||prop==='fill'||prop==='stroke'?()=>{}:(...args)=>{calls.push([prop,...args]);}});drawBallContactZone(ctx,p);assert.deepEqual({x:ball.x,y:ball.y,vx:ball.vx,vy:ball.vy},before);assert.ok(calls.some(([name])=>name==='moveTo'));});
test('contrôle : pas de capture distante, derrière ou à vitesse incompatible',()=>{for(const change of [{x:390},{x:260},{vx:900}]){const s=setup();Object.assign(s.b,change);tick(s);assert.equal(s.c.owned,false);}});
test('contrôle : perte par distance, vitesse et changement de face',()=>{for(const change of [{x:410},{vx:800},{x:280}]){const s=setup();tick(s);Object.assign(s.b,change);tick(s);assert.equal(s.c.owned,false);}});
test('contrôle : poussée bornée, inertie conservée et aucune attraction',()=>{const s=setup();s.p.vx=200;tick(s);assert.equal(s.b.x,339);assert.ok(s.b.vx>0&&s.b.vx<=T.pushAcceleration*C.step);s.b.vx=300;tick(s);assert.equal(s.b.vx,300);s.b.x=365;s.b.vx=0;tick(s);assert.equal(s.b.vx,0);});
test('contrôle : touche légère amortie sans aspiration ni téléportation',()=>{const s=setup();s.b.vx=180;tick(s);assert.ok(s.c.owned);assert.ok(s.b.vx<180);assert.equal(s.b.y,625);});
for(const [name,x,y]of [['droite',1,0],['diagonale',1,-1],['haut',0,-1],['bas',1,1]])test(`visée ${name} : direction normalisée et chevrons`,()=>{const s=setup();tick(s,{aimX:x,aimY:y});assert.deepEqual(s.c.aim,aimDirection(x,y));assert.ok(s.c.indicator);assert.ok(Math.abs(Math.hypot(s.c.aim.x,s.c.aim.y)-1)<1e-9);});
test('visée : deadzone, absence, option désactivable et perte de contrôle',()=>{const s=setup();tick(s,{aimX:.1});assert.equal(s.c.indicator,null);tick(s,{aimX:1});s.c.showAim=false;assert.equal(s.c.indicator,null);s.c.showAim=true;s.c.release();assert.equal(s.c.indicator,null);});
function shot(duration,input={aimX:1}){const s=setup();tick(s,{...input,shoot:true},duration);tick(s,input);return s;}
test('frappe normale au relâchement, possession libérée et anti-récapture',()=>{const s=shot(C.step);assert.ok(s.b.vx>=520&&s.b.vx<540);assert.equal(s.c.owned,false);assert.equal(s.c.indicator,null);s.b.vx=0;tick(s);assert.equal(s.c.owned,false);});
test('charge progressive, plafond 0,7 s, frappe chargée clairement supérieure',()=>{const short=shot(C.step),half=shot(.35),full=shot(.7),over=shot(2);assert.ok(half.b.vx>short.b.vx);assert.ok(full.b.vx>short.b.vx*1.8);assert.equal(full.b.vx,1000);assert.equal(over.b.vx,full.b.vx);});
test('charge maintenue ne frappe pas automatiquement et n’ajoute aucune vitesse',()=>{const s=setup();for(let i=0;i<200;i++)tick(s,{shoot:true,aimY:-1});assert.equal(s.c.charge,.7);assert.ok(s.c.owned);assert.equal(s.b.vy,0);});
test('frappe sans stick : orientation actuelle, aucun auto-aim',()=>{for(const facing of [-1,1]){const s=setup();s.p.facing=facing;s.b.x=s.p.x+39*facing;tick(s,{shoot:true});tick(s);assert.equal(Math.sign(s.b.vx),facing);assert.equal(s.b.vy,0);}});
test('frappe suit la visée au relâchement, pas celle au début de charge',()=>{const s=setup();tick(s,{shoot:true,aimX:1});tick(s,{aimY:-1});assert.equal(s.b.vx,0);assert.ok(s.b.vy<0);});
test('collision forte et Heavy libèrent la balle et annulent la charge',()=>{for(const heavy of [false,true]){const s=setup();tick(s,{shoot:true});s.c.impact({vx:heavy?0:-500,vy:0},s.b,heavy);assert.equal(s.c.owned,false);assert.equal(s.c.charging,false);tick(s);assert.equal(s.b.vx,0);}});
test('collision faible conserve le contrôle',()=>{const s=setup();tick(s);s.c.impact({vx:20,vy:0},s.b,false);assert.ok(s.c.owned);});
test('pause/déconnexion annule la frappe sans tirer',()=>{const s=setup();tick(s,{shoot:true});tick(s,{cancelShot:true});assert.equal(s.b.vx,0);assert.equal(s.c.owned,false);});
function match(){const m=new Match(new ProfileStore({getItem(){return null;},setItem(){}}));m.start();m.state=STATES.PLAYING;return m;}
test('conduite en mouvement : charge complète, contact souple et balle non fixée',()=>{const m=match();Object.assign(m.player,{x:250,y:606,vx:0,vy:0,grounded:true});Object.assign(m.ball,{x:289,y:625,vx:0,vy:0});const gaps=[];for(let i=0;i<90;i++){m.update(C.step,{axis:.35,shoot:true,aimY:-1});gaps.push(m.ball.x-m.player.x);assert.ok(m.control.owned);}assert.equal(m.control.charge,.7);assert.ok(m.ball.x>320);assert.ok(Math.max(...gaps)-Math.min(...gaps)>.01);m.update(C.step,{aimY:-1});assert.ok(m.ball.vy<-900);});
for(const side of [-1,1])test(`frappe contrôlée vers cage ${side} : vrai but unique et limites conservées`,()=>{const m=match();Object.assign(m.player,{x:side===1?1100:180,y:448,vx:0,vy:0,facing:side});Object.assign(m.bot,{x:640,y:200});Object.assign(m.ball,{x:m.player.x+39*side,y:448,vx:0,vy:0});m.update(C.step,{shoot:true,aimX:side});m.update(C.step,{aimX:side});for(let i=0;i<80&&m.state===STATES.PLAYING;i++)m.update(C.step);assert.equal(m.score.player+m.score.bot,1);assert.equal(m.boundaryRecoveries,0);});
for(const boost of [false,true])test(`contrôle aérien et frappe avec jetpack=${boost}`,()=>{const m=match();Object.assign(m.player,{x:600,y:260,vx:0,vy:-100,grounded:false});Object.assign(m.ball,{x:639,y:260,vx:0,vy:-100});m.update(C.step,{boost,shoot:true,aimY:-1});assert.ok(m.control.owned);m.update(C.step,{boost,aimY:-1});assert.equal(m.control.owned,false);assert.ok(m.ball.vy<-400);assert.equal(m.boundaryRecoveries,0);});
test('Heavy conserve son contact physique et casse la possession en match',()=>{const m=match();Object.assign(m.player,{x:600,y:260});Object.assign(m.ball,{x:639,y:260});Object.assign(m.bot,{x:670,y:260,vx:-200});m.update(C.step,{shoot:true});assert.equal(m.control.owned,false);assert.ok(m.ball.vx<0);});
test('but et réengagement effacent charge et chevrons sans double score',()=>{const m=match();m.control.owned=true;m.control.charging=true;Object.assign(m.ball,{x:1220,y:448});m.update(C.step);assert.equal(m.score.player,1);assert.equal(m.control.owned,false);m.update(C.step);assert.equal(m.score.player,1);m.prepare();assert.equal(m.control.charge,0);});
test('sécurité hors-arène pendant possession : aucun point',()=>{const m=match();m.control.owned=true;m.ball.y=700;m.update(C.step);assert.equal(m.state,STATES.PRE_ROUND);assert.equal(m.score.player+m.score.bot,0);assert.equal(m.control.owned,false);});
class Target{listeners={};addEventListener(n,f){(this.listeners[n]??=[]).push(f);}emit(n,props={}){for(const f of this.listeners[n]||[])f({target:{tagName:'CANVAS'},preventDefault(){},...props});}}
function inputs(){const target=new Target(),pad={index:0,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({value:0}))};let pads=[pad];const b=new BallInput(target,{getGamepads:()=>pads},()=>{});return {target,pad,b,disconnect(){pads=[];}};}
test('PS5 : stick principal, L2 et indépendance Croix/R2',()=>{const s=inputs();s.pad.axes[2]=1;s.pad.axes[0]=-1;s.pad.axes[1]=-1;s.pad.buttons[6].value=1;const i=s.b.read(0);assert.equal(i.aimIntent,false);assert.equal(i.aimX,0);assert.equal(i.aimY,0);assert.equal(i.shoot,true);s.pad.buttons[6].value=0;s.pad.buttons[0].value=1;s.pad.buttons[7].value=1;assert.equal(s.b.read(0).shoot,false);});
test('clavier IJKL et F : diagonale, maintien, relâchement, sans touches réservées',()=>{const s=inputs();for(const code of ['KeyI','KeyL','KeyF'])s.target.emit('keydown',{code});let i=s.b.read();assert.ok(i.aimX>0&&i.aimY<0&&i.shoot);s.target.emit('keyup',{code:'KeyF'});assert.equal(s.b.read().shoot,false);s.target.emit('blur');s.b.read();s.target.emit('keydown',{code:'Space'});assert.equal(s.b.read().shoot,false);});
test('déconnexion pendant charge et perte de focus ne déclenchent pas une frappe',()=>{const s=inputs();s.pad.buttons[2].value=1;s.b.read();s.disconnect();assert.ok(s.b.read().cancelShot);const t=inputs();t.pad.buttons[2].value=1;t.b.read();t.target.emit('blur');assert.equal(t.b.read().shoot,false);t.pad.buttons[2].value=0;t.b.read();t.pad.buttons[2].value=1;assert.ok(t.b.read().shoot);});
test('régression CJ : maintenir Carré avant le contact commence la charge à acquisition',()=>{const s=setup();s.b.x=500;tick(s,{shoot:true,aimY:-1});assert.equal(s.c.owned,false);s.b.x=339;tick(s,{shoot:true,aimY:-1});assert.ok(s.c.charging);assert.ok(s.c.charge>0);tick(s,{aimY:-1});assert.ok(s.b.vy<-500);});
test('régression CJ : viser dès le lancement ne bloque ni visée ni Carré',()=>{const s=inputs();s.pad.axes[2]=1;s.b.clear();s.b.read();let input=s.b.read();assert.equal(input.aimX,1);assert.equal(input.cancelShot,false);s.pad.buttons[2].value=1;assert.equal(s.b.read().shoot,true);});
test('indicateur Fluid : attaché au corps, pas au ballon',()=>{const player=createPlayer('fluid');Object.assign(player,{x:300,y:200,w:60,h:96,controlX:0,controlY:-1,facing:1});const control={available:true,indicator:{x:0,y:-1,charge:.5}};const indicator=resolveFluidContactIndicator(player,control);assert.ok(indicator);assert.equal(indicator.x,300);assert.ok(indicator.y<200);assert.equal(indicator.direction.y,-1);assert.equal(indicator.charge,.5);});
test('indicateur Fluid : une seule flèche simple autour de Fluid',()=>{
	const calls=[];
	const ctx=new Proxy({}, {get:(_,prop)=>prop==='save'||prop==='restore'||prop==='closePath'?()=>{}:((...args)=>{calls.push([prop,...args]);})});
	const renderer={ctx};
	const player=createPlayer('fluid');Object.assign(player,{x:300,y:200,w:60,h:96,controlX:1,controlY:0,facing:1});
	Renderer.prototype.fluidIndicator.call(renderer,player,{available:true,indicator:{x:1,y:0,charge:.5}});
	const moveTos=calls.filter(([name])=>name==='moveTo');
	const lineTos=calls.filter(([name])=>name==='lineTo').length;
	assert.equal(moveTos.length,3);
	assert.equal(lineTos,4);
	assert.ok(calls.some(([name,])=>name==='translate'));
	assert.ok(calls.some(([name,angle])=>name==='rotate'&&Math.abs(angle)<1e-9));
	assert.ok(calls.some(([name])=>name==='fill'));
});
