export class ControlsHelp {
  constructor(){this.last='';this.keyboard=document.getElementById('keyboard-help');this.gamepad=document.getElementById('gamepad-help');this.status=document.getElementById('controller-status');}
  update(input){
    const info=input.gamepad.status,key=JSON.stringify([info,input.lastMethod]);if(key===this.last)return;this.last=key;
    this.gamepad.hidden=!info.supported;
    const ps=info.label==='PS5'||info.label==='PlayStation';
    document.getElementById('gamepad-jump').textContent=ps?'Croix (×)':info.label==='Xbox'?'A':'A / Croix';
    document.getElementById('gamepad-boost').textContent=ps?'R2':info.label==='Xbox'?'RT':'RT / R2';
    document.getElementById('gamepad-shoot').textContent=ps?'Carré (□)':info.label==='Xbox'?'X':'X / Carré';
    this.keyboard.classList.toggle('last-input',input.lastMethod==='keyboard');
    this.gamepad.classList.toggle('last-input',input.lastMethod==='gamepad');
    this.keyboard.dataset.active=String(input.lastMethod==='keyboard');this.gamepad.dataset.active=String(input.lastMethod==='gamepad');
    if(!info.available)this.status.textContent='Manette indisponible dans ce navigateur ou cette fenêtre. Le clavier reste disponible.';
    else if(info.connected&&!info.supported)this.status.textContent='Manette détectée, mais ses commandes ne sont pas reconnues par le navigateur. Le clavier reste disponible.';
    else if(info.connected)this.status.textContent=`${info.label} connectée · Commandes actives : ${input.lastMethod==='gamepad'?'manette':'clavier'} · Les deux restent utilisables.`;
    else this.status.textContent='PS5 : branche ta manette, puis appuie sur Croix pour la détecter. Le clavier reste disponible.';
  }
}
