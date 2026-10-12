import test from 'node:test';import assert from 'node:assert/strict';
import {goalEntryDepth,goalScorer} from '../src/goals.js';import {FLAT_ARENA as A} from '../src/training-arenas.js';import {CONFIG as C} from '../src/config.js';
for(const r of [19,28.5,38])for(const side of [-1,1])test(`goal entry radius ${r}, side ${side}: front, edge, centre, depth, posts, crossing`,()=>{
 const mouth=side<0?A.goalLeft:A.goalRight,y=(A.goalScoreTop+A.goalScoreBottom)/2,depth=goalEntryDepth(r,A),previous={x:mouth-side*(r+2),y};
 assert.equal(depth,2*r);
 for(const d of [-r-.1,-r,-1,0,1,r,depth-.01])assert.equal(goalScorer({x:mouth+side*d,y,r},A,previous),null,`depth ${d}`);
 for(const d of [depth,depth+.01,depth+5])assert.equal(goalScorer({x:mouth+side*d,y,r},A,previous),side<0?'bot':'player');
 for(const top of [A.goalScoreTop+r,A.goalScoreTop+r-1,A.goalScoreBottom-r,A.goalScoreBottom-r+1])assert.equal(goalScorer({x:mouth+side*(depth+1),y:top,r},A,previous),null);
 const b={x:mouth+side*(depth+1),y,r};assert.equal(goalScorer(b,A,b),null);assert.equal(goalScorer(b,A,{x:mouth+side*(depth+2),y}),null);
 assert.equal(goalScorer(b,A,{x:mouth+side*(depth-1),y:0}),null);
 assert.equal(goalEntryDepth(r,C),depth);
});

