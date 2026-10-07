import test from 'node:test';
import assert from 'node:assert/strict';
import {Match,STATES as S} from '../src/match.js';
import {TeamBot} from '../src/team-mode.js';
import {ProfileStore} from '../src/profile-store.js';
import {createPlayer} from '../src/player.js';
import {createBall} from '../src/ball.js';
import {CONFIG as C,DIFFICULTIES} from '../src/config.js';
import {MobileMenuModel} from '../src/mobile-menu-model.js';
import {MobileCamera} from '../src/mobile-camera.js';
const memory=()=>{const values=new Map();return {getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};};
const make=()=>{const m=new Match(new ProfileStore(memory()));m.start('2v2','elite');return m;};
const playing=()=>{const m=make();m.update(C.countdown+.01);assert.equal(m.state,S.PLAYING);return m;};
const challenge=(m,id)=>m.profile.challenges.snapshot().items.find(d=>d.id===id);
test('2v2 : un humain, un bot allié, deux adversaires, mêmes capacités',()=>{
  const m=make();assert.equal(m.mode,'2v2');assert.equal(m.players.length,4);assert.equal(m.bots.length,3);
  assert.equal(m.players.filter(p=>p.team==='player').length,2);assert.equal(m.players.filter(p=>p.team==='bot').length,2);
  assert.equal(new Set(m.players).size,4);assert.equal(new Set(m.bots.map(e=>e.ai)).size,3);
  assert.equal(m.state,S.PRE_ROUND);assert.equal(m.remaining,300);
  for(const p of m.players){assert.equal(p.w,C.playerWidth);assert.equal(p.h,C.playerHeight);assert.equal(p.fuel,100);assert.ok(p.jumpReady&&p.impulseReady);assert.equal(p.y,C.floor-p.h/2);}
  for(const entry of m.bots)assert.equal(entry.ai.base.settings,DIFFICULTIES.elite);
  assert.deepEqual(m.players.map(p=>p.x),[480,800,360,920]);
});
test('2v2 : les trois bots pilotent les corps existants, sans mouvement humain automatique',()=>{
  const m=playing(),start=m.bots.map(e=>e.body.x),humanX=m.player.x;
  for(let i=0;i<90;i++)m.update(C.step);
  for(const [i,entry] of m.bots.entries())assert.notEqual(entry.body.x,start[i]);
  assert.equal(m.player.x,humanX);
  for(const p of m.players){assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y));assert.ok(p.fuel>=0&&p.fuel<=100);}
});
test('2v2 : IA miroir, directions opposées et capacités identiques sans mutation',()=>{
  const red=Object.assign(createPlayer('heavy'),{x:850,y:450,team:'bot',grounded:true});
  const blue={...red,x:C.width-red.x,team:'player',vx:-red.vx};
  const ball=Object.assign(createBall(),{x:700,y:450,vx:120,vy:-40}),mirror={...ball,x:C.width-ball.x,vx:-ball.vx};
  const before=structuredClone({red,blue,ball,mirror});
  const a=new TeamBot('elite','bot',()=>.5).update(red,ball,C.step,[red]);
  const b=new TeamBot('elite','player',()=>.5).update(blue,mirror,C.step,[blue]);
  assert.equal(a.axis,-b.axis);assert.equal(a.jump,b.jump);assert.equal(a.boost,b.boost);
  assert.deepEqual({red,blue,ball,mirror},before);
});
test('2v2 : le bot éloigné reste en soutien au lieu de poursuivre son partenaire',()=>{
  const near=Object.assign(createPlayer('heavy'),{x:700,y:532,team:'bot',grounded:true});
  const far=Object.assign(createPlayer('heavy'),{x:882.5,y:532,team:'bot',grounded:true});
  const ball=Object.assign(createBall(),{x:650,y:541.5});
  const ai=new TeamBot('elite','bot',()=>.5);assert.deepEqual(ai.update(far,ball,C.step,[near,far]),{axis:0,jump:false,boost:false});
  ball.vx=500;ball.x=C.goalRight-70;ai.reset();ai.update(far,ball,C.step,[near,far]);assert.equal(ai.supporting,false);
});
test('2v2 : contact physique possible avec chacun des trois bots',()=>{
  for(let index=0;index<3;index++){
    const m=playing();for(const [i,p] of m.players.entries())Object.assign(p,{x:350+i*160,y:300,vx:0,vy:0,grounded:false,contactSurface:null});
    for(const entry of m.bots)entry.ai.update=()=>({axis:0,jump:false,boost:false});
    const body=m.bots[index].body;Object.assign(m.ball,{x:body.x-35,y:body.y,vx:100,vy:0});m.update(C.step);
    assert.equal(m.lastTouch,body);assert.ok(m.ball.x<=body.x-body.w/2-m.ball.r+1e-6);
  }
});
test('2v2 : buts d’équipe, seuls les buts humains alimentent XP personnelle et défis',()=>{
  const m=playing(),ally=m.players.find(p=>p.team==='player'&&p!==m.player);
  m.lastTouch=ally;assert.equal(m.goal('player'),true);assert.equal(m.score.player,1);assert.equal(m.humanGoals,0);
  assert.equal(challenge(m,'d-goals-2').progress,0);assert.equal(m.goal('player'),false);
  m.prepare();m.state=S.PLAYING;m.lastTouch=m.player;m.goal('player');
  assert.equal(m.score.player,2);assert.equal(m.humanGoals,1);assert.equal(challenge(m,'d-goals-2').progress,1);
  m.prepare();m.state=S.PLAYING;m.lastTouch=m.player;m.goal('bot');
  assert.deepEqual(m.score,{player:2,bot:1});assert.equal(m.humanGoals,1);
  m.state=S.PLAYING;m.finish();assert.equal(m.result,'win');assert.equal(m.reward,160);
  assert.equal(challenge(m,'d-match-1').progress,1);assert.equal(challenge(m,'d-win').progress,1);
  const xp=m.profile.data.xp,season=m.profile.data.seasonXp;m.finish();assert.equal(m.profile.data.xp,xp);assert.equal(m.profile.data.seasonXp,season);
});
test('2v2 : un vrai tir humain est attribué avant le but',()=>{
  const m=playing();Object.assign(m.player,{x:600,y:350,grounded:true});Object.assign(m.ball,{x:625,y:340,vx:0,vy:0});
  m.control.update(m.player,m.ball,{shoot:true},.35);m.control.update(m.player,m.ball,{},C.step);
  assert.equal(m.lastTouch,m.player);m.goal('player');assert.equal(m.rewardGoals,1);
});
test('2v2 : remise en jeu réinitialise quatre joueurs et trois IA, garde le score',()=>{
  const m=playing();m.lastTouch=m.player;m.goal('player');
  for(const p of m.players)Object.assign(p,{fuel:0,boosting:true,jumpHeld:true,flipTimer:.2,flipHit:true});
  for(const entry of m.bots)entry.ai.base.wait=3;
  m.update(C.goalPause+.01);assert.equal(m.state,S.PRE_ROUND);assert.equal(m.score.player,1);assert.equal(m.humanGoals,1);assert.equal(m.lastTouch,null);
  for(const p of m.players){assert.equal(p.fuel,100);assert.equal(p.boosting,false);assert.equal(p.jumpHeld,false);assert.equal(p.flipTimer,0);}
  for(const entry of m.bots)assert.equal(entry.ai.base.wait,0);
});
test('2v2 : 00:00 termine une avance avant un nouveau but',()=>{
  const m=playing();m.score.player=1;m.remaining=C.step;
  Object.assign(m.ball,{x:C.goalLeft-60,y:(C.goalTop+C.goalBottom)/2});m.update(C.step);
  assert.equal(m.state,S.POST_MATCH);assert.deepEqual(m.score,{player:1,bot:0});assert.equal(m.result,'win');
});
test('2v2 : égalité et mort subite, prochain but gagne et ne récompense qu’une fois',()=>{
  const m=playing();m.remaining=C.step;m.update(C.step);assert.equal(m.overtime,true);
  m.goal('bot');assert.equal(m.result,'loss');assert.equal(m.state,S.POST_MATCH);assert.equal(m.reward,100);assert.equal(m.goal('bot'),false);
});
test('2v2 : retour menu arrête tous les boosts et le jeu, abandon sans récompense',()=>{
  const m=playing();for(const p of m.players)p.boosting=true;
  m.menu();const before=structuredClone(m.players);m.update(1,{boost:true,axis:1});
  assert.deepEqual(m.players,before);assert.ok(m.players.every(p=>!p.boosting));assert.equal(m.profile.data.xp,0);assert.equal(challenge(m,'d-match-1').progress,0);
});
test('2v2 : transitions vers duel et entraînement sans bot résiduel',()=>{
  const m=make();m.start('easy');assert.equal(m.mode,'duel');assert.equal(m.players.length,2);assert.equal(m.bots.length,1);assert.equal(m.difficulty,'easy');
  m.start('2v2');assert.equal(m.players.length,4);assert.equal(m.difficulty,'normal');
  m.start('training');assert.equal(m.players.length,1);assert.equal(m.bots.length,0);assert.equal(m.bot,null);
  m.start('2v2','elite');assert.equal(m.players.length,4);assert.equal(m.difficulty,'elite');
});
test('2v2 : menu bloque le lancement sans assets ou hors du choix des modes',()=>{
  const model=new MobileMenuModel();assert.equal(model.canLaunch('2v2',true),false);model.navigate('modes');
  assert.equal(model.canLaunch('2v2',false),false);assert.equal(model.canLaunch('2v2',true),true);assert.equal(model.canLaunch('duel',true),true);
});
test('2v2 : cadrage mobile inclut les quatre joueurs sans les déplacer',()=>{
  const m=make();m.players[2].x=20;m.players[3].x=C.width-20;const before=structuredClone(m.players),camera=new MobileCamera();camera.update(m,true,C.step);
  for(const p of m.players)assert.equal(camera.project(p.x,p.y).visible,true);assert.deepEqual(m.players,before);
});
test('2v2 : match complet avec buts physiques, chrono actif et récompense unique',()=>{
  const m=make();for(const entry of m.bots)entry.ai.base.random=()=>.5;
  for(let i=0;i<Math.ceil(600/C.step)&&m.state!==S.POST_MATCH;i++){
    const time=i*C.step;
    m.update(C.step,{axis:Math.sin(time*.7)*.4,jump:time%3<.08,boost:time%4<.2,shoot:time%1.5<.75,aimX:1,aimY:-.5,aimIntent:true});
    for(const p of m.players)assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y));
  }
  assert.equal(m.state,S.POST_MATCH);assert.equal(m.remaining,0);assert.equal(m.boundaryRecoveries,0);
  assert.ok(m.score.player>0&&m.score.bot>0,'les deux équipes ont marqué par simulation physique');
  assert.equal(m.profile.data.completed.length,1);
  const players=structuredClone(m.players),xp=m.profile.data.xp;m.update(1,{axis:1,boost:true});
  assert.deepEqual(m.players,players);assert.equal(m.profile.data.xp,xp);assert.equal(m.finish(),false);
});
