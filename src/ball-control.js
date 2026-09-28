import { CONFIG as C } from './config.js';

// Local contact assistance only: never a spring, position constraint or attraction.
export const BALL_CONTROL = Object.freeze({captureSpeed:430, releaseSpeed:600,
  reach:78, contactMargin:10, pushAcceleration:900, chargeSeconds:.7,
  shotSpeed:520, chargedSpeed:1000, pressureShotSpeed:700, pressureChargedSpeed:1080,
  cooldown:.3, impactSpeed:260, contactBounce:.08});
export function aimDirection(x=0,y=0,deadzone=.18){
  if(!Number.isFinite(x)||!Number.isFinite(y))return null;
  const length=Math.hypot(x,y);return length>deadzone?{x:x/length,y:y/length}:null;
}
export class BallControl {
  constructor(){this.showAim=true;this.reset();}
  reset(){this.owned=false;this.pressure=false;this.pendingShot=null;this.charge=0;this.charging=false;this.held=false;this.cooldown=0;this.aim=null;}
  release(){this.owned=false;this.pressure=false;this.pendingShot=null;this.charging=false;this.charge=0;this.aim=null;this.cooldown=BALL_CONTROL.cooldown;}
  contact(p,b){
    const dx=Math.max(0,Math.abs(b.x-p.x)-p.w/2),dy=Math.max(0,Math.abs(b.y-p.y)-p.h/2);
    return Math.hypot(dx,dy)<=b.r+BALL_CONTROL.contactMargin;
  }
  update(p,b,input,dt,heavy=null){
    const T=BALL_CONTROL;this.cooldown=Math.max(0,this.cooldown-dt);
    const pressed=!!input.shoot,relative=Math.hypot(b.vx-p.vx,b.vy-p.vy);
    const front=(b.x-p.x)*p.facing;
    if(input.cancelShot){this.release();this.held=pressed;return;}
    if(this.owned&&(Math.hypot(b.x-p.x,b.y-p.y)>T.reach||relative>T.releaseSpeed||front<0))this.release();
    if(!this.owned&&!this.cooldown&&front>=p.w/2&&relative<=T.captureSpeed&&this.contact(p,b))this.owned=true;
    // A contested touch grants a shot opportunity, never possession or attraction.
    this.pressure=!!heavy&&!this.cooldown&&front>=0&&this.contact(p,b)&&this.contact(heavy,b)&&(p.x-b.x)*(heavy.x-b.x)<0;
    this.aim=this.available?aimDirection(input.aimX,input.aimY):null;
    if(this.available){
      // Charge starts on acquisition even when the button was already held.
      if(pressed&&!this.charging){this.charging=true;this.charge=0;}
      if(pressed&&this.charging)this.charge=Math.min(T.chargeSeconds,this.charge+dt);
      if(!pressed&&this.held&&this.charging){
        const pressure=this.pressure,dir=this.aim||{x:p.facing,y:0};
        const low=pressure?T.pressureShotSpeed:T.shotSpeed,high=pressure?T.pressureChargedSpeed:T.chargedSpeed;
        const speed=low+(high-low)*this.chargeFraction,shot={vx:dir.x*speed+p.vx*.2,vy:dir.y*speed+p.vy*.2};
        this.release();
        if(pressure)this.pendingShot=shot;else this.applyShot(b,shot);
      }else if(this.owned&&!this.pressure&&this.contact(p,b)&&front>=p.w/2){
        // Outward pressure at contact only. Never pull an escaping ball back.
        const outward=(p.vx-b.vx)*p.facing;
        if(outward>0)b.vx+=p.facing*Math.min(outward,T.pushAcceleration*dt);
      }
    }else{this.charging=false;this.charge=0;}
    this.held=pressed;
  }
  applyShot(b,shot){
    b.vx=shot.vx;b.vy=shot.vy;const speed=Math.hypot(b.vx,b.vy);
    if(speed>C.maxBallSpeed){b.vx*=C.maxBallSpeed/speed;b.vy*=C.maxBallSpeed/speed;}b.flash=.12;
  }
  finishContacts(b){
    // Resolve all body/arena contacts first, then apply the voluntary impulse.
    // No position changes or collision exemptions; next step uses normal physics.
    if(this.pendingShot){this.applyShot(b,this.pendingShot);this.pendingShot=null;}
  }
  impact(before,b,heavyContact){
    if(this.pressure&&heavyContact){this.owned=false;return;}
    if(this.owned&&(heavyContact||Math.hypot(b.vx-before.vx,b.vy-before.vy)>BALL_CONTROL.impactSpeed))this.release();
  }
  get available(){return this.owned||this.pressure;}
  get chargeFraction(){return this.charge/BALL_CONTROL.chargeSeconds;}
  get indicator(){return this.showAim&&this.available&&this.aim?{...this.aim,charge:this.chargeFraction}:null;}
}
