import test from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG as C } from '../src/config.js';
import { Match, STATES as S } from '../src/match.js';
import { ProfileStore } from '../src/profile-store.js';
import { createPlayer, drive } from '../src/player.js';
import { createBall, integrateBall } from '../src/ball.js';
import { movePlayer, collideBall, hitPlayer } from '../src/physics.js';
// Retain collision regression coverage for the reversible original layout.
import { classicSolids as solids } from '../src/arena.js';
import { goalScorer, goalEntryDepth } from '../src/goals.js';
import { Bot } from '../src/bot.js';
const memory=()=>{const data=new Map();return {getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};};
const make=()=>new Match(new ProfileStore(memory()));
function advance(m,seconds,input={}){for(let i=0;i<Math.ceil(seconds/C.step);i++)m.update(C.step,input);}
function playing(){const m=make();m.start();advance(m,3.02);assert.equal(m.state,S.PLAYING);return m;}
test('menu, lancement et compte à rebours sans consommation du chrono',()=>{const m=make();assert.equal(m.state,S.MENU);m.start('elite');advance(m,2);assert.equal(m.state,S.PRE_ROUND);assert.equal(m.remaining,300);advance(m,1.02);assert.equal(m.state,S.PLAYING);assert.equal(m.difficulty,'elite');});
test('déplacement, saut, jetpack, recharge et égalité des capacités',()=>{
  const a=createPlayer('fluid'),b=createPlayer('heavy');for(const p of [a,b]){p.x=C.width/2;p.y=C.floor-p.h/2;p.grounded=true;p.contactSurface='floor';for(let i=0;i<30;i++){drive(p,{axis:1},C.step);movePlayer(p,solids,C.step);}assert.ok(p.x>0);drive(p,{jump:true},C.step);assert.ok(p.vy<0);const fuel=p.fuel;drive(p,{boost:true},C.step);assert.ok(p.fuel<fuel);const low=p.fuel;drive(p,{},C.step);assert.equal(p.fuel,low,'pas de recharge en plein air');
    for(let i=0;i<360&&!p.grounded;i++){drive(p,{},C.step);movePlayer(p,solids,C.step);}
    assert.ok(p.grounded,'atterrissage réel requis');assert.equal(p.contactSurface,'floor');
    drive(p,{},C.step);assert.ok(p.fuel>low,'recharge après atterrissage');}
  assert.equal(a.vx,b.vx);assert.equal(a.vy,b.vy);assert.equal(a.fuel,b.fuel);
});
test('saut : premier appui, maintien sans répétition, second appui aérien et consommation unique',()=>{
  const p=createPlayer('fluid');p.grounded=true;drive(p,{jump:true},C.step);assert.ok(p.vy<0);const afterGround=p.vy;drive(p,{jump:true},C.step);assert.equal(p.vy,afterGround+C.gravity*C.step);drive(p,{jump:false},C.step);const beforeAir=p.vy;drive(p,{jump:true},C.step);assert.ok(p.vy<beforeAir);assert.equal(p.impulseReady,false);const afterAir=p.vy;drive(p,{jump:false},C.step);drive(p,{jump:true},C.step);assert.ok(Math.abs(p.vy-(afterAir+2*C.gravity*C.step))<1e-9);
});
test('double saut : orientation seule/ROT reste neutre, stick directionnel déclenche le flip',()=>{
  for(const rotate of [false,true]){const neutral=createPlayer('fluid');neutral.grounded=false;neutral.jumpReady=false;neutral.impulseReady=true;neutral.footX=1;neutral.footY=0;drive(neutral,{jump:true,rotate},C.step);assert.equal(neutral.vx,0);assert.ok(neutral.vy<0);}
  const flip=createPlayer('fluid');flip.grounded=false;flip.jumpReady=false;flip.impulseReady=true;drive(flip,{jump:true,directionX:1,directionY:0},C.step);assert.ok(flip.vx>0);assert.equal(flip.impulseReady,false);assert.ok(flip.flipTimer>0);assert.equal(flip.flipX,1);
});
test('orientation aérienne progressive et impulsion courte distincte du Jetpack',()=>{
  const p=createPlayer('fluid');p.grounded=false;p.jumpReady=false;p.impulseReady=true;p.footX=0;p.footY=1;p.x=300;p.y=260;
  drive(p,{aimX:1,aimY:-1,jump:true},C.step);
  assert.ok(p.vx>0);assert.ok(p.vy<0);assert.equal(p.impulseReady,false);assert.ok(p.impulseCooldown>0);assert.ok(p.footY>0&&p.footY<1);
});

test('inertie aérienne : l’élan horizontal persiste lorsque le stick est relâché',()=>{
  const p=createPlayer('fluid');p.grounded=false;p.vx=240;p.vy=-80;
  for(let i=0;i<30;i++)drive(p,{},C.step);
  assert.ok(p.vx>185);
});
test('orientation aérienne : retour vertical progressif quand l’entrée devient neutre',()=>{
  const p=createPlayer('fluid');p.grounded=false;p.x=300;p.y=260;
  for(let i=0;i<36;i++)drive(p,{aimX:1,aimY:-1},C.step);
  const tilted=p.footY;
  assert.ok(tilted>0);
  for(let i=0;i<24;i++)drive(p,{},C.step);
  assert.ok(p.footY>tilted);
  assert.ok(p.footY>0);
});
test('orientation aérienne : le stick 360° oriente le corps sans modifier la trajectoire',()=>{
  const p=createPlayer('fluid');p.grounded=false;p.x=300;p.y=260;p.vx=90;p.vy=-40;const vx=p.vx;
  for(let i=0;i<24;i++)drive(p,{directionX:0,directionY:1},C.step);
  assert.ok(p.footY<0);assert.ok(p.vx<=vx);
});
test('rotation dédiée : ROT reste disponible mais n’est plus requis pour orienter ni pour décider du flip',()=>{
  const p=createPlayer('fluid');p.grounded=false;p.x=300;p.y=260;
  for(let i=0;i<24;i++)drive(p,{directionX:1,directionY:0},C.step);
  assert.ok(Math.abs(p.footX)>0.7);
  drive(p,{directionX:0,directionY:-1,rotate:true},C.step);assert.ok(p.rotateHeld);
  const q=createPlayer('fluid');q.grounded=false;q.jumpReady=false;q.impulseReady=true;drive(q,{jump:true,rotate:true},C.step);assert.equal(q.vx,0);assert.ok(q.vy<0);
});
test('sol et plafond : recharge seulement quand les pieds sont orientés vers la surface',()=>{
  const floor=createPlayer('fluid');floor.x=400;floor.grounded=false;floor.jumpReady=false;floor.impulseReady=false;floor.footX=0;floor.footY=1;floor.y=C.floor-floor.h/2-1;floor.vy=200;movePlayer(floor,solids,.02);assert.ok(floor.jumpReady&&floor.impulseReady);
  const ceiling=createPlayer('fluid');ceiling.x=400;ceiling.grounded=false;ceiling.jumpReady=false;ceiling.impulseReady=false;ceiling.footX=0;ceiling.footY=-1;ceiling.y=C.ceiling+ceiling.h/2+1;ceiling.vy=-200;movePlayer(ceiling,solids,.02);assert.ok(ceiling.jumpReady&&ceiling.impulseReady);
  const shoulder=createPlayer('fluid');shoulder.x=400;shoulder.grounded=false;shoulder.jumpReady=false;shoulder.impulseReady=false;shoulder.footX=1;shoulder.footY=0;shoulder.y=C.ceiling+shoulder.h/2+1;shoulder.vy=-200;movePlayer(shoulder,solids,.02);assert.equal(shoulder.contactSurface,'ceiling');assert.equal(shoulder.jumpReady,false);assert.equal(shoulder.impulseReady,false);
});
test('JET ne recharge pas le saut aérien',()=>{const p=createPlayer('fluid');p.grounded=false;p.jumpReady=false;p.impulseReady=true;drive(p,{boost:true},C.step);assert.equal(p.impulseReady,true);assert.equal(p.jumpReady,false);});
test('sol, plateformes, dessous de plateforme et obstacle bloquent le joueur',()=>{
  for(const rect of solids.filter(r=>['floor','platform','obstacle'].includes(r.kind))){const p=createPlayer('fluid');p.x=rect.x+rect.w/2;p.y=rect.y-p.h/2-1;p.vy=200;movePlayer(p,[rect],.02);assert.equal(p.y,rect.y-p.h/2);assert.ok(p.grounded);}
  const p=createPlayer('fluid'),r=solids[1];p.x=r.x+50;p.y=r.y+r.h+p.h/2+1;p.vy=-200;movePlayer(p,[r],.02);assert.equal(p.y,r.y+r.h+p.h/2);assert.equal(p.vy,0);
});
test('balle : gravité, inertie, rebonds, plateformes, obstacle et limites',()=>{
  const ball=createBall();ball.vx=150;integrateBall(ball,.1);assert.ok(ball.x>640&&ball.vy>0);
  // Goal boundaries have sloping collision surfaces, not horizontal shelves.
  // Their fieldward response is covered by goal-boundaries.test.mjs.
  for(const r of solids.filter(s=>!s.goalBoundary)){Object.assign(ball,{x:r.x+r.w/2,y:r.y-ball.r+2,vx:20,vy:150});collideBall(ball,[r]);assert.ok(ball.vy<0);assert.ok(Math.abs(ball.y-(r.y-ball.r))<.001);}
  for(const side of [-1,1]){
    const x=side<0?2:C.width-2;
    Object.assign(ball,{x,y:C.goalBottom+ball.r+1,vx:side*50,vy:0});collideBall(ball,[]);
    assert.equal(Math.sign(ball.vx),-side,'rebond hors ouverture');
    Object.assign(ball,{x,y:(C.goalTop+C.goalBottom)/2,vx:side*50,vy:0});collideBall(ball,[]);
    assert.equal(ball.x,x);assert.equal(ball.vx,side*50,'passage libre dans la cage');
  }
});
test('contact physique symétrique, sans attraction ni possession',()=>{
  const balls=[];for(const skin of ['fluid','heavy']){const p=createPlayer(skin);p.x=400;p.y=500;p.vx=250;const b=createBall();Object.assign(b,{x:432,y:500,vx:0,vy:0});assert.ok(hitPlayer(b,p));assert.ok(b.vx>250);balls.push(b);}
  assert.equal(balls[0].vx,balls[1].vx);const p=createPlayer('fluid');p.x=100;p.y=100;const b=createBall(),before={...b};assert.equal(hitPlayer(b,p),false);assert.deepEqual(b,before);
});
test('flip aérien : le premier contact frappe la balle une fois dans la direction du flip',()=>{
  const m=playing(),p=m.player;
  Object.assign(p,{x:300,y:400,grounded:false,contactSurface:null,flipReady:true,flipHit:false});
  Object.assign(m.ball,{x:335,y:400,vx:0,vy:0});
  m.update(C.step,{axis:0,rotate:true});
  const struckSpeed=Math.hypot(m.ball.vx,m.ball.vy);
  assert.ok(struckSpeed>300);assert.equal(p.flipHit,true);
  Object.assign(m.ball,{x:335,y:400,vx:0,vy:0});
  m.update(C.step,{axis:0,rotate:true});
  assert.ok(Math.hypot(m.ball.vx,m.ball.vy)<100);assert.equal(p.flipHit,true);
});
test('but valide seulement après entrée complète sous la barre',()=>{const b=createBall();b.y=(C.goalTop+C.goalBottom)/2;b.x=C.goalRight-1;assert.equal(goalScorer(b),null);b.x=C.goalRight+goalEntryDepth(b.r);assert.equal(goalScorer(b),'player');b.x=C.goalLeft-goalEntryDepth(b.r);assert.equal(goalScorer(b),'bot');b.y=C.goalTop+b.r;assert.equal(goalScorer(b),null);});
test('buts des deux camps, double but ignoré, remise en jeu et chrono suspendu',()=>{
  const m=playing();Object.assign(m.ball,{x:C.goalRight+12+m.ball.r-1,y:(C.goalTop+C.goalBottom)/2,vx:500,vy:0});m.update(C.step);assert.equal(m.score.player,1);assert.equal(m.state,S.GOAL_SCORED);assert.equal(m.goal('player'),false);const time=m.remaining;advance(m,1.9);assert.equal(m.state,S.PLAYING);assert.equal(m.ball.x,640);assert.ok(m.remaining<=time&&m.remaining>time-.2);Object.assign(m.ball,{x:C.goalLeft-12-m.ball.r+1,y:(C.goalTop+C.goalBottom)/2,vx:-500,vy:0});m.update(C.step);assert.equal(m.score.bot,1);
});
test('fin du chrono prioritaire, jeu arrêté, pas de double récompense',()=>{
  const m=playing();m.score.player=2;m.score.bot=1;m.remaining=C.step;Object.assign(m.ball,{x:60,y:(C.goalTop+C.goalBottom)/2});m.update(C.step);assert.equal(m.state,S.POST_MATCH);assert.equal(m.score.bot,1);assert.equal(m.reward,170);const xp=m.profile.data.xp,ball={...m.ball};assert.equal(m.finish(),false);assert.equal(m.goal('bot'),false);advance(m,2,{axis:1,boost:true});assert.deepEqual(m.ball,ball);assert.equal(m.profile.data.xp,xp);
});
test('égalité : mort subite, prochain but gagnant et récompense unique',()=>{const m=playing();m.remaining=C.step;m.update(C.step);assert.equal(m.state,S.PLAYING);assert.ok(m.overtime);assert.equal(m.remaining,0);m.goal('bot');assert.equal(m.state,S.POST_MATCH);assert.equal(m.result,'loss');assert.equal(m.reward,100);assert.equal(m.goal('player'),false);});
test('300 secondes de temps de jeu simulé et fin automatique',()=>{const m=playing();m.score.player=1;for(let i=0;i<36001&&m.state!==S.POST_MATCH;i++){m.ball.x=640;m.ball.y=200;m.ball.vx=0;m.ball.vy=0;m.update(C.step);}assert.equal(m.state,S.POST_MATCH);assert.equal(m.remaining,0);});
test('rejouer, retour menu et conservation du profil',()=>{const m=playing();m.score.player=1;m.finish();const xp=m.profile.data.xp,id=m.id;m.start('easy');assert.equal(m.state,S.PRE_ROUND);assert.equal(m.score.player,0);assert.equal(m.remaining,300);assert.notEqual(m.id,id);assert.equal(m.profile.data.xp,xp);m.menu();assert.equal(m.state,S.MENU);advance(m,3);assert.equal(m.remaining,300);});
test('profil persistant, seuil de niveau et idempotence après rechargement',()=>{const storage=memory(),p=new ProfileStore(storage);p.data.xp=990;assert.equal(p.award('match-1',2,true),170);assert.equal(p.level,2);const reloaded=new ProfileStore(storage);assert.equal(reloaded.data.xp,1160);assert.equal(reloaded.award('match-1',2,true),0);});
test('stockage refusé ou corrompu ne bloque pas le match',()=>{const p=new ProfileStore({getItem(){return 'bad'},setItem(){throw Error()}});assert.ok(p.warning);assert.equal(p.award('x',1,false),110);assert.equal(p.award('x',1,false),0);});
test('trois bots : décisions bornées, mêmes paramètres physiques',()=>{for(const level of ['easy','normal','elite']){const ai=new Bot(level,()=>.5),p=createPlayer('heavy'),ball=createBall();p.x=900;p.y=606;p.grounded=true;for(let i=0;i<500;i++){const input=ai.update(p,ball,C.step);assert.ok([-1,0,1].includes(input.axis));drive(p,input,C.step);movePlayer(p,solids,C.step);assert.ok(Math.abs(p.vx)<=C.runSpeed);assert.ok(p.fuel>=0&&p.fuel<=100);}}});
test('le bot rejoint une balle libre ou proche du montant haut du but',()=>{
  for(const [x,y,bx] of [[748,520,795],[1250,C.goalTop-15-C.ballRadius,1120]]){
    const m=playing();m.ai=new Bot('elite',()=>.5);Object.assign(m.bot,{x:bx,y:606,vx:0,vy:0});Object.assign(m.ball,{x,y,vx:0,vy:0});
    advance(m,20);assert.ok(Math.abs(m.ball.x-x)>30||m.score.player+m.score.bot>0,`balle bloquée à ${x}`);
  }
});

test('double saut neutre relance une vraie montee sans casser inertie horizontale',()=>{
  const p=createPlayer('fluid');p.grounded=false;p.jumpReady=false;p.impulseReady=true;p.vx=137;p.vy=120;
  drive(p,{jump:true},C.step);
  assert.ok(p.vx>130); // only the normal tiny air drag applies; the double jump does not erase horizontal inertia
  assert.equal(p.vy,-C.maxRise);
  assert.equal(p.impulseReady,false);
});

test('Jet V4 : Fluid propulse dans son orientation aerienne sans effacer son inertie',()=>{
  const p=createPlayer('fluid');p.grounded=false;p.contactSurface=null;p.footX=-1;p.footY=0;p.vx=80;p.vy=0;
  drive(p,{boost:true,directionX:1,directionY:0},C.step);
  assert.ok(p.vx>80);
  assert.ok(p.fuel<100);
});
