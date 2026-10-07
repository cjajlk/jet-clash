import { STATES } from './match.js';
export class HUD{
  constructor(){this.lastState=null;this.announcementText='';this.ids={};for(const id of ['menu','hud','fuel-hud','score-player','score-bot','timer','mode-label','fuel-player','fuel-bot','announcement','result','result-title','result-score','xp-earned','xp-breakdown','result-level','profile','save-warning','game-shell','leave-game','team-player-name','team-player-detail','team-bot-name','team-bot-detail','match-type','fuel-bot-label'])this.ids[id]=document.getElementById(id);}
  update(m){const el=this.ids,menu=m.state===STATES.MENU,result=m.state===STATES.POST_MATCH,training=!!m.training;el.menu.hidden=!menu;el.result.hidden=!result;el.hud.hidden=menu||result;el['fuel-hud'].hidden=menu||result;el['score-player'].textContent=m.score.player;el['score-bot'].textContent=m.score.bot;
    el['leave-game'].hidden=menu||result;
    const teams=m.mode==='2v2';
    el['match-type'].textContent=training?'ENTRAÎNEMENT SOLO':teams?'2V2 · TOI + 1 BOT CONTRE 2 BOTS':'DUEL · JOUEUR CONTRE BOT';
    el['fuel-bot-label'].textContent=teams?'JETPACK · BOT 1':'JETPACK · HEAVY';
    el['team-player-name'].textContent=teams?'BLEUS':'FLUID';el['team-player-detail'].textContent=teams?'VOUS + 1 BOT':'VOUS';
    el['team-bot-name'].textContent=teams?'ROUGES':'HEAVY';el['team-bot-detail'].textContent=teams?'2 BOTS':'BOT';
    const seconds=Math.ceil(m.remaining);el.timer.hidden=training;el.timer.textContent=training?'--:--':`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;el['mode-label'].textContent=training?'ENTRAÎNEMENT':m.overtime?'MORT SUBITE':teams?'MATCH 2V2':'MATCH';el['game-shell'].classList.toggle('overtime',!!m.overtime);el['fuel-player'].value=m.player.fuel;el['fuel-bot'].value=m.bot?.fuel??0;el['fuel-bot'].parentElement.hidden=training||!m.bot;
    let announcement='';if(m.state===STATES.PRE_ROUND)announcement=`${Math.max(1,Math.ceil(m.phase))}<small>PRÉPARE-TOI</small>`;else if(m.state===STATES.GOAL_SCORED)announcement=m.lastGoal==='player'?(teams?'BUT POUR LES BLEUS !':'BUT POUR FLUID !'):(teams?'BUT POUR LES ROUGES !':'BUT POUR HEAVY !');if(announcement!==this.announcementText){el.announcement.innerHTML=announcement;this.announcementText=announcement;}el.announcement.hidden=!announcement;
    el.profile.textContent=`Niveau ${m.profile.level} · ${m.profile.data.xp} XP`;el['save-warning'].hidden=!m.profile.warning;el['save-warning'].textContent=m.profile.warning;
    if(result&&this.lastState!==m.state){el['result-title'].textContent=m.result==='win'?'VICTOIRE !':'DÉFAITE';el['result-score'].textContent=`${m.score.player} — ${m.score.bot}`;el['xp-earned'].textContent=`+${m.reward} XP`;el['xp-breakdown'].textContent=`Match terminé : 100 · Victoire : ${m.result==='win'?50:0} · Buts : ${(m.rewardGoals??m.score.player)*10}`;el['result-level'].textContent=`Niveau ${m.profile.level} · ${m.profile.data.xp%1000} / 1 000 XP vers le niveau suivant`;document.getElementById('replay').focus();}
    if(menu&&this.lastState!==m.state&&this.lastState!==null)document.getElementById('start').focus();this.lastState=m.state;
  }
}
