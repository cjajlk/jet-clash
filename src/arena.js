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
  {x:0,y:100,w:285,h:C.goalTop-100,kind:'goalRoof',goalBoundary:true,contactEdges:[1,2],vertices:[
    {x:0,y:100},{x:285,y:100},{x:C.goalLeft,y:C.goalTop},{x:0,y:C.goalTop},
  ]},
  {x:995,y:100,w:285,h:C.goalTop-100,kind:'goalRoof',goalBoundary:true,contactEdges:[2,3],vertices:[
    {x:995,y:100},{x:C.width,y:100},{x:C.width,y:C.goalTop},{x:C.goalRight,y:C.goalTop},
  ]},
  // Collision follows the visible ramp, leaving the goal mouth free of hidden edges.
  { x:0,y:C.goalRampBottom,w:260,h:C.floor-C.goalRampBottom,kind:'goalBase',goalBoundary:true,contactEdges:[0,2],playerContactEdges:[0],vertices:[
    {x:C.goalLeft,y:C.goalRampBottom},{x:260,y:C.floor},{x:C.goalLeft,y:C.floor},
  ] },
  { x:1020,y:C.goalRampBottom,w:260,h:C.floor-C.goalRampBottom,kind:'goalBase',goalBoundary:true,contactEdges:[0,2],playerContactEdges:[2],vertices:[
    {x:C.goalRight,y:C.goalRampBottom},{x:C.goalRight,y:C.floor},{x:1020,y:C.floor},
  ] },
  // Pocket floor level with the ramp top: a ball that enters the goal stays in the scoring band instead of falling behind the ramp.
  { x:0,y:C.goalRampBottom,w:C.goalLeft,h:C.floor-C.goalRampBottom,kind:'goalPocket',goalBoundary:true,contactEdges:[0],playerContactEdges:[],vertices:[
    {x:0,y:C.goalRampBottom},{x:C.goalLeft,y:C.goalRampBottom},{x:C.goalLeft,y:C.floor},{x:0,y:C.floor},
  ] },
  { x:C.goalRight,y:C.goalRampBottom,w:C.width-C.goalRight,h:C.floor-C.goalRampBottom,kind:'goalPocket',goalBoundary:true,contactEdges:[0],playerContactEdges:[],vertices:[
    {x:C.goalRight,y:C.goalRampBottom},{x:C.width,y:C.goalRampBottom},{x:C.width,y:C.floor},{x:C.goalRight,y:C.floor},
  ] },
];
export const solids = OPEN_ARENA ? classicSolids.filter(s=>!['platform','obstacle'].includes(s.kind)) : classicSolids;
export function resetPositions(player, bot, ball) {
  for (const [body, x] of [[player, 300], [bot, 980]]) {
    Object.assign(body, { x, y: C.floor - C.playerHeight / 2, vx: 0, vy: 0,
      grounded: true, contactSurface: 'floor', footX: 0, footY: 1, controlX: 1, controlY: 0,
      rotateHeld: false, jumpReady: true, impulseReady: true, impulseCooldown: 0, flipIntent: 0,
      flipHeld:false,flipReady:true,flipTimer:0,flipHit:false,flipX:1,flipY:0,
      fuel: 100, boosting: false, jumpHeld: false });
  }
  player.facing = 1; bot.facing = -1;
  Object.assign(ball, { x: 640, y: 278, vx: 0, vy: 0, angle: 0, flash: 0 });
}
