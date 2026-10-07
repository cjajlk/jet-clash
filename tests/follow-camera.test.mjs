import test from 'node:test';
import assert from 'node:assert/strict';
import {MobileCamera} from '../src/mobile-camera.js';
import {Renderer} from '../src/renderer.js';
import {CONFIG as C} from '../src/config.js';
const scene=()=>({state:'PLAYING',player:{x:550,y:500},ball:{x:600,y:500,r:28.5,vx:0,vy:0},bot:{x:1200,y:500}});
const settle=(c,m,frames=120,dt=1/60)=>{for(let i=0;i<frames;i++)c.update(m,true,dt);return c;};
test('suivi : joueur/ballon proches grossissent, bot distant hors cadre',()=>{
  const m=scene(),before=structuredClone(m),c=settle(new MobileCamera(),m);
  assert.ok(c.zoom>1.49&&c.zoom<=1.5);assert.ok(c.project(m.player.x,m.player.y).visible);
  assert.ok(c.project(m.ball.x,m.ball.y).visible);assert.equal(c.project(m.bot.x,m.bot.y).visible,false);assert.deepEqual(m,before);
});
test('suivi : s’ouvre dès une frappe longue en gardant le joueur',()=>{
  const m=scene(),c=settle(new MobileCamera(),m);m.ball.x=1200;m.ball.vx=1000;c.update(m,true);
  assert.ok(c.zoom<1.5);assert.ok(c.project(m.ball.x,m.ball.y).visible);assert.ok(c.project(m.player.x,m.player.y).visible);
});
test('suivi : un déplacement ordinaire et le rapprochement restent amortis',()=>{
  const m=scene(),c=settle(new MobileCamera(),m),x=c.x;m.player.x+=20;m.ball.x+=20;c.update(m,true);
  assert.ok(c.x>x&&c.x<x+20);m.player.x=120;m.ball.x=1220;c.update(m,true);const wide=c.zoom;
  m.player.x=550;m.ball.x=600;c.update(m,true);assert.ok(c.zoom>wide&&c.zoom<1.5);
});
test('suivi : la cage proche reste visible sur toute sa hauteur',()=>{
  for(const x of [180,1100]){
    const m=scene();m.player.x=x;m.ball.x=x;m.ball.y=350;const c=settle(new MobileCamera(),m);
    for(const y of [C.goalTop,C.goalBottom])assert.ok(c.project(x<320?C.goalLeft:C.goalRight,y).visible);
  }
});
test('suivi : anticipation du ballon et limites du décor',()=>{
  for(const velocity of [-1600,1600]){
    const m=scene();m.ball.vx=velocity;const c=settle(new MobileCamera(),m);
    const halfW=C.width/(2*c.zoom),halfH=C.height/(2*c.zoom);
    assert.ok(c.x>=halfW&&c.x<=C.width-halfW);assert.ok(c.y>=halfH&&c.y<=C.height-halfH);
    assert.ok(c.project(m.ball.x,m.ball.y).visible);
  }
});
test('suivi : fluidité indépendante du rafraîchissement',()=>{
  const m=scene(),a=settle(new MobileCamera(),m,60,1/30),b=settle(new MobileCamera(),m,240,1/120);
  assert.ok(Math.abs(a.zoom-b.zoom)<1e-10);
});
test('suivi : cadre figé au but, vue entière au coup d’envoi et au menu',()=>{
  const m=scene(),c=settle(new MobileCamera(),m),before={x:c.x,y:c.y,zoom:c.zoom};
  m.state='GOAL_SCORED';m.ball.x=1200;c.update(m,true);assert.deepEqual({x:c.x,y:c.y,zoom:c.zoom},before);
  for(const state of ['PRE_ROUND','POST_MATCH','MENU']){m.state=state;c.update(m,true);assert.equal(c.zoom,1);assert.equal(c.active,false);}
});
test('suivi : les repères ne se superposent pas pour trois bots hors écran',()=>{
  const m=scene();m.players=[m.player,...['ALLIÉ','BOT 1','BOT 2'].map(label=>({x:1250,y:500,label,team:label==='ALLIÉ'?'player':'bot'}))];
  const arcs=[],labels=[],ctx={save(){},restore(){},beginPath(){},arc(x,y){arcs.push({x,y});},fill(){},stroke(){},translate(){},rotate(){},moveTo(){},lineTo(){},closePath(){},fillText(text){labels.push(text);}};
  const r=new Renderer({getContext:()=>ctx});settle(r.camera,m);const before=structuredClone(m);r.offscreenPlayers(m);
  assert.equal(arcs.length,3);assert.equal(new Set(arcs.map(p=>p.y)).size,3);assert.deepEqual(labels,['ALLIÉ','BOT 1','BOT 2']);assert.deepEqual(m,before);
});
