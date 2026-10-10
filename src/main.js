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
import { controlSettings } from './control-settings.js';
import { GameplayAudio } from './gameplay-audio.js';
const canvas=document.getElementById('arena'),renderer=new Renderer(canvas),hud=new HUD(),input=new PlayerInput(),controlsHelp=new ControlsHelp();
const mobile=new TouchControls(document.getElementById('game-shell'));
let storage;try{storage=localStorage;}catch{}
const profile=new ProfileStore(storage);
const audio=new GameplayAudio({enabled:profile.data.settings?.sound!==false,onEnabledChange:enabled=>{
  profile.data.settings={...profile.data.settings,sound:enabled};profile.save();
}});
const match=new Match(profile,(kind,detail)=>audio.play(kind,detail));const start=document.getElementById('start');let ready=false;
for(const event of ['pointerdown','keydown'])document.addEventListener(event,e=>{if(e.isTrusted)audio.unlock();},{capture:true});
// A touch/layout change cancels pending shots but must not lock a held gamepad stick.
mobile.onCancel=()=>{match.control.release();input.clear();input.resumeGamepad();};
mobile.onReset=()=>{if(match.training)match.resetTrainingBall();};
const launch=payload=>{if(!ready)return;setPaused(false);input.resumeGamepad();touchCancelled=false;touchReleaseAim=null;const mode=payload?.mode||'duel';if(mode==='training')match.start('training',undefined,payload?.arena);else{const difficulty=payload?.difficulty||document.getElementById('difficulty').value;document.getElementById('difficulty').value=difficulty;match.start(mode==='2v2'?'2v2':difficulty,difficulty);}mobileMenu.update(match,ready);hud.update(match);canvas.focus();};
const mobileMenu=new MobileMenu({enabled:true,onLaunch:payload=>launch(payload),audio});
mobileMenu.update(match,false,'Chargement de l’arène…');
const returnToMenu=()=>{
  setPaused(false);touchCancelled=false;touchReleaseAim=null;
  audio.stop();match.menu();renderer.camera.reset();document.getElementById('pause').hidden=true;
  // Recover older arena-only fullscreen sessions: the menu is a sibling of the arena.
  if(document.fullscreenElement&&document.fullscreenElement!==document.documentElement){
    document.exitFullscreen().catch(error=>console.warn('Retour au menu : sortie du plein écran impossible',error));
  }
  mobile.update(match.state);mobileMenu.update(match,ready);hud.update(match);
  mobileMenu.root.querySelector('#mobile-play')?.focus();
};
start.addEventListener('click',launch);document.getElementById('replay').addEventListener('click',()=>launch({mode:match.mode,difficulty:match.difficulty,arena:match.trainingArenaId}));
for(const id of ['back-menu','leave-game'])document.getElementById(id).addEventListener('click',returnToMenu);
let last=performance.now(),accumulator=0,paused=false,touchCancelled=false,touchReleaseAim=null;
function setPaused(value){paused=value;audio.setPaused(value);if(value)match.control.release();input.clear();mobile.clear();accumulator=0;last=performance.now();document.getElementById('pause').hidden=!value||[STATES.MENU,STATES.POST_MATCH].includes(match.state);}
window.addEventListener('blur',()=>setPaused(true));window.addEventListener('focus',()=>{input.resumeGamepad();setPaused(false);});document.addEventListener('visibilitychange',()=>{if(!document.hidden)input.resumeGamepad();setPaused(document.hidden);});document.addEventListener('fullscreenchange',()=>{input.resumeGamepad();if(!document.hidden)setPaused(false);if(match.state===STATES.MENU)mobileMenu.root.querySelector('[data-fullscreen],.mm-gear')?.focus();else canvas.focus();});
try{await renderer.load();ready=true;start.disabled=false;start.textContent='ENTRER DANS L’ARÈNE →';document.getElementById('load-status').textContent='5 MIN · MORT SUBITE EN CAS D’ÉGALITÉ';}catch(error){document.getElementById('load-status').textContent=`Asset inaccessible : ${error.message}. Vérifie que le ZIP est entièrement extrait.`;start.textContent='CHARGEMENT IMPOSSIBLE';}
function frame(now){
  // Schedule first: an isolated input/presentation error must not kill every future frame.
  requestAnimationFrame(frame);
  const delta=Math.min((now-last)/1000,0.1);last=now;
  mobileMenu.update(match,ready,document.getElementById('load-status').textContent);
  const touch=mobile.input.read();touchCancelled ||= touch.cancelShot;
  if(touch.releaseAim)touchReleaseAim=touch.releaseAim;
  if(touch.cancelShot||touch.shoot)touchReleaseAim=null;
  // Keep the release direction until a physics tick consumes the release,
  // including on screens whose refresh rate exceeds the physics rate.
  const released=touchReleaseAim?{aimX:touchReleaseAim.x,aimY:touchReleaseAim.y,aimActive:true}:{};
  const playerControls=input.read();
  const ballControls=input.readBallControls();
  // If a saved/custom gamepad profile assigns TIR and FLIP to the same button,
  // prioritise the aimed shot while the button is held. This prevents the flip
  // action from rotating Fluid during charge/aim and restores predictable 360° aiming.
  if(input.gamepad.status.connected&&ballControls.shoot&&controlSettings.gamepad.shoot===controlSettings.gamepad.rotate){
    playerControls.rotate=false;
  }
  const controls=combineTouch({...playerControls,...ballControls},{...touch,...released,cancelShot:touchCancelled});
  controlsHelp.update(input);
  const gamepadActive=input.gamepad.status.connected;
  if(controls.resetBall&&match.training)match.resetTrainingBall();
  mobile.update(match.state,gamepadActive?'gamepad':'touch',match.training);
  if(ready&&!paused&&!mobile.portrait){
    accumulator+=delta;
    while(accumulator>=C.step){match.update(C.step,controls);accumulator-=C.step;touchCancelled=false;touchReleaseAim=null;}
  }else accumulator=0;
  if(!mobileMenu.visible)renderer.render(match,{mobile:mobile.active&&!mobile.portrait,dt:delta});hud.update(match);
}requestAnimationFrame(frame);
// Explicitly enabled only for automated local test sessions.
if(new URLSearchParams(location.search).get('test')==='1')window.__jetclash={match,input,renderer,setPaused,mobile,audio};
