import test from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG as C } from '../src/config.js';
import { solids,classicSolids,OPEN_ARENA } from '../src/arena.js';
import { createBall } from '../src/ball.js';
import { createPlayer } from '../src/player.js';
import { collideBall,movePlayer } from '../src/physics.js';
import { Renderer } from '../src/renderer.js';

test('arène V2 : layout ouvert avec approches de but, sans anciens solides intérieurs',()=>{
  assert.equal(OPEN_ARENA,true);assert.deepEqual(solids,classicSolids);
  assert.equal(solids.some(s=>['platform','obstacle','goalPocket'].includes(s.kind)),false);
  assert.equal(solids.filter(s=>s.kind==='goalRoof').length,2);
  assert.equal(solids.filter(s=>s.kind==='goalBase').length,2);
});
for(const [name,x,y] of [['ancienne plateforme gauche',400,400],['ancienne plateforme droite',880,400],['ancien centre',640,C.floor-C.playerHeight]]){
  test(`arène V2 : balle libre à travers ${name}`,()=>{const ball=createBall();Object.assign(ball,{x,y,vx:120,vy:80});const before={...ball};collideBall(ball,solids);assert.deepEqual(ball,before);});
  for(const skin of ['fluid','heavy'])test(`arène V2 : ${skin} libre à travers ${name}`,()=>{const p=createPlayer(skin);Object.assign(p,{x,y,vx:100,vy:-100});movePlayer(p,solids,.05);assert.equal(p.x,x+5);assert.equal(p.y,y-5);});
}
test('arène V2 : rendu utilise le fond complet sans superposer de cages ni rampes',()=>{
  const noop=()=>{},ctx=new Proxy({createLinearGradient:()=>({addColorStop:noop})},{get:(o,k)=>o[k]??noop,set:(o,k,v)=>(o[k]=v,true)});
  const renderer=new Renderer({getContext:()=>ctx}),calls=[];
  renderer.camera.update=()=>({zoom:1,x:640,y:360});renderer.arenaV2Goals=()=>calls.push('arenaV2Goals');renderer.goalRamp=()=>calls.push('ramp');renderer.goalGate=()=>calls.push('oldGate');renderer.fit=key=>calls.push(key);
  const background={width:C.width,height:C.height},draws=[];renderer.images.backgroundFlat=background;ctx.drawImage=(...args)=>draws.push(args);
  renderer.render({player:createPlayer('fluid'),bot:createPlayer('heavy'),ball:createBall()});
  assert.deepEqual(draws[0],[background,0,0,C.width,C.height]);assert.ok(!calls.includes('arenaV2Goals'));assert.ok(!calls.includes('ramp'));assert.ok(!calls.includes('oldGate'));assert.ok(!calls.includes('platform'));assert.ok(!calls.includes('obstacle'));
});
