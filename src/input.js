import { BallInput } from './ball-input.js';
import { GamepadInput } from './gamepad-input.js';
import { KEY_OPTIONS, controlSettings } from './control-settings.js';

export class KeyboardInput {
  constructor(target=window,onActivity=()=>{}) {
    this.keys=new Set();
    this.previousReset=false; // Initialize one-shot reset tracking for keyboard input
    this.codes=new Set(KEY_OPTIONS.map(option=>option.code));
    target.addEventListener('keydown',e=>{
      if (!this.codes.has(e.code) || /^(INPUT|SELECT|BUTTON|TEXTAREA)$/.test(e.target.tagName)) return;
      e.preventDefault(); this.keys.add(e.code);onActivity();
    });
    target.addEventListener('keyup',e=>this.keys.delete(e.code));
    target.addEventListener('blur',()=>this.clear());
  }
  clear() { this.keys.clear(); this.previousReset=false; }
  read() {
    const bindings=controlSettings.keyboard;
    const any=(action)=>bindings[action].some(k=>this.keys.has(k));
    const resetBall=any('resetBall')&&!this.previousReset;this.previousReset=any('resetBall');
    const directionX=Number(any('moveRight'))-Number(any('moveLeft'));
    const directionY=Number(any('aimDown'))-Number(any('aimUp'));
    return { axis:directionX,directionX,directionY,
      jump:any('jump'), boost:any('boost'), rotate:any('rotate'), backPose:any('backPose'), resetBall };
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
  resumeGamepad(){this.gamepad.resume?.();}
  readBallControls(){return this.ball.read(this.gamepad.index);}
  read(){
    const pad=this.gamepad.read(),keyboard=this.keyboard.read();
    if(!this.gamepad.status.supported)this.lastMethod='keyboard';
    const directionHeld=[...controlSettings.keyboard.moveLeft,...controlSettings.keyboard.moveRight].some(code=>this.keyboard.keys.has(code));
    // Keyboard directions retain priority when held; buttons combine by OR.
    // A connected or held controller therefore never disables keyboard controls.
    const keyboardVertical=keyboard.directionY!==0;
    return {axis:directionHeld?keyboard.axis:pad.axis,
      directionX:directionHeld?keyboard.directionX:pad.directionX,
      directionY:keyboardVertical?keyboard.directionY:pad.directionY,
      jump:keyboard.jump||pad.jump,boost:keyboard.boost||pad.boost,rotate:keyboard.rotate||pad.rotate,backPose:keyboard.backPose||pad.backPose,resetBall:keyboard.resetBall||pad.resetBall};
  }
}
