import { TouchInput } from './touch-input.js';
import { controlSettings } from './control-settings.js';

export class TouchControls {
  constructor(shell){
    this.input=new TouchInput();this.shell=shell;this.active=false;this.portrait=false;this.onCancel=()=>{};this.onReset=()=>{};
    this.enabled=navigator.maxTouchPoints>0||matchMedia('(any-pointer: coarse)').matches;
    document.body.classList.toggle('touch-capable',this.enabled);
    this.layer=document.createElement('div');this.layer.id='touch-controls';this.layer.hidden=true;
    this.layer.innerHTML=`<div class="touch-stick touch-move" data-touch="move" role="group" aria-label="Joystick directionnel 360 degrés"><span class="touch-knob"></span></div>
      <button type="button" class="touch-button touch-jump" data-touch="jump">SAUT</button>
      <button type="button" class="touch-button touch-rot" data-touch="rot">ROT</button>
      <button type="button" class="touch-button touch-boost" data-touch="boost">JET</button>
      <button type="button" class="touch-button touch-shoot" data-touch="shoot" aria-label="Tir : maintenir pour charger, glisser pour viser, relâcher pour frapper">TIR</button>
      <button type="button" class="touch-button touch-reset" data-touch="reset">RESET</button>
      <button type="button" class="touch-fullscreen" aria-label="Plein écran">⛶</button>
      <span class="touch-notice" role="status"></span>`;
    this.rotate=document.createElement('div');this.rotate.id='touch-rotate';this.rotate.hidden=true;
    this.rotate.innerHTML='<strong>Tourne ton téléphone</strong><span>JetClash se joue en paysage.<br>Le match est en pause.</span>';
    shell.append(this.layer,this.rotate);
    for(const el of this.layer.querySelectorAll('[data-touch]'))this.bind(el);
    const reset=this.layer.querySelector('[data-touch="reset"]');
    if(reset)reset.addEventListener('click',()=>{if(this.active&&this.training)this.onReset();});
    this.layer.querySelector('.touch-fullscreen').addEventListener('click',async()=>{
      const notice=this.layer.querySelector('.touch-notice');
      try{
        if(document.fullscreenElement)await document.exitFullscreen();
        else if(shell.requestFullscreen)await shell.requestFullscreen();
        else notice.textContent='Plein écran non disponible ; le jeu reste utilisable.';
      }catch{notice.textContent='Plein écran non disponible ; le jeu reste utilisable.';}
    });
    window.addEventListener('blur',()=>this.clear());
    window.addEventListener('resize',()=>{if(this.enabled){this.clear();this.onCancel();}});
    document.addEventListener('visibilitychange',()=>{if(document.hidden){this.clear();this.onCancel();}});
    for(const name of ['contextmenu','dragstart'])shell.addEventListener(name,e=>{if(this.active)e.preventDefault();});
  }
  bind(el){
    const origins=new Map();
    const coordinates=e=>{
      if(el.dataset.touch==='shoot'){
        const origin=origins.get(e.pointerId)||{x:e.clientX,y:e.clientY};
        // 48 CSS pixels of travel, with the existing .18 radial deadzone (~9px).
        return {x:(e.clientX-origin.x)/48,y:(e.clientY-origin.y)/48};
      }
      const r=el.getBoundingClientRect(),radius=r.width*.35;
      const x=(e.clientX-r.left-r.width/2)/radius,y=(e.clientY-r.top-r.height/2)/radius;
      const length=Math.max(1,Math.hypot(x,y));return {x:x/length,y:y/length};
    };
    el.addEventListener('pointerdown',e=>{
      if(!this.active||this.portrait||e.pointerType==='mouse'&&e.button!==0)return;
      e.preventDefault();origins.set(e.pointerId,{x:e.clientX,y:e.clientY});const {x,y}=coordinates(e);
      if(this.input.start(e.pointerId,el.dataset.touch,x,y)){el.setPointerCapture(e.pointerId);this.paint();}
    });
    el.addEventListener('pointermove',e=>{
      if(!this.input.pointers.has(e.pointerId))return;e.preventDefault();const {x,y}=coordinates(e);this.input.move(e.pointerId,x,y);this.paint();
    });
    for(const name of ['pointerup','pointercancel','lostpointercapture'])el.addEventListener(name,e=>{
      if(!this.input.pointers.has(e.pointerId)){origins.delete(e.pointerId);return;}
      e.preventDefault();
      if(name==='pointerup'&&el.dataset.touch==='shoot'){const {x,y}=coordinates(e);this.input.move(e.pointerId,x,y);}
      this.input.end(e.pointerId,name!=='pointerup');origins.delete(e.pointerId);this.paint();
    });
  }
  paint(){
    for(const el of this.layer.querySelectorAll('[data-touch]')){
      const p=[...this.input.pointers.values()].find(p=>p.control===el.dataset.touch);
      el.classList.toggle('pressed',!!p);
      const knob=el.querySelector('.touch-knob');if(knob)knob.style.transform=`translate(${(p?.x||0)*90}%,${(p?.y||0)*90}%)`;
    }
  }
  clear(){this.input.clear();this.paint();}
  update(state,mode='touch',training=false){
    const active=this.enabled&&['PRE_ROUND','PLAYING','GOAL_SCORED'].includes(state);
    const portrait=active&&innerHeight>innerWidth;
    const gamepad=mode==='gamepad';
    if(active!==this.active||portrait!==this.portrait||gamepad!==this.gamepadMode){this.clear();this.onCancel();}
    this.active=active;this.portrait=portrait;
    this.gamepadMode=gamepad;
    this.training=training;
    this.layer.dataset.layout=controlSettings.touch.layout;
    document.body.classList.toggle('touch-match',active&&!portrait&&!gamepad);
    this.layer.hidden=!active||portrait||gamepad;this.rotate.hidden=!portrait||gamepad;
    const reset=this.layer.querySelector('[data-touch="reset"]');if(reset)reset.hidden=!training||portrait||gamepad;
  }
}
