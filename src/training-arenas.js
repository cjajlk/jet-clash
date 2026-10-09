import {CONFIG as C} from './config.js';
import {solids} from './arena.js';
export const TRAINING_ARENAS=Object.freeze([
 {id:'current',name:'Cour de l’Aube',image:'assets/arena/arena_background_midfield_goals.png',key:'background',detail:'Terrain actuel'},
 {id:'vertical',name:'Cages verticales',image:'assets/arena/arena_background_vertical_goals.png',key:'backgroundVertical',detail:'Fond alternatif'},
 {id:'original',name:'Arène originale',image:'assets/arena/arena_background.png',key:'backgroundLegacy',detail:'Fond historique'},
 {id:'flat',name:'Néon · terrain plat',image:'assets/arena/arena_flat_large_goals_v4.png',key:'backgroundFlat',detail:'Test · buts surélevés'}
]);
export const FLAT_ARENA=Object.freeze({...C,floor:556,goalLeft:172,goalRight:1108,goalTop:176,goalBottom:386,goalScoreTop:178,goalScoreBottom:384,goalLineInset:12,goalRequireCrossing:true,playerGoalBackInset:35});
const A=FLAT_ARENA;
export const FLAT_SOLIDS=[{x:0,y:A.floor,w:A.width,h:A.height-A.floor,kind:'floor'},
 ...['left','right'].flatMap(side=>{const x=side==='left'?0:A.goalRight,w=A.goalLeft;return [
 {x,y:0,w,h:A.goalTop,kind:'goalRoof',goalBoundary:true},
 {x,y:A.goalBottom,w,h:A.floor-A.goalBottom,kind:'goalBase',goalBoundary:true},
 {x:side==='left'?0:A.width-A.playerGoalBackInset,y:A.goalTop,w:A.playerGoalBackInset,h:A.goalBottom-A.goalTop,kind:'goalBack',goalBoundary:true}];})];
export function trainingArena(id){return TRAINING_ARENAS.find(a=>a.id===id)||TRAINING_ARENAS[0];}
export function arenaPhysics(id){return id==='flat'?{config:FLAT_ARENA,solids:FLAT_SOLIDS}:{config:C,solids};}
