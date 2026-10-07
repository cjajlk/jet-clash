import { CONFIG as C } from './config.js';
// Arena 02: open field with recessed vertical goals and smooth Sideswipe-like approaches.
export const OPEN_ARENA = true;

const leftGoalBaseVertices = [
  { x: 0, y: C.goalBottom },
  { x: C.goalLeft, y: C.goalBottom },
  { x: C.goalLeft + 30, y: C.goalBottom + 15 },
  { x: C.goalLeft + 60, y: C.goalBottom + 40 },
  { x: C.goalLeft + 90, y: C.goalBottom + 85 },
  { x: C.goalLeft + 120, y: C.goalBottom + 140 },
  { x: C.goalLeft + 155, y: C.floor },
  { x: 0, y: C.floor },
];
const rightGoalBaseVertices = leftGoalBaseVertices
  .map(p => ({ x: C.width - p.x, y: p.y }))
  .reverse();

export const classicSolids = [
  { x: 0, y: C.floor, w: C.width, h: 100, kind: 'floor' },
  // The opening between goalTop and goalBottom stays fully playable.
  { x: 0, y: C.ceiling, w: C.goalLeft, h: C.goalTop-C.ceiling, kind: 'goalRoof', goalBoundary: true },
  { x: C.goalRight, y: C.ceiling, w: C.width-C.goalRight, h: C.goalTop-C.ceiling, kind: 'goalRoof', goalBoundary: true },
  // Curved-looking convex ramps replace the former rectangular bases. This removes
  // the invisible vertical wall at the mouth and lets Fluid ride smoothly toward the goal.
  { vertices: leftGoalBaseVertices, surface: leftGoalBaseVertices.slice(0,-1), kind: 'goalBase', goalBoundary: true, side: 'left' },
  { vertices: rightGoalBaseVertices, surface: rightGoalBaseVertices.slice(1).reverse(), kind: 'goalBase', goalBoundary: true, side: 'right' },
];
export const solids = classicSolids;
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
