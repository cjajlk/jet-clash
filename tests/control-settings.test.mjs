import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { controlSettings } from '../src/control-settings.js';
import { KeyboardInput, PlayerInput } from '../src/input.js';
import { GamepadInput } from '../src/gamepad-input.js';

class Target{
  listeners=new Map();
  addEventListener(name,fn){if(!this.listeners.has(name))this.listeners.set(name,[]);this.listeners.get(name).push(fn);}
  emit(name,props={}){const e={target:{tagName:'CANVAS'},preventDefault(){},...props};for(const fn of this.listeners.get(name)||[])fn(e);}
}

function pad(){
  return {index:0,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({value:0,pressed:false}))};
}

afterEach(()=>controlSettings.reset());

test('commandes : clavier et stick principal sont remappables',()=>{
  controlSettings.setKeyboard('moveLeft',['KeyE']);
  controlSettings.setGamepad('movementStick','left');
  const target=new Target(),gamepad=pad(),source={getGamepads:()=>[gamepad]};
  const keyboard=new KeyboardInput(target),input=new PlayerInput(target,source);
  target.emit('keydown',{code:'KeyE'});
  assert.equal(keyboard.read().axis,-1);
  assert.equal(input.read().axis,-1);
  gamepad.axes[0]=1;
  assert.equal(input.gamepad.read().axis,1);
});

test('commandes : options tactiles et boutons gamepad restent persistables',()=>{
  controlSettings.setTouchLayout('mirrored');
  controlSettings.setGamepad('jump',1);
  controlSettings.setGamepad('boost',4);
  controlSettings.setGamepad('shoot',2);
  assert.equal(controlSettings.touch.layout,'mirrored');
  assert.equal(controlSettings.gamepad.jump,1);
  assert.equal(controlSettings.gamepad.boost,4);
  assert.equal(controlSettings.gamepad.shoot,2);
});

test('tir et visée utilisent toutes les touches personnalisées, même après création de l’entrée',()=>{
  const target=new Target(),input=new PlayerInput(target,{});
  controlSettings.setKeyboard('shoot',['KeyE','KeyT']);
  controlSettings.setKeyboard('aimLeft',['KeyQ','KeyA']);
  controlSettings.setKeyboard('aimUp',['KeyZ','KeyW']);
  for(const code of ['KeyE','KeyT']){
    target.emit('keydown',{code});assert.equal(input.readBallControls().shoot,true);
    target.emit('keyup',{code});assert.equal(input.readBallControls().shoot,false);
  }
  for(const code of ['KeyQ','KeyA']){
    target.emit('keydown',{code});assert.equal(input.readBallControls().aimX,-1);target.emit('keyup',{code});
  }
  for(const code of ['KeyZ','KeyW']){
    target.emit('keydown',{code});assert.equal(input.readBallControls().aimY,-1);target.emit('keyup',{code});
  }
  target.emit('keydown',{code:'KeyF'});assert.equal(input.readBallControls().shoot,false);
  target.emit('keyup',{code:'KeyF'});
  target.emit('keydown',{code:'KeyE',target:{tagName:'SELECT'}});assert.equal(input.readBallControls().shoot,false);
  target.emit('keydown',{code:'KeyT'});target.emit('blur');
  assert.equal(input.readBallControls().shoot,false);assert.equal(input.readBallControls().cancelShot,false);
});
