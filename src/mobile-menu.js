import { MobileMenuModel,MENU_TABS,COLLECTION_CATEGORIES,PASS_PREVIEWS,DEFAULT_MENU_THEME,profilePresentation } from './mobile-menu-model.js';
import { controlSettings, KEY_OPTIONS, GAMEPAD_BUTTON_OPTIONS, STICK_OPTIONS, TOUCH_LAYOUT_OPTIONS } from './control-settings.js';
const icons={home:'M3 11 12 3l9 8M5 10v11h5v-7h4v7h5V10',collection:'M5 5h14v16H5zM8 2h13v16',shop:'M4 8h16l-1 13H5zM8 8V6a4 4 0 0 1 8 0v2',pass:'m12 2 8 5v10l-8 5-8-5V7zM8 12l3 3 5-6',challenges:'M5 22V3h14l-3 5 3 5H5',options:'M10 2h4l.5 3 2 .9 2.5-1.4 2 3.5-2.2 1.8v2.4l2.2 1.8-2 3.5-2.5-1.4-2 .9-.5 3h-4l-.5-3-2-.9-2.5 1.4-2-3.5L5 12.2V9.8L2.8 8l2-3.5 2.5 1.4 2-.9zM12 8a3 3 0 1 0 0 6 3 3 0 0 0 0-6'};
const icon=name=>`<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="${icons[name]||icons.pass}"/></svg>`;
const preview=(title,detail,kind='pass')=>`<article class="mm-card"><span class="mm-card-icon">${icon(kind)}</span><h3>${title}</h3><p>${detail}</p><span class="mm-soon">À venir</span></article>`;
const keyLabel=new Map(KEY_OPTIONS.map(option=>[option.code,option.label]));
const buttonLabel=new Map(GAMEPAD_BUTTON_OPTIONS.map(option=>[String(option.value),option.label]));
const actionTitles={moveLeft:'Déplacement gauche',moveRight:'Déplacement droite',jump:'Saut',boost:'Jetpack',shoot:'Tir',rotate:'Flip aérien',resetBall:'Reset',aimUp:'Visée haut',aimLeft:'Visée gauche',aimDown:'Visée bas',aimRight:'Visée droite',movementStick:'Stick principal',layout:'Disposition'};
const selectMarkup=(options,value,dataSetting,dataAction)=>`<label class="mm-control-field"><span>${actionTitles[dataAction]||dataAction}</span><select data-setting="${dataSetting}" data-action="${dataAction}">${options.map(option=>`<option value="${option.value}" ${String(option.value)===String(value)?'selected':''}>${option.label}</option>`).join('')}</select></label>`;

export class MobileMenu {
  constructor({enabled,onLaunch,theme=DEFAULT_MENU_THEME}){
    this.enabled=enabled;this.onLaunch=onLaunch;this.model=new MobileMenuModel();this.ready=false;this.visible=false;this.last='';this.difficulty='normal';
    this.root=document.createElement('section');this.root.id='mobile-menu';this.root.hidden=true;this.root.setAttribute('aria-label','Accueil et navigation JetClash');
    this.root.dataset.theme=theme.id;this.root.style.setProperty('--mm-background',`url("${new URL(theme.background,document.baseURI).href}")`);
    this.root.innerHTML=`<header class="mm-header"><div class="mm-profile"><span class="mm-emblem" aria-hidden="true">JC</span><div><strong data-profile-name></strong><span data-profile-level></span><progress data-profile-xp max="1000" aria-label="Progression du niveau"></progress></div></div><div class="mm-brand">JET<span>CLASH</span></div><button class="mm-gear" data-route="options" aria-label="Options">${icon('options')}</button></header>
      <div class="mm-body"></div><nav class="mm-nav" aria-label="Navigation principale">${MENU_TABS.map(t=>`<button data-route="${t.id}">${icon(t.id)}<span>${t.label}</span></button>`).join('')}</nav>`;
    document.body.append(this.root);this.body=this.root.querySelector('.mm-body');
    this.root.addEventListener('click',e=>{
      const button=e.target.closest('button');if(!button||button.disabled)return;
      if(button.dataset.route){this.model.navigate(button.dataset.route);this.render();}
      else if(button.hasAttribute('data-back')){this.model.back();this.render();}
      else if(button.dataset.category){this.model.selectCategory(button.dataset.category);this.render();}
      else if(button.hasAttribute('data-reward')){this.model.selectReward(Number(button.dataset.reward));this.render();}
      else if(button.dataset.difficulty)this.selectDifficulty(button.dataset.difficulty);
      else if(button.id==='mobile-duel'&&this.model.canLaunch('duel',this.ready))this.onLaunch({mode:'duel',difficulty:this.difficulty});
      else if(button.id==='mobile-training'&&this.ready)this.onLaunch({mode:'training'});
      else if(button.hasAttribute('data-reset-controls')){controlSettings.reset();this.render();}
    });
    this.root.addEventListener('change',e=>{
      const target=e.target.closest('select[data-setting]');if(!target)return;
      const {setting,action}=target.dataset;
      if(setting==='keyboard')controlSettings.setKeyboard(action,target.value);
      else if(setting==='gamepad')controlSettings.setGamepad(action,target.value);
      else if(setting==='touch'&&action==='layout')controlSettings.setTouchLayout(target.value);
      this.render();
    });
    this.root.addEventListener('keydown',e=>{
      const options=[...this.root.querySelectorAll('[data-difficulty]')],i=options.indexOf(e.target);
      if(i<0||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(e.key))return;
      e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?2:(i+(['ArrowRight','ArrowDown'].includes(e.key)?1:2))%3;
      this.selectDifficulty(options[next].dataset.difficulty);options[next].focus();
    });
  }
  selectDifficulty(value){
    if(!['easy','normal','elite'].includes(value))return;
    this.difficulty=value;
    for(const button of this.root.querySelectorAll('[data-difficulty]')){
      const selected=button.dataset.difficulty===value;
      button.setAttribute('aria-checked',String(selected));button.tabIndex=selected?0:-1;
    }
  }
  update(match,ready,status=''){
    const visible=this.enabled&&match.state==='MENU';
    if(visible&&!this.visible)this.model.home();
    this.visible=visible;this.ready=ready;this.status=status;this.profile=profilePresentation(match.profile);
    this.root.hidden=!visible;document.body.classList.toggle('mobile-menu-open',visible);
    if(!visible)return;
    const key=JSON.stringify([this.profile,ready,status]);
    if(key!==this.last){
      this.last=key;this.render();
      this.root.querySelector('[data-profile-name]').textContent=this.profile.nickname;
      this.root.querySelector('[data-profile-level]').textContent=`Niveau ${this.profile.level} · ${this.profile.progress} / 1 000 XP`;
      this.root.querySelector('[data-profile-xp]').value=this.profile.progress;
    }
    else if(this.renderedRoute!==this.model.route)this.render();
  }
  render(){
    const route=this.model.route;this.renderedRoute=route;this.root.dataset.route=route;
    for(const button of this.root.querySelectorAll('.mm-nav button')){
      const active=button.dataset.route===(['modes','options'].includes(route)?'home':route);
      if(active)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');
    }
    const heading=(title,kicker='JETCLASH')=>`<div class="mm-page-heading"><div><p class="mm-kicker">${kicker}</p><h2>${title}</h2></div><button class="mm-back" data-back aria-label="Retour">← Retour</button></div>`;
    if(route==='home')this.body.innerHTML=`<section class="mm-home" aria-label="Accueil"><div class="mm-intro"><p class="mm-kicker">LA COUR DE L’AUBE</p><h1>LE CIEL<br> EST À TOI.</h1><p>Entre dans l’arène.<br>Fais parler ton énergie.</p></div><div class="mm-hero"><div class="mm-orbit"></div><img id="mobile-fluid" src="assets/characters/fluid/fluid_idle.png" alt="Fluid, combattant équipé d’un jetpack"><img class="mm-hero-ball" src="assets/ball/ball_idle.png" alt=""></div><div class="mm-play-area"><span class="mm-pilot-label">FLUID <small>PRÊT POUR LE DUEL</small></span><button id="mobile-play" class="mm-primary" data-route="modes">JOUER <span aria-hidden="true">↗</span></button><p>1 contre 1 · Face à Heavy</p></div></section>`;
    else if(route==='modes')this.body.innerHTML=`<section class="mm-page">${heading('Choisis ton duel','DIRECTION L’ARÈNE')}<div class="mm-modes"><div class="mm-duel-card"><div class="mm-duel-art"><img src="assets/characters/fluid/fluid_jetpack.png" alt=""><span>VS</span><img src="assets/characters/heavy/heavy_walk.png" alt=""></div><div><span class="mm-kicker">LA COUR DE L’AUBE</span><h3>DUEL 1V1</h3><p>Toi face à Heavy. Cinq minutes pour gagner.</p></div></div><div class="mm-duel-actions"><div id="difficulty-title" class="mm-difficulty-title">Difficulté de Heavy</div><div id="mobile-difficulty" class="mm-difficulty" role="radiogroup" aria-labelledby="difficulty-title">${[['easy','Facile'],['normal','Normal'],['elite','Élite']].map(([value,label])=>`<button type="button" role="radio" data-difficulty="${value}">${label}</button>`).join('')}</div><button id="mobile-duel" class="mm-primary" ${this.ready?'':'disabled'}>DUEL 1V1 <span aria-hidden="true">→</span></button><button id="mobile-training" class="mm-secondary" ${this.ready?'':'disabled'}>ENTRAÎNEMENT</button><p id="mobile-load-status" role="status"></p><span class="mm-future-modes">Entraînement · Hoops · Goal Rush<br><strong>Bientôt</strong></span></div></div></section>`;
    else if(route==='collection'){
      const item=COLLECTION_CATEGORIES.find(c=>c.id===this.model.category);
      this.body.innerHTML=`<section class="mm-page">${heading('Collection','TON IDENTITÉ')}<div class="mm-collection"><div class="mm-categories" aria-label="Catégories">${COLLECTION_CATEGORIES.map(c=>`<button data-category="${c.id}" aria-pressed="${c.id===item.id}">${c.label}</button>`).join('')}</div><article class="mm-preview">${item.image?`<img src="assets/${item.image}" alt="${item.title}">`:`<span class="mm-preview-icon">${icon('collection')}</span>`}<div><span class="mm-kicker">${item.id==='fluid'?'ÉQUIPÉ':'APERÇU'}</span><h3>${item.title}</h3><p>${item.detail}</p></div></article></div></section>`;
    }else if(route==='shop')this.body.innerHTML=`<section class="mm-page">${heading('Boutique','DU STYLE, BIENTÔT')}<div class="mm-card-grid">${preview('Objets permanents','Une collection de styles pour te démarquer.','shop')}${preview('Événements','Des collections pour les grandes occasions.','challenges')}</div></section>`;
    else if(route==='pass')this.body.innerHTML=`<section class="mm-page">${heading('Pass','APERÇU · BIENTÔT')}<div class="mm-pass"><div class="mm-pass-summary"><span>Niveau du profil <strong>${this.profile.level}</strong></span><progress max="1000" value="${this.profile.progress}" aria-label="XP du profil"></progress><small>${this.profile.progress} / 1 000 XP · Progression actuelle</small></div><div class="mm-reward-track" aria-label="Aperçu des paliers">${PASS_PREVIEWS.map((name,i)=>`<button data-reward="${i}" aria-pressed="${i===this.model.reward}"><small>PALIER ${i+1}</small>${icon(i===2?'collection':'pass')}<span>${name}</span></button>`).join('')}</div><div class="mm-selected-reward"><div class="mm-selected-art" aria-hidden="true">${icon(this.model.reward===2?'collection':'pass')}</div><p><strong>${PASS_PREVIEWS[this.model.reward]}</strong><span>Récompense provisoire · Aperçu uniquement</span></p><button disabled>RÉCUPÉRER · BIENTÔT</button></div></div></section>`;
    else if(route==='challenges')this.body.innerHTML=`<section class="mm-page">${heading('Défis','DE NOUVEAUX OBJECTIFS')}<div class="mm-card-grid mm-three">${preview('Quotidiens','Un rendez-vous pour chaque journée.','challenges')}${preview('Hebdomadaires','Des objectifs pour aller plus loin.','challenges')}${preview('Saisonniers','Des défis au rythme de JetClash.','challenges')}</div></section>`;
    else if(route==='options')this.body.innerHTML=`<section class="mm-page">${heading('Options','TES COMMANDES')}<div class="mm-options"><article class="mm-card"><h3>Clavier</h3><p>Régle chaque action. Les touches sont sauvegardées automatiquement.</p><div class="mm-control-grid">${selectMarkup(KEY_OPTIONS,controlSettings.keyboard.moveLeft[0],'keyboard','moveLeft')} ${selectMarkup(KEY_OPTIONS,controlSettings.keyboard.moveRight[0],'keyboard','moveRight')} ${selectMarkup(KEY_OPTIONS,controlSettings.keyboard.jump[0],'keyboard','jump')} ${selectMarkup(KEY_OPTIONS,controlSettings.keyboard.boost[0],'keyboard','boost')} ${selectMarkup(KEY_OPTIONS,controlSettings.keyboard.shoot[0],'keyboard','shoot')} ${selectMarkup(KEY_OPTIONS,controlSettings.keyboard.rotate[0],'keyboard','rotate')} ${selectMarkup(KEY_OPTIONS,controlSettings.keyboard.resetBall[0],'keyboard','resetBall')} ${selectMarkup(KEY_OPTIONS,controlSettings.keyboard.aimLeft[0],'keyboard','aimLeft')} ${selectMarkup(KEY_OPTIONS,controlSettings.keyboard.aimRight[0],'keyboard','aimRight')} ${selectMarkup(KEY_OPTIONS,controlSettings.keyboard.aimUp[0],'keyboard','aimUp')} ${selectMarkup(KEY_OPTIONS,controlSettings.keyboard.aimDown[0],'keyboard','aimDown')}</div></article><article class="mm-card"><h3>Manette PS5 / Xbox</h3><p>Croix/A : saut, Rond/B : boost, Carré/X : flip aérien, L2/LT : tir.</p><div class="mm-control-grid">${selectMarkup(STICK_OPTIONS,controlSettings.gamepad.movementStick,'gamepad','movementStick')} ${selectMarkup(GAMEPAD_BUTTON_OPTIONS,controlSettings.gamepad.jump,'gamepad','jump')} ${selectMarkup(GAMEPAD_BUTTON_OPTIONS,controlSettings.gamepad.boost,'gamepad','boost')} ${selectMarkup(GAMEPAD_BUTTON_OPTIONS,controlSettings.gamepad.shoot,'gamepad','shoot')} ${selectMarkup(GAMEPAD_BUTTON_OPTIONS,controlSettings.gamepad.rotate,'gamepad','rotate')} ${selectMarkup(GAMEPAD_BUTTON_OPTIONS,controlSettings.gamepad.resetBall,'gamepad','resetBall')}</div></article><article class="mm-card"><h3>Tactile</h3><p>Le contrôle tactile garde les mêmes actions, avec une disposition miroir au besoin.</p><div class="mm-control-grid">${selectMarkup(TOUCH_LAYOUT_OPTIONS,controlSettings.touch.layout,'touch','layout')}</div></article><article class="mm-card"><h3>Réglages</h3><p>Choisis tes commandes ici, puis reviens jouer.</p><button type="button" class="mm-primary" data-reset-controls>Réinitialiser par défaut</button><p class="mm-small-note">Le jeu applique les changements immédiatement.</p></article></div></section>`;
    if(route==='modes'){
      this.selectDifficulty(this.difficulty);
      this.root.querySelector('#mobile-load-status').textContent=this.ready?'Match local · 5 minutes':this.status||'Chargement de l’arène…';
    }
  }
}
