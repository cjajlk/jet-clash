import { CONFIG as C } from './config.js';
export function goalEntryDepth(radius) {
  const pocketDepth=Math.min(C.goalLeft,C.width-C.goalRight);
  return Math.min(radius*C.goalEntryRadiusFactor,Math.max(0,pocketDepth-radius));
}
export function goalScorer(ball) {
  // A ball touching either rim has not cleanly entered the opening.
  if (ball.y-ball.r <= C.goalTop || ball.y+ball.r >= C.goalBottom) return null;
  if(ball.x<0||ball.x>C.width)return null;
  // Arena V2: the ball must visibly enter the recessed pocket; crossing the
  // mouth by a few pixels is not enough to score.
  const depth=goalEntryDepth(ball.r);
  if (ball.x <= C.goalLeft-depth) return 'bot';
  if (ball.x >= C.goalRight+depth) return 'player';
  return null;
}
