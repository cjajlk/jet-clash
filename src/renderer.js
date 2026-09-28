import { CONFIG as C } from './config.js';
const paths={background:'arena/arena_background.png',left:'arena/goal_left_blue.png',right:'arena/goal_right_red.png',platform:'arena/platform_large.png',obstacle:'arena/center_obstacle.png',ball:'ball/ball_idle.png',impact:'ball/ball_glow.png'};
for(const skin of ['fluid','heavy'])for(const pose of ['walk','jump','jetpack','sprint'])paths[`${skin}_${pose}`]=`characters/${skin}/${skin}_${pose}.png`;
export class Renderer{
  constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.images={};}
  async load(){await Promise.all(Object.entries(paths).map(([name,path])=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>{this.images[name]=im;resolve();};im.onerror=()=>reject(new Error(path));im.src=`assets/${path}`;})));}
  fit(key,x,y,w,h,flip=false,alpha=1){const im=this.images[key];if(!im)return;const s=Math.min(w/im.width,h/im.height),dw=im.width*s,dh=im.height*s;const c=this.ctx;c.save();c.globalAlpha=alpha;c.translate(x+w/2,y+h/2);if(flip)c.scale(-1,1);c.drawImage(im,-dw/2,-dh/2,dw,dh);c.restore();}
  render(m){const c=this.ctx;c.clearRect(0,0,C.width,C.height);const bg=this.images.background;if(bg){const s=Math.max(C.width/bg.width,C.height/bg.height);c.drawImage(bg,(C.width-bg.width*s)/2,0,bg.width*s,bg.height*s);}c.fillStyle='#080c2350';c.fillRect(0,0,C.width,C.height);
    const grad=c.createLinearGradient(0,C.floor,0,C.height);grad.addColorStop(0,'#131735cc');grad.addColorStop(1,'#080e22');c.fillStyle=grad;c.fillRect(0,C.floor,C.width,C.height-C.floor);c.strokeStyle='#71ddff90';c.lineWidth=2;c.beginPath();c.moveTo(0,C.floor);c.lineTo(C.width,C.floor);c.stroke();
    // Visible bases match the solid geometry below the two elevated openings.
    for(const [x,w,color] of [[0,C.goalLeft,'#55dbff'],[C.goalRight,C.width-C.goalRight,'#ff5b79']]){
      c.fillStyle='#151e36';c.fillRect(x,C.goalBottom,w,C.floor-C.goalBottom);
      c.strokeStyle=color;c.lineWidth=2;c.strokeRect(x+1,C.goalBottom+1,w-2,C.floor-C.goalBottom-2);
    }
    this.fit('left',0,C.goalTop-1,181,C.goalBottom-C.goalTop+2);this.fit('right',C.width-198,C.goalTop-1,198,C.goalBottom-C.goalTop+2);this.fit('platform',285,380,230,96);this.fit('platform',765,380,230,96);this.fit('obstacle',496,570,288,89);
    for(const p of [m.player,m.bot]){const pose=p.boosting?'jetpack':!p.grounded?'jump':Math.abs(p.vx)>45?'sprint':'walk';const h=96;this.fit(`${p.skin}_${pose}`,p.x-43,p.y+p.h/2-h,86,h,p.facing<0);}
    const b=m.ball;c.save();c.translate(b.x,b.y);c.rotate(b.angle);this.fit(b.flash>0?'impact':'ball',-b.r,-b.r,b.r*2,b.r*2);c.restore();
  }
}
