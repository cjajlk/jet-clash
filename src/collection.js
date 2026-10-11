import { characterCosmetic } from './character-cosmetics.js';
import { capsuleCategory, capsuleModel, CAPSULE_COLORS } from './capsules.js';
export const COSMETIC_SLOTS=Object.freeze(['skin','trail','ball','banner','explosion']);
export const EQUIPMENT_SLOTS=Object.freeze([...COSMETIC_SLOTS,'propulsion','impact','style','avatar','title']);
const names={skin:'Style',trail:'Traînée',ball:'Balle',banner:'Bannière',explosion:'Explosion'};
export const COSMETIC_PALETTES=Object.freeze([{name:'Aube',color:'#65e8ff',hue:150},{name:'Nébuleuse',color:'#bd73ff',hue:230},{name:'Couronne',color:'#ffcf65',hue:0},{name:'Nova',color:'#ff638e',hue:280},{name:'Émeraude',color:'#55ed98',hue:80},{name:'Glace',color:'#ccefff',hue:170}]);
export const PRISMATIC='prismatic';
export const cosmeticPalettes=item=>capsuleModel(item)?CAPSULE_COLORS:COSMETIC_PALETTES;
const palettes=COSMETIC_PALETTES;
export function cosmeticVisual(item){
  if(!item||!EQUIPMENT_SLOTS.includes(item.type))return null;
  if(['avatar','title'].includes(item.type))return null;
  if(item.variant===PRISMATIC){const hue=((globalThis.performance?.now?.()??Date.now())/40)%360;return {name:'Prismatique',color:`hsl(${hue} 85% 70%)`,hue,prismatic:true};}
  if(capsuleModel(item))return CAPSULE_COLORS[Number.isInteger(item.palette)&&item.palette>=0&&item.palette<4?item.palette:0];
  const character=characterCosmetic(item);
  if(character)return palettes[Number.isInteger(item.palette)&&item.palette>=0&&item.palette<palettes.length?item.palette:character.palette];
  const hash=[...String(item.id)].reduce((n,c)=>(n*31+c.charCodeAt(0))>>>0,0);
  return palettes[Number.isInteger(item.palette)&&item.palette>=0&&item.palette<palettes.length?item.palette:hash%4];
}
export class Collection {
  constructor(profile){
    this.profile=profile;const d=profile.data;
    for(const key of ['equipment','openedCrates','cosmeticColors','cosmeticVariants','pendingVariantChoices'])if(!d[key]||typeof d[key]!=='object'||Array.isArray(d[key]))d[key]={};
    d.capsuleInventory=Array.isArray(d.capsuleInventory)?d.capsuleInventory.filter(i=>i&&typeof i.id==='string'&&(capsuleModel(i)||(i.type==='crate'&&capsuleCategory(i.capsuleCategory)))):[];
    for(const item of this.items())this.initializeVariants(item.id);
    for(const [id,color] of Object.entries(d.cosmeticColors))if(!cosmeticVisual(this.item(id))||!(color===PRISMATIC&&this.variants(id)?.prismatic)&&(!Number.isInteger(color)||color<0||color>=cosmeticPalettes(this.item(id)).length))delete d.cosmeticColors[id];
    for(const slot of Object.keys(d.equipment))if(!EQUIPMENT_SLOTS.includes(slot)||this.item(d.equipment[slot])?.type!==slot)delete d.equipment[slot];
  }
  items(){return [...(Array.isArray(this.profile.data.passInventory)?this.profile.data.passInventory:[]),...(this.profile.data.capsuleInventory||[])].filter(i=>i&&typeof i.id==='string');}
  item(id){return this.items().find(i=>i.id===id);}
  initializeVariants(id){
    const item=this.item(id);if(!cosmeticVisual(item))return null;
    const d=this.profile.data,colors=cosmeticPalettes(item),character=characterCosmetic(item),visual=cosmeticVisual(character?{...item,palette:character.palette}:item);
    const initial=Math.max(0,colors.indexOf(visual)),selected=d.cosmeticColors[id];
    let state=d.cosmeticVariants[id];
    if(!state||typeof state!=='object'||!Array.isArray(state.normal))state=d.cosmeticVariants[id]={normal:[initial,...(Number.isInteger(selected)&&selected>=0&&selected<colors.length?[selected]:[])]};
    state.normal=[...new Set(state.normal.filter(p=>Number.isInteger(p)&&p>=0&&p<colors.length))];if(!state.normal.length)state.normal=[initial];
    state.prismatic=state.normal.length===colors.length;return state;
  }
  variants(id){const state=this.initializeVariants(id);return state?{normal:[...state.normal],prismatic:state.prismatic}:null;}
  lockedVariants(id){const item=this.item(id),state=this.variants(id);return state?cosmeticPalettes(item).map((_,i)=>i).filter(i=>!state.normal.includes(i)):[];}
  appearance(item){const character=characterCosmetic(item),base=character?{...item,label:character.label,characterCosmetic:character.id,palette:character.palette}:item,palette=this.profile.data.cosmeticColors[item?.id],state=item?this.variants(item.id):null;if(!state)return base;if(palette===PRISMATIC&&state.prismatic)return {...base,palette:0,variant:PRISMATIC};const initial=cosmeticPalettes(item).indexOf(cosmeticVisual(base));return {...base,palette:state.normal.includes(palette)?palette:state.normal.includes(initial)?initial:state.normal[0]};}
  equipped(slot){return this.appearance(this.item(this.profile.data.equipment[slot]));}
  setColor(id,palette){const state=this.variants(id);if(!state||(palette===PRISMATIC?!state.prismatic:!state.normal.includes(palette)))return false;this.profile.data.cosmeticColors[id]=palette;this.profile.save();return true;}
  chooseVariant(crateId,palette){const id=this.profile.data.pendingVariantChoices[crateId],state=this.variants(id);if(!id||!state||!this.lockedVariants(id).includes(palette))return false;state.normal.push(palette);this.profile.data.cosmeticVariants[id]=state;this.initializeVariants(id);delete this.profile.data.pendingVariantChoices[crateId];this.profile.save();return true;}
  pendingChoices(){return Object.entries(this.profile.data.pendingVariantChoices).filter(([,id])=>this.item(id)&&this.lockedVariants(id).length).map(([crateId,id])=>({crateId,item:this.item(id),colors:this.lockedVariants(id)}));}
  crates(){const groups=new Map();for(const item of this.items()){if(!['crate','mystery'].includes(item.type)||Object.hasOwn(this.profile.data.openedCrates,item.id))continue;const key=item.capsuleCategory?`capsule-${item.capsuleCategory}`:`${item.type}-${item.rarity||'common'}-${item.season||1}`;const group=groups.get(key)||{...item,quantity:0,crateIds:[]};group.quantity++;group.crateIds.push(item.id);groups.set(key,group);}return [...groups.values()];}
  characters(){return [{id:'fluid',label:'Fluid',preview:'assets/characters/fluid/fluid_idle.png'},...this.items().filter(item=>characterCosmetic(item)).map(item=>({id:item.id,label:this.appearance(item).label,preview:characterCosmetic(item).preview}))];}
  selectCharacter(id){return id==='fluid'?this.unequip('skin'):this.characters().some(c=>c.id===id)&&this.equip(id);}
  equip(id){const item=this.item(id);if(!item||!EQUIPMENT_SLOTS.includes(item.type))return false;this.profile.data.equipment[item.type]=id;this.profile.save();return true;}
  unequip(slot){if(!EQUIPMENT_SLOTS.includes(slot))return false;delete this.profile.data.equipment[slot];this.profile.save();return true;}
  buyCapsule(categoryId){
    const category=capsuleCategory(categoryId),d=this.profile.data,coins=d.coins??0;
    if(!category||!Number.isSafeInteger(coins)||coins<category.price)return null;
    let sequence=Number.isSafeInteger(d.capsuleSequence)&&d.capsuleSequence>=0?d.capsuleSequence:0;
    do{sequence++;if(!Number.isSafeInteger(sequence))return null;}while(this.item(`purchased-capsule-${sequence}`)||Object.hasOwn(d.openedCrates,`purchased-capsule-${sequence}`));
    const crate={id:`purchased-capsule-${sequence}`,type:'crate',capsuleCategory:category.id,label:`Capsule ${category.label}`,pricePaid:category.price,source:'shop'};
    d.coins=coins-category.price;d.capsuleSequence=sequence;d.capsuleInventory.push(crate);this.profile.save();return crate;
  }
  openCapsule(crate,random){
    const category=capsuleCategory(crate.capsuleCategory),d=this.profile.data;
    if(this.item(crate.id)!==crate||Object.hasOwn(d.openedCrates,crate.id)||!category||!Number.isSafeInteger(crate.pricePaid)||crate.pricePaid<0)return null;
    const value=random();if(!Number.isFinite(value)||value<0||value>=1)return null;
    const model=category.models[Math.floor(value*category.models.length)],owned=this.item(model.id),locked=owned?this.lockedVariants(model.id):[],refund=owned&&!locked.length?Math.floor(crate.pricePaid/4):0,coins=d.coins??0;
    if(!Number.isSafeInteger(coins)||coins<0||!Number.isSafeInteger(coins+refund))return null;
    const reward=owned||{...model,label:`${category.label} · ${model.label}`,palette:0,source:'shop'};
    if(!owned)d.capsuleInventory.push(reward);
    this.initializeVariants(reward.id);if(owned&&locked.length)d.pendingVariantChoices[crate.id]=reward.id;
    if(refund)d.coins=coins+refund;
    d.openedCrates[crate.id]=reward.id;this.profile.save();return {...reward,duplicate:!!owned,refund,choice:owned&&locked.length?crate.id:null};
  }
  open(id,random=Math.random){
    const crate=this.item(id),d=this.profile.data;if(!crate||!['crate','mystery'].includes(crate.type)||Object.hasOwn(d.openedCrates,id))return null;
    if(crate.capsuleCategory)return this.openCapsule(crate,random);
    const value=random();if(!Number.isFinite(value)||value<0||value>=1)return null;
    const index=Math.floor(value*COSMETIC_SLOTS.length*palettes.length),type=COSMETIC_SLOTS[index%COSMETIC_SLOTS.length],palette=Math.floor(index/COSMETIC_SLOTS.length);
    const owned=this.items().find(item=>item.type===type&&item.rarity===crate.rarity&&(item.season||1)===(crate.season||1)&&(item.source==='crate'||item.id.endsWith('-content')));
    const reward=owned||{id:`crate-cosmetic-s${crate.season||1}-${crate.rarity||'common'}-${type}`,type,palette,label:`${names[type]} · ${crate.rarity||'common'} · Saison ${crate.season||1}`,rarity:crate.rarity,season:crate.season,image:`rewards/reward_${type}.png`,prepared:true,source:'crate'};
    if(!owned)d.passInventory.push(reward);this.initializeVariants(reward.id);
    const choice=!!owned&&this.lockedVariants(reward.id).length>0;if(choice)d.pendingVariantChoices[id]=reward.id;
    d.openedCrates[id]=reward.id;this.profile.save();return {...reward,duplicate:!!owned,refund:0,choice:choice?id:null};
  }
}
