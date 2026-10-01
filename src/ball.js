import { CONFIG as C } from './config.js';
export function createBall() { return { x: 640, y: 278, vx: 0, vy: 0, r: C.ballRadius * C.ballScale, angle: 0, flash: 0 }; }
export function integrateBall(ball, dt) {
  ball.vy += C.gravity * dt;
  ball.vx *= Math.exp(-0.13 * dt);
  ball.vy *= Math.exp(-0.04 * dt);
  const speed = Math.hypot(ball.vx, ball.vy);
  if (speed > C.maxBallSpeed) { ball.vx *= C.maxBallSpeed / speed; ball.vy *= C.maxBallSpeed / speed; }
  ball.x += ball.vx * dt; ball.y += ball.vy * dt;
  ball.angle += ball.vx * dt / ball.r;
  ball.flash = Math.max(0, ball.flash - dt);
}
