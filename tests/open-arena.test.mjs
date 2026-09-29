import test from 'node:test';
import assert from 'node:assert/strict';
import { solids,classicSolids,OPEN_ARENA } from '../src/arena.js';
import { createBall } from '../src/ball.js';
import { createPlayer } from '../src/player.js';
import { collideBall,movePlayer } from '../src/physics.js';
import { Renderer } from '../src/renderer.js';

test('arène ouverte : seuls les trois solides intérieurs sont désactivés, originaux conservés',()=>{
  assert.equal(OPEN_ARENA,true);
  assert.equal(classicSolids.filter(s=>['platform','obstacle'].includes(s.kind)).length,3);
  assert.deepEqual(solids,classicSolids.filter(s=>!['platform','obstacle'].includes(s.kind)));
  for(const s of solids)assert.ok(classicSolids.includes(s),'same floor and goal objects');
});
for(const [name,x,y] of [['plateforme gauche',400,400],['plateforme droite',880,400],['centre',640,605]]){
  test(`arène ouverte : balle libre à travers ${name}`,()=>{
    const ball=createBall();Object.assign(ball,{x,y,vx:120,vy:80});const before={...ball};collideBall(ball,solids);assert.deepEqual(ball,before);
  });
  for(const skin of ['fluid','heavy'])test(`arène ouverte : ${skin} libre à travers ${name}`,()=>{
    const p=createPlayer(skin);Object.assign(p,{x,y,vx:100,vy:-100});movePlayer(p,solids,.05);
    assert.equal(p.x,x+5);assert.equal(p.y,y-5);assert.equal(p.vx,100);assert.equal(p.vy,-100);
  });
}
test('arène ouverte : le rendu conserve les deux cages/rampes et ne dessine aucun intérieur',()=>{
  const noop=()=>{},ctx=new Proxy({createLinearGradient:()=>({addColorStop:noop})},{get:(o,k)=>o[k]??noop,set:(o,k,v)=>(o[k]=v,true)});
  const renderer=new Renderer({getContext:()=>ctx}),draws=[];
  renderer.camera.update=()=>({zoom:1,x:640,y:360});renderer.fit=key=>draws.push(key);renderer.goalRamp=key=>draws.push(key);
  renderer.render({player:createPlayer('fluid'),bot:createPlayer('heavy'),ball:createBall()});
  for(const key of ['left','right','rampLeft','rampRight'])assert.ok(draws.includes(key));
  assert.ok(!draws.includes('platform'));assert.ok(!draws.includes('obstacle'));
});
