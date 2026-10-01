import { KEY_OPTIONS, GAMEPAD_BUTTON_OPTIONS, controlSettings } from './control-settings.js';

const keyLabels=new Map(KEY_OPTIONS.map(option=>[option.code,option.label]));
const buttonLabels=new Map(GAMEPAD_BUTTON_OPTIONS.map(option=>[String(option.value),option.label]));
const labelForCode=code=>keyLabels.get(code)||code;
const labelForButton=value=>buttonLabels.get(String(value))||`Bouton ${value}`;

export class ControlsHelp {
  constructor(){this.last='';this.keyboard=document.getElementById('keyboard-help');this.gamepad=document.getElementById('gamepad-help');this.status=document.getElementById('controller-status');}
  update(input){
    const info=input.gamepad.status,key=JSON.stringify([info,input.lastMethod,controlSettings.keyboard,controlSettings.gamepad,controlSettings.touch]);if(key===this.last)return;this.last=key;
    this.gamepad.hidden=!info.supported;
    const padBindings=controlSettings.gamepad,keyboardBindings=controlSettings.keyboard;
    this.keyboard.innerHTML=`<strong>CLAVIER</strong><span>${labelForCode(keyboardBindings.moveLeft[0])} / ${labelForCode(keyboardBindings.moveRight[0])} Déplacement</span><span>${labelForCode(keyboardBindings.jump[0])} Saut</span><span>${labelForCode(keyboardBindings.boost[0])} Jetpack</span><span class="hint">${labelForCode(keyboardBindings.aimUp[0])}/${labelForCode(keyboardBindings.aimLeft[0])}/${labelForCode(keyboardBindings.aimDown[0])}/${labelForCode(keyboardBindings.aimRight[0])} Visée · ${labelForCode(keyboardBindings.shoot[0])} Tir · ${labelForCode(keyboardBindings.rotate[0])} ROT</span>`;
    const moveLabel=padBindings.movementStick==='left'?'Stick gauche':'Stick droit';
    const moveEl=document.getElementById('gamepad-move');if(moveEl)moveEl.textContent=moveLabel;
    document.getElementById('gamepad-jump').textContent=labelForButton(padBindings.jump);
    document.getElementById('gamepad-boost').textContent=labelForButton(padBindings.boost);
    document.getElementById('gamepad-shoot').textContent=labelForButton(padBindings.shoot);
    this.keyboard.classList.toggle('last-input',input.lastMethod==='keyboard');
    this.gamepad.classList.toggle('last-input',input.lastMethod==='gamepad');
    this.keyboard.dataset.active=String(input.lastMethod==='keyboard');this.gamepad.dataset.active=String(input.lastMethod==='gamepad');
    if(!info.available)this.status.textContent='Manette indisponible dans ce navigateur ou cette fenêtre. Le clavier reste disponible.';
    else if(info.connected&&!info.supported)this.status.textContent='Manette détectée, mais ses commandes ne sont pas reconnues par le navigateur. Le clavier reste disponible.';
    else if(info.connected)this.status.textContent=`${info.label} connectée · Commandes actives : ${input.lastMethod==='gamepad'?'manette':'clavier'} · Les deux restent utilisables.`;
    else this.status.textContent='PS5 : branche ta manette, puis appuie sur un bouton pour la détecter. Le clavier reste disponible.';
  }
}
