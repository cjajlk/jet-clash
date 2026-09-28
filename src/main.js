import { CONFIG as C } from './config.js';
import { Match, STATES } from './match.js';
import { ProfileStore } from './profile-store.js';
import { KeyboardInput } from './input.js';
import { Renderer } from './renderer.js';
import { HUD } from './hud.js';
const canvas=document.getElementById('arena'),renderer=new Renderer(canvas),hud=new HUD(),input=new KeyboardInput();
let storage;try{storage=localStorage;}catch{}
const match=new Match(new ProfileStore(storage));const start=document.getElementById('start');let ready=false;
const launch=()=>{if(!ready)return;input.clear();match.start(document.getElementById('difficulty').value);hud.update(match);canvas.focus();};
start.addEventListener('click',launch);document.getElementById('replay').addEventListener('click',launch);document.getElementById('back-menu').addEventListener('click',()=>{input.clear();match.menu();hud.update(match);});
let last=performance.now(),accumulator=0,paused=false;
function setPaused(value){paused=value;input.clear();accumulator=0;last=performance.now();document.getElementById('pause').hidden=!value||[STATES.MENU,STATES.POST_MATCH].includes(match.state);}
window.addEventListener('blur',()=>setPaused(true));window.addEventListener('focus',()=>setPaused(false));document.addEventListener('visibilitychange',()=>setPaused(document.hidden));
try{await renderer.load();ready=true;start.disabled=false;start.textContent='ENTRER DANS L’ARÈNE →';document.getElementById('load-status').textContent='5 MIN · MORT SUBITE EN CAS D’ÉGALITÉ';}catch(error){document.getElementById('load-status').textContent=`Asset inaccessible : ${error.message}. Vérifie que le ZIP est entièrement extrait.`;start.textContent='CHARGEMENT IMPOSSIBLE';}
function frame(now){const delta=Math.min((now-last)/1000,0.1);last=now;if(ready&&!paused){accumulator+=delta;while(accumulator>=C.step){match.update(C.step,input.read());accumulator-=C.step;}}renderer.render(match);hud.update(match);requestAnimationFrame(frame);}requestAnimationFrame(frame);
// Explicitly enabled only for automated local test sessions.
if(new URLSearchParams(location.search).get('test')==='1')window.__jetclash={match,input,renderer,setPaused};
