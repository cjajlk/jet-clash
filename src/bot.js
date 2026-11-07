import { CONFIG as DEFAULT, DIFFICULTIES } from './config.js';
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
export class Bot {
  constructor(level, random = Math.random) { this.settings=DIFFICULTIES[level] || DIFFICULTIES.normal; this.random=random; this.reset(); }
  reset() { this.wait=0;this.intent='attack'; this.input={axis:0,jump:false,boost:false}; }
  update(body, ball, dt,players=[],C=DEFAULT) {
    this.wait-=dt;
    if (this.wait>0) return this.input;
    const d=this.settings; this.wait=d.reaction;
    // Intercept where the ball will be when Heavy can reach it, with the
    // existing difficulty-dependent anticipation and reaction delay.
    const travel=Math.abs(ball.x-body.x)/C.runSpeed;
    const horizon=Math.min(.55,d.anticipation+travel*d.aggression*.25);
    const predictedX=clamp(ball.x+ball.vx*horizon,ball.r,C.width-ball.r);
    let predictedY=clamp(ball.y+ball.vy*horizon+C.gravity*horizon*horizon/2,C.ceiling+ball.r,C.floor-ball.r);
    const error=(this.random()-.5)*2*d.error;
    const contactOffset=body.w/2+ball.r;
    // Evaluate the goal mouth, not only the ball's horizontal proximity.
    // A high/low ball is not a direct shot; avoid spending fuel chasing it.
    const timeToGoal=ball.vx>70?(C.goalRight-ball.x)/ball.vx:Infinity;
    const goalY=Number.isFinite(timeToGoal)?ball.y+ball.vy*timeToGoal+C.gravity*timeToGoal*timeToGoal/2:Infinity;
    const defending=timeToGoal>=0&&timeToGoal<.8&&goalY+ball.r>C.goalTop&&goalY-ball.r<C.goalBottom;
    const beaten=ball.x>body.x+contactOffset*.5&&ball.x>C.width/2&&ball.vx> -70;
    const escaping=ball.vx< -C.runSpeed&&ball.x<body.x-contactOffset*2;
    this.intent=defending?'defend':beaten?'recover':escaping?'support':'attack';
    // Stay goal-side of the ball to clear left, including inside the pocket.
    let target=predictedX+contactOffset+error;
    if(defending){
      // Take a reachable blocking position in front of the mouth, rather than
      // running deep into the net behind a fast ball. Keep existing aim error.
      target=C.goalRight-body.w/2+error*.25;
      const interceptTime=clamp((target-contactOffset-ball.x)/ball.vx,0,timeToGoal);
      predictedY=clamp(ball.y+ball.vy*interceptTime+C.gravity*interceptTime*interceptTime/2,C.ceiling+ball.r,C.floor-ball.r);
    }else if(beaten){
      target=Math.max(C.goalRight-100,predictedX+contactOffset)+error;
    }else if(escaping){
      // Follow a clearance from behind, leaving space to react to its return.
      target=Math.max(C.width*.55,predictedX+contactOffset*2)+error;
    }
    target=clamp(target,body.w/2,C.width-body.w/2);
    const dx=target-body.x;
    const close=Math.abs(ball.x-body.x)<contactOffset+8;
    const striking=body.x>ball.x+body.w/2&&close&&Math.abs(ball.y-body.y)<body.h/2+ball.r;
    // Brake before overshooting instead of repeatedly circling a slow ball.
    const brakingDistance=body.vx*body.vx/(2*(body.grounded?C.runAcceleration:C.airAcceleration));
    const deadband=defending?6:14;
    let axis=Math.abs(dx)>deadband?Math.sign(dx):0;
    if(axis&&Math.sign(body.vx)===axis&&Math.abs(dx)<brakingDistance+deadband)axis=-Math.sign(body.vx);
    if(striking)axis=-1;
    const interceptAbove=predictedY<body.y-body.h*.45;
    const reachable=Math.abs(dx)<(defending?300:230);
    const wantsHeight=interceptAbove&&reachable&&this.intent!=='support'&&this.intent!=='recover';
    // Release between presses so a held jump does not waste the second jump.
    const jump=wantsHeight&&!body.jumpHeld&&(
      (body.grounded&&body.jumpReady)||
      (!body.grounded&&body.impulseReady&&body.impulseCooldown<=0&&body.vy>-100&&ball.y<body.y-body.h*.6)
    );
    // Reserve fuel for useful aerial interceptions; never thrust past the ball.
    const boost=wantsHeight&&body.fuel>12&&body.y>predictedY+body.h*.3&&body.vy>-C.maxRise*.75&&d.aggression>this.random();
    this.input={axis,jump,boost}; return this.input;
  }
}
