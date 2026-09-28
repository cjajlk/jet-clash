import { BallInput } from './ball-input.js';
import { GamepadInput } from './gamepad-input.js';

export class KeyboardInput {
  constructor(target=window,onActivity=()=>{}) {
    this.keys=new Set();
    this.codes=new Set(['ArrowLeft','ArrowRight','KeyA','KeyQ','KeyD','Space','ArrowUp','KeyW','KeyZ','ShiftLeft','ShiftRight']);
    target.addEventListener('keydown',e=>{
      if (!this.codes.has(e.code) || /^(INPUT|SELECT|BUTTON|TEXTAREA)$/.test(e.target.tagName)) return;
      e.preventDefault(); this.keys.add(e.code);onActivity();
    });
    target.addEventListener('keyup',e=>this.keys.delete(e.code));
    target.addEventListener('blur',()=>this.clear());
  }
  clear() { this.keys.clear(); }
  read() {
    const any=(...keys)=>keys.some(k=>this.keys.has(k));
    return { axis:Number(any('ArrowRight','KeyD'))-Number(any('ArrowLeft','KeyA','KeyQ')),
      jump:any('Space','ArrowUp','KeyW','KeyZ'), boost:any('ShiftLeft','ShiftRight') };
  }
}

// Both devices feed the existing player interface; no gameplay parameters change.
export class PlayerInput {
  constructor(target=window,source=navigator){
    this.lastMethod='keyboard';
    this.ball=new BallInput(target,source,method=>{this.lastMethod=method;});
    this.keyboard=new KeyboardInput(target,()=>{this.lastMethod='keyboard';});
    this.gamepad=new GamepadInput(target,source,()=>{this.lastMethod='gamepad';});
    target.addEventListener('blur',()=>this.gamepad.clear());
  }
  clear(){this.keyboard.clear();this.gamepad.clear();this.ball.clear();}
  readBallControls(){return this.ball.read(this.gamepad.index);}
  read(){
    const pad=this.gamepad.read(),keyboard=this.keyboard.read();
    if(!this.gamepad.status.supported)this.lastMethod='keyboard';
    const directionHeld=['ArrowLeft','ArrowRight','KeyA','KeyQ','KeyD'].some(code=>this.keyboard.keys.has(code));
    // Keyboard directions retain priority when held; buttons combine by OR.
    // A connected or held controller therefore never disables keyboard controls.
    return {axis:directionHeld?keyboard.axis:pad.axis,jump:keyboard.jump||pad.jump,boost:keyboard.boost||pad.boost};
  }
}
