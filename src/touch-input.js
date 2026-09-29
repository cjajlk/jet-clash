import { stickAxis, STICK_DEADZONE } from './gamepad-input.js';
import { aimDirection } from './ball-control.js';

// Device adapter only. These values feed the existing gameplay unchanged.
export class TouchInput {
  constructor(){this.pointers=new Map();this.cancelled=false;this.releaseAim=null;}
  start(id,control,x=0,y=0){
    if(this.pointers.has(id)||!['move','aim','jump','boost','shoot'].includes(control))return false;
    if(['move','aim'].includes(control)&&[...this.pointers.values()].some(p=>p.control===control))return false;
    if(control==='shoot')this.releaseAim=null;
    this.pointers.set(id,{control,x,y});return true;
  }
  move(id,x,y){const p=this.pointers.get(id);if(p){p.x=x;p.y=y;}}
  end(id,cancel=false){
    const p=this.pointers.get(id);
    if(p?.control==='shoot'){
      if(cancel){this.cancelled=true;this.releaseAim=null;}
      else this.releaseAim=aimDirection(p.x,p.y,STICK_DEADZONE);
    }
    this.pointers.delete(id);
  }
  clear(){this.pointers.clear();this.cancelled=true;this.releaseAim=null;}
  read(){
    const pointers=[...this.pointers.values()],move=pointers.find(p=>p.control==='move'),aim=pointers.find(p=>p.control==='aim'),shot=pointers.find(p=>p.control==='shoot');
    const drag=aimDirection(shot?.x,shot?.y,STICK_DEADZONE),releaseAim=this.releaseAim;
    const direction=drag||releaseAim||aimDirection(aim?.x,aim?.y,STICK_DEADZONE),cancelShot=this.cancelled;this.cancelled=false;this.releaseAim=null;
    return {axis:stickAxis(move?.x),aimX:direction?.x||0,aimY:direction?.y||0,
      jump:pointers.some(p=>p.control==='jump'),boost:pointers.some(p=>p.control==='boost'),shoot:pointers.some(p=>p.control==='shoot'),
      moveActive:!!move,aimActive:!!(aim||drag||releaseAim),cancelShot,releaseAim,
      direction:aimDirection(move?.x,move?.y,STICK_DEADZONE)};
  }
}

export function combineTouch(base,touch){
  // A held touch stick controls only its own channel. Lifting it restores the
  // keyboard/gamepad immediately; action buttons combine without disabling them.
  return {...base,...(touch.direction?{touchDirection:touch.direction}:{}),axis:touch.moveActive?touch.axis:base.axis,
    aimX:touch.aimActive?touch.aimX:base.aimX,aimY:touch.aimActive?touch.aimY:base.aimY,
    jump:base.jump||touch.jump,boost:base.boost||touch.boost,shoot:base.shoot||touch.shoot,
    cancelShot:base.cancelShot||touch.cancelShot};
}
