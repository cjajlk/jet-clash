import { CONFIG as DEFAULT } from './config.js';
const C=DEFAULT;
import { Bot } from './bot.js';
import { createPlayer } from './player.js';
import { resetPositions } from './arena.js';

// Reuse Heavy's existing decisions, mirrored for the blue team.
export class TeamBot {
  constructor(level,team,random=Math.random){this.team=team;this.base=new Bot(level,random);this.reset();}
  reset(){this.base.reset();this.supportWait=0;this.supporting=false;this.supportInput={axis:0,jump:false,boost:false};}
  update(body,ball,dt,players=[],C=DEFAULT){
    const direction=this.team==='player'?1:-1;
    const allies=players.filter(p=>p.team===this.team);
    const nearest=allies.slice().sort((a,b)=>(Math.abs(a.x-ball.x)+Math.abs(a.y-ball.y)*.35)-(Math.abs(b.x-ball.x)+Math.abs(b.y-ball.y)*.35))[0];
    const ownGoal=this.team==='player'?C.goalLeft:C.goalRight;
    const danger=direction*(ball.x-ownGoal)<220&&ball.vx*direction< -70;
    if(nearest&&nearest!==body&&!danger){
      // The other team member supports from behind instead of crowding the ball.
      const support=Math.max(340,Math.min(C.width-340,(ownGoal+ball.x)/2));
      this.supporting=true;this.supportWait-=dt;
      if(this.supportWait<=0){
        this.supportWait=this.base.settings.reaction;
        const dx=support-body.x,braking=body.vx*body.vx/(2*(body.grounded?C.runAcceleration:C.airAcceleration));
        let axis=Math.abs(dx)>14?Math.sign(dx):0;
        if(axis&&Math.sign(body.vx)===axis&&Math.abs(dx)<braking+14)axis=-Math.sign(body.vx);
        this.supportInput={axis,jump:false,boost:false};
      }
      return this.supportInput;
    }
    if(this.supporting){this.base.reset();this.supportWait=0;this.supporting=false;}
    if(this.team==='bot')return this.base.update(body,ball,dt,players,C);
    const input=this.base.update({...body,x:C.width-body.x,vx:-body.vx},{...ball,x:C.width-ball.x,vx:-ball.vx},dt,players,C);
    return {...input,axis:-input.axis};
  }
}

export function createTeamExtras(level){
  return [['player','ALLIÉ'],['bot','BOT 2']].map(([team,label])=>({
    body:Object.assign(createPlayer('heavy'),{team,label}),ai:new TeamBot(level,team),
  }));
}

export function resetTeamPositions(player,opponent,extras,ball){
  // Existing reset restores exactly the same movement/fuel/jump/flip capabilities.
  resetPositions(player,opponent,ball);
  resetPositions(extras[0].body,extras[1].body,ball);
  for(const [body,x,team,label] of [
    [player,480,'player','VOUS'],[extras[0].body,360,'player','ALLIÉ'],
    [opponent,800,'bot','BOT 1'],[extras[1].body,920,'bot','BOT 2'],
  ])Object.assign(body,{x,team,label,facing:team==='player'?1:-1,controlX:team==='player'?1:-1});
}
