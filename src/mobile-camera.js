import { CONFIG as C } from './config.js';
export const MOBILE_FRAMING=Object.freeze({close:1.35,balanced:1.30,wide:1.10});
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));

export class MobileCamera {
  constructor(){this.mode='balanced';this.reset();}
  reset(){this.zoom=1;this.x=C.width/2;this.y=C.height/2;this.active=false;}
  update(m,enabled,dt=1/60){
    if(!enabled){this.reset();return this;}
    const points=[{x:m.player.x,y:m.player.y,r:52},...(m.bot?[{x:m.bot.x,y:m.bot.y,r:52}]:[]),{x:m.ball.x,y:m.ball.y,r:m.ball.r+12}];
    // Include the nearby goal mouth before it becomes relevant to a shot/save.
    if(m.ball.x<320)points.push({x:C.goalLeft,y:(C.goalTop+C.goalBottom)/2,r:65});
    if(m.ball.x>C.width-320)points.push({x:C.goalRight,y:(C.goalTop+C.goalBottom)/2,r:65});
    const minX=Math.max(0,Math.min(...points.map(p=>p.x-p.r))-24),maxX=Math.min(C.width,Math.max(...points.map(p=>p.x+p.r))+24);
    const minY=Math.max(0,Math.min(...points.map(p=>p.y-p.r))-24),maxY=Math.min(C.height,Math.max(...points.map(p=>p.y+p.r))+24);
    const desired=Math.max(1,Math.min(MOBILE_FRAMING[this.mode]||1.3,C.width/(maxX-minX),C.height/(maxY-minY)));
    const ease=1-Math.exp(-5*Math.max(0,dt));
    // Open the view immediately when needed; close it gradually to avoid pumping.
    this.zoom=!this.active||desired<this.zoom?desired:this.zoom+(desired-this.zoom)*ease;
    const hw=C.width/(2*this.zoom),hh=C.height/(2*this.zoom);
    const targetX=(minX+maxX)/2,targetY=(minY+maxY)/2;
    const x=this.active?this.x+(targetX-this.x)*ease:targetX,y=this.active?this.y+(targetY-this.y)*ease:targetY;
    this.x=clamp(x,Math.max(hw,maxX-hw),Math.min(C.width-hw,minX+hw));
    this.y=clamp(y,Math.max(hh,maxY-hh),Math.min(C.height-hh,minY+hh));
    this.active=true;return this;
  }
  // Projection is ready for future offscreen indicators, without adding any UI.
  project(x,y){const px=(x-this.x)*this.zoom+C.width/2,py=(y-this.y)*this.zoom+C.height/2;return {x:px,y:py,visible:px>=0&&px<=C.width&&py>=0&&py<=C.height};}
}
