import {CONFIG as C} from './config.js';
export const AERIAL_SHOTS=Object.freeze({rearPadding:10,rearMargin:8,inputSeconds:.18,contactSeconds:.16});
export function aerialContact(p,b,margin=2){
  const dx=b.x-p.x,dy=b.y-p.y,length=Math.hypot(dx,dy);if(!length)return null;
  const footLength=Math.hypot(p.footX,p.footY)||1;
  const fx=p.backPoseHeld?0:(p.footX||0)/footLength,fy=p.backPoseHeld?1:(p.footY??1)/footLength;
  const localFeet=dx*fx+dy*fy,localBack=(-dx*fy+dy*fx)*(p.facing||1);
  const bodyContact=Math.hypot(Math.max(0,Math.abs(dx)-p.w/2),Math.max(0,Math.abs(dy)-p.h/2))<=b.r+margin;
  if(bodyContact&&localFeet/length>=.65&&localFeet>=localBack)return 'feet';
  // A flat sporting surface along the back/jetpack, independent of the narrow body collider.
  const rear=p.w/2+AERIAL_SHOTS.rearPadding;
  const distance=Math.hypot(localBack-rear,Math.max(0,Math.abs(localFeet)-p.h/2));
  return localBack>p.w*.2&&distance<=b.r+AERIAL_SHOTS.rearMargin+margin?'back':null;
}
function movement(input){
  // Touch overrides the neutral keyboard/gamepad vector rather than being masked by zero.
  return {x:input.touchDirection?.x??input.directionX??input.axis??0,y:input.touchDirection?.y??input.directionY??0};
}
export function prepareAerialShot(p,b,input,dt=C.step){
  p.aerialInputTime=Math.max(0,(p.aerialInputTime||0)-dt);
  p.aerialRecentTime=Math.max(0,(p.aerialRecentTime||0)-dt);
  if(p.grounded||p.contactSurface){p.aerialContactLatched=false;p.aerialInputTime=0;p.aerialRecentTime=0;p.aerialReadyType=null;return null;}
  const face=aerialContact(p,b);
  if(!aerialContact(p,b,5))p.aerialContactLatched=false;
  if(input.jump&&!p.jumpHeld){p.aerialInputTime=AERIAL_SHOTS.inputSeconds;p.aerialInput=movement(input);}
  if(face){
    p.aerialRecentTime=AERIAL_SHOTS.contactSeconds;p.aerialFace=face;
    const distance=Math.hypot(b.x-p.x,b.y-p.y)||1;
    p.aerialRecentX=(b.x-p.x)/distance;p.aerialRecentY=(b.y-p.y)/distance;
    if(!p.aerialContactLatched){p.aerialContactLatched=true;p.impulseReady=true;p.flipReady=true;p.impulseCooldown=0;}
  }
  const dx=b.x-p.x,dy=b.y-p.y,len=Math.hypot(dx,dy);if(!len)return null;
  const x=dx/len,y=dy/len;
  const near=Math.hypot(Math.max(0,Math.abs(dx)-p.w/2),Math.max(0,Math.abs(dy)-p.h/2))<=b.r+20;
  const sameSide=x*p.aerialRecentX+y*p.aerialRecentY>.5;
  const eligible=face||(p.aerialRecentTime>0&&near&&sameSide?p.aerialFace:null);
  p.aerialReadyType=eligible==='back'?'gold':eligible==='feet'?'purple':null;
  if(!eligible||!p.aerialInputTime||!p.impulseReady)return null;
  const direction=p.aerialInput||movement(input),inputLength=Math.hypot(direction.x,direction.y),neutral=inputLength<.18;
  const away=inputLength>=.18&&(direction.x*x+direction.y*y)/inputLength<-.25;
  const type=eligible==='feet'&&neutral?'purple':eligible==='back'&&(away||(input.backPose&&neutral))?'gold':null;
  if(!type)return null;
  p.aerialInputTime=0;p.aerialRecentTime=0;p.aerialReadyType=null;
  p.jumpHeld=true;p.impulseReady=false;p.flipReady=false;p.impulseCooldown=C.airImpulseCooldown;
  p.flipTimer=0;p.flipHit=true;
  return {type,x,y};
}
export function applyAerialShot(p,b,shot){
  const speed=shot.type==='gold'?950:800;
  b.vx=shot.x*speed;b.vy=shot.y*speed;markSpecialShot(b,shot.type);
  p.vx-=shot.x*180;p.vy-=shot.y*180;
}
export function markSpecialShot(b,type){
  if(!['gold','purple'].includes(type))return;
  b.flash=.35;b.shotColor=type;b.shotTimer=1.1;b.shotTrail=[{x:b.x,y:b.y}];
}
export function aimedSpecialShotType(p,b){
  if(!p||p.grounded||p.contactSurface)return null;
  const face=aerialContact(p,b);
  return face==='back'?'gold':face==='feet'?'purple':null;
}
