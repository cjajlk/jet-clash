import test from 'node:test';
import assert from 'node:assert/strict';
import {Bot} from '../src/bot.js';
import {TeamBot} from '../src/team-mode.js';
import {Match} from '../src/match.js';
import {ProfileStore} from '../src/profile-store.js';
import {createPlayer} from '../src/player.js';
import {createBall} from '../src/ball.js';
import {CONFIG as C,DIFFICULTIES} from '../src/config.js';
const player=(extra={})=>Object.assign(createPlayer('heavy'),{x:1020,y:518,grounded:true,contactSurface:'floor'},extra);
const ball=(extra={})=>Object.assign(createBall(),{x:850,y:245,vx:650,vy:-100},extra);
test('danger : couvre une trajectoire vers la cage, pas une balle qui la survole ou passe dessous',()=>{
 for(const [y,vy,expected] of [[245,-100,'defend'],[50,-300,'attack'],[500,0,'attack']]){const ai=new Bot('elite',()=>.5);ai.update(player(),ball({y,vy}),C.step);assert.equal(ai.intent,expected);}
});
test('défense : tient devant la cage au lieu de poursuivre le ballon derrière le filet',()=>{
 const ai=new Bot('elite',()=>.5),p=player({x:C.goalRight-19,y:245}),b=ball({x:970,vy:0});const i=ai.update(p,b,C.step);assert.equal(ai.intent,'defend');assert.equal(i.axis,0);
});
test('dépassé : revient côté but et garde le carburant pour défendre',()=>{
 const ai=new Bot('elite',()=>.5),p=player({x:760,grounded:false,contactSurface:null,fuel:30}),b=ball({x:900,y:420,vx:100,vy:0});const i=ai.update(p,b,C.step);assert.equal(ai.intent,'recover');assert.equal(i.axis,1);assert.equal(i.jump,false);assert.equal(i.boost,false);
});
test('dégagement : accompagne à distance sans gaspiller de saut ni de jet',()=>{
 const ai=new Bot('elite',()=>.5),p=player({x:710,grounded:false,contactSurface:null}),b=ball({x:550,y:150,vx:-600,vy:0});const i=ai.update(p,b,C.step);assert.equal(ai.intent,'support');assert.equal(i.axis,0);assert.equal(i.boost,false);assert.equal(i.jump,false);
});
test('transition après retour du ballon : reprend la défense à sa prochaine réaction',()=>{
 const ai=new Bot('normal',()=>.5),p=player(),b=ball({x:550,vx:-600});const first=ai.update(p,b,C.step);assert.equal(ai.intent,'support');Object.assign(b,{x:850,y:245,vx:650,vy:-100});assert.equal(ai.update(p,b,.01),first);assert.equal(ai.intent,'support');ai.update(p,b,DIFFICULTIES.normal.reaction);assert.equal(ai.intent,'defend');ai.reset();assert.equal(ai.intent,'attack');
});
for(const [x,bx,vy] of [[950,750,-100],[1020,750,-250],[1020,850,-100],[1080,750,-250],[1080,850,-100]])test(`arrêt réel depuis ${x}, ballon ${bx}, vitesse verticale ${vy}`,()=>{
 const m=new Match(new ProfileStore({getItem(){},setItem(){}}));m.start('duel');m.state='PLAYING';m.ai=new Bot('elite',()=>.5);Object.assign(m.player,{x:350,y:518,vx:0,vy:0});Object.assign(m.bot,player({x}));Object.assign(m.ball,ball({x:bx,vy}));let saved=false;
 for(let i=0;i<240;i++){m.update(C.step,{});assert.equal(m.score.player,0);assert.ok(m.bot.fuel>=0&&m.bot.fuel<=100);if(m.ball.vx< -100){saved=true;break;}}
 assert.equal(saved,true);assert.equal(m.boundaryRecoveries,0);
});
for(const values of [{x:850,y:245,vx:650,vy:-100},{x:1100,y:450,vx:50,vy:0},{x:550,y:200,vx:-600,vy:0}])test(`tactique miroir 2v2, vitesse ${values.vx}`,()=>{
 const p=player({team:'bot'}),b=ball(values),mirror={...p,team:'player',x:C.width-p.x,vx:-p.vx},mb={...b,x:C.width-b.x,vx:-b.vx};const a=new TeamBot('elite','bot',()=>.5),z=new TeamBot('elite','player',()=>.5),before=structuredClone({p,b,mirror,mb});const i=a.update(p,b,C.step,[p]),j=z.update(mirror,mb,C.step,[mirror]);assert.equal(a.base.intent,z.base.intent);assert.equal(i.axis,-j.axis||0);assert.equal(i.jump,j.jump);assert.equal(i.boost,j.boost);assert.deepEqual({p,b,mirror,mb},before);
});
