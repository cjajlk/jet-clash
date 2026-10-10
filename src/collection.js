import { capsuleCategory, capsuleModel, CAPSULE_COLORS } from './capsules.js';
export const COSMETIC_SLOTS=Object.freeze(['skin','trail','ball','banner','explosion']);
export const EQUIPMENT_SLOTS=Object.freeze([...COSMETIC_SLOTS,'propulsion','impact','style']);
const names={skin:'Style',trail:'Traînée',ball:'Balle',banner:'Bannière',explosion:'Explosion'};
export const COSMETIC_PALETTES=Object.freeze([{name:'Aube',color:'#65e8ff',hue:150},{name:'Nébuleuse',color:'#bd73ff',hue:230},{name:'Couronne',color:'#ffcf65',hue:0},{name:'Nova',color:'#ff638e',hue:280}]);
const palettes=COSMETIC_PALETTES;
export function cosmeticVisual(item){
  if(!item||!EQUIPMENT_SLOTS.includes(item.type))return null;
  if(capsuleModel(item))return CAPSULE_COLORS[Number.isInteger(item.palette)&&item.palette>=0&&item.palette<4?item.palette:0];
  const hash=[...String(item.id)].reduce((n,c)=>(n*31+c.charCodeAt(0))>>>0,0);
  return palettes[Number.isInteger(item.palette)&&item.palette>=0&&item.palette<palettes.length?item.palette:hash%palettes.length];
}
export class Collection {
  constructor(profile){
    this.profile=profile;const d=profile.data;
    for(const key of ['equipment','openedCrates','cosmeticColors'])if(!d[key]||typeof d[key]!=='object'||Array.isArray(d[key]))d[key]={};
    d.capsuleInventory=Array.isArray(d.capsuleInventory)?d.capsuleInventory.filter(i=>i&&typeof i.id==='string'&&(capsuleModel(i)||(i.type==='crate'&&capsuleCategory(i.capsuleCategory)))):[];
    for(const [id,color] of Object.entries(d.cosmeticColors))if(!cosmeticVisual(this.item(id))||!Number.isInteger(color)||color<0||color>=palettes.length)delete d.cosmeticColors[id];
    for(const slot of Object.keys(d.equipment))if(!EQUIPMENT_SLOTS.includes(slot)||this.item(d.equipment[slot])?.type!==slot)delete d.equipment[slot];
  }
  items(){return [...(Array.isArray(this.profile.data.passInventory)?this.profile.data.passInventory:[]),...(this.profile.data.capsuleInventory||[])].filter(i=>i&&typeof i.id==='string');}
  item(id){return this.items().find(i=>i.id===id);}
  appearance(item){const palette=this.profile.data.cosmeticColors[item?.id];return Number.isInteger(palette)?{...item,palette}:item;}
  equipped(slot){return this.appearance(this.item(this.profile.data.equipment[slot]));}
  setColor(id,palette){if(!cosmeticVisual(this.item(id))||!Number.isInteger(palette)||palette<0||palette>=palettes.length)return false;this.profile.data.cosmeticColors[id]=palette;this.profile.save();return true;}
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
    const model=category.models[Math.floor(value*category.models.length)],owned=this.item(model.id),refund=owned?Math.floor(crate.pricePaid/4):0,coins=d.coins??0;
    if(!Number.isSafeInteger(coins)||coins<0||!Number.isSafeInteger(coins+refund))return null;
    const reward=owned||{...model,label:`${category.label} · ${model.label}`,palette:0,source:'shop'};
    if(!owned)d.capsuleInventory.push(reward);
    if(refund)d.coins=coins+refund;
    d.openedCrates[crate.id]=reward.id;this.profile.save();return {...reward,duplicate:!!owned,refund};
  }
  open(id,random=Math.random){
    const crate=this.item(id),d=this.profile.data;if(!crate||!['crate','mystery'].includes(crate.type)||Object.hasOwn(d.openedCrates,id))return null;
    if(crate.capsuleCategory)return this.openCapsule(crate,random);
    const value=random();if(!Number.isFinite(value)||value<0||value>=1)return null;
    const index=Math.floor(value*COSMETIC_SLOTS.length*palettes.length),type=COSMETIC_SLOTS[index%COSMETIC_SLOTS.length],palette=Math.floor(index/COSMETIC_SLOTS.length);
    const reward={id:`${id}-content`,type,palette,label:`${names[type]} · ${palettes[palette].name}`,rarity:crate.rarity,season:crate.season,image:`rewards/reward_${type}.png`,prepared:true};
    if(this.item(reward.id))return null;
    d.passInventory.push(reward);d.openedCrates[id]=reward.id;this.profile.save();return reward;
  }
}
