import test from 'node:test';
import assert from 'node:assert/strict';
import {CONFIG as C} from '../src/config.js';
import {solids} from '../src/arena.js';
import {createPlayer,drive} from '../src/player.js';
import {movePlayer} from '../src/physics.js';

function simulate(p,input,ticks){
  for(let i=0;i<ticks;i++){drive(p,input,C.step);movePlayer(p,solids,C.step);}
  return p;
}
for(const skin of ['fluid','heavy'])for(const sign of [-1,1]){
  const side=sign<0?'left':'right',line=sign<0?C.goalLeft:C.goalRight;
  const approach=()=>Object.assign(createPlayer(skin),{x:line-sign*230,y:C.floor-C.playerHeight/2,grounded:true,contactSurface:'floor'});
  test(`${skin} ${side} : marche sur toute la rampe, entrée complète et sortie`,()=>{
    const p=approach();let reached=false;
    for(let i=0;i<240;i++){
      const before=p.x;simulate(p,{axis:sign},1);
      assert.ok(sign*(p.x-before)>=-1e-8,'pas de recul invisible sur la rampe');
      if(sign*(p.x-line)>p.w/2){reached=true;assert.ok(p.y-p.h/2>=C.goalTop);assert.ok(p.y+p.h/2<=C.goalBottom+1e-8);}
    }
    assert.ok(reached,'le corps entier doit franchir la ligne');
    assert.equal(p.x,sign<0?C.playerGoalBackInset+p.w/2:C.width-C.playerGoalBackInset-p.w/2);
    simulate(p,{axis:-sign},240);
    assert.ok(sign*(p.x-line)<-p.w/2,'le corps entier ressort naturellement');
  });
  test(`${skin} ${side} : entrée aérienne dans l’ouverture`,()=>{
    const p=Object.assign(createPlayer(skin),{x:line-sign*35,y:(C.goalTop+C.goalBottom)/2,vx:sign*300,vy:0});
    simulate(p,{axis:sign},45);assert.ok(sign*(p.x-line)>p.w/2);
  });
  test(`${skin} ${side} : saut et BOOST franchissent l’ouverture`,()=>{
    for(const input of [{axis:sign,jump:true},{axis:sign,boost:true}]){
      const p=Object.assign(createPlayer(skin),{x:line-sign*35,y:C.goalBottom-C.playerHeight/2,vx:sign*300,grounded:true,contactSurface:'floor'});
      let entered=false;
      for(let i=0;i<60;i++){simulate(p,input,1);if(sign*(p.x-line)>p.w/2)entered=true;}
      assert.ok(entered,input.boost?'BOOST':'saut');
    }
  });
  test(`${skin} ${side} : corps trop haut bloqué par le montant supérieur`,()=>{
    const p=Object.assign(createPlayer(skin),{x:line-sign*35,y:C.goalTop+pHeight()/2-5,vx:sign*300,vy:0});
    // Isolate the solid contact from gravity, which would eventually lower the body into the opening.
    for(let i=0;i<60;i++){p.vx=sign*300;p.vy=0;movePlayer(p,solids,C.step);}
    assert.ok(sign*(p.x-line)<=-p.w/2+1e-8);
  });
  test(`${skin} ${side} : bas de cage solide et profondeur bornée`,()=>{
    const p=Object.assign(createPlayer(skin),{x:line+sign*60,y:C.goalBottom-pHeight()/2,vx:sign*1000,vy:850});
    for(let i=0;i<120;i++){p.vx=sign*1000;p.vy=850;movePlayer(p,solids,C.step);assert.ok(p.x-p.w/2>=C.playerGoalBackInset&&p.x+p.w/2<=C.width-C.playerGoalBackInset);assert.ok(p.y+p.h/2<=C.goalBottom+1e-8);}
  });
}
function pHeight(){return C.playerHeight;}
for(const skin of ['fluid','heavy'])test(`${skin} : symétrie exacte des deux poches`,()=>{
  const left=Object.assign(createPlayer(skin),{x:400,y:C.floor-C.playerHeight/2,grounded:true,contactSurface:'floor'});
  const right={...left,x:C.width-left.x,facing:-1};
  for(let i=0;i<250;i++){
    simulate(left,{axis:-1},1);simulate(right,{axis:1},1);
    assert.ok(Math.abs(left.x+right.x-C.width)<1e-7);assert.ok(Math.abs(left.y-right.y)<1e-7);
  }
});
