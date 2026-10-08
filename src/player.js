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
export function setBackPose(body,input){
  if(input.backPose&&!body.backPoseHeld)body.facing=-(body.facing||1);
  body.backPoseHeld=!!input.backPose;
}
export function drive(body, input, dt) {
  setBackPose(body,input);
  const rawTouch=input.touchDirection;
  const rawAim=normalize(input.aimX,input.aimY);
  const rawDirection=normalize(input.directionX,input.directionY)||normalize(rawTouch?.x,rawTouch?.y)||rawAim;
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
  const wantsFlip=!supported&&!!rawDirection;
  body.flipIntent=wantsFlip?Math.min(C.airFlipIntentTime,body.flipIntent+dt):Math.max(0,body.flipIntent-dt);
  // footX/footY points toward the feet, so the body/head faces opposite the stick.
  // Trajectory is untouched: the stick changes orientation, not existing velocity.
  const stickFootTarget=rawDirection?{x:-rawDirection.x,y:-rawDirection.y}:null;
  const visualTarget=supported?(support==='ceiling'?{x:0,y:-1}:{x:0,y:1}):body.backPoseHeld?{x:0,y:1}:(stickFootTarget||(rotationHeld?{x:body.footX||0,y:body.footY||1}:{x:0,y:1}));
  const turnRate=supported?C.groundOrientationRate:rawDirection?(rotationHeld?C.airRotateRate:C.airOrientationRate):C.airReturnOrientationRate;
  const visual=normalize(body.footX,body.footY)||{x:1,y:0};
  const visualEase=1-Math.exp(-turnRate*dt);
  const currentAngle=Math.atan2(visual.y,visual.x),targetAngle=Math.atan2(visualTarget.y,visualTarget.x);
  const angleDelta=Math.atan2(Math.sin(targetAngle-currentAngle),Math.cos(targetAngle-currentAngle));
  const angle=currentAngle+angleDelta*visualEase;
  body.footX=Math.cos(angle);body.footY=Math.sin(angle);
  const axis = Math.max(-1, Math.min(1, input.axis || 0));
  const accel = supported ? C.runAcceleration : C.airAcceleration;
  // Walking/air steering caps its own acceleration, never an existing boost,
  // flip or collision impulse. Opposite input can still brake that momentum.
  const previousVx=body.vx;
  const steeredVx=previousVx+axis*accel*dt;
  body.vx=axis>0?Math.min(steeredVx,Math.max(C.runSpeed,previousVx)):
    axis<0?Math.max(steeredVx,Math.min(-C.runSpeed,previousVx)):previousVx;
  if (!axis) body.vx *= Math.exp(-(supported ? 13 : C.airHorizontalDrag) * dt);
  if (axis&&!body.backPoseHeld) body.facing = Math.sign(axis);
  body.impulseCooldown=Math.max(0,body.impulseCooldown-dt);
  const airLook=normalize(body.footX,body.footY)||{x:0,y:1};
  const orientedImpulse=normalize(airLook.x,-Math.abs(airLook.y))||{x:0,y:-1};
  const directionalImpulse=rawDirection||orientedImpulse;
  if (input.jump && !body.jumpHeld) {
    if (supported && body.jumpReady) {
      body.vy = support==='ceiling' ? C.jumpSpeed : -C.jumpSpeed;
      body.grounded = false;
      body.contactSurface = null;
      body.jumpReady = false;
      body.impulseReady = true;
      body.flipIntent = 0;
    } else if (body.impulseReady && body.impulseCooldown <= 0) {
      // Rule: neutral second press = neutral double jump; stick + second press = directional flip.
      const impulse = rawDirection?directionalImpulse:{x:0,y:-1};
      if(rawDirection){
        body.vx += impulse.x * C.airImpulseSpeed;
        body.vy += impulse.y * C.airImpulseSpeed;
      } else {
        // A neutral double jump starts a fresh upward stage. Adding the old
        // 260 impulse while already at maxRise was immediately swallowed by
        // the vertical speed clamp, so CJ could barely gain extra height.
        // Restarting the normal jump rise preserves horizontal inertia while
        // guaranteeing a real second tier of altitude, including on descent.
        body.vy = -C.jumpSpeed;
      }
      if(rawDirection){
        // A directional second jump is the flip itself: animate the full roll and
        // expose its direction to the ball-contact strike during the same window.
        body.flipTimer=C.airFlipDuration;body.flipReady=false;body.flipHit=false;
        body.flipX=impulse.x;body.flipY=impulse.y;
      }
      body.impulseReady = false;
      body.impulseCooldown = C.airImpulseCooldown;
    }
  }
  body.jumpHeld = !!input.jump;
  body.boosting = !!input.boost && body.fuel >= C.fuelUse * dt;
  body.vy += C.gravity * dt;
  if (body.boosting) {
    // Jet V4: in the air, thrust follows Fluid's actual facing/orientation instead
    // of always pulling vertically.  The feet vector points away from the head,
    // therefore the propulsion direction is its opposite. Touch keeps its direct
    // 360° vector so the existing mobile control remains immediate.
    const touchJet=normalize(rawTouch?.x,rawTouch?.y);
    const bodyJet=normalize(-body.footX,-body.footY)||{x:0,y:-1};
    const jetDirection=!supported&&body.skin==='fluid'?(touchJet||bodyJet):{x:0,y:-1};
    // Bound powered horizontal flight to the existing run + flip speed.
    const jetLimit=C.runSpeed+C.airImpulseSpeed;
    const beforeJet=body.vx;
    const jetVx=beforeJet+jetDirection.x*C.thrust*dt;
    body.vx=jetDirection.x>0?Math.min(jetVx,Math.max(jetLimit,beforeJet)):
      jetDirection.x<0?Math.max(jetVx,Math.min(-jetLimit,beforeJet)):beforeJet;
    body.vy += jetDirection.y * C.thrust * dt;
    body.fuel = Math.max(0, body.fuel - C.fuelUse * dt);
  }
  else if (!input.boost && supported) body.fuel = Math.min(100, body.fuel + C.fuelRecharge * dt);
  body.vy = Math.max(-C.maxRise, Math.min(850, body.vy));
}
