import { CONFIG as DEFAULT } from './config.js';
export function goalEntryDepth(radius,C=DEFAULT) {
  const pocketDepth=Math.min(C.goalLeft,C.width-C.goalRight);
  return Math.min(radius*C.goalEntryRadiusFactor,Math.max(0,pocketDepth-radius));
}
export function goalScorer(ball,C=DEFAULT,previous=null) {
  // The entire ball must fit inside the visible net, not the larger physical pocket.
  if (ball.y-ball.r <= C.goalScoreTop || ball.y+ball.r >= C.goalScoreBottom) return null;
  if(ball.x<0||ball.x>C.width)return null;
  // Arena V2: the ball must visibly enter the recessed pocket; crossing the
  // mouth by a few pixels is not enough to score.
  if(C.goalRequireCrossing){
    if(!previous)return null;
    const left=C.goalLeft-C.goalLineInset-ball.r,right=C.goalRight+C.goalLineInset+ball.r;
    const scorer=previous.x>left&&ball.x<=left?'bot':previous.x<right&&ball.x>=right?'player':null;
    if(!scorer)return null;
    const line=scorer==='bot'?left:right,t=(line-previous.x)/(ball.x-previous.x);
    const y=previous.y+(ball.y-previous.y)*t;
    return y-ball.r>C.goalScoreTop&&y+ball.r<C.goalScoreBottom?scorer:null;
  }
  const depth=goalEntryDepth(ball.r,C);
  if (ball.x <= C.goalLeft-depth) return 'bot';
  if (ball.x >= C.goalRight+depth) return 'player';
  return null;
}
