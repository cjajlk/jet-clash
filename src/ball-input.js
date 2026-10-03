import { aimDirection } from './ball-control.js';
import { STICK_DEADZONE } from './gamepad-input.js';
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
    if(padShoot&&!this.previous.shoot)this.onActivity('gamepad');
    this.previous={connected:!!pad,shoot:padShoot};
    const keyboardBindings=controlSettings.keyboard;
    const keyboard=aimDirection(Number(this.keys.has(keyboardBindings.aimRight[0]))-Number(this.keys.has(keyboardBindings.aimLeft[0])),Number(this.keys.has(keyboardBindings.aimDown[0]))-Number(this.keys.has(keyboardBindings.aimUp[0])));
    if(keyboard)this.lastAim=keyboard;
    const direction=keyboard||this.lastAim;
    return {aimX:direction?.x||0,aimY:direction?.y||0,aimIntent:!!direction,shoot:this.keys.has((keyboardBindings.shoot[0]||'KeyF'))||padShoot,cancelShot};
  }
}
