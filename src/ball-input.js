import { aimDirection } from './ball-control.js';
import { STICK_DEADZONE } from './gamepad-input.js';

// Separate channel keeps the validated movement/jump/jetpack interface intact.
export class BallInput {
  constructor(target,source,onActivity){
    this.source=source;this.onActivity=onActivity;this.keys=new Set();this.previous={};this.blocked=false;this.cancelled=false;
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
    const button=pad?.buttons?.[2],shoot=!!(button?.pressed||button?.value>.5);
    let aim=aimDirection(pad?.axes?.[2],pad?.axes?.[3],STICK_DEADZONE);
    let cancelShot=this.cancelled||!!(this.previous.connected&&!pad);this.cancelled=false;
    // Only the shot button needs release after focus/start, never the aim stick.
    if(this.blocked&&!shoot)this.blocked=false;
    const padShoot=!this.blocked&&shoot;
    if((aim&&(aim.x!==this.previous.x||aim.y!==this.previous.y))||(padShoot&&!this.previous.shoot))this.onActivity('gamepad');
    this.previous={connected:!!pad,x:aim?.x,y:aim?.y,shoot:padShoot};
    const keyboard=aimDirection(Number(this.keys.has('KeyL'))-Number(this.keys.has('KeyJ')),Number(this.keys.has('KeyK'))-Number(this.keys.has('KeyI')));
    const direction=keyboard||aim;
    return {aimX:direction?.x||0,aimY:direction?.y||0,shoot:this.keys.has('KeyF')||padShoot,cancelShot};
  }
}
