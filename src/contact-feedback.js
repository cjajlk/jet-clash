import {aimedSpecialShotType} from './aerial-shots.js';
// Presentation sampled after physics; never grants a shot or changes movement.
export class ContactFeedback {
  constructor(play=()=>{}){this.play=play;this.reset();}
  reset(){this.contact=false;this.resetTime=0;this.latched=false;}
  update(match,dt){
    if(match.state!=='PLAYING'){this.reset();match.contactFeedback=this;return;}
    const p=match.player,c=match.control;
    this.contact=!c.cooldown&&(c.contact(p,match.ball)||!!aimedSpecialShotType(p,match.ball));
    this.resetTime=Math.max(0,this.resetTime-dt);
    const latched=!!p.aerialContactLatched&&!p.grounded&&!p.contactSurface;
    if(latched&&!this.latched){this.resetTime=.65;this.play('reset');}
    this.latched=latched;match.contactFeedback=this;
  }
}
