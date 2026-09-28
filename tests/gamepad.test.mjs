import test from 'node:test';
import assert from 'node:assert/strict';
import { PlayerInput, KeyboardInput } from '../src/input.js';
import { GamepadInput, stickAxis } from '../src/gamepad-input.js';
import { createPlayer, drive } from '../src/player.js';
import { CONFIG as C } from '../src/config.js';
const empty={axis:0,jump:false,boost:false};
class Target{
  listeners=new Map();
  addEventListener(name,fn){if(!this.listeners.has(name))this.listeners.set(name,[]);this.listeners.get(name).push(fn);}
  emit(name,props={}){const e={target:{tagName:'CANVAS'},preventDefault(){},...props};for(const fn of this.listeners.get(name)||[])fn(e);}
}
function pad(index=0,id='DualSense Wireless Controller (Vendor: 054c Product: 0ce6)'){
  return {index,id,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({value:0,pressed:false}))};
}
function setup(initial=[]){const target=new Target(),source={getGamepads:()=>pads};let pads=initial;const input=new PlayerInput(target,source);return {target,source,input,set:p=>{pads=p;}};}
test('PS5 déjà branchée : détectée au premier polling, avant tout événement',()=>{const p=pad(2),s=setup([null,null,p]);assert.deepEqual(s.input.read(),empty);assert.equal(s.input.gamepad.status.label,'PS5');assert.ok(s.input.gamepad.status.supported);});
test('branchement en jeu, débranchement pendant R2, clavier puis reconnexion',()=>{
  const s=setup(),p=pad();assert.deepEqual(s.input.read(),empty);s.set([p]);s.target.emit('gamepadconnected',{gamepad:p});p.buttons[7].value=.8;assert.equal(s.input.read().boost,true);
  s.set([null]);s.target.emit('gamepaddisconnected',{gamepad:p});assert.deepEqual(s.input.read(),empty);s.target.emit('keydown',{code:'KeyD'});assert.equal(s.input.read().axis,1);s.target.emit('keyup',{code:'KeyD'});
  const fresh=pad();fresh.axes[0]=-1;s.set([fresh]);s.target.emit('gamepadconnected',{gamepad:fresh});assert.equal(s.input.read().axis,-1);
});
test('connexion et déconnexion détectées aussi sans événements',()=>{const s=setup(),p=pad();p.axes[0]=1;s.set([p]);assert.equal(s.input.read().axis,1);s.set([]);assert.deepEqual(s.input.read(),empty);assert.equal(s.input.gamepad.status.connected,false);});
test('stick horizontal : deadzone sans dérive, analogique borné, pleine amplitude',()=>{
  for(const value of [-.18,-.1,0,.1,.18,NaN,undefined])assert.equal(stickAxis(value),0);
  assert.equal(stickAxis(1),1);assert.equal(stickAxis(-1),-1);assert.equal(stickAxis(3),1);assert.ok(Math.abs(stickAxis(.59)-.5)<1e-9);
  const p=pad(),s=setup([p]);p.axes[1]=1;p.axes[2]=1;assert.deepEqual(s.input.read(),empty);
});
test('Croix/A : bouton standard 0 ; Carré, Rond, R1 ne sautent pas',()=>{const p=pad(),s=setup([p]);for(const i of [1,2,5])p.buttons[i].pressed=true;assert.equal(s.input.read().jump,false);p.buttons[0].pressed=true;assert.equal(s.input.read().jump,true);p.buttons[0].pressed=false;assert.equal(s.input.read().jump,false);});
test('R2/RT : maintien continu, seuil analogique, relâchement immédiat',()=>{
  const p=pad(),s=setup([p]);p.buttons[7].value=.1;assert.equal(s.input.read().boost,false);p.buttons[7].value=.3;for(let i=0;i<120;i++)assert.equal(s.input.read().boost,true);p.buttons[7].value=0;assert.equal(s.input.read().boost,false);p.buttons[6].value=1;assert.equal(s.input.read().boost,false);
});
test('clavier conservé : toutes les commandes gardent leur sens',()=>{
  const t=new Target(),keyboard=new KeyboardInput(t);
  for(const code of ['ArrowLeft','KeyA','KeyQ']){t.emit('keydown',{code});assert.equal(keyboard.read().axis,-1);t.emit('keyup',{code});}
  for(const code of ['ArrowRight','KeyD']){t.emit('keydown',{code});assert.equal(keyboard.read().axis,1);t.emit('keyup',{code});}
  for(const code of ['Space','ArrowUp','KeyW','KeyZ']){t.emit('keydown',{code});assert.equal(keyboard.read().jump,true);t.emit('keyup',{code});}
  for(const code of ['ShiftLeft','ShiftRight']){t.emit('keydown',{code});assert.equal(keyboard.read().boost,true);t.emit('keyup',{code});}
  t.emit('keydown',{code:'KeyD',target:{tagName:'SELECT'}});assert.deepEqual(keyboard.read(),empty);
});
test('clavier et manette coexistent ; directions clavier prioritaires et actions combinées',()=>{
  const p=pad(),s=setup([p]);p.axes[0]=-1;s.input.read();s.target.emit('keydown',{code:'KeyD'});assert.equal(s.input.read().axis,1);s.target.emit('keydown',{code:'ArrowLeft'});assert.equal(s.input.read().axis,0);
  p.buttons[7].value=1;s.target.emit('keydown',{code:'Space'});assert.deepEqual(s.input.read(),{axis:0,jump:true,boost:true});s.target.emit('keyup',{code:'ArrowLeft'});s.target.emit('keyup',{code:'KeyD'});assert.equal(s.input.read().axis,-1);
  s.target.emit('keydown',{code:'ShiftLeft'});p.buttons[7].value=0;assert.equal(s.input.read().boost,true);s.target.emit('keyup',{code:'ShiftLeft'});assert.equal(s.input.read().boost,false);
});
test('dernière entrée : pas de clignotement sous un stick maintenu ou bruit au repos',()=>{
  const p=pad(),s=setup([p]);p.axes[0]=1;s.input.read();assert.equal(s.input.lastMethod,'gamepad');s.target.emit('keydown',{code:'Space'});for(let i=0;i<100;i++)s.input.read();assert.equal(s.input.lastMethod,'keyboard');
  p.axes[0]=-.6;s.input.read();assert.equal(s.input.lastMethod,'gamepad');s.target.emit('keydown',{code:'KeyD'});p.axes[0]=.09;s.input.read();assert.equal(s.input.lastMethod,'keyboard');p.buttons[7].value=.7;s.input.read();assert.equal(s.input.lastMethod,'gamepad');
});
test('API absente, bloquée ou manette non standard : clavier fonctionnel',()=>{
  for(const source of [{},{getGamepads(){throw new Error('SecurityError');}},{getGamepads:()=>[{...pad(),mapping:''}]}]){
    const t=new Target(),input=new PlayerInput(t,source);t.emit('keydown',{code:'KeyD'});assert.equal(input.read().axis,1);assert.equal(input.gamepad.status.supported,false);
  }
});
test('perte de focus : relâchement, puis retour au neutre avant reprise des commandes manette',()=>{
  const p=pad(),s=setup([p]);p.buttons[7].value=1;s.input.read();s.target.emit('blur');assert.deepEqual(s.input.read(),empty);s.input.clear();assert.deepEqual(s.input.read(),empty);p.buttons[7].value=0;s.input.read();p.buttons[7].value=1;assert.equal(s.input.read().boost,true);
});
test('mapping Xbox et PS5 : mêmes entrées, labels distincts',()=>{for(const [id,label]of [['Xbox Controller','Xbox'],['DualSense Wireless Controller','PS5']]){const p=pad(0,id),s=setup([p]);p.buttons[0].value=1;p.buttons[7].value=1;assert.deepEqual(s.input.read(),{axis:0,jump:true,boost:true});assert.equal(s.input.gamepad.status.label,label);}});
test('aucun changement de capacités : commandes manette et clavier identiques dans drive',()=>{
  const p=pad(),s=setup([p]),a=createPlayer('fluid'),b=createPlayer('fluid');p.axes[0]=1;p.buttons[7].value=1;
  for(let i=0;i<120;i++){drive(a,s.input.read(),C.step);drive(b,{axis:1,jump:false,boost:true},C.step);}assert.deepEqual(a,b);
});
