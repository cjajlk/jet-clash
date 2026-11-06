export const DRILLS=Object.freeze({
  target:{title:'Tir sur cible',help:'Maintiens TIR, vise le cercle doré puis relâche au contact. Le ballon doit traverser la cible.'},
  save:{title:'Arrêt devant le but',help:'Le ballon arrive vers ton but à gauche. Intercepte-le et renvoie-le vers la droite avant son entrée.'},
  reset:{title:'Rebond aérien',help:'Laisse tes pieds toucher le ballon. Au signal SAUT RÉCUPÉRÉ, appuie sur SAUT pour rebondir en l’air.'}
});
export class TrainingDrill {
  constructor(match){this.match=match;this.active=false;}
  start(id){if(!DRILLS[id]||!this.match.training)return false;this.id=id;this.active=true;this.retry();return true;}
  begin(){if(this.active&&!this.done&&!this.failed)this.running=true;}
  stop(){this.active=false;this.match.trainingExercise=null;}
  retry(){
    if(!this.active)return;
    const m=this.match;m.prepare({countdown:false});m.contactFeedback?.reset();
    this.running=false;this.started=false;this.previous=null;this.done=false;this.failed=false;this.time=0;this.fired=false;this.resetEarned=false;this.touched=false;this.target=null;
    const p=m.player,b=m.ball;
    Object.assign(p,{x:640,y:320,vx:0,vy:0,grounded:false,contactSurface:null,footX:0,footY:1,controlX:1,controlY:0,facing:1,backPoseHeld:false,impulseReady:true,jumpHeld:false});
    Object.assign(b,{x:679,y:320,vx:0,vy:0});
    if(this.id==='target')this.target={x:900,y:300,r:55};
    if(this.id==='save'){Object.assign(p,{x:260,y:260,vy:-140});Object.assign(b,{x:470,y:245,vx:-650,vy:-180});}
    if(this.id==='reset'){Object.assign(p,{y:270,impulseReady:false,vy:110});Object.assign(b,{x:640,y:365,vy:-90});}
    this.match.trainingExercise=this;
  }
  before(input){
    if(!this.active||!this.running||this.done||this.failed)return;
    // Only the target launch is staged until the player's first deliberate input.
    if(this.id==='target'&&!this.started){
      Object.assign(this.match.player,{x:640,y:320,vx:0,vy:0,grounded:false,contactSurface:null});
      Object.assign(this.match.ball,{x:679,y:320,vx:0,vy:0});
      if(input.shoot||input.jump||input.boost||input.axis)this.started=true;
    }
    const p=this.match.player,b=this.match.ball;
    this.previous={x:b.x,y:b.y,latched:!!p.aerialContactLatched,impulseReady:p.impulseReady,grounded:p.grounded,jumpHeld:p.jumpHeld};
  }
  onEvent(kind){if(this.active&&!this.failed&&!this.done&&kind==='shot')this.fired=true;}
  after(input,dt){
    if(!this.active||!this.running||this.done||this.failed||!this.previous)return;
    const m=this.match,p=m.player,b=m.ball,prev=this.previous;this.time+=dt;
    if(this.id==='target'&&this.fired){
      const t=this.target,dx=b.x-prev.x,dy=b.y-prev.y,length=dx*dx+dy*dy;
      const u=length?Math.max(0,Math.min(1,((t.x-prev.x)*dx+(t.y-prev.y)*dy)/length)):0;
      this.done=Math.hypot(prev.x+u*dx-t.x,prev.y+u*dy-t.y)<=t.r-b.r;
    }
    if(this.id==='save'){
      if(m.control.recentContactTime>0||this.fired)this.touched=true;
      this.done=this.touched&&b.vx>100&&b.x-b.r>m.arena.goalLeft&&m.state==='PLAYING';
    }
    if(this.id==='reset'){
      if(p.aerialContactLatched&&!prev.latched)this.resetEarned=true;
      this.done=this.resetEarned&&!prev.grounded&&!p.grounded&&!!input.jump&&!prev.jumpHeld&&!p.impulseReady;
    }
    if(!this.done&&this.id==='reset'&&p.grounded)this.failed=true;
    if(!this.done&&(this.time>=10||m.state==='GOAL_SCORED'||m.state==='MENU'))this.failed=true;
  }
}
export class TrainingDrills extends TrainingDrill {
  constructor(match,shell){
    super(match);this.root=document.createElement('section');this.root.className='tutorial-panel drill-panel';this.root.hidden=true;
    this.root.innerHTML='<strong data-drill-title></strong><p data-drill-help></p><small data-drill-status role="status"></small><div><button type="button" data-drill-begin>Commencer</button><button type="button" data-drill-retry>Réessayer</button><button type="button" data-drill-next>Exercice suivant</button><button type="button" data-drill-exit>Jeu libre</button></div>';
    shell.append(this.root);
    this.root.querySelector('[data-drill-begin]').onclick=()=>{this.begin();this.update();};
    this.root.querySelector('[data-drill-retry]').onclick=()=>this.retry();
    this.root.querySelector('[data-drill-next]').onclick=()=>{const ids=Object.keys(DRILLS);this.start(ids[(ids.indexOf(this.id)+1)%ids.length]);};
    this.root.querySelector('[data-drill-exit]').onclick=()=>this.stop();
  }
  retry(){this.started=false;super.retry();this.update();}
  stop(){super.stop();this.update();}
  after(input,dt){super.after(input,dt);this.update();}
  update(){
    this.root.hidden=!this.active;if(!this.active)return;
    this.root.classList.toggle('drill-running',this.running&&!this.done&&!this.failed);
    this.root.querySelector('[data-drill-title]').textContent=DRILLS[this.id].title;
    this.root.querySelector('[data-drill-help]').textContent=DRILLS[this.id].help;
    this.root.querySelector('[data-drill-begin]').hidden=this.running;
    this.root.querySelector('[data-drill-status]').textContent=!this.running?'Lis la consigne puis appuie sur Commencer.':this.done?'Réussi ! Rejoue ou passe au suivant.':this.failed?'Réessaie : la même situation sera replacée.':this.id==='reset'&&this.resetEarned?'Saut récupéré : appuie sur SAUT !':'À toi de jouer !';
  }
}
