export const COSMETIC_SLOTS=Object.freeze(['skin','trail','ball','banner','explosion']);
const names={skin:'Style',trail:'Traînée',ball:'Balle',banner:'Bannière',explosion:'Explosion'};
const palettes=[{name:'Aube',color:'#65e8ff',hue:150},{name:'Nébuleuse',color:'#bd73ff',hue:25},{name:'Couronne',color:'#ffcf65',hue:230},{name:'Nova',color:'#ff638e',hue:85}];
export function cosmeticVisual(item){
  if(!item||!COSMETIC_SLOTS.includes(item.type))return null;
  const hash=[...String(item.id)].reduce((n,c)=>(n*31+c.charCodeAt(0))>>>0,0);
  return palettes[Number.isInteger(item.palette)&&item.palette>=0&&item.palette<palettes.length?item.palette:hash%palettes.length];
}
export class Collection {
  constructor(profile){this.profile=profile;const d=profile.data;d.equipment=d.equipment&&typeof d.equipment==='object'&&!Array.isArray(d.equipment)?d.equipment:{};d.openedCrates=d.openedCrates&&typeof d.openedCrates==='object'&&!Array.isArray(d.openedCrates)?d.openedCrates:{};for(const slot of Object.keys(d.equipment))if(!COSMETIC_SLOTS.includes(slot)||this.item(d.equipment[slot])?.type!==slot)delete d.equipment[slot];}
  items(){return (Array.isArray(this.profile.data.passInventory)?this.profile.data.passInventory:[]).filter(i=>i&&typeof i.id==='string');}
  item(id){return this.items().find(i=>i.id===id);}
  equipped(slot){return this.item(this.profile.data.equipment[slot]);}
  equip(id){const item=this.item(id);if(!item||!COSMETIC_SLOTS.includes(item.type))return false;this.profile.data.equipment[item.type]=id;this.profile.save();return true;}
  unequip(slot){if(!COSMETIC_SLOTS.includes(slot))return false;delete this.profile.data.equipment[slot];this.profile.save();return true;}
  open(id,random=Math.random){
    const crate=this.item(id),d=this.profile.data;if(!crate||!['crate','mystery'].includes(crate.type)||Object.hasOwn(d.openedCrates,id))return null;
    const value=random();if(!Number.isFinite(value)||value<0||value>=1)return null;
    const index=Math.floor(value*COSMETIC_SLOTS.length*palettes.length),type=COSMETIC_SLOTS[index%COSMETIC_SLOTS.length],palette=Math.floor(index/COSMETIC_SLOTS.length);
    const reward={id:`${id}-content`,type,palette,label:`${names[type]} · ${palettes[palette].name}`,rarity:crate.rarity,season:crate.season,image:`rewards/reward_${type}.png`,prepared:true};
    if(this.item(reward.id))return null;
    d.passInventory.push(reward);d.openedCrates[id]=reward.id;this.profile.save();return reward;
  }
}
