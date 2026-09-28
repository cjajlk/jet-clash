import { stickAxis, STICK_DEADZONE } from './gamepad-input.js';
import { aimDirection } from './ball-control.js';

// Device adapter only. These values feed the existing gameplay unchanged.
export class TouchInput {
  constructor(){this.pointers=new Map();this.cancelled=false;}
  start(id,control,x=0,y=0){
    if(this.pointers.has(id)||!['move','aim','jump','boost','shoot'].includes(control))return false;
    if(['move','aim'].includes(control)&&[...this.pointers.values()].some(p=>p.control===control))return false;
    this.pointers.set(id,{control,x,y});return true;
  }
  move(id,x,y){const p=this.pointers.get(id);if(p){p.x=x;p.y=y;}}
  end(id,cancel=false){const p=this.pointers.get(id);if(p?.control==='shoot'&&cancel)this.cancelled=true;this.pointers.delete(id);}
  clear(){this.pointers.clear();this.cancelled=true;}
  read(){
    const pointers=[...this.pointers.values()],move=pointers.find(p=>p.control==='move'),aim=pointers.find(p=>p.control==='aim');
    const direction=aimDirection(aim?.x,aim?.y,STICK_DEADZONE),cancelShot=this.cancelled;this.cancelled=false;
    return {axis:stickAxis(move?.x),aimX:direction?.x||0,aimY:direction?.y||0,
      jump:pointers.some(p=>p.control==='jump'),boost:pointers.some(p=>p.control==='boost'),shoot:pointers.some(p=>p.control==='shoot'),
      moveActive:!!move,aimActive:!!aim,cancelShot};
  }
}

export function combineTouch(base,touch){
  // A held touch stick controls only its own channel. Lifting it restores the
  // keyboard/gamepad immediately; action buttons combine without disabling them.
  return {...base,axis:touch.moveActive?touch.axis:base.axis,
    aimX:touch.aimActive?touch.aimX:base.aimX,aimY:touch.aimActive?touch.aimY:base.aimY,
    jump:base.jump||touch.jump,boost:base.boost||touch.boost,shoot:base.shoot||touch.shoot,
    cancelShot:base.cancelShot||touch.cancelShot};
}
