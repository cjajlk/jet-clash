import {aimedSpecialShotType,SPECIAL_SHOT_STYLES} from './aerial-shots.js';
// Presentation sampled after physics; never grants a shot or changes movement.
export class ContactFeedback {
  constructor(play=()=>{}){this.play=play;this.reset();}
  reset(){this.contact=false;this.specialType=null;this.resultType=null;this.resultLabel=null;this.resetTime=0;this.latched=false;}
  update(match,dt){
    if(match.state!=='PLAYING'){this.reset();match.contactFeedback=this;return;}
    const p=match.player,c=match.control;
    const special=aimedSpecialShotType(p,match.ball);
    this.contact=!c.cooldown&&(c.contact(p,match.ball)||!!special);
    this.specialType=this.contact?special:null;
    const result=match.ball.shotTimer>.55?SPECIAL_SHOT_STYLES[match.ball.shotColor]:null;
    this.resultType=result?match.ball.shotColor:null;
    this.resultLabel=result?result.label+(match.ball.shotMode==='aimed'?' · VISÉ':' · IMPULSION'):null;
    this.resetTime=Math.max(0,this.resetTime-dt);
    const latched=!!p.aerialContactLatched&&!p.grounded&&!p.contactSurface;
    if(latched&&!this.latched){this.resetTime=.65;this.play('reset');}
    this.latched=latched;match.contactFeedback=this;
  }
}
