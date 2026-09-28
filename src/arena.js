import { CONFIG as C } from './config.js';
export const solids = [
  { x: 0, y: C.floor, w: C.width, h: 100, kind: 'floor' },
  { x: 290, y: 392, w: 220, h: 24, kind: 'platform' },
  { x: 770, y: 392, w: 220, h: 24, kind: 'platform' },
  { x: 504, y: 620, w: 58, h: 24, kind: 'obstacle' },
  { x: 562, y: 594, w: 156, h: 50, kind: 'obstacle' },
  { x: 718, y: 620, w: 58, h: 24, kind: 'obstacle' },
  { x: 0, y: C.goalTop - 15, w: C.goalLeft, h: 15, kind: 'goalRoof' },
  { x: C.goalRight, y: C.goalTop - 15, w: C.width - C.goalRight, h: 15, kind: 'goalRoof' },
  { x: 0, y: C.goalBottom, w: C.goalLeft, h: C.floor - C.goalBottom, kind: 'goalBase' },
  { x: C.goalRight, y: C.goalBottom, w: C.width - C.goalRight, h: C.floor - C.goalBottom, kind: 'goalBase' },
];
export function resetPositions(player, bot, ball) {
  for (const [body, x] of [[player, 300], [bot, 980]]) {
    Object.assign(body, { x, y: C.floor - C.playerHeight / 2, vx: 0, vy: 0,
      grounded: true, fuel: 100, boosting: false, jumpHeld: false });
  }
  player.facing = 1; bot.facing = -1;
  Object.assign(ball, { x: 640, y: 278, vx: 0, vy: 0, angle: 0, flash: 0 });
}
