const STORAGE_KEY='jetclash.etape2.controls.v1';

export const KEY_OPTIONS=Object.freeze([
  {code:'ArrowLeft',label:'Flèche gauche'},{code:'ArrowRight',label:'Flèche droite'},
  {code:'ArrowUp',label:'Flèche haut'},{code:'ArrowDown',label:'Flèche bas'},
  {code:'KeyA',label:'A'},{code:'KeyD',label:'D'},{code:'KeyQ',label:'Q'},{code:'KeyW',label:'W'},
  {code:'KeyZ',label:'Z'},{code:'KeyE',label:'E'},{code:'KeyR',label:'R'},{code:'KeyT',label:'T'},
  {code:'KeyF',label:'F'},{code:'KeyI',label:'I'},{code:'KeyJ',label:'J'},{code:'KeyK',label:'K'},{code:'KeyL',label:'L'},
  {code:'Space',label:'Espace'},{code:'ShiftLeft',label:'Maj gauche'},{code:'ShiftRight',label:'Maj droite'},
]);

export const GAMEPAD_BUTTON_OPTIONS=Object.freeze([
  {value:0,label:'Croix / A'},{value:1,label:'Rond / B'},{value:2,label:'Carré / X'},{value:3,label:'Triangle / Y'},
  {value:4,label:'L1 / LB'},{value:5,label:'R1 / RB'},{value:6,label:'L2 / LT'},{value:7,label:'R2 / RT'},
  {value:8,label:'Partager / View'},{value:9,label:'Options / Menu'},{value:10,label:'Stick gauche (L3)'},{value:11,label:'Stick droit (R3)'},
  {value:12,label:'Haut'} ,{value:13,label:'Bas'},{value:14,label:'Gauche'},{value:15,label:'Droite'},
]);

export const STICK_OPTIONS=Object.freeze([
  {value:'right',label:'Stick droit'},
  {value:'left',label:'Stick gauche'},
]);

export const TOUCH_LAYOUT_OPTIONS=Object.freeze([
  {value:'standard',label:'Standard'},
  {value:'mirrored',label:'Miroir gauche/droite'},
]);

const DEFAULT_SETTINGS=Object.freeze({
  keyboard:{
    moveLeft:['ArrowLeft','KeyA','KeyQ'],
    moveRight:['ArrowRight','KeyD'],
    jump:['Space','ArrowUp','KeyW','KeyZ'],
    boost:['ShiftLeft','ShiftRight'],
    shoot:['KeyF'],
    rotate:['KeyR'],
    resetBall:['KeyT'],
    aimUp:['KeyI'],
    aimLeft:['KeyJ'],
    aimDown:['KeyK'],
    aimRight:['KeyL'],
  },
  gamepad:{movementStick:'right',jump:0,boost:1,shoot:6,rotate:2,resetBall:13},
  touch:{layout:'standard'},
});

const clone=value=>typeof structuredClone==='function'?structuredClone(value):JSON.parse(JSON.stringify(value));
const arrayOf=value=>Array.isArray(value)?value.filter(Boolean):typeof value==='string'&&value?value.split(',').map(v=>v.trim()).filter(Boolean):[];
const asNumber=value=>Number.isInteger(Number(value))?Number(value):null;

function normalize(saved){
  const keyboard=saved?.keyboard||{};
  const gamepad=saved?.gamepad||{};
  const touch=saved?.touch||{};
  const migratedDefaultGamepad=asNumber(gamepad.boost)===7&&asNumber(gamepad.rotate)===5;
  return {
    keyboard:{
      moveLeft:arrayOf(keyboard.moveLeft).length?arrayOf(keyboard.moveLeft):clone(DEFAULT_SETTINGS.keyboard.moveLeft),
      moveRight:arrayOf(keyboard.moveRight).length?arrayOf(keyboard.moveRight):clone(DEFAULT_SETTINGS.keyboard.moveRight),
      jump:arrayOf(keyboard.jump).length?arrayOf(keyboard.jump):clone(DEFAULT_SETTINGS.keyboard.jump),
      boost:arrayOf(keyboard.boost).length?arrayOf(keyboard.boost):clone(DEFAULT_SETTINGS.keyboard.boost),
      shoot:arrayOf(keyboard.shoot).length?arrayOf(keyboard.shoot):clone(DEFAULT_SETTINGS.keyboard.shoot),
      rotate:arrayOf(keyboard.rotate).length?arrayOf(keyboard.rotate):clone(DEFAULT_SETTINGS.keyboard.rotate),
      resetBall:arrayOf(keyboard.resetBall).length?arrayOf(keyboard.resetBall):clone(DEFAULT_SETTINGS.keyboard.resetBall),
      aimUp:arrayOf(keyboard.aimUp).length?arrayOf(keyboard.aimUp):clone(DEFAULT_SETTINGS.keyboard.aimUp),
      aimLeft:arrayOf(keyboard.aimLeft).length?arrayOf(keyboard.aimLeft):clone(DEFAULT_SETTINGS.keyboard.aimLeft),
      aimDown:arrayOf(keyboard.aimDown).length?arrayOf(keyboard.aimDown):clone(DEFAULT_SETTINGS.keyboard.aimDown),
      aimRight:arrayOf(keyboard.aimRight).length?arrayOf(keyboard.aimRight):clone(DEFAULT_SETTINGS.keyboard.aimRight),
    },
    gamepad:{
      movementStick:gamepad.movementStick==='left'?'left':'right',
      jump:asNumber(gamepad.jump)??DEFAULT_SETTINGS.gamepad.jump,
      boost:migratedDefaultGamepad?DEFAULT_SETTINGS.gamepad.boost:asNumber(gamepad.boost)??DEFAULT_SETTINGS.gamepad.boost,
      shoot:asNumber(gamepad.shoot)??DEFAULT_SETTINGS.gamepad.shoot,
      rotate:migratedDefaultGamepad?DEFAULT_SETTINGS.gamepad.rotate:asNumber(gamepad.rotate)??DEFAULT_SETTINGS.gamepad.rotate,
      resetBall:asNumber(gamepad.resetBall)??DEFAULT_SETTINGS.gamepad.resetBall,
    },
    touch:{layout:touch.layout==='mirrored'?'mirrored':'standard'},
  };
}

function load(storage){
  try{
    const raw=storage?.getItem(STORAGE_KEY);
    if(!raw)return clone(DEFAULT_SETTINGS);
    return normalize(JSON.parse(raw));
  }catch{return clone(DEFAULT_SETTINGS);}
}

class ControlSettingsStore {
  constructor(storage){this.storage=storage;this.data=load(storage);} 
  save(){try{if(this.storage)this.storage.setItem(STORAGE_KEY,JSON.stringify(this.data));}catch{}}
  reset(){this.data=clone(DEFAULT_SETTINGS);this.save();return this.data;}
  setKeyboard(action,value){if(!(action in this.data.keyboard))return false;this.data.keyboard[action]=arrayOf(value);this.save();return true;}
  setGamepad(action,value){if(!(action in this.data.gamepad))return false;if(action==='movementStick'){this.data.gamepad[action]=value==='left'?'left':'right';this.save();return true;}const number=asNumber(value);if(number===null)return false;this.data.gamepad[action]=number;this.save();return true;}
  setTouchLayout(value){this.data.touch.layout=value==='mirrored'?'mirrored':'standard';this.save();return true;}
  get keyboard(){return this.data.keyboard;}
  get gamepad(){return this.data.gamepad;}
  get touch(){return this.data.touch;}
}

const storage=typeof localStorage!=='undefined'?localStorage:null;
export const controlSettings=new ControlSettingsStore(storage);
export { DEFAULT_SETTINGS };