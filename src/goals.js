import { CONFIG as C } from './config.js';
export function goalScorer(ball) {
  // A ball touching either rim has not cleanly entered the opening.
  if (ball.y-ball.r <= C.goalTop || ball.y+ball.r >= C.goalBottom) return null;
  if (ball.x+ball.r <= C.goalLeft) return 'bot';
  if (ball.x-ball.r >= C.goalRight) return 'player';
  return null;
}
