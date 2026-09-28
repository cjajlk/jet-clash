import test from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG as C } from '../src/config.js';
import { solids } from '../src/arena.js';
import { createBall, integrateBall } from '../src/ball.js';
import { createPlayer, drive } from '../src/player.js';
import { collideBall, movePlayer, hitPlayer, ballOutsideArena } from '../src/physics.js';
import { circlePolygonContact, boxPolygonContact } from '../src/collision-shapes.js';
import { Match, STATES as S } from '../src/match.js';
import { ProfileStore } from '../src/profile-store.js';
import { goalScorer } from '../src/goals.js';
const ends=solids.filter(s=>s.goalBoundary),epsilon=1e-5;
function checkBall(b){
  assert.ok(!ballOutsideArena(b),'balle hors arène');
  assert.ok(b.x>=b.r-epsilon&&b.x<=C.width-b.r+epsilon,'balle derrière le mur extérieur');
  assert.ok(b.y>=100+b.r-epsilon&&b.y<=C.floor-b.r+epsilon,'balle sous le sol ou hors plafond');
  for(const s of ends)assert.ok((circlePolygonContact(b,s.collisionVertices||s.vertices)?.depth||0)<epsilon,`balle dans ${s.kind}`);
}
function checkPlayer(p){
  assert.ok(p.x-p.w/2>=C.goalLeft-epsilon&&p.x+p.w/2<=C.goalRight+epsilon,'personnage derrière la cage');
  assert.ok(p.y-p.h/2>=100-epsilon&&p.y+p.h/2<=C.floor+epsilon,'personnage hors sol/plafond');
  for(const s of ends)assert.ok((boxPolygonContact(p,s.collisionVertices||s.vertices)?.depth||0)<epsilon,`personnage dans ${s.kind}`);
}
function coordinates(side,x,y,vx,vy){return {x:side==='gauche'?x:C.width-x,y,vx:side==='gauche'?vx:-vx,vy};}
function simulate(side,initial,seconds=4,skins=[],axis=-1,boost=false){
  const b=createBall();Object.assign(b,coordinates(side,...initial));
  const players=skins.map(skin=>{const p=createPlayer(skin);Object.assign(p,{x:b.x+(side==='gauche'?44:-44),y:Math.max(138,Math.min(606,b.y)),grounded:b.y>590});movePlayer(p,solids,0);return p;});
  let minY=b.y,maxX=side==='gauche'?b.x:C.width-b.x,scored=null;
  for(let i=0;i<seconds/C.step;i++){
    for(const p of players){drive(p,{axis:side==='gauche'?axis:-axis,boost},C.step);movePlayer(p,solids,C.step);checkPlayer(p);}
    integrateBall(b,C.step);collideBall(b,solids);for(const p of players)hitPlayer(b,p);collideBall(b,solids);checkBall(b);
    minY=Math.min(minY,b.y);maxX=Math.max(maxX,side==='gauche'?b.x:C.width-b.x);
    scored=goalScorer(b);if(scored)break;
  }
  return {b,minY,maxX,scored};
}
for(const side of ['gauche','droite']){
  test(`${side} 1 — balle lente au pied de rampe`,()=>{const r=simulate(side,[227,625,-30,0]);assert.ok(r.maxX>227||r.minY<620);});
  test(`${side} 2 — pression forte contre rampe, Fluid et Heavy`,()=>{for(const skin of ['fluid','heavy']){const r=simulate(side,[227,625,-300,0],6,[skin]);assert.ok(r.minY<600||r.maxX>260);}});
  test(`${side} 3 — côté extérieur de la cage renvoie dans le terrain`,()=>{const r=simulate(side,[150,330,-300,0]);assert.ok(r.maxX>160);});
  test(`${side} 4 — balle au-dessus de la cage ne se pose pas sur un toit`,()=>{const r=simulate(side,[230,145,-120,0]);assert.ok(r.b.y>200||r.maxX>280);});
  test(`${side} 5 — frappe vers le dessus de cage`,()=>{const r=simulate(side,[240,260,-700,-450]);assert.ok(r.maxX>250);});
  test(`${side} 6 — les deux personnages montent contre la rampe sans sortir`,()=>{for(const skin of ['fluid','heavy'])simulate(side,[245,600,0,0],5,[skin]);});
  test(`${side} 7 — aucun personnage ne passe derrière l’ouverture`,()=>{
    for(const skin of ['fluid','heavy']){
      const p=createPlayer(skin);Object.assign(p,coordinates(side,120,448,0,0));
      for(let i=0;i<360;i++){drive(p,{axis:side==='gauche'?-1:1},C.step);movePlayer(p,solids,C.step);checkPlayer(p);}
    }
  });
  test(`${side} 8 — jetpack ne donne pas accès au dessus/extérieur`,()=>{
    for(const skin of ['fluid','heavy']){
      const p=createPlayer(skin);Object.assign(p,coordinates(side,270,530,0,0));
      for(let i=0;i<1200;i++){drive(p,{axis:side==='gauche'?-1:1,boost:i%360<240,jump:true},C.step);movePlayer(p,solids,C.step);checkPlayer(p);}
    }
  });
  for(const [joint,x,y]of [['sol/rampe',227,625],['rampe/cage',148,520],['cage/limite haute',150,330],['plafond/limite',245,119]]){
    for(const skins of [['fluid'],['heavy'],['fluid','heavy']]){
      test(`${side} 9 — compression ${skins.join('+')} au raccord ${joint}`,()=>{simulate(side,[x,y,-30,0],6,skins,-1,y<388);});
    }
    test(`${side} 10 — balle rapide au raccord ${joint}`,()=>{simulate(side,[x,y,-C.maxBallSpeed,y<388?-500:500]);});
  }
  test(`${side} 11 — but, remise en jeu et absence de double comptage`,()=>{
    const m=new Match(new ProfileStore({getItem:()=>null,setItem(){}}));m.start();m.state=S.PLAYING;
    Object.assign(m.ball,coordinates(side,125,448,-550,0));
    for(let i=0;i<60&&m.state===S.PLAYING;i++)m.update(C.step);
    assert.equal(m.state,S.GOAL_SCORED);const scorer=side==='gauche'?'bot':'player';assert.equal(m.score[scorer],1);assert.equal(m.goal(scorer),false);assert.equal(m.boundaryRecoveries,0);
    for(let i=0;i<600;i++)m.update(C.step);assert.equal(m.state,S.PLAYING);assert.equal(m.score[scorer],1);
  });
  test(`${side} 12 — aucun passage sous l’arène, même au raccord extérieur`,()=>{
    for(const y of [507,590,640]){const b=createBall();Object.assign(b,coordinates(side,70,y,-900,900));collideBall(b,solids);checkBall(b);for(let i=0;i<240;i++){integrateBall(b,C.step);collideBall(b,solids);checkBall(b);}}
  });
  test(`${side} — correction d’une pénétration profonde vers le terrain, jamais vers le dos`,()=>{
    for(const [x,y]of [[10,150],[40,350],[25,540],[50,635],[1,643]]){
      const b=createBall();Object.assign(b,coordinates(side,x,y,0,0));collideBall(b,solids);checkBall(b);
      const p=createPlayer('fluid');Object.assign(p,coordinates(side,x,y,0,0));movePlayer(p,solids,0);checkPlayer(p);
    }
  });
  test(`${side} — aucune balle immobile sur un rebord inaccessible à l’intérieur de la cage`,()=>{
    const m=new Match(new ProfileStore({getItem:()=>null,setItem(){}}));m.start();m.state=S.PLAYING;
    Object.assign(m.ball,coordinates(side,61,489,-30,0));m.ai.update=()=>({});
    for(let i=0;i<240&&m.state===S.PLAYING;i++)m.update(C.step);
    assert.equal(m.boundaryRecoveries,0);
    assert.ok(m.state===S.GOAL_SCORED||(side==='gauche'?m.ball.x>101:m.ball.x<1179),'sortie physique ou vrai but, sans reset');
  });
}
test('symétrie exacte des contours supérieurs et inférieurs',()=>{
  const key=v=>`${v.x},${v.y}`;
  for(const kind of ['goalRoof','goalBase']){const a=ends.find(s=>s.kind===kind&&s.x===0),b=ends.find(s=>s.kind===kind&&s.x>0);assert.deepEqual((a.collisionVertices||a.vertices).map(v=>key({x:C.width-v.x,y:v.y})).sort(),(b.collisionVertices||b.vertices).map(key).sort());}
});
test('sécurité ultime : balle entièrement dehors => réengagement sans point ni XP',()=>{
  for(const [x,y]of [[-20,448],[1300,448],[640,80],[640,664]]){
    const m=new Match(new ProfileStore({getItem:()=>null,setItem(){}}));m.start();m.state=S.PLAYING;m.score={player:2,bot:1};m.remaining=100;
    Object.assign(m.ball,{x,y});m.update(C.step);assert.equal(m.state,S.PRE_ROUND);assert.deepEqual(m.score,{player:2,bot:1});assert.equal(m.profile.data.xp,0);assert.equal(m.boundaryRecoveries,1);assert.equal(m.ball.x,640);assert.equal(m.ball.y,278);assert.equal(m.lastGoal,null);
    for(let i=0;i<362;i++)m.update(C.step);assert.equal(m.state,S.PLAYING);assert.equal(m.boundaryRecoveries,1);
  }
});
test('sécurité ultime : chevauchement partiel de limite ne réengage pas',()=>{
  for(const [x,y]of [[-18,448],[1298,448],[640,82],[640,662]]){
    const b=createBall();Object.assign(b,{x,y});assert.equal(ballOutsideArena(b),false);
  }
});
test('300 s de jeu simulé sous pression aux extrémités : zéro recours au failsafe',()=>{
  for(const side of ['gauche','droite']){
    const m=new Match(new ProfileStore({getItem:()=>null,setItem(){}}));m.start();m.state=S.PLAYING;Object.assign(m.ball,coordinates(side,227,625,-300,0));
    m.ai.update=()=>({axis:side==='gauche'?-1:1,boost:m.elapsed%3<1.5});
    for(let i=0;i<120*300;i++){
      m.update(C.step,{axis:side==='gauche'?-1:1,boost:m.elapsed%4<2,jump:true});checkBall(m.ball);checkPlayer(m.player);checkPlayer(m.bot);assert.equal(m.boundaryRecoveries,0);
    }
  }
});
