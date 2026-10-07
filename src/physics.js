import { CONFIG as C } from './config.js';
import { circlePolygonContact, boxPolygonContact } from './collision-shapes.js';
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function setSupport(p, ny) {
  if (ny < -.5) { p.grounded = true; p.contactSurface = 'floor'; }
  else if (ny > .5) { p.grounded = true; p.contactSurface = 'ceiling'; }
}
function rechargeSupport(p) {
  if (p.contactSurface === 'floor' && p.footY > .65) { p.jumpReady = true; p.impulseReady = true; }
  if (p.contactSurface === 'ceiling' && p.footY < -.65) { p.jumpReady = true; p.impulseReady = true; }
}
function overlaps(p, r) { return !r.vertices && p.x + p.w/2 > r.x && p.x - p.w/2 < r.x+r.w && p.y+p.h/2 > r.y && p.y-p.h/2 < r.y+r.h; }
function surfaceYAt(points,x){
  if(!points?.length)return null;
  for(let i=0;i<points.length-1;i++){
    const a=points[i],b=points[i+1],lo=Math.min(a.x,b.x),hi=Math.max(a.x,b.x);
    if(x<lo||x>hi)continue;
    const t=Math.abs(b.x-a.x)<1e-9?0:(x-a.x)/(b.x-a.x);
    return a.y+(b.y-a.y)*t;
  }
  return null;
}
function resolvePlayerRamps(p,solids){
  for(const shape of solids){
    if(!shape.vertices)continue;
    // Goal approaches are treated as a continuous rideable surface for the player.
    // This avoids the SAT rectangle snagging on the steep first segment and creating
    // the invisible wall CJ observed in front of both goals.
    if(shape.kind==='goalBase'&&shape.surface){
      const surfaceY=surfaceYAt(shape.surface,p.x);
      if(surfaceY!=null){
        const feet=p.y+p.h/2;
        const wasAbove=p.y-p.h/2<surfaceY;
        if(wasAbove&&feet>=surfaceY-3&&p.vy>=-90){
          p.y=surfaceY-p.h/2;
          if(p.vy>0)p.vy=0;
          p.grounded=true;p.contactSurface='floor';
          rechargeSupport(p);
        }
      }
      continue;
    }
    const hit=boxPolygonContact(p,shape.collisionVertices||shape.vertices,shape.playerContactEdges||shape.contactEdges);if(!hit)continue;
    p.x+=hit.nx*hit.depth;p.y+=hit.ny*hit.depth;
    const normal=p.vx*hit.nx+p.vy*hit.ny;
    if(normal<0){p.vx-=normal*hit.nx;p.vy-=normal*hit.ny;}
    setSupport(p,hit.ny);
  }
}
export function movePlayer(p, solids, dt) {
  p.x += p.vx * dt;
  p.grounded = false; p.contactSurface = null;
  resolvePlayerRamps(p,solids);
  for (const r of solids) if (overlaps(p, r)) {
    if (p.vx > 0) p.x = r.x - p.w/2;
    else if (p.vx < 0) p.x = r.x+r.w+p.w/2;
    p.vx = 0;
  }
  p.x = clamp(p.x, p.w/2, C.width - p.w/2);
  p.y += p.vy * dt; p.grounded = false;
  resolvePlayerRamps(p,solids);
  for (const r of solids) if (overlaps(p,r)) {
    if (p.vy >= 0) { p.y = r.y-p.h/2; setSupport(p,-1); }
    else { p.y = r.y+r.h+p.h/2; setSupport(p,1); }
    p.vy = 0;
    rechargeSupport(p);
  }
  if (p.y < C.ceiling + p.h/2) { p.y = C.ceiling+p.h/2; p.vy = Math.max(0,p.vy); setSupport(p,1); rechargeSupport(p); }
  // Arena V2: the recessed goal mouths are playable for characters too.
  // Outer canvas walls remain hard limits; the rectangular goal frame solids
  // above/below the mouth keep players inside the intended opening.
  for(let pass=0;pass<4;pass++){
    if(p.x<p.w/2){p.x=p.w/2;p.vx=Math.max(0,p.vx);}
    if(p.x>C.width-p.w/2){p.x=C.width-p.w/2;p.vx=Math.min(0,p.vx);}
    if(p.y+p.h/2>C.floor){p.y=C.floor-p.h/2;p.vy=Math.min(0,p.vy);setSupport(p,-1);rechargeSupport(p);}
    if(p.y-p.h/2<C.ceiling){p.y=C.ceiling+p.h/2;p.vy=Math.max(0,p.vy);setSupport(p,1);rechargeSupport(p);}
    resolvePlayerRamps(p,solids.filter(s=>s.goalBoundary));
  }
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
function resolveBallShape(ball,rect){
    const hit = rect.vertices ? circlePolygonContact(ball,rect.collisionVertices||rect.vertices,rect.contactEdges) : circleContact(ball,rect); if (!hit) return;
    ball.x += hit.nx*hit.depth; ball.y += hit.ny*hit.depth;
    const normalSpeed = ball.vx*hit.nx+ball.vy*hit.ny;
    if (normalSpeed < (rect.vertices ? -1e-8 : 0)) {
      const bounce = Math.abs(normalSpeed) < 45 ? 0 : C.ballBounce;
      ball.vx -= (1+bounce)*normalSpeed*hit.nx;
      ball.vy -= (1+bounce)*normalSpeed*hit.ny;
      if (hit.ny < -0.5) {
        if(rect.vertices){
          const tx=-hit.ny,ty=hit.nx,tangentSpeed=ball.vx*tx+ball.vy*ty;
          ball.vx-=.012*tangentSpeed*tx;ball.vy-=.012*tangentSpeed*ty;
        }else ball.vx *= 0.988;
      }
    }
}
export function collideBall(ball, solids) {
  // Resolve the continuous inclined outlines before the flat floor/platforms.
  const ordered=[...solids.filter(s=>s.vertices),...solids.filter(s=>!s.vertices)];
  for (const rect of ordered) resolveBallShape(ball,rect);
  // Infinite outer half-planes close the finite floor and back-wall seams.
  // Recheck only the end colliders after containment, including after player pressure.
  const ends=solids.filter(s=>s.goalBoundary);
  for(let pass=0;pass<4;pass++){
    const insideGoalOpening=ball.x>=0&&ball.x<=C.width&&ball.y-ball.r>C.goalTop&&ball.y+ball.r<C.goalBottom;
    if (!insideGoalOpening&&ball.x < ball.r) { ball.x = ball.r; if(ball.vx<0)ball.vx=-ball.vx*C.ballBounce; }
    if (!insideGoalOpening&&ball.x > C.width-ball.r) { ball.x=C.width-ball.r; if(ball.vx>0)ball.vx=-ball.vx*C.ballBounce; }
    if (ball.y < C.ceiling+ball.r) { ball.y=C.ceiling+ball.r; if(ball.vy<0)ball.vy=-ball.vy*C.ballBounce; }
    if (ball.y > C.floor-ball.r) { ball.y=C.floor-ball.r;if(ball.vy>0){ball.vy=ball.vy<45?0:-ball.vy*C.ballBounce;ball.vx*=.988;} }
    for(const end of ends)resolveBallShape(ball,end);
  }
  // End-collider separation can move a deeply compressed ball past the flat
  // floor/ceiling plane; finish with the arena's hard containment limits.
  if(ball.y<C.ceiling+ball.r){ball.y=C.ceiling+ball.r;if(ball.vy<0)ball.vy=-ball.vy*C.ballBounce;}
  if(ball.y>C.floor-ball.r){ball.y=C.floor-ball.r;if(ball.vy>0)ball.vy=-ball.vy*C.ballBounce;}
}

// Strictly outside: mere contact/partial overlap with the boundary is not a reset.
export function ballOutsideArena(ball){
  return ball.x+ball.r<0||ball.x-ball.r>C.width||ball.y+ball.r<C.ceiling||ball.y-ball.r>C.floor;
}
export function hitPlayer(ball,p,restitution=.88,flipStrike=null) {
  const hit = circleContact(ball,{ x:p.x-p.w/2,y:p.y-p.h/2,w:p.w,h:p.h });
  if (!hit) return false;
  ball.x += hit.nx*hit.depth; ball.y += hit.ny*hit.depth;
  const relative = (ball.vx-p.vx)*hit.nx+(ball.vy-p.vy)*hit.ny;
  if (relative < 0) {
    // Ordinary contacts retain their original restitution. A controlled touch
    // can cushion the bounce; separation, masses and Heavy's response stay intact.
    const impulse = -(1+restitution)*relative / (1+0.18);
    ball.vx += impulse*hit.nx; ball.vy += impulse*hit.ny;
    p.vx -= impulse*0.18*hit.nx; p.vy -= impulse*0.18*hit.ny;
    ball.flash=0.12;
  }
  if(flipStrike){
    ball.vx+=flipStrike.x*C.airFlipStrikeSpeed;
    ball.vy+=flipStrike.y*C.airFlipStrikeSpeed;
    const speed=Math.hypot(ball.vx,ball.vy);
    if(speed>C.maxBallSpeed){ball.vx*=C.maxBallSpeed/speed;ball.vy*=C.maxBallSpeed/speed;}
    ball.flash=.18;
  }
  return true;
}
