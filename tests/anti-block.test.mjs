import test from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG as C } from '../src/config.js';
// Retain collision regression coverage for the reversible original layout.
import { classicSolids as solids } from '../src/arena.js';
import { createBall, integrateBall } from '../src/ball.js';
import { createPlayer, drive } from '../src/player.js';
import { collideBall, movePlayer, hitPlayer, circleContact } from '../src/physics.js';
import { circlePolygonContact, boxPolygonContact } from '../src/collision-shapes.js';

const zones=[
  {name:'sous le but gauche',foot:218,direction:-1,slope:1,shape:solids.find(s=>s.kind==='goalBase'&&s.x===0)},
  {name:'sous le but droit',foot:1062,direction:1,slope:1,shape:solids.find(s=>s.kind==='goalBase'&&s.x>0)},
  {name:'pied central gauche',foot:448,direction:1,slope:50/114,shape:solids.find(s=>s.kind==='obstacle')},
  {name:'pied central droit',foot:832,direction:-1,slope:50/114,shape:solids.find(s=>s.kind==='obstacle')},
];
function simulate(zone,speed,mode,seconds=8){
  const {foot,direction,slope}=zone,b=createBall();
  const tangent=b.r*(Math.sqrt(1+slope*slope)-1)/slope;
  Object.assign(b,{x:foot-direction*(tangent+(mode==='duo opposé'?0:.5)),y:C.floor-b.r,vx:direction*speed,vy:0});
  const initialX=b.x,initialY=b.y,players=[];
  const add=(skin,axis)=>{
    const p=createPlayer(skin);Object.assign(p,{x:b.x-axis*44,y:C.floor-p.h/2,grounded:true});
    movePlayer(p,solids,0);players.push({p,axis});
  };
  if(mode!=='seule')add(mode==='Heavy'?'heavy':'fluid',direction);
  if(mode==='duo même côté')add('heavy',direction);
  if(mode==='duo opposé')add('heavy',-direction);
  let escapeAt=null,minY=b.y,firstContact=false;const history=[];
  for(let i=0;i<seconds/C.step;i++){
    for(const {p,axis} of players){drive(p,{axis},C.step);movePlayer(p,solids,C.step);}
    integrateBall(b,C.step);
    if(circlePolygonContact(b,zone.shape.vertices))firstContact=true;
    // The same order as Match.update; no replacement/test-only solver.
    collideBall(b,solids);for(const {p}of players)hitPlayer(b,p);
    if(circlePolygonContact(b,zone.shape.vertices))firstContact=true;
    collideBall(b,solids);
    assert.ok(Number.isFinite(b.x)&&Number.isFinite(b.y)&&Number.isFinite(b.vx)&&Number.isFinite(b.vy));
    for(const shape of solids){
      const hit=shape.vertices?circlePolygonContact(b,shape.vertices):circleContact(b,shape);
      assert.ok((hit?.depth||0)<1e-5,`pénétration ${shape.kind}: ${hit?.depth}`);
    }
    minY=Math.min(minY,b.y);
    const elevated=initialY-b.y>25;
    const away=direction*(b.x-initialX)<-2 && b.vx*direction<-1;
    if(escapeAt===null&&firstContact&&(elevated||away))escapeAt=i*C.step;
    if(i<120)history.push([b.x,b.y,b.vx,b.vy]);
  }
  return {escapeAt,minY,firstContact,history};
}

for(const zone of zones)for(const speed of [30,300,900])for(const mode of ['seule','Fluid','Heavy','duo même côté','duo opposé']){
  test(`${zone.name} / ${speed} px/s / ${mode}: sortie physique sans blocage`,()=>{
    const result=simulate(zone,speed,mode);
    assert.ok(result.firstContact,'la trajectoire doit réellement toucher la pente');
    assert.notEqual(result.escapeAt,null,'la balle doit quitter le contact ou monter');
    assert.ok(result.escapeAt<4,`sortie trop tardive : ${result.escapeAt}s`);
  });
}
for(const zone of zones){
  test(`${zone.name}: Fluid et Heavy produisent exactement la même réponse`,()=>{
    assert.deepEqual(simulate(zone,30,'Fluid',2),simulate(zone,30,'Heavy',2));
  });
  test(`${zone.name}: balle immobile sur la pente redescend par gravité`,()=>{
    const b=createBall(),d=30,normal={x:-zone.direction*zone.slope,y:-1},length=Math.hypot(normal.x,normal.y);
    Object.assign(b,{x:zone.foot+zone.direction*d+normal.x/length*b.r,y:C.floor-zone.slope*d+normal.y/length*b.r,vx:0,vy:0});
    const start=b.x;
    for(let i=0;i<120;i++){integrateBall(b,C.step);collideBall(b,solids);}
    assert.ok((b.x-start)*zone.direction<-5,'la gravité doit ramener la balle vers le bas de la pente');
  });
}
test('les contours de collision sont exactement symétriques',()=>{
  const key=v=>`${v.x},${v.y}`;
  const mirror=shape=>shape.vertices.map(v=>key({x:C.width-v.x,y:v.y})).sort();
  assert.deepEqual(mirror(zones[0].shape),zones[1].shape.vertices.map(key).sort());
  assert.deepEqual(mirror(zones[2].shape),zones[2].shape.vertices.map(key).sort());
});
test('trajectoires libres en miroir : même réponse des pentes',()=>{
  for(const [left,right] of [[zones[0],zones[1]],[zones[2],zones[3]]]){
    const a=simulate(left,300,'seule',1),b=simulate(right,300,'seule',1);
    a.history.forEach((p,i)=>{const q=b.history[i],message=`${left.name}, pas ${i}: ${p} / ${q}`;assert.ok(Math.abs(p[0]+q[0]-C.width)<1e-6,message);assert.ok(Math.abs(p[1]-q[1])<1e-6,message);assert.ok(Math.abs(p[2]+q[2])<1e-6,message);assert.ok(Math.abs(p[3]-q[3])<1e-6,message);});
  }
});
test('contact incliné sans apport d’énergie : réponse issue de la normale',()=>{
  const shape=zones[0].shape,ball=createBall();
  // The left ramp is y=x+426; place a circle 1 px into its middle.
  const n={x:Math.SQRT1_2,y:-Math.SQRT1_2};
  Object.assign(ball,{x:150+n.x*(ball.r-1),y:576+n.y*(ball.r-1),vx:-300,vy:0});
  const energy=ball.vx**2+ball.vy**2;
  collideBall(ball,[shape]);assert.ok(ball.vy<0);assert.ok(ball.vx**2+ball.vy**2<=energy+1e-6);
  assert.ok((circlePolygonContact(ball,shape.vertices)?.depth||0)<1e-6);
});
test('les personnages montent sur les quatre pentes sans traverser la géométrie',()=>{
  for(const zone of zones)for(const skin of ['fluid','heavy']){
    const p=createPlayer(skin);Object.assign(p,{x:zone.foot-zone.direction*40,y:C.floor-p.h/2,grounded:true});let minY=p.y;
    for(let i=0;i<120;i++){
      drive(p,{axis:zone.direction},C.step);movePlayer(p,solids,C.step);minY=Math.min(minY,p.y);
      assert.ok((boxPolygonContact(p,zone.shape.vertices)?.depth||0)<1e-6);
    }
    assert.ok(minY<C.floor-p.h/2-20);
  }
});
