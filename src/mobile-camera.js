import { CONFIG as C } from './config.js';
export const MOBILE_FRAMING=Object.freeze({close:1.65,balanced:1.50,wide:1.25});
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));

export class MobileCamera {
  constructor(){this.mode='balanced';this.reset();}
  reset(){this.zoom=1;this.x=C.width/2;this.y=C.height/2;this.active=false;}
  update(m,enabled,dt=1/60){
    if(!enabled||m.state&&['MENU','PRE_ROUND','POST_MATCH'].includes(m.state)){this.reset();return this;}
    // Hold the shot framing during the goal celebration, before the wide kickoff.
    if(m.state==='GOAL_SCORED')return this;
    const player=m.player,ball=m.ball;
    const players=m.players||[player,m.bot].filter(Boolean);
    // Distant bots must not dictate the zoom. Nearby challenges still fit on screen.
    const nearby=players.filter(p=>p!==player&&Math.hypot(p.x-ball.x,p.y-ball.y)<260);
    const leadX=clamp((ball.vx||0)*.12,-90,90),leadY=clamp((ball.vy||0)*.08,-45,45);
    const points=[{x:player.x,y:player.y,r:70},{x:ball.x,y:ball.y,r:ball.r+22},
      {x:clamp(ball.x+leadX,0,C.width),y:clamp(ball.y+leadY,0,C.height),r:ball.r+22},
      ...nearby.map(p=>({x:p.x,y:p.y,r:62}))];
    // Include the nearby goal mouth before it becomes relevant to a shot/save.
    const goalX=ball.x<320?C.goalLeft:ball.x>C.width-320?C.goalRight:null;
    if(goalX!==null)points.push({x:goalX,y:C.goalTop,r:22},{x:goalX,y:C.goalBottom,r:22});
    const minX=Math.max(0,Math.min(...points.map(p=>p.x-p.r))-24),maxX=Math.min(C.width,Math.max(...points.map(p=>p.x+p.r))+24);
    const minY=Math.max(0,Math.min(...points.map(p=>p.y-p.r))-24),maxY=Math.min(C.height,Math.max(...points.map(p=>p.y+p.r))+24);
    const desired=Math.max(1,Math.min(MOBILE_FRAMING[this.mode]||1.5,C.width/(maxX-minX),C.height/(maxY-minY)));
    const ease=1-Math.exp(-5*Math.max(0,dt));
    // Open the view immediately when needed; close it gradually to avoid pumping.
    this.zoom=desired<this.zoom?desired:this.zoom+(desired-this.zoom)*ease;
    const hw=C.width/(2*this.zoom),hh=C.height/(2*this.zoom);
    const targetX=player.x*.55+(ball.x+leadX)*.45,targetY=player.y*.6+(ball.y+leadY)*.4;
    const x=this.active?this.x+(targetX-this.x)*ease:targetX,y=this.active?this.y+(targetY-this.y)*ease:targetY;
    this.x=clamp(x,Math.max(hw,maxX-hw),Math.min(C.width-hw,minX+hw));
    this.y=clamp(y,Math.max(hh,maxY-hh),Math.min(C.height-hh,minY+hh));
    this.active=true;return this;
  }
  // Projection is also used by screen-edge indicators; world coordinates never change.
  project(x,y){const px=(x-this.x)*this.zoom+C.width/2,py=(y-this.y)*this.zoom+C.height/2;return {x:px,y:py,visible:px>=0&&px<=C.width&&py>=0&&py<=C.height};}
}
