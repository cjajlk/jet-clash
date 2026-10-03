import { CONFIG as C } from './config.js';
export function goalScorer(ball) {
  // A ball touching either rim has not cleanly entered the opening.
  if (ball.y-ball.r <= C.goalTop || ball.y+ball.r >= C.goalBottom) return null;
  if(ball.x<0||ball.x>C.width)return null;
  // A ball stopped halfway in the pocket still counts once its centre is well inside.
  if (ball.x+ball.r <= C.goalLeft||ball.x<=C.goalLeft-20) return 'bot';
  if (ball.x-ball.r >= C.goalRight||ball.x>=C.goalRight+20) return 'player';
  return null;
}
