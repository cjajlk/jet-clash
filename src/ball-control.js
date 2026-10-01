import { CONFIG as C } from './config.js';
import { circlePolygonContact } from './collision-shapes.js';

// Local contact assistance only: never a spring, position constraint or attraction.
export const BALL_CONTROL = Object.freeze({captureSpeed:430, releaseSpeed:600,
  reach:78, contactMargin:10, pushAcceleration:900, chargeSeconds:.7,
  shotSpeed:520, chargedSpeed:1000, pressureShotSpeed:700, pressureChargedSpeed:1080,
  cooldown:.3, impactSpeed:260, contactBounce:.08, controlDamping:7, orientationThreshold:.12});
const normalize=(x=0,y=0)=>{
  if(!Number.isFinite(x)||!Number.isFinite(y))return null;
  const length=Math.hypot(x,y);
  return length>1e-6?{x:x/length,y:y/length}:null;
};
export function aimDirection(x=0,y=0,deadzone=.18){
  if(!Number.isFinite(x)||!Number.isFinite(y))return null;
  const length=Math.hypot(x,y);return length>deadzone?{x:x/length,y:y/length}:null;
}
function resolveBallContactAxes(p){
  const body=normalize(p.footX,p.footY)||{x:0,y:1};
  const facing=p.facing||1;
  const side={x:body.y*facing,y:-body.x*facing};
  const center={x:p.x+side.x*C.ballControlOffsetX+body.x*C.ballControlOffsetY,y:p.y+side.y*C.ballControlOffsetX+body.y*C.ballControlOffsetY};
  return {body,side,center};
}
export function resolveBallContactZone(p){
  const {body,side,center}=resolveBallContactAxes(p);
  const width=C.ballControlWidth+BALL_CONTROL.contactMargin*2;
  const height=C.ballControlHeight+BALL_CONTROL.contactMargin*2;
  const front=width*.34,frontTip=width*.10,back=width*.22,backTip=width*.06,top=height*.42,mid=height*.18,bottom=height*.40;
  const local=[
    {x:-backTip,y:-top},
    {x:front,y:-top},
    {x:front+frontTip,y:-mid},
    {x:front+frontTip,y:mid},
    {x:front,y:bottom},
    {x:-back,y:bottom},
    {x:-back-backTip,y:mid},
    {x:-back-backTip,y:-mid},
  ];
  const vertices=local.map(({x,y})=>({x:center.x+side.x*x+body.x*y,y:center.y+side.y*x+body.y*y}));
  return {center,body,side,vertices};
}
export function drawBallContactZone(ctx,p){
  const zone=resolveBallContactZone(p);if(!zone)return zone;const {vertices}=zone;
  ctx.save();ctx.beginPath();vertices.forEach((v,i)=>i?ctx.lineTo(v.x,v.y):ctx.moveTo(v.x,v.y));ctx.closePath();ctx.fillStyle='rgba(255,72,72,0.08)';ctx.strokeStyle='rgba(255,72,72,0.85)';ctx.lineWidth=2;ctx.setLineDash([8,6]);ctx.fill();ctx.stroke();ctx.restore();
  return zone;
}
export class BallControl {
  constructor(){this.showAim=true;this.reset();}
  reset(){this.owned=false;this.pressure=false;this.pendingShot=null;this.charge=0;this.charging=false;this.held=false;this.cooldown=0;this.aim=null;}
  release(){this.owned=false;this.pressure=false;this.pendingShot=null;this.charging=false;this.charge=0;this.aim=null;this.cooldown=BALL_CONTROL.cooldown;}
  contact(p,b){
    const zone=resolveBallContactZone(p);
    return !!circlePolygonContact(b,zone.vertices);
  }
  update(p,b,input,dt,heavy=null){
    const T=BALL_CONTROL;this.cooldown=Math.max(0,this.cooldown-dt);
    const pressed=!!input.shoot,relative=Math.hypot(b.vx-p.vx,b.vy-p.vy);
    const control=normalize(p.controlX,p.controlY)||{x:p.facing||1,y:0};
    const toBall=normalize(b.x-p.x,b.y-p.y);
    const coherence=toBall?toBall.x*control.x+toBall.y*control.y:-1;
    if(input.cancelShot){this.release();this.held=pressed;return;}
    if(this.owned&&(Math.hypot(b.x-p.x,b.y-p.y)>T.reach||relative>T.releaseSpeed||coherence<-T.orientationThreshold))this.release();
    if(!this.owned&&!this.cooldown&&this.contact(p,b)&&relative<=T.captureSpeed&&coherence>=T.orientationThreshold)this.owned=true;
    // A contested touch grants a shot opportunity, never possession or attraction.
    this.pressure=!!heavy&&!this.cooldown&&this.contact(p,b)&&this.contact(heavy,b)&&coherence>=T.orientationThreshold&&(p.x-b.x)*(heavy.x-b.x)<0;
    const explicitAim=input.aimIntent?aimDirection(input.aimX,input.aimY):null;
    this.aim=this.available?(explicitAim||control):null;
    if(this.available){
      // Charge starts on acquisition even when the button was already held.
      if(pressed&&!this.charging){this.charging=true;this.charge=0;}
      if(pressed&&this.charging)this.charge=Math.min(T.chargeSeconds,this.charge+dt);
      if(!pressed&&this.held&&this.charging){
        const pressure=this.pressure,dir=this.aim||control;
        const low=pressure?T.pressureShotSpeed:T.shotSpeed,high=pressure?T.pressureChargedSpeed:T.chargedSpeed;
        const speed=low+(high-low)*this.chargeFraction,shot={vx:dir.x*speed+p.vx*.2,vy:dir.y*speed+p.vy*.2};
        this.release();
        if(pressure)this.pendingShot=shot;else this.applyShot(b,shot);
      }else if(this.owned&&!this.pressure&&this.contact(p,b)&&coherence>=T.orientationThreshold){
        // A controlled touch absorbs part of the relative speed. The ball can
        // still escape naturally if the player misaligns or overcommits.
        const absorb=Math.max(0,1-relative/T.captureSpeed);
        const mix=Math.min(1,T.controlDamping*dt*absorb*Math.max(.2,coherence));
        b.vx+= (p.vx-b.vx)*mix;
        b.vy+= (p.vy-b.vy)*mix;
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
