import { CONFIG as C } from './config.js';
import { circlePolygonContact } from './collision-shapes.js';

// Local contact assistance only: never a spring, position constraint or attraction.
export const BALL_CONTROL = Object.freeze({captureSpeed:430, releaseSpeed:600,
  reach:78, contactMargin:10, pushAcceleration:900, chargeSeconds:.7,
  shotSpeed:520, chargedSpeed:1000, pressureShotSpeed:700, pressureChargedSpeed:1080,
  cooldown:.3, impactSpeed:260, contactBounce:.08, controlDamping:7, orientationThreshold:.12,
  shotPrepareEnterMargin:14, shotPrepareExitMargin:24, shotIntentSeconds:.24, recentContactSeconds:.12,
  liftAcceleration:1450, liftMaxUpSpeed:520, liftIntentThreshold:.22});
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
  const airVisualOffset=!p.grounded&&p.contactSurface!=='floor'?(C.ballControlAirOffsetY||0):0;
  const center={x:p.x+side.x*C.ballControlOffsetX+body.x*C.ballControlOffsetY,y:p.y+side.y*C.ballControlOffsetX+body.y*C.ballControlOffsetY+airVisualOffset};
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
  const zone=resolveBallContactZone(p);if(!zone)return zone;const {vertices,center,body,side}=zone;
  // Debug-only view of Fluid's sporting hitbox. The four labelled faces rotate
  // with the exact same axes used by ball contact; this never changes physics.
  const face=(a,b,label,color)=>{
    const mid={x:(a.x+b.x)/2,y:(a.y+b.y)/2};
    ctx.save();ctx.setLineDash([]);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.strokeStyle=color;ctx.lineWidth=4;ctx.stroke();
    ctx.font='bold 10px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=color;ctx.shadowColor='#050817';ctx.shadowBlur=4;ctx.fillText(label,mid.x,mid.y);ctx.restore();
  };
  ctx.save();ctx.beginPath();vertices.forEach((v,i)=>i?ctx.lineTo(v.x,v.y):ctx.moveTo(v.x,v.y));ctx.closePath();ctx.fillStyle='rgba(255,72,72,0.08)';ctx.strokeStyle='rgba(255,255,255,0.7)';ctx.lineWidth=1.5;ctx.setLineDash([7,5]);ctx.fill();ctx.stroke();ctx.restore();
  // Local +side is AVANT, -side is DOS, -body is TETE and +body is PIEDS.
  face(vertices[1],vertices[4],'AVANT','#6fffd2');
  face(vertices[5],vertices[0],'DOS','#ff9ed8');
  face(vertices[0],vertices[1],'TETE','#7bdcff');
  face(vertices[4],vertices[5],'PIEDS','#ffd56f');
  ctx.save();ctx.setLineDash([]);ctx.beginPath();ctx.moveTo(center.x,center.y);ctx.lineTo(center.x-body.x*22,center.y-body.y*22);ctx.strokeStyle='rgba(123,220,255,.8)';ctx.lineWidth=2;ctx.stroke();ctx.beginPath();ctx.moveTo(center.x,center.y);ctx.lineTo(center.x+side.x*22,center.y+side.y*22);ctx.strokeStyle='rgba(111,255,210,.8)';ctx.stroke();ctx.restore();
  return zone;
}
export class BallControl {
  constructor(){this.showAim=true;this.reset();}
  reset(){this.owned=false;this.pressure=false;this.shotContact=false;this.shotPrepared=false;this.pendingShot=null;this.pendingShotTime=0;this.recentContactTime=0;this.charge=0;this.charging=false;this.held=false;this.cooldown=0;this.aim=null;}
  release(){this.owned=false;this.pressure=false;this.shotContact=false;this.shotPrepared=false;this.pendingShot=null;this.pendingShotTime=0;this.recentContactTime=0;this.charging=false;this.charge=0;this.aim=null;this.cooldown=BALL_CONTROL.cooldown;}
  contact(p,b){
    const zone=resolveBallContactZone(p);
    return !!circlePolygonContact(b,zone.vertices);
  }
  prepareContact(p,b,margin){
    const zone=resolveBallContactZone(p);
    return !!circlePolygonContact({...b,r:b.r+margin},zone.vertices);
  }
  update(p,b,input,dt,heavy=null){
    const T=BALL_CONTROL;this.cooldown=Math.max(0,this.cooldown-dt);this.pendingShotTime=Math.max(0,this.pendingShotTime-dt);this.recentContactTime=Math.max(0,this.recentContactTime-dt);if(this.pendingShotTime<=0)this.pendingShot=null;
    const pressed=!!input.shoot,relative=Math.hypot(b.vx-p.vx,b.vy-p.vy);
    const control=normalize(p.controlX,p.controlY)||{x:p.facing||1,y:0};
    const toBall=normalize(b.x-p.x,b.y-p.y);
    const coherence=toBall?toBall.x*control.x+toBall.y*control.y:-1;
    if(input.cancelShot){this.release();this.held=pressed;return;}
    // Losing a soft possession must not erase a shot already being prepared in flight.
    // Only the possession state is dropped; charge/aim remain armed while TIR stays held.
    if(this.owned&&(Math.hypot(b.x-p.x,b.y-p.y)>T.reach||relative>T.releaseSpeed||coherence<-T.orientationThreshold)){
      this.owned=false;this.pressure=false;
    }
    const touching=this.contact(p,b);
    if(!this.owned&&!this.cooldown&&touching&&relative<=T.captureSpeed&&coherence>=T.orientationThreshold)this.owned=true;
    // The visible sporting zone is also the exact shot-enabling zone: the ball's
    // circumference only has to touch it. Orientation still controls possession,
    // damping and shot direction; it no longer makes a genuine close contact inert.
    this.shotContact=!this.cooldown&&touching;
    // The aiming arrow uses a slightly wider, hysteretic preparation envelope.
    // Enter close to Fluid, leave only after moving farther away: no frame-to-frame flicker.
    const prepareMargin=this.shotPrepared?T.shotPrepareExitMargin:T.shotPrepareEnterMargin;
    this.shotPrepared=!this.cooldown&&this.prepareContact(p,b,prepareMargin);
    // A contested touch grants a shot opportunity, never possession or attraction.
    this.pressure=!!heavy&&!this.cooldown&&touching&&this.contact(heavy,b)&&coherence>=T.orientationThreshold&&(p.x-b.x)*(heavy.x-b.x)<0;
    const explicitAim=input.aimIntent?aimDirection(input.aimX,input.aimY):null;

    // TIR is now a real pre-charge: it starts immediately, even with no ball nearby.
    // This lets an airborne player prepare power + direction before reaching the ball.
    if(pressed&&!this.charging&&!this.cooldown){this.charging=true;this.charge=0;}
    if(pressed&&this.charging)this.charge=Math.min(T.chargeSeconds,this.charge+dt);
    this.aim=(this.charging||this.available)?(explicitAim||control):null;

    if(!pressed&&this.held&&this.charging){
      const pressure=this.pressure,dir=this.aim||explicitAim||control;
      const canStrike=touching||pressure||this.recentContactTime>0;
      const low=pressure?T.pressureShotSpeed:T.shotSpeed,high=pressure?T.pressureChargedSpeed:T.chargedSpeed;
      const speed=low+(high-low)*this.chargeFraction;
      const shot={vx:dir.x*speed+p.vx*.2,vy:dir.y*speed+p.vy*.2};

      this.owned=false;this.pressure=false;this.shotContact=false;this.shotPrepared=false;
      this.charging=false;this.charge=0;this.aim=null;this.cooldown=T.cooldown;

      // Real contact fires immediately. Otherwise the released gesture stays armed
      // briefly so an aerial approach can meet the ball just after release. No force
      // is applied until a genuine Fluid↔ball contact is reported.
      if(canStrike&&!pressure)this.applyShot(b,shot);
      else {this.pendingShot=shot;this.pendingShotTime=T.shotIntentSeconds;}
    }else if(this.owned&&!this.pressure&&this.contact(p,b)&&coherence>=T.orientationThreshold){
      // A controlled touch absorbs part of the relative speed. The ball can
      // still escape naturally if the player misaligns or overcommits.
      const absorb=Math.max(0,1-relative/T.captureSpeed);
      const mix=Math.min(1,T.controlDamping*dt*absorb*Math.max(.2,coherence));
      b.vx+= (p.vx-b.vx)*mix;
      b.vy+= (p.vy-b.vy)*mix;

      // Controlled lift remains only a contact aid; aimed shots are handled above.
      const zone=resolveBallContactZone(p);
      const dx=b.x-zone.center.x,dy=b.y-zone.center.y;
      const localSide=dx*zone.side.x+dy*zone.side.y;
      const localBody=dx*zone.body.x+dy*zone.body.y;
      const upwardIntent=Math.max(0,-control.y);
      const underBall=b.y<p.y && localBody<0;
      const centered=Math.max(0,1-Math.abs(localSide)/(b.r+C.playerWidth*.45));
      if(underBall&&upwardIntent>=T.liftIntentThreshold&&centered>0){
        const lift=T.liftAcceleration*upwardIntent*(.35+.65*centered)*dt;
        b.vy=Math.max(-T.liftMaxUpSpeed,b.vy-lift);
      }
    }
    this.held=pressed;
  }
  applyShot(b,shot){
    b.vx=shot.vx;b.vy=shot.vy;const speed=Math.hypot(b.vx,b.vy);
    if(speed>C.maxBallSpeed){b.vx*=C.maxBallSpeed/speed;b.vy*=C.maxBallSpeed/speed;}b.flash=.12;
  }
  finishContacts(b,p,physicalPlayerContact=false){
    // Resolve ordinary body/arena contacts first. A collision solver can separate the
    // ball a few pixels before this method runs, so preserve the real contact event
    // reported by hitPlayer(). This makes the entry into Fluid's striking surface
    // precise without enlarging the validated sporting hitbox or attracting the ball.
    const genuineEntry=!!physicalPlayerContact||(!p||this.contact(p,b));
    if(genuineEntry)this.recentContactTime=BALL_CONTROL.recentContactSeconds;
    if(this.pendingShot&&this.pendingShotTime>0&&genuineEntry){
      this.applyShot(b,this.pendingShot);this.pendingShot=null;this.pendingShotTime=0;
    }
  }
  impact(before,b,heavyContact){
    if(this.pressure&&heavyContact){this.owned=false;return;}
    if(this.owned&&(heavyContact||Math.hypot(b.vx-before.vx,b.vy-before.vy)>BALL_CONTROL.impactSpeed)){
      if(this.charging){this.owned=false;this.pressure=false;}
      else this.release();
    }
  }
  get softContact(){return this.owned||this.charging||!!this.pendingShot;}
  get available(){return this.charging||this.owned||this.pressure||this.shotContact||this.shotPrepared||!!this.pendingShot;}
  get chargeFraction(){return this.charge/BALL_CONTROL.chargeSeconds;}
  get indicator(){return this.showAim&&this.available&&this.aim?{...this.aim,charge:this.chargeFraction}:null;}
}
