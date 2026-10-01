import { CONFIG as C } from './config.js';
import { solids, OPEN_ARENA } from './arena.js';
import { MobileCamera } from './mobile-camera.js';
import { drawBallContactZone } from './ball-control.js';
const paths={background:'arena/arena_background.png',left:'arena/goal_left_blue.png',right:'arena/goal_right_red.png',rampLeft:'arena/goal_ramp_left_blue.png',rampRight:'arena/goal_ramp_right_red.png',platform:'arena/platform_large.png',obstacle:'arena/center_obstacle.png',ball:'ball/ball_idle.png',impact:'ball/ball_glow.png'};
const FLUID_AIR_POSES=Object.freeze(['air_idle','air_up','air_diagonal_up','air_horizontal','air_turn','ceiling','air_diagonal_down','air_dash']);
export const FLUID_AIR_ASSETS=Object.freeze(FLUID_AIR_POSES.map(pose=>`fluid_${pose}`));
const FLUID_VISUAL=Object.freeze({hysteresis:.08,maxRotation:.16,dashWindow:.12,idleY:.82,upY:.58,diagUpY:.22,horizontalY:-.16,diagDownY:-.62,turnY:-.78});
const FLUID_POSE_Y=Object.freeze({air_idle:.92,air_up:.68,air_diagonal_up:.36,air_horizontal:0,air_diagonal_down:-.46,air_turn:-.88,ceiling:-1});
function normalize(x=0,y=0){if(!Number.isFinite(x)||!Number.isFinite(y))return null;const length=Math.hypot(x,y);return length>1e-6?{x:x/length,y:y/length}:null;}
function clamp(v,min,max){return Math.max(min,Math.min(max,v));}
export function resolveFluidContactIndicator(player,control){
  if(!player||!control?.available)return null;
  const direction=normalize(control.indicator?.x,control.indicator?.y)||normalize(player.controlX,player.controlY)||{x:player.facing||1,y:0};
  const charge=control.indicator?.charge??0;
  const offset=Math.max(player.w*.36,player.h*.18)*(C.fluidVisualScale||1);
  return {x:player.x+direction.x*offset,y:player.y+direction.y*offset,direction,charge};
}
for(const pose of FLUID_AIR_POSES)paths[`fluid_${pose}`]=`characters/fluid/fluid_${pose}.png`;
for(const pose of ['idle','walk','jump','sprint','jetpack','attack'])paths[`fluid_${pose}`]=`characters/fluid/fluid_${pose}.png`;
for(const pose of ['walk','jump','jetpack','sprint'])paths[`heavy_${pose}`]=`characters/heavy/heavy_${pose}.png`;
export function resolveFluidVisualPose(p,cache={}){
  const supported=!!p.grounded||p.contactSurface==='ceiling';
  const look=normalize(p.footX,p.footY)||{x:0,y:1};
  const motion=normalize(p.vx,p.vy)||null;
  let pose;
  if(supported&&p.contactSurface==='ceiling')pose='ceiling';
  else if(!supported&&Number.isFinite(p.impulseCooldown)&&p.impulseCooldown>C.airImpulseCooldown-FLUID_VISUAL.dashWindow)pose='air_dash';
  else if(!supported&&(p.rotateHeld&&p.flipIntent>=C.airFlipIntentTime||look.y<=FLUID_VISUAL.turnY))pose='air_turn';
  else if(!supported){
    if(look.y>=FLUID_VISUAL.idleY)pose='air_idle';
    else if(look.y>=FLUID_VISUAL.upY)pose='air_up';
    else if(look.y>=FLUID_VISUAL.diagUpY)pose='air_diagonal_up';
    else if(look.y>=FLUID_VISUAL.horizontalY)pose='air_horizontal';
    else if(look.y>=FLUID_VISUAL.diagDownY)pose='air_diagonal_down';
    else pose='air_turn';
  }else pose=Math.abs(p.vx)>45?'sprint':'walk';
  const last=cache.pose;if(last&&last!==pose&&Math.abs(look.y-(FLUID_POSE_Y[last]??0))<FLUID_VISUAL.hysteresis)pose=last;
  cache.pose=pose;cache.look=look;
  const flip=look.x<-.12||(Math.abs(look.x)<=.12&&(p.controlX<0||p.facing<0));
  const drift=motion||look;
  const rotation=pose==='ceiling' ? 0 : clamp((drift.x*.12+drift.y*.04),-FLUID_VISUAL.maxRotation,FLUID_VISUAL.maxRotation);
  return {key:`fluid_${pose}`,flip,rotation,pose};
}
export class Renderer{
  constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.images={};this.camera=new MobileCamera();this.fluidVisuals=new WeakMap();}
  async load(){await Promise.all(Object.entries(paths).map(([name,path])=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>{this.images[name]=im;resolve();};im.onerror=()=>reject(new Error(path));im.src=`assets/${path}`;})));}
  fit(key,x,y,w,h,flip=false,alpha=1){const im=this.images[key];if(!im)return;const s=Math.min(w/im.width,h/im.height),dw=im.width*s,dh=im.height*s;const c=this.ctx;c.save();c.globalAlpha=alpha;c.translate(x+w/2,y+h/2);if(flip)c.scale(-1,1);c.drawImage(im,-dw/2,-dh/2,dw,dh);c.restore();}
  drawSprite(key,x,y,w,h,{flip=false,rotation=0,alpha=1}={}){const im=this.images[key];if(!im)return;const s=Math.min(w/im.width,h/im.height),dw=im.width*s,dh=im.height*s;const c=this.ctx;c.save();c.globalAlpha=alpha;c.translate(x+w/2,y+h/2);if(rotation)c.rotate(rotation);if(flip)c.scale(-1,1);c.drawImage(im,-dw/2,-dh/2,dw,dh);c.restore();}
  goalRamp(key,mirrored=false){
    const im=this.images[key];if(!im)return;const c=this.ctx;
    // Keep the supplied PNG intact. Only its lower ramp/support portion is drawn;
    // the cage above source y=280 is excluded, not overlaid on the existing goal.
    const sourceX=191,sourceY=280,sourceWidth=555,sourceHeight=im.height-sourceY;
    const base=solids.find(s=>s.kind==='goalBase'&&s.x===0);
    const sx=(base.w-C.goalLeft)/280,sy=(C.floor-C.goalRampBottom)/120;
    const width=sourceWidth*sx,height=sourceHeight*sy;
    c.save();if(mirrored){c.translate(C.width,0);c.scale(-1,1);}
    // Clip to the actual collision outline, so the texture follows the solid slope.
    c.beginPath();base.vertices.forEach((v,i)=>i?c.lineTo(v.x,v.y):c.moveTo(v.x,v.y));c.closePath();c.clip();
    if(mirrored){c.translate(width,0);c.scale(-1,1);}
    c.drawImage(im,mirrored?im.width-sourceX-sourceWidth:sourceX,sourceY,sourceWidth,sourceHeight,0,C.goalRampBottom,width,height);
    c.restore();
  }
  fluidIndicator(player,control){
    const anchor=resolveFluidContactIndicator(player,control);if(!anchor)return;const c=this.ctx;const {x,y,direction,charge}=anchor;
    c.save();c.translate(x,y);c.rotate(Math.atan2(direction.y,direction.x));c.lineJoin='round';c.shadowColor='#43dcff';c.shadowBlur=6+8*charge;
    const shaft=player.w*.28,head=player.w*.44,spread=8+charge*2;
    c.beginPath();c.moveTo(-shaft,0);c.lineTo(head,0);c.strokeStyle='#07243b';c.lineWidth=6;c.stroke();
    c.beginPath();c.moveTo(head,0);c.lineTo(head-12,-spread);c.lineTo(head-12,spread);c.closePath();c.fillStyle=`rgba(144,248,255,${.86+.14*charge})`;c.fill();
    c.beginPath();c.moveTo(-shaft,0);c.lineTo(head,0);c.strokeStyle=`rgba(144,248,255,${.8+.2*charge})`;c.lineWidth=3+charge*.8;c.stroke();
    c.restore();
  }
  render(m,{mobile=false,dt=1/60}={}){const c=this.ctx;c.clearRect(0,0,C.width,C.height);
    const camera=this.camera.update(m,mobile,dt);c.save();
    const fluidW=86*(C.fluidVisualScale||1),fluidH=96*(C.fluidVisualScale||1);
    if(mobile){c.translate(C.width/2,C.height/2);c.scale(camera.zoom,camera.zoom);c.translate(-camera.x,-camera.y);}
    const bg=this.images.background;if(bg){const s=Math.max(C.width/bg.width,C.height/bg.height);c.drawImage(bg,(C.width-bg.width*s)/2,0,bg.width*s,bg.height*s);}c.fillStyle='#080c2350';c.fillRect(0,0,C.width,C.height);
    const grad=c.createLinearGradient(0,C.floor,0,C.height);grad.addColorStop(0,'#131735cc');grad.addColorStop(1,'#080e22');c.fillStyle=grad;c.fillRect(0,C.floor,C.width,C.height-C.floor);c.strokeStyle='#71ddff90';c.lineWidth=2;c.beginPath();c.moveTo(0,C.floor);c.lineTo(C.width,C.floor);c.stroke();
    this.goalRamp('rampLeft');this.goalRamp('rampRight',true);
    this.fit('left',0,C.goalTop-1,181,C.goalBottom-C.goalTop+2);this.fit('right',C.width-198,C.goalTop-1,198,C.goalBottom-C.goalTop+2);if(!OPEN_ARENA){this.fit('platform',285,380,230,96);this.fit('platform',765,380,230,96);this.fit('obstacle',496,570,288,89);}
    for(const p of [m.player,m.bot].filter(Boolean)){const h=96;
      if(p.skin==='fluid'&&(!p.grounded||p.contactSurface==='ceiling')){
        const cache=this.fluidVisuals.get(p)||{};this.fluidVisuals.set(p,cache);
        const visual=resolveFluidVisualPose(p,cache);
        this.drawSprite(visual.key,p.x-fluidW/2,p.y+p.h/2-fluidH,fluidW,fluidH,{flip:visual.flip,rotation:visual.rotation});
      }else{
        const pose=p.boosting?'jetpack':!p.grounded?'jump':Math.abs(p.vx)>45?'sprint':'walk';
        const visualW=p.skin==='fluid'?fluidW:86,visualH=p.skin==='fluid'?fluidH:h;
        this.fit(`${p.skin}_${pose}`,p.x-visualW/2,p.y+p.h/2-visualH,visualW,visualH,p.facing<0);
      }
    }
    if(C.DEBUG_BALL_CONTACT)drawBallContactZone(c,m.player);
    if(mobile){const b=m.ball;c.save();c.beginPath();c.arc(b.x,b.y,b.r+2,0,Math.PI*2);c.lineWidth=1.5;c.strokeStyle='#a0f6ffb0';c.shadowColor='#56d9ff';c.shadowBlur=9;c.stroke();c.restore();}
    const b=m.ball;c.save();c.translate(b.x,b.y);c.rotate(b.angle);this.fit(b.flash>0?'impact':'ball',-b.r,-b.r,b.r*2,b.r*2);c.restore();
    this.fluidIndicator(m.player,m.control);
    c.restore();
  }
}
