import { CHARACTER_COSMETICS } from './character-cosmetics.js';
export const PASS_SEASON=1;
export const PASS_MAX_LEVEL=50;
export const SEASON_ONE=Object.freeze({id:1,name:'Saison 1',startsAt:'2026-10-11T00:00:00.000Z',endsAt:'2026-12-06T00:00:00.000Z'});
const crates=new Set([3,7,11,15,19,23,27,31,35,43,49]);
const coins=new Set([2,12,22,32,42]);
const tokens=new Set([5,14,24,34,44]);
const kinds=['skin','trail','ball','banner','explosion','mystery'];
const names={coins:'Coins',tokens:'Jetons',xp:'XP profil',crate:'Caisse',skin:'Style',trail:'Traînée',ball:'Balle',banner:'Bannière',explosion:'Explosion',mystery:'Récompense mystère'};
function reward(level,track){
  let type=crates.has(level)?'crate':coins.has(level)?'coins':tokens.has(level)?'tokens':level%4===0?kinds[(level/4-1)%kinds.length]:'xp';
  if(level===50)type='skin';
  if(track==='premium'&&type==='xp')type=kinds[(level-1)%kinds.length];
  const rarity=level<10?'common':level<20?'uncommon':level<30?'rare':level<40?'epic':'legendary';
  const amount=type==='coins'?(track==='premium'?200:100):type==='tokens'?(track==='premium'?10:5):type==='xp'?(track==='premium'?200:100):1;
  const id=`s1-${track}-${level}`;
  const character=level===50?CHARACTER_COSMETICS.find(c=>c.rewardId===id):null;
  return Object.freeze({id,level,track,type,amount,rarity,...(character?{characterCosmetic:character.id,palette:character.palette}:{}),label:character?character.label:type==='crate'?`Caisse ${rarity}`:`${amount>1?amount+' ':''}${names[type]}`,image:type==='crate'?`crates/crate_${rarity}.png`:`rewards/reward_${type==='tokens'?'mystery':type}.png`});
}
export const PASS_LEVELS=Object.freeze(Array.from({length:50},(_,i)=>Object.freeze({level:i+1,free:reward(i+1,'free'),premium:reward(i+1,'premium')})));
export class SeasonPass {
  constructor(profile,clock=()=>Date.now()){this.profile=profile;this.clock=clock;this.normalize();}
  normalize(){
    const d=this.profile.data;
    if(!Number.isSafeInteger(d.seasonXp)||d.seasonXp<0)d.seasonXp=0;
    if(!d.pass||typeof d.pass!=='object'||Array.isArray(d.pass))d.pass={};
    const p=d.pass;if(!Number.isSafeInteger(p.season)||p.season<1)p.season=PASS_SEASON;p.premium=p.premium===true;
    if(!d.seasonArchives||typeof d.seasonArchives!=='object'||Array.isArray(d.seasonArchives))d.seasonArchives={};
    if(!Number.isFinite(Date.parse(p.startsAt)))p.startsAt=SEASON_ONE.startsAt;
    if(!Number.isFinite(Date.parse(p.endsAt))||Date.parse(p.endsAt)<=Date.parse(p.startsAt))p.endsAt=SEASON_ONE.endsAt;
    p.claimed=Array.isArray(p.claimed)?[...new Set(p.claimed.filter(id=>typeof id==='string'))]:[];
    p.level=this.level;this.profile.save();
  }
  get level(){return Math.min(PASS_MAX_LEVEL,Math.floor(this.profile.data.seasonXp/1000));}
  get levels(){const season=this.profile.data.pass.season;if(season===1)return PASS_LEVELS;const prototype=r=>({...r,id:r.id.replace(/^s1-/,`s${season}-`),characterCosmetic:null,...(r.level===50?{label:`Personnage exclusif Saison ${season} · À préparer`}:{})});return PASS_LEVELS.map(row=>({...row,free:prototype(row.free),premium:prototype(row.premium)}));}
  get ended(){return this.clock()>=Date.parse(this.profile.data.pass.endsAt);}
  activateSeason({id,startsAt,endsAt}){const p=this.profile.data.pass;if(!Number.isSafeInteger(id)||id<=p.season||!Number.isFinite(Date.parse(startsAt))||!Number.isFinite(Date.parse(endsAt))||Date.parse(endsAt)<=Date.parse(startsAt)||!this.ended)return false;this.profile.data.seasonArchives[p.season]={...p,claimed:[...p.claimed],xp:this.profile.data.seasonXp};this.profile.data.pass={season:id,startsAt,endsAt,premium:false,claimed:[],level:0};this.profile.data.seasonXp=0;this.profile.save();return true;}
  addXp(amount,{save=true}={}){
    if(this.ended||!Number.isSafeInteger(amount)||amount<=0||!Number.isSafeInteger(this.profile.data.seasonXp+amount))return false;
    this.profile.data.seasonXp+=amount;this.profile.data.pass.level=this.level;if(save)this.profile.save();return true;
  }
  setPremium(active){if(typeof active!=='boolean')return false;this.profile.data.pass.premium=active;this.profile.save();return true;}
  state(reward){const p=this.profile.data.pass;return p.claimed.includes(reward.id)?'claimed':this.ended?'expired':reward.level>this.level?'locked':reward.track==='premium'&&!p.premium?'premium':'available';}
  claim(level,track){
    const r=this.levels.find(row=>row.level===level)?.[track];
    if(!r||!['free','premium'].includes(track)||this.state(r)!=='available')return false;
    const d=this.profile.data;
    if(['coins','tokens','xp'].includes(r.type)){
      const balance=d[r.type]??0;if(!Number.isSafeInteger(balance)||balance<0||!Number.isSafeInteger(balance+r.amount))return false;
      d[r.type]=balance+r.amount;
    }else{
      if(d.passInventory!==undefined&&(!Array.isArray(d.passInventory)||!d.passInventory.every(item=>item&&typeof item==='object')))return false;
      d.passInventory??=[];
      if(!d.passInventory.some(item=>item.id===r.id))d.passInventory.push({...r,season:d.pass.season,prepared:true,exclusive:level===50});
      this.profile.collection?.initializeVariants(r.id);
    }
    d.pass.claimed.push(r.id);d.pass.level=this.level;this.profile.save();return true;
  }
  snapshot(){const d=this.profile.data;return {season:d.pass.season,startsAt:d.pass.startsAt,endsAt:d.pass.endsAt,daysRemaining:Math.max(0,Math.ceil((Date.parse(d.pass.endsAt)-this.clock())/86400000)),ended:this.ended,xp:d.seasonXp,level:this.level,progress:this.level===50?1000:d.seasonXp%1000,premium:d.pass.premium,claimed:[...d.pass.claimed]};}
}
