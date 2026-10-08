import { CONFIG as C } from './config.js';
export function createBall() { return { x: 640, y: 278, vx: 0, vy: 0, r: C.ballRadius * C.ballScale, angle: 0, flash: 0 }; }
export function limitBallSpeed(ball){
  const speed=Math.hypot(ball.vx,ball.vy);
  if(speed>C.maxBallSpeed){const scale=C.maxBallSpeed/speed;ball.vx*=scale;ball.vy*=scale;}
}
export function integrateBall(ball, dt) {
  ball.shotTimer=Math.max(0,(ball.shotTimer||0)-dt);
  if(ball.shotTimer>0){
    ball.shotTrail??=[];ball.shotTrail.push({x:ball.x,y:ball.y});
    if(ball.shotTrail.length>24)ball.shotTrail.shift();
  }else if(ball.shotTrail)ball.shotTrail=[];
  ball.vy += C.gravity * dt;
  ball.vx *= Math.exp(-0.13 * dt);
  ball.vy *= Math.exp(-0.04 * dt);
  const speed = Math.hypot(ball.vx, ball.vy);
  if (speed > C.maxBallSpeed) { ball.vx *= C.maxBallSpeed / speed; ball.vy *= C.maxBallSpeed / speed; }
  ball.x += ball.vx * dt; ball.y += ball.vy * dt;
  ball.angle += ball.vx * dt / ball.r;
  ball.flash = Math.max(0, ball.flash - dt);
}
