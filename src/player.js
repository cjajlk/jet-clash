import { CONFIG as C } from './config.js';
export function createPlayer(skin) {
  return { skin, x: 0, y: 0, vx: 0, vy: 0, w: C.playerWidth, h: C.playerHeight,
    fuel: 100, grounded: false, boosting: false, jumpHeld: false, facing: 1 };
}
export function drive(body, input, dt) {
  const raw=input.touchDirection,mag=raw?Math.hypot(raw.x,raw.y):0;
  const direction=Number.isFinite(mag)&&mag>0?{x:raw.x/mag,y:raw.y/mag}:null;
  if(direction)body.touchDirection=direction;else delete body.touchDirection;
  const axis = Math.max(-1, Math.min(1, input.axis || 0));
  const accel = body.grounded ? C.runAcceleration : C.airAcceleration;
  body.vx += axis * accel * dt;
  if (!axis) body.vx *= Math.exp(-(body.grounded ? 13 : 1.5) * dt);
  body.vx = Math.max(-C.runSpeed, Math.min(C.runSpeed, body.vx));
  if (axis) body.facing = Math.sign(axis);
  if (input.jump && !body.jumpHeld && body.grounded) { body.vy = -C.jumpSpeed; body.grounded = false; }
  body.jumpHeld = !!input.jump;
  body.boosting = !!input.boost && body.fuel >= C.fuelUse * dt;
  body.vy += C.gravity * dt;
  if (body.boosting) {
    // Only an explicit touch vector redirects airborne thrust. Ground takeoff,
    // keyboard, controller, fuel and thrust magnitude retain their old rules.
    if(direction&&!body.grounded){body.vx+=direction.x*C.thrust*dt;body.vy+=direction.y*C.thrust*dt;}
    else body.vy -= C.thrust * dt;
    body.fuel = Math.max(0, body.fuel - C.fuelUse * dt);
  }
  else if (!input.boost) body.fuel = Math.min(100, body.fuel + C.fuelRecharge * dt);
  body.vy = Math.max(-C.maxRise, Math.min(850, body.vy));
}
