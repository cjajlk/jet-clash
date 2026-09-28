import { CONFIG as C, DIFFICULTIES } from './config.js';
export class Bot {
  constructor(level, random = Math.random) { this.settings=DIFFICULTIES[level] || DIFFICULTIES.normal; this.random=random; this.reset(); }
  reset() { this.wait=0; this.input={axis:0,jump:false,boost:false}; }
  update(body, ball, dt) {
    this.wait-=dt;
    if (this.wait>0) return this.input;
    const d=this.settings; this.wait=d.reaction;
    const predicted=ball.x+ball.vx*d.anticipation;
    const error=(this.random()-0.5)*2*d.error;
    // Heavy attacks left: approach the right of the free ball, or intercept near home.
    const defending=ball.x>930 && ball.vx>70;
    const target=Math.max(body.w/2,Math.min(C.width-body.w/2,(defending ? Math.max(predicted,1080) : predicted)+48+error));
    const dx=target-body.x;
    const ballAbove=ball.y<body.y-36;
    const blockedByCenter=body.x>=480 && body.x<=810 && body.y>535;
    const close=Math.abs(ball.x-body.x)<145;
    let axis=Math.abs(dx)>20 ? Math.sign(dx) : 0;
    if (body.x>ball.x+18 && close && Math.abs(ball.y-body.y)<75) axis=-1;
    const jump=body.grounded && ((ballAbove && Math.abs(dx)<250) || blockedByCenter);
    const boost=ballAbove && Math.abs(dx)<240 && body.fuel>12 && body.y>ball.y+20 && (body.y>210) && d.aggression>this.random();
    this.input={axis,jump,boost}; return this.input;
  }
}
