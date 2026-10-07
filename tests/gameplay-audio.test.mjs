import test from 'node:test';
import assert from 'node:assert/strict';
import {GameplayAudio} from '../src/gameplay-audio.js';
import {BallControl} from '../src/ball-control.js';
import {createPlayer} from '../src/player.js';
import {createBall} from '../src/ball.js';
import {Match,STATES} from '../src/match.js';
import {ProfileStore} from '../src/profile-store.js';
import {CONFIG as C} from '../src/config.js';
const profile=()=>new ProfileStore({getItem(){return null;},setItem(){}});
test('son de but : uniquement les buts acceptés, sans doublon en duel',()=>{
  const events=[],m=new Match(profile(),(kind,detail)=>events.push({kind,...detail}));
  assert.equal(m.goal('player'),false);m.start();assert.equal(m.goal('player'),false);
  m.state=STATES.PLAYING;assert.equal(m.goal('invalid'),false);assert.equal(m.goal('player'),true);
  assert.equal(m.goal('player'),false);m.update(C.step);
  assert.deepEqual(events,[{kind:'goal',scorer:'player',training:false}]);
  m.state=STATES.PLAYING;m.finish();assert.equal(m.goal('bot'),false);assert.equal(events.length,1);
});
test('son de but disponible en entraînement sans score ni XP de match',()=>{
  const events=[],m=new Match(profile(),kind=>events.push(kind));m.start('training');m.goal('player');
  assert.deepEqual(events,['goal']);assert.equal(m.score.player,0);assert.equal(m.profile.data.xp,0);
});
test('son de tir : aucun son de charge, frappe immédiate et différée une seule fois',()=>{
  const powers=[],control=new BallControl(power=>powers.push(power)),p=createPlayer('fluid'),b=createBall();
  Object.assign(p,{x:600,y:350,grounded:true});Object.assign(b,{x:625,y:340,vx:0,vy:0});
  control.update(p,b,{shoot:true},.35);assert.equal(powers.length,0);
  control.update(p,b,{},C.step);control.update(p,b,{},C.step);assert.equal(powers.length,1);
  assert.ok(powers[0]>0&&powers[0]<=1);
  control.reset();Object.assign(b,{x:900,y:340,vx:0,vy:0});
  control.update(p,b,{shoot:true},.35);control.update(p,b,{},C.step);
  control.finishContacts(b,p,false);assert.equal(powers.length,1);
  Object.assign(b,{x:625,y:340});control.finishContacts(b,p,true);control.finishContacts(b,p,true);
  assert.equal(powers.length,2);
});
test('son de flip : un seul impact sonore par flip réel',()=>{
  const events=[],m=new Match(profile(),kind=>events.push(kind));m.start('training');
  Object.assign(m.player,{x:600,y:350,grounded:false,contactSurface:null,flipTimer:.3,flipHit:false,vx:0,vy:0});
  Object.assign(m.ball,{x:635,y:350,vx:0,vy:0});m.update(C.step);
  assert.equal(m.player.flipHit,true);assert.deepEqual(events,['shot']);
  Object.assign(m.ball,{x:m.player.x+35,y:m.player.y,vx:0,vy:0});m.update(C.step);
  assert.deepEqual(events,['shot']);
});
test('une erreur audio ne bloque ni score ni fin de match',()=>{
  const m=new Match(profile(),()=>{throw Error('audio unavailable');});m.start();m.state=STATES.PLAYING;
  assert.equal(m.goal('player'),true);assert.equal(m.score.player,1);
  m.state=STATES.PLAYING;assert.equal(m.finish(),true);assert.equal(m.result,'win');
});
test('audio indisponible : aucune exception, aucun son mis en attente',()=>{
  const audio=new GameplayAudio({contextFactory:()=>null});assert.doesNotThrow(()=>audio.unlock());
  assert.equal(audio.play('goal'),false);assert.equal(audio.voices.size,0);
  const denied=new GameplayAudio({contextFactory:()=>{throw Error('denied');}});
  assert.doesNotThrow(()=>denied.unlock());assert.equal(denied.play('shot'),false);
});
test('son coupé et pause : arrêt immédiat, choix enregistré et contexte réutilisé',()=>{
  let creations=0,stops=0,resumes=0;const saved=[];
  const context={state:'suspended',destination:{},createGain:()=>({gain:{},connect(){}}),
    resume(){resumes++;this.state='running';return Promise.resolve();},suspend(){this.state='suspended';return Promise.resolve();}};
  const audio=new GameplayAudio({contextFactory:()=>{creations++;return context;},onEnabledChange:value=>saved.push(value)});
  audio.unlock();audio.unlock();assert.equal(creations,1);assert.equal(resumes,1);
  audio.voices.add({stop(){stops++;}});audio.setEnabled(false);
  assert.equal(stops,1);assert.equal(audio.voices.size,0);assert.equal(audio.play('goal'),false);
  audio.setEnabled(true);audio.voices.add({stop(){stops++;}});audio.setPaused(true);
  assert.equal(stops,2);assert.equal(audio.play('shot'),false);assert.equal(context.state,'suspended');
  audio.setPaused(false);assert.equal(creations,1);assert.equal(context.state,'running');assert.deepEqual(saved,[false,true]);
});
