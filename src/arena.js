import { CONFIG as C } from './config.js';
// Reversible CJ trial: set false to restore the original interior.
export const OPEN_ARENA = true;
export const classicSolids = [
  { x: 0, y: C.floor, w: C.width, h: 100, kind: 'floor' },
  { x: 290, y: 392, w: 220, h: 24, kind: 'platform' },
  { x: 770, y: 392, w: 220, h: 24, kind: 'platform' },
  // One continuous convex outline removes the old buried stair edges.
  // The central top (x=562..718, y=594) stays in exactly the same place.
  { x:448,y:594,w:384,h:50,kind:'obstacle', vertices:[
    {x:448,y:644},{x:562,y:594},{x:718,y:594},{x:832,y:644},
  ] },
  // Solid exterior above each mouth: no horizontal roof on which a ball can park.
  // The field-facing diagonal joins the ceiling to the unchanged upper goal lip.
  {x:0,y:100,w:218,h:C.goalTop-100,kind:'goalRoof',goalBoundary:true,contactEdges:[1,2],vertices:[
    {x:0,y:100},{x:218,y:100},{x:C.goalLeft,y:C.goalTop},{x:0,y:C.goalTop},
  ]},
  {x:1062,y:100,w:218,h:C.goalTop-100,kind:'goalRoof',goalBoundary:true,contactEdges:[2,3],vertices:[
    {x:1062,y:100},{x:C.width,y:100},{x:C.width,y:C.goalTop},{x:C.goalRight,y:C.goalTop},
  ]},
  // Invisible 45-degree slopes, joined to each base as a single solid polygon.
  // Keep the approved rendering outline in vertices. The invisible collision
  // continues the same incline inside the goal, removing the inaccessible sill.
  // At the scoring line x=82 the surface still meets exactly y=508.
  { x:0,y:C.goalBottom,w:218,h:C.floor-C.goalBottom,kind:'goalBase',goalBoundary:true,contactEdges:[0],collisionVertices:[
    {x:0,y:C.goalBottom-C.goalLeft},{x:218,y:C.floor},{x:0,y:C.floor},
  ],vertices:[
    {x:0,y:C.goalBottom},{x:C.goalLeft,y:C.goalBottom},{x:218,y:C.floor},{x:0,y:C.floor},
  ] },
  { x:1062,y:C.goalBottom,w:218,h:C.floor-C.goalBottom,kind:'goalBase',goalBoundary:true,contactEdges:[0],collisionVertices:[
    {x:1062,y:C.floor},{x:C.width,y:C.goalBottom-C.goalLeft},{x:C.width,y:C.floor},
  ],vertices:[
    {x:1062,y:C.floor},{x:C.goalRight,y:C.goalBottom},{x:C.width,y:C.goalBottom},{x:C.width,y:C.floor},
  ] },
];
export const solids = OPEN_ARENA ? classicSolids.filter(s=>!['platform','obstacle'].includes(s.kind)) : classicSolids;
export function resetPositions(player, bot, ball) {
  for (const [body, x] of [[player, 300], [bot, 980]]) {
    Object.assign(body, { x, y: C.floor - C.playerHeight / 2, vx: 0, vy: 0,
      grounded: true, fuel: 100, boosting: false, jumpHeld: false });
  }
  player.facing = 1; bot.facing = -1;
  Object.assign(ball, { x: 640, y: 278, vx: 0, vy: 0, angle: 0, flash: 0 });
}
