import test from 'node:test';
import assert from 'node:assert/strict';
import { Match, STATES } from '../src/match.js';
import { ProfileStore } from '../src/profile-store.js';
import { CONFIG as C } from '../src/config.js';

const memory=()=>{const data=new Map();return {getItem:key=>data.get(key)||null,setItem:(key,value)=>data.set(key,value)};};
const startTraining=()=>{const match=new Match(new ProfileStore(memory()));match.start('training');return match;};

test('entraînement : lancement solo sans bot ni chrono de fin',()=>{const m=startTraining();assert.equal(m.training,true);assert.equal(m.state,STATES.PLAYING);assert.equal(m.bot,null);assert.equal(m.remaining,0);assert.equal(m.finished,false);assert.equal(m.reward,0);});
test('entraînement : conserve les échelles gameplay de l’arène normale',()=>{const m=startTraining();assert.equal(C.ballScale,2.5);assert.equal(C.fluidVisualScale,1.3);assert.equal(m.ball.r,C.ballRadius*C.ballScale);assert.equal(m.player.w,38);assert.equal(m.player.h,76);});
test('entraînement : pas de récompense ni d’XP, même après un but',()=>{const m=startTraining();m.ball.x=1220;m.ball.y=(C.goalTop+C.goalBottom)/2;m.update(C.step);assert.equal(m.score.player,0);assert.equal(m.profile.data.xp,0);assert.equal(m.reward,0);assert.equal(m.state,STATES.PLAYING);});
test('entraînement : reset ballon ne déplace pas Fluid',()=>{const m=startTraining();Object.assign(m.player,{x:420,y:410,vx:12,vy:-8});Object.assign(m.ball,{x:800,y:500,vx:120,vy:-60,angle:1.4,flash:0.2});m.resetTrainingBall();assert.equal(m.ball.x,640);assert.equal(m.ball.y,278);assert.equal(m.ball.vx,0);assert.equal(m.ball.vy,0);assert.equal(m.ball.angle,0);assert.equal(m.player.x,420);assert.equal(m.player.y,410);});
test('entraînement : sortie vers le menu sans effet de progression',()=>{const m=startTraining();m.menu();assert.equal(m.state,STATES.MENU);assert.equal(m.profile.data.xp,0);assert.equal(m.reward,0);});