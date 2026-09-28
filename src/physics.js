import { CONFIG as C } from './config.js';
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function overlaps(p, r) { return p.x + p.w/2 > r.x && p.x - p.w/2 < r.x+r.w && p.y+p.h/2 > r.y && p.y-p.h/2 < r.y+r.h; }
export function movePlayer(p, solids, dt) {
  p.x += p.vx * dt;
  for (const r of solids) if (overlaps(p, r)) {
    if (p.vx > 0) p.x = r.x - p.w/2;
    else if (p.vx < 0) p.x = r.x+r.w+p.w/2;
    p.vx = 0;
  }
  p.x = clamp(p.x, p.w/2, C.width - p.w/2);
  p.y += p.vy * dt; p.grounded = false;
  for (const r of solids) if (overlaps(p,r)) {
    if (p.vy >= 0) { p.y = r.y-p.h/2; p.grounded = true; }
    else p.y = r.y+r.h+p.h/2;
    p.vy = 0;
  }
  if (p.y < 100 + p.h/2) { p.y = 100+p.h/2; p.vy = Math.max(0,p.vy); }
}
// Circle versus rectangle. Separation is collision correction, never possession.
export function circleContact(ball, rect) {
  const cx = clamp(ball.x, rect.x, rect.x+rect.w), cy = clamp(ball.y,rect.y,rect.y+rect.h);
  let dx = ball.x-cx, dy = ball.y-cy, dist = Math.hypot(dx,dy);
  if (dist >= ball.r) return null;
  if (dist > 0.00001) return { nx: dx/dist, ny: dy/dist, depth: ball.r-dist };
  const faces = [
    { d: ball.x-rect.x, nx:-1, ny:0 }, { d:rect.x+rect.w-ball.x,nx:1,ny:0 },
    { d:ball.y-rect.y,nx:0,ny:-1 }, { d:rect.y+rect.h-ball.y,nx:0,ny:1 },
  ].sort((a,b)=>a.d-b.d);
  return { nx:faces[0].nx, ny:faces[0].ny, depth:ball.r+faces[0].d };
}
export function collideBall(ball, solids) {
  for (const rect of solids) {
    const hit = circleContact(ball,rect); if (!hit) continue;
    ball.x += hit.nx*hit.depth; ball.y += hit.ny*hit.depth;
    const normalSpeed = ball.vx*hit.nx+ball.vy*hit.ny;
    if (normalSpeed < 0) {
      const bounce = Math.abs(normalSpeed) < 45 ? 0 : C.ballBounce;
      ball.vx -= (1+bounce)*normalSpeed*hit.nx;
      ball.vy -= (1+bounce)*normalSpeed*hit.ny;
      if (hit.ny < -0.5) ball.vx *= 0.988;
    }
  }
  if (ball.x < ball.r) { ball.x = ball.r; ball.vx = Math.abs(ball.vx)*C.ballBounce; }
  if (ball.x > C.width-ball.r) { ball.x=C.width-ball.r; ball.vx=-Math.abs(ball.vx)*C.ballBounce; }
  if (ball.y < 100+ball.r) { ball.y=100+ball.r; ball.vy=Math.abs(ball.vy)*C.ballBounce; }
}
export function hitPlayer(ball,p) {
  const hit = circleContact(ball,{ x:p.x-p.w/2,y:p.y-p.h/2,w:p.w,h:p.h });
  if (!hit) return false;
  ball.x += hit.nx*hit.depth; ball.y += hit.ny*hit.depth;
  const relative = (ball.vx-p.vx)*hit.nx+(ball.vy-p.vy)*hit.ny;
  if (relative < 0) {
    // Identical masses and restitution for both skins; impulse derives only from motion.
    const impulse = -(1+0.88)*relative / (1+0.18);
    ball.vx += impulse*hit.nx; ball.vy += impulse*hit.ny;
    p.vx -= impulse*0.18*hit.nx; p.vy -= impulse*0.18*hit.ny;
    ball.flash=0.12;
  }
  return true;
}
