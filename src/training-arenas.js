import {CONFIG as C} from './config.js';
export const TRAINING_ARENAS=Object.freeze([
 {id:'flat',name:'Cour Néon',image:'assets/arena/arena_flat_large_goals_v4.png',key:'backgroundFlat',detail:'Terrain plat · buts surélevés'}
]);
// Monthly UTC calendar rotation; a match keeps its chosen decor until it ends.
export function competitiveArena(date=new Date(),catalog=TRAINING_ARENAS){
 const slot=date.getUTCFullYear()*12+date.getUTCMonth();
 return catalog[slot%catalog.length];
}
export const FLAT_ARENA=Object.freeze({...C,floor:556,goalLeft:172,goalRight:1108,goalTop:176,goalBottom:386,goalScoreTop:178,goalScoreBottom:384,goalLineInset:12,goalRequireCrossing:true,playerGoalBackInset:35});
const A=FLAT_ARENA;
// Small ball-only bevels remove the dead 90-degree floor corners.
// Characters keep their flat walking surface.
export const CORNER_BEVEL={width:64,height:48};
export const FLAT_SOLIDS=[{x:0,y:A.floor,w:A.width,h:A.height-A.floor,kind:'floor'},
 ...[-1,1].map(side=>{const points=[{x:A.goalLeft,y:A.floor-48},{x:A.goalLeft+64,y:A.floor},{x:A.goalLeft,y:A.floor}];return {vertices:side<0?points:points.map(p=>({x:A.width-p.x,y:p.y})).reverse(),kind:'cornerBevel',ballOnly:true,goalBoundary:true};}),
 ...['left','right'].flatMap(side=>{const x=side==='left'?0:A.goalRight,w=A.goalLeft;return [
 {x,y:0,w,h:A.goalTop,kind:'goalRoof',goalBoundary:true},
 {x,y:A.goalBottom,w,h:A.floor-A.goalBottom,kind:'goalBase',goalBoundary:true},
 {x:side==='left'?0:A.width-A.playerGoalBackInset,y:A.goalTop,w:A.playerGoalBackInset,h:A.goalBottom-A.goalTop,kind:'goalBack',goalBoundary:true}];})];
export function trainingArena(id){return TRAINING_ARENAS.find(a=>a.id===id)||TRAINING_ARENAS[0];}
export function arenaPhysics(id){return {config:FLAT_ARENA,solids:FLAT_SOLIDS};}
