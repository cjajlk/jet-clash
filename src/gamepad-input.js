import { controlSettings } from './control-settings.js';
const neutral=()=>({axis:0,directionX:0,directionY:0,jump:false,boost:false,rotate:false,resetBall:false});
export const STICK_DEADZONE=.18;
export const TRIGGER_THRESHOLD=.12;

export function stickAxis(value){
  if(!Number.isFinite(value))return 0;
  const magnitude=Math.min(1,Math.abs(value));
  return magnitude<=STICK_DEADZONE?0:Math.sign(value)*(magnitude-STICK_DEADZONE)/(1-STICK_DEADZONE);
}
function labelFor(id=''){
  if(/dualsense|0ce6|0df2/i.test(id))return 'PS5';
  if(/054c|sony|playstation|wireless controller/i.test(id))return 'PlayStation';
  if(/xbox|xinput/i.test(id))return 'Xbox';
  return 'Manette';
}
function button(pad,index,threshold){
  const b=pad.buttons?.[index];return !!b&&(b.pressed||Number.isFinite(b.value)&&b.value>threshold);
}

export class GamepadInput {
  constructor(target=window,source=navigator,onActivity=()=>{}){
    this.source=source;this.onActivity=onActivity;this.index=null;
    this.previous=neutral();this.previousReset=false;this.axisAtActivity=0;this.needsNeutral=false;
    this.status={available:typeof source.getGamepads==='function',connected:false,supported:false,label:'Manette'};
    // Events discard stale input immediately. Polling also covers pads connected
    // before the page loaded, sparse slots, and a missed connection event.
    target.addEventListener('gamepadconnected',()=>{this.previous=neutral();this.axisAtActivity=0;});
    target.addEventListener('gamepaddisconnected',e=>{
      if(e.gamepad?.index===this.index){this.index=null;this.previous=neutral();this.axisAtActivity=0;this.needsNeutral=false;this.status={...this.status,connected:false,supported:false};}
    });
  }
  clear(){
    this.needsNeutral=this.needsNeutral||!!(this.previous.axis||this.previous.directionY||this.previous.jump||this.previous.boost||this.previous.rotate);
    this.previous=neutral();this.previousReset=false;this.axisAtActivity=0;
  }
  read(){
    let pads=[];
    try{
      this.status.available=typeof this.source.getGamepads==='function';
      if(this.status.available)pads=Array.from(this.source.getGamepads()||[]).filter(p=>p&&p.connected);
    }catch{this.status.available=false;}
    const supported=pads.filter(p=>p.mapping==='standard');
    const pad=supported.find(p=>p.index===this.index)||supported[0]||pads[0];
    this.status={available:this.status.available,connected:!!pad,supported:!!pad&&pad.mapping==='standard',label:labelFor(pad?.id)};
    if(!this.status.supported){this.index=null;this.previous=neutral();this.axisAtActivity=0;this.needsNeutral=false;return neutral();}
    if(this.index!==pad.index){this.previous=neutral();this.axisAtActivity=0;this.needsNeutral=false;}
    this.index=pad.index;
    const useLeft=controlSettings.gamepad.movementStick==='left';
    // W3C standard mapping: Cross/A=0, Circle/B=1 and Square/X=2.
    const directionX=stickAxis(pad.axes?.[useLeft?0:2]);
    const directionY=stickAxis(pad.axes?.[useLeft?1:3]);
    const state={axis:directionX,directionX,directionY,jump:button(pad,controlSettings.gamepad.jump,.5),boost:button(pad,controlSettings.gamepad.boost,TRIGGER_THRESHOLD),rotate:button(pad,controlSettings.gamepad.rotate,.5),resetBall:button(pad,controlSettings.gamepad.resetBall,.5)};
    if(this.needsNeutral){if(!state.axis&&!state.directionY&&!state.jump&&!state.boost&&!state.rotate)this.needsNeutral=false;return neutral();}
    const moved=(state.axis!==0||state.directionY!==0)&&(this.axisAtActivity===0||Math.sign(state.axis)!==Math.sign(this.axisAtActivity)||Math.abs(state.axis-this.axisAtActivity)>.08||Math.abs(state.directionY-this.previous.directionY)>.08);
    if(moved||state.jump&&!this.previous.jump||state.boost&&!this.previous.boost||state.rotate&&!this.previous.rotate){this.onActivity();this.axisAtActivity=state.axis;}
    if(state.axis===0)this.axisAtActivity=0;
    const resetBall=state.resetBall&&!this.previousReset;
    this.previous=state;this.previousReset=state.resetBall;
    return {...state,resetBall};
  }
}
