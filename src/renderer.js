import { CONFIG as C } from './config.js';
import { solids } from './arena.js';
import { MobileCamera } from './mobile-camera.js';
const paths={background:'arena/arena_background.png',left:'arena/goal_left_blue.png',right:'arena/goal_right_red.png',rampLeft:'arena/goal_ramp_left_blue.png',rampRight:'arena/goal_ramp_right_red.png',platform:'arena/platform_large.png',obstacle:'arena/center_obstacle.png',ball:'ball/ball_idle.png',impact:'ball/ball_glow.png'};
for(const skin of ['fluid','heavy'])for(const pose of ['walk','jump','jetpack','sprint'])paths[`${skin}_${pose}`]=`characters/${skin}/${skin}_${pose}.png`;
export class Renderer{
  constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.images={};this.camera=new MobileCamera();}
  async load(){await Promise.all(Object.entries(paths).map(([name,path])=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>{this.images[name]=im;resolve();};im.onerror=()=>reject(new Error(path));im.src=`assets/${path}`;})));}
  fit(key,x,y,w,h,flip=false,alpha=1){const im=this.images[key];if(!im)return;const s=Math.min(w/im.width,h/im.height),dw=im.width*s,dh=im.height*s;const c=this.ctx;c.save();c.globalAlpha=alpha;c.translate(x+w/2,y+h/2);if(flip)c.scale(-1,1);c.drawImage(im,-dw/2,-dh/2,dw,dh);c.restore();}
  goalRamp(key,mirrored=false){
    const im=this.images[key];if(!im)return;const c=this.ctx;
    // Keep the supplied PNG intact. Only its lower ramp/support portion is drawn;
    // the cage above source y=280 is excluded, not overlaid on the existing goal.
    const sourceX=191,sourceY=280,sourceWidth=555,sourceHeight=im.height-sourceY;
    const base=solids.find(s=>s.kind==='goalBase'&&s.x===0);
    const sx=(base.w-C.goalLeft)/280,sy=(C.floor-C.goalBottom)/120;
    const width=sourceWidth*sx,height=sourceHeight*sy;
    c.save();if(mirrored){c.translate(C.width,0);c.scale(-1,1);}
    // Clip to the actual collision outline, so the texture follows the solid slope.
    c.beginPath();base.vertices.forEach((v,i)=>i?c.lineTo(v.x,v.y):c.moveTo(v.x,v.y));c.closePath();c.clip();
    if(mirrored){c.translate(width,0);c.scale(-1,1);}
    c.drawImage(im,mirrored?im.width-sourceX-sourceWidth:sourceX,sourceY,sourceWidth,sourceHeight,0,C.goalBottom,width,height);
    c.restore();
  }
  aimIndicator(ball,indicator){
    if(!indicator)return;const c=this.ctx;c.save();c.translate(ball.x,ball.y);c.rotate(Math.atan2(indicator.y,indicator.x));
    c.lineJoin='round';c.shadowColor='#43dcff';c.shadowBlur=6+8*indicator.charge;
    for(let i=0;i<3;i++){const x=ball.r+14+i*13;c.beginPath();c.moveTo(x-6,-6);c.lineTo(x,0);c.lineTo(x-6,6);c.strokeStyle='#052135';c.lineWidth=6;c.stroke();c.strokeStyle=`rgba(150,250,255,${.85+.15*indicator.charge})`;c.lineWidth=3+indicator.charge;c.stroke();}c.restore();
  }
  controlIndicator(ball,control){
    if(!control?.available)return;const c=this.ctx,r=ball.r+7;c.save();
    c.beginPath();c.arc(ball.x,ball.y,r,0,Math.PI*2);c.strokeStyle='#70edff80';c.lineWidth=2;c.stroke();
    if(control.charging){
      const charge=control.chargeFraction;c.beginPath();c.arc(ball.x,ball.y,r,-Math.PI/2,-Math.PI/2+Math.PI*2*Math.max(.03,charge));
      c.strokeStyle='#c4ffff';c.lineWidth=4;c.shadowColor='#43dcff';c.shadowBlur=10;c.stroke();
    }c.restore();
  }
  render(m,{mobile=false,dt=1/60}={}){const c=this.ctx;c.clearRect(0,0,C.width,C.height);
    const camera=this.camera.update(m,mobile,dt);c.save();
    if(mobile){c.translate(C.width/2,C.height/2);c.scale(camera.zoom,camera.zoom);c.translate(-camera.x,-camera.y);}
    const bg=this.images.background;if(bg){const s=Math.max(C.width/bg.width,C.height/bg.height);c.drawImage(bg,(C.width-bg.width*s)/2,0,bg.width*s,bg.height*s);}c.fillStyle='#080c2350';c.fillRect(0,0,C.width,C.height);
    const grad=c.createLinearGradient(0,C.floor,0,C.height);grad.addColorStop(0,'#131735cc');grad.addColorStop(1,'#080e22');c.fillStyle=grad;c.fillRect(0,C.floor,C.width,C.height-C.floor);c.strokeStyle='#71ddff90';c.lineWidth=2;c.beginPath();c.moveTo(0,C.floor);c.lineTo(C.width,C.floor);c.stroke();
    this.goalRamp('rampLeft');this.goalRamp('rampRight',true);
    this.fit('left',0,C.goalTop-1,181,C.goalBottom-C.goalTop+2);this.fit('right',C.width-198,C.goalTop-1,198,C.goalBottom-C.goalTop+2);this.fit('platform',285,380,230,96);this.fit('platform',765,380,230,96);this.fit('obstacle',496,570,288,89);
    for(const p of [m.player,m.bot]){const pose=p.boosting?'jetpack':!p.grounded?'jump':Math.abs(p.vx)>45?'sprint':'walk';const h=96;
      c.save();if(mobile&&!p.grounded&&p.touchDirection){c.translate(p.x,p.y);c.rotate(Math.atan2(p.touchDirection.y,p.touchDirection.x)+Math.PI/2);c.translate(-p.x,-p.y);}
      this.fit(`${p.skin}_${pose}`,p.x-43,p.y+p.h/2-h,86,h,p.facing<0);c.restore();}
    if(mobile){const b=m.ball;c.save();c.beginPath();c.arc(b.x,b.y,b.r+2,0,Math.PI*2);c.lineWidth=1.5;c.strokeStyle='#a0f6ffb0';c.shadowColor='#56d9ff';c.shadowBlur=9;c.stroke();c.restore();}
    const b=m.ball;c.save();c.translate(b.x,b.y);c.rotate(b.angle);this.fit(b.flash>0?'impact':'ball',-b.r,-b.r,b.r*2,b.r*2);c.restore();
    this.aimIndicator(b,m.control?.indicator);
    this.controlIndicator(b,m.control);
    c.restore();
  }
}
