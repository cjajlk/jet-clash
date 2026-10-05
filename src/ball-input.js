import { aimDirection } from './ball-control.js';
import { stickAxis, STICK_DEADZONE } from './gamepad-input.js';
import { controlSettings } from './control-settings.js';

// Separate channel keeps the validated movement/jump/jetpack interface intact.
export class BallInput {
  constructor(target,source,onActivity){
    this.source=source;this.onActivity=onActivity;this.keys=new Set();this.previous={};this.blocked=false;this.cancelled=false;this.lastAim=null;
    target.addEventListener('keydown',e=>{
      if(!['KeyI','KeyJ','KeyK','KeyL','KeyF'].includes(e.code)||/^(INPUT|SELECT|BUTTON|TEXTAREA)$/.test(e.target.tagName))return;
      e.preventDefault();this.keys.add(e.code);onActivity('keyboard');
    });
    target.addEventListener('keyup',e=>this.keys.delete(e.code));
    target.addEventListener('blur',()=>this.clear());
    target.addEventListener('gamepaddisconnected',()=>{this.cancelled=true;});
  }
  clear(){this.keys.clear();this.blocked=true;this.cancelled=true;this.previous={};}
  read(index){
    let pads=[];try{pads=Array.from(this.source.getGamepads?.()||[]);}catch{}
    const supported=pads.filter(p=>p?.connected&&p.mapping==='standard');
    const pad=supported.find(p=>p.index===index)||supported[0];
    const shootButton=pad?.buttons?.[controlSettings.gamepad.shoot];
    const shoot=!!(shootButton?.pressed||shootButton?.value>.5);
    let cancelShot=this.cancelled||!!(this.previous.connected&&!pad);this.cancelled=false;
    // Only the shot button needs release after focus/start, never the aim stick.
    if(this.blocked&&!shoot)this.blocked=false;
    const padShoot=!this.blocked&&shoot;
    const wasPadShooting=!!this.previous.shoot;
    if(padShoot&&!wasPadShooting)this.onActivity('gamepad');
    const keyboardBindings=controlSettings.keyboard;
    const keyboard=aimDirection(Number(this.keys.has(keyboardBindings.aimRight[0]))-Number(this.keys.has(keyboardBindings.aimLeft[0])),Number(this.keys.has(keyboardBindings.aimDown[0]))-Number(this.keys.has(keyboardBindings.aimUp[0])));

    // While TIR is held (and on its release frame), the configured movement stick
    // becomes the 360° shot-aim stick. Outside a shot it stays exclusively a
    // movement/orientation control, so ordinary aerial handling is unchanged.
    const useLeft=controlSettings.gamepad.movementStick==='left';
    const padVector=aimDirection(stickAxis(pad?.axes?.[useLeft?0:2]),stickAxis(pad?.axes?.[useLeft?1:3]),STICK_DEADZONE);
    const padAim=(padShoot||wasPadShooting)?padVector:null;
    if(keyboard||padAim)this.lastAim=keyboard||padAim;
    const direction=keyboard||padAim||((padShoot||wasPadShooting)?this.lastAim:null);
    this.previous={connected:!!pad,shoot:padShoot};
    return {aimX:direction?.x||0,aimY:direction?.y||0,aimIntent:!!direction,shoot:this.keys.has((keyboardBindings.shoot[0]||'KeyF'))||padShoot,cancelShot};
  }
}
