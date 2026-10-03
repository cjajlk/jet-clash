import { CONFIG as C } from './config.js';
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const normalize=(x=0,y=0)=>{
  if(!Number.isFinite(x)||!Number.isFinite(y))return null;
  const length=Math.hypot(x,y);
  return length>1e-6?{x:x/length,y:y/length}:null;
};
export function createPlayer(skin) {
  return { skin, x: 0, y: 0, vx: 0, vy: 0, w: C.playerWidth, h: C.playerHeight,
    fuel: 100, grounded: false, boosting: false, jumpHeld: false, facing: 1,
    contactSurface: null, footX: 0, footY: 1, controlX: 1, controlY: 0, rotateHeld: false,
    jumpReady: true, impulseReady: true, impulseCooldown: 0, flipIntent: 0,
    flipHeld:false,flipReady:true,flipTimer:0,flipHit:false,flipX:1,flipY:0 };
}
export function drive(body, input, dt) {
  const rawTouch=input.touchDirection,rawAim=normalize(input.aimX,input.aimY);
  const rawDirection=rawAim||normalize(rawTouch?.x,rawTouch?.y);
  const support=body.contactSurface;
  const supported=body.grounded||!!support;
  const horizontal=body.facing||1;
  const rotationHeld=!!input.rotate;
  const flipPressed=rotationHeld&&!body.flipHeld;
  body.flipTimer=Math.max(0,body.flipTimer-dt);
  if(supported){body.flipReady=true;body.flipTimer=0;body.flipHit=false;}
  else if(flipPressed&&body.flipReady){
    body.flipTimer=C.airFlipDuration;body.flipReady=false;body.flipHit=false;
    const direction=rawDirection||normalize(Number(input.axis||0),0);
    body.flipX=direction?.x??horizontal;body.flipY=direction?.y??0;
  }
  body.flipHeld=rotationHeld;
  const airDirection=rawDirection||normalize(Number(input.axis||0),0);
  const controlDirection=supported?{x:horizontal,y:0}:(airDirection||{x:body.controlX||horizontal,y:body.controlY||0});
  const control=normalize(controlDirection.x,controlDirection.y)||{x:horizontal,y:0};
  body.controlX=control.x;body.controlY=control.y;
  body.rotateHeld=rotationHeld;
  const wantsFlip=!supported&&rotationHeld&&!!rawDirection&&rawDirection.y<C.airFlipIntentY;
  body.flipIntent=wantsFlip?Math.min(C.airFlipIntentTime,body.flipIntent+dt):Math.max(0,body.flipIntent-dt);
  const visualTarget=supported?(support==='ceiling'?{x:0,y:-1}:{x:0,y:1}):rotationHeld?(rawDirection||{x:body.footX||0,y:body.footY||1}):(!rawDirection?{x:0,y:1}:body.flipIntent>=C.airFlipIntentTime?control:normalize(control.x*C.airLeanFactor,1-Math.abs(control.x)*C.airLeanDepth)||{x:0,y:1});
  const turnRate=supported?C.groundOrientationRate:rotationHeld?C.airRotateRate:body.flipIntent>=C.airFlipIntentTime?C.airOrientationRate:C.airReturnOrientationRate;
  const visual=normalize(body.footX,body.footY)||{x:1,y:0};
  const visualEase=1-Math.exp(-turnRate*dt);
  const currentAngle=Math.atan2(visual.y,visual.x),targetAngle=Math.atan2(visualTarget.y,visualTarget.x);
  const angleDelta=Math.atan2(Math.sin(targetAngle-currentAngle),Math.cos(targetAngle-currentAngle));
  const angle=currentAngle+angleDelta*visualEase;
  body.footX=Math.cos(angle);body.footY=Math.sin(angle);
  const axis = Math.max(-1, Math.min(1, input.axis || 0));
  const accel = supported ? C.runAcceleration : C.airAcceleration;
  body.vx += axis * accel * dt;
  if (!axis) body.vx *= Math.exp(-(supported ? 13 : 1.5) * dt);
  body.vx = Math.max(-C.runSpeed, Math.min(C.runSpeed, body.vx));
  if (axis) body.facing = Math.sign(axis);
  body.impulseCooldown=Math.max(0,body.impulseCooldown-dt);
  const airLook=normalize(body.footX,body.footY)||{x:0,y:1};
  const orientedImpulse=normalize(airLook.x,-Math.abs(airLook.y))||{x:0,y:-1};
  const directionalImpulse=rawDirection&&Math.abs(rawDirection.x)>.18?normalize(rawDirection.x,-Math.abs(rawDirection.y))||orientedImpulse:orientedImpulse;
  if (input.jump && !body.jumpHeld) {
    if (supported && body.jumpReady) {
      body.vy = support==='ceiling' ? C.jumpSpeed : -C.jumpSpeed;
      body.grounded = false;
      body.contactSurface = null;
      body.jumpReady = false;
      body.impulseReady = true;
      body.flipIntent = 0;
    } else if (body.impulseReady && body.impulseCooldown <= 0) {
      const directional = body.rotateHeld||body.flipIntent>=C.airFlipIntentTime||Math.abs(airLook.x)>.45||(rawDirection&&Math.abs(rawDirection.x)>.18);
      const impulse = directional?directionalImpulse:{x:0,y:-1};
      body.vx += impulse.x * C.airImpulseSpeed;
      body.vy += impulse.y * C.airImpulseSpeed;
      body.impulseReady = false;
      body.impulseCooldown = C.airImpulseCooldown;
    }
  }
  body.jumpHeld = !!input.jump;
  body.boosting = !!input.boost && body.fuel >= C.fuelUse * dt;
  body.vy += C.gravity * dt;
  if (body.boosting) {
    // Only an explicit touch vector redirects airborne thrust. Ground takeoff,
    // keyboard, controller, fuel and thrust magnitude retain their old rules.
    if(rawDirection&&!supported){body.vx+=rawDirection.x*C.thrust*dt;body.vy+=rawDirection.y*C.thrust*dt;}
    else body.vy -= C.thrust * dt;
    body.fuel = Math.max(0, body.fuel - C.fuelUse * dt);
  }
  else if (!input.boost) body.fuel = Math.min(100, body.fuel + C.fuelRecharge * dt);
  body.vy = Math.max(-C.maxRise, Math.min(850, body.vy));
}
