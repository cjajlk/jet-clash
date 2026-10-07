import { CONFIG as C, DIFFICULTIES } from './config.js';
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
export class Bot {
  constructor(level, random = Math.random) { this.settings=DIFFICULTIES[level] || DIFFICULTIES.normal; this.random=random; this.reset(); }
  reset() { this.wait=0; this.input={axis:0,jump:false,boost:false}; }
  update(body, ball, dt) {
    this.wait-=dt;
    if (this.wait>0) return this.input;
    const d=this.settings; this.wait=d.reaction;
    // Intercept where the ball will be when Heavy can reach it, with the
    // existing difficulty-dependent anticipation and reaction delay.
    const travel=Math.abs(ball.x-body.x)/C.runSpeed;
    const horizon=Math.min(.55,d.anticipation+travel*d.aggression*.25);
    const predictedX=clamp(ball.x+ball.vx*horizon,ball.r,C.width-ball.r);
    const predictedY=clamp(ball.y+ball.vy*horizon+C.gravity*horizon*horizon/2,C.ceiling+ball.r,C.floor-ball.r);
    const error=(this.random()-.5)*2*d.error;
    const contactOffset=body.w/2+ball.r;
    const defending=ball.vx>70&&predictedX>C.goalRight-contactOffset*3;
    // Stay goal-side of the ball to clear left, including inside the pocket.
    const target=clamp(predictedX+contactOffset+error,body.w/2,C.width-body.w/2);
    const dx=target-body.x;
    const close=Math.abs(ball.x-body.x)<contactOffset+8;
    const striking=body.x>ball.x+body.w/2&&close&&Math.abs(ball.y-body.y)<body.h/2+ball.r;
    // Brake before overshooting instead of repeatedly circling a slow ball.
    const brakingDistance=body.vx*body.vx/(2*(body.grounded?C.runAcceleration:C.airAcceleration));
    let axis=Math.abs(dx)>14?Math.sign(dx):0;
    if(axis&&Math.sign(body.vx)===axis&&Math.abs(dx)<brakingDistance+14)axis=-Math.sign(body.vx);
    if(striking)axis=-1;
    const interceptAbove=predictedY<body.y-body.h*.45;
    const reachable=Math.abs(dx)<(defending?300:230);
    const wantsHeight=interceptAbove&&reachable;
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
