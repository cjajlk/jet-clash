import { TouchInput } from './touch-input.js';

export class TouchControls {
  constructor(shell){
    this.input=new TouchInput();this.shell=shell;this.active=false;this.portrait=false;this.onCancel=()=>{};
    this.enabled=navigator.maxTouchPoints>0||matchMedia('(any-pointer: coarse)').matches;
    document.body.classList.toggle('touch-capable',this.enabled);
    this.layer=document.createElement('div');this.layer.id='touch-controls';this.layer.hidden=true;
    this.layer.innerHTML=`<div class="touch-stick touch-move" data-touch="move" role="group" aria-label="Joystick déplacement"><span class="touch-knob"></span><span class="touch-label">DÉPLACEMENT</span></div>
      <div class="touch-stick touch-aim" data-touch="aim" role="group" aria-label="Joystick visée"><span class="touch-knob"></span><span class="touch-label">VISÉE</span></div>
      <button type="button" class="touch-button touch-jump" data-touch="jump">SAUT</button>
      <button type="button" class="touch-button touch-boost" data-touch="boost">JET</button>
      <button type="button" class="touch-button touch-shoot" data-touch="shoot">TIR</button>
      <button type="button" class="touch-fullscreen" aria-label="Plein écran">⛶</button>
      <span class="touch-notice" role="status"></span>`;
    this.rotate=document.createElement('div');this.rotate.id='touch-rotate';this.rotate.hidden=true;
    this.rotate.innerHTML='<strong>Tourne ton téléphone</strong><span>JetClash se joue en paysage.<br>Le match est en pause.</span>';
    shell.append(this.layer,this.rotate);
    for(const el of this.layer.querySelectorAll('[data-touch]'))this.bind(el);
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
    const coordinates=e=>{
      const r=el.getBoundingClientRect(),radius=r.width*.35;
      const x=(e.clientX-r.left-r.width/2)/radius,y=(e.clientY-r.top-r.height/2)/radius;
      const length=Math.max(1,Math.hypot(x,y));return {x:x/length,y:y/length};
    };
    el.addEventListener('pointerdown',e=>{
      if(!this.active||this.portrait||e.pointerType==='mouse'&&e.button!==0)return;
      e.preventDefault();const {x,y}=coordinates(e);
      if(this.input.start(e.pointerId,el.dataset.touch,x,y)){el.setPointerCapture(e.pointerId);this.paint();}
    });
    el.addEventListener('pointermove',e=>{
      if(!this.input.pointers.has(e.pointerId))return;e.preventDefault();const {x,y}=coordinates(e);this.input.move(e.pointerId,x,y);this.paint();
    });
    for(const name of ['pointerup','pointercancel','lostpointercapture'])el.addEventListener(name,e=>{
      if(!this.input.pointers.has(e.pointerId))return;e.preventDefault();this.input.end(e.pointerId,name!=='pointerup');this.paint();
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
  update(state){
    const active=this.enabled&&['PRE_ROUND','PLAYING','GOAL_SCORED'].includes(state);
    const portrait=active&&innerHeight>innerWidth;
    if(active!==this.active||portrait!==this.portrait){this.clear();this.onCancel();}
    this.active=active;this.portrait=portrait;
    document.body.classList.toggle('touch-match',active);
    this.layer.hidden=!active||portrait;this.rotate.hidden=!portrait;
  }
}
