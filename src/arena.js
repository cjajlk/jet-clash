import { CONFIG as C } from './config.js';
// Arena 02: open field with recessed vertical goals.
export const OPEN_ARENA = true;
export const classicSolids = [
  { x: 0, y: C.floor, w: C.width, h: 100, kind: 'floor' },
  // Vertical goal frames. The space between goalTop and goalBottom is a real
  // playable pocket: ball AND players can fly inside it.
  { x: 0, y: C.ceiling, w: C.goalLeft, h: C.goalTop-C.ceiling, kind: 'goalRoof', goalBoundary: true },
  { x: C.goalRight, y: C.ceiling, w: C.width-C.goalRight, h: C.goalTop-C.ceiling, kind: 'goalRoof', goalBoundary: true },
  { x: 0, y: C.goalBottom, w: C.goalLeft, h: C.floor-C.goalBottom, kind: 'goalBase', goalBoundary: true },
  { x: C.goalRight, y: C.goalBottom, w: C.width-C.goalRight, h: C.floor-C.goalBottom, kind: 'goalBase', goalBoundary: true },
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
