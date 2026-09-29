import { CONFIG as C } from './config.js';
import { Match, STATES } from './match.js';
import { ProfileStore } from './profile-store.js';
import { PlayerInput } from './input.js';
import { ControlsHelp } from './controls-help.js';
import { Renderer } from './renderer.js';
import { HUD } from './hud.js';
import { TouchControls } from './touch-controls.js';
import { combineTouch } from './touch-input.js';
import { MobileMenu } from './mobile-menu.js';
const canvas=document.getElementById('arena'),renderer=new Renderer(canvas),hud=new HUD(),input=new PlayerInput(),controlsHelp=new ControlsHelp();
const mobile=new TouchControls(document.getElementById('game-shell'));
let storage;try{storage=localStorage;}catch{}
const match=new Match(new ProfileStore(storage));const start=document.getElementById('start');let ready=false;
mobile.onCancel=()=>{match.control.release();input.clear();};
const launch=()=>{if(!ready)return;input.clear();mobile.clear();match.start(document.getElementById('difficulty').value);mobileMenu.update(match,ready);hud.update(match);canvas.focus();};
const mobileMenu=new MobileMenu({enabled:true,onLaunch:difficulty=>{document.getElementById('difficulty').value=difficulty;launch();}});
mobileMenu.update(match,false,'Chargement de l’arène…');
start.addEventListener('click',launch);document.getElementById('replay').addEventListener('click',launch);document.getElementById('back-menu').addEventListener('click',()=>{input.clear();match.menu();hud.update(match);});
let last=performance.now(),accumulator=0,paused=false,touchCancelled=false,touchReleaseAim=null;
function setPaused(value){paused=value;if(value)match.control.release();input.clear();mobile.clear();accumulator=0;last=performance.now();document.getElementById('pause').hidden=!value||[STATES.MENU,STATES.POST_MATCH].includes(match.state);}
window.addEventListener('blur',()=>setPaused(true));window.addEventListener('focus',()=>setPaused(false));document.addEventListener('visibilitychange',()=>setPaused(document.hidden));
try{await renderer.load();ready=true;start.disabled=false;start.textContent='ENTRER DANS L’ARÈNE →';document.getElementById('load-status').textContent='5 MIN · MORT SUBITE EN CAS D’ÉGALITÉ';}catch(error){document.getElementById('load-status').textContent=`Asset inaccessible : ${error.message}. Vérifie que le ZIP est entièrement extrait.`;start.textContent='CHARGEMENT IMPOSSIBLE';}
function frame(now){
  const delta=Math.min((now-last)/1000,0.1);last=now;
  mobileMenu.update(match,ready,document.getElementById('load-status').textContent);mobile.update(match.state);
  const touch=mobile.input.read();touchCancelled ||= touch.cancelShot;
  if(touch.releaseAim)touchReleaseAim=touch.releaseAim;
  if(touch.cancelShot||touch.shoot)touchReleaseAim=null;
  // Keep the release direction until a physics tick consumes the release,
  // including on screens whose refresh rate exceeds the physics rate.
  const released=touchReleaseAim?{aimX:touchReleaseAim.x,aimY:touchReleaseAim.y,aimActive:true}:{};
  const controls=combineTouch({...input.read(),...input.readBallControls()},{...touch,...released,cancelShot:touchCancelled});
  controlsHelp.update(input);
  if(ready&&!paused&&!mobile.portrait){
    accumulator+=delta;
    while(accumulator>=C.step){match.update(C.step,controls);accumulator-=C.step;touchCancelled=false;touchReleaseAim=null;}
  }else accumulator=0;
  if(!mobileMenu.visible)renderer.render(match,{mobile:mobile.active&&!mobile.portrait,dt:delta});hud.update(match);requestAnimationFrame(frame);
}requestAnimationFrame(frame);
// Explicitly enabled only for automated local test sessions.
if(new URLSearchParams(location.search).get('test')==='1')window.__jetclash={match,input,renderer,setPaused,mobile};
