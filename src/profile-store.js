import { Collection } from './collection.js';
import { ChallengeManager } from './challenges.js';
import { SeasonPass } from './season-pass.js';
import {QuickReactions} from './quick-reactions.js';
const KEY='jetclash.etape2.profile.v1';
export class ProfileStore {
  constructor(storage,clock) { this.storage=storage; this.warning=''; this.data={xp:0,completed:[]}; this.load(); this.pass=new SeasonPass(this); this.collection=new Collection(this); this.challenges=new ChallengeManager(this,clock);this.reactions=new QuickReactions(this);this.normalizeIdentity();this.save(); }
  normalizeIdentity(){const d=this.data;if(!d.identity||typeof d.identity!=='object'||Array.isArray(d.identity))d.identity={};if(typeof d.identity.nickname!=='string'||!d.identity.nickname.trim())d.identity.nickname=typeof d.nickname==='string'?d.nickname:'Pilote';d.identity.nickname=d.identity.nickname.slice(0,24);if(!d.stats||typeof d.stats!=='object'||Array.isArray(d.stats))d.stats={matches:d.completed.length,wins:0,goals:0,partial:d.completed.length>0};for(const key of ['matches','wins','goals'])if(!Number.isSafeInteger(d.stats[key])||d.stats[key]<0)d.stats[key]=0;d.stats.matches=Math.max(d.stats.matches,d.completed.length);}
  load() {
    try {
      const raw=this.storage?.getItem(KEY);
      if (!this.storage) throw new Error('storage unavailable');
      if (!raw) return;
      const saved=JSON.parse(raw);
      if (!Number.isSafeInteger(saved.xp) || saved.xp<0 || !Array.isArray(saved.completed) || !saved.completed.every(x=>typeof x==='string')) throw new Error('invalid profile');
      this.data={...saved,xp:saved.xp,completed:saved.completed};
    } catch { this.warning='Sauvegarde indisponible ou illisible : progression conservée pour cette session seulement.'; }
  }
  save(){
    try { if (!this.storage) throw new Error('storage unavailable'); this.storage.setItem(KEY,JSON.stringify(this.data)); }
    catch { this.warning='Sauvegarde indisponible : progression conservée pour cette session seulement.'; }
  }
  get level() { return 1+Math.floor(this.data.xp/1000); }
  award(id, goals, won) {
    if (this.data.completed.includes(id)) return 0;
    const xp=100+(won?50:0)+10*Math.max(0,Math.floor(goals));
    this.data.xp+=xp; this.data.completed.push(id);this.data.stats.matches++;if(won)this.data.stats.wins++;this.data.stats.goals+=Math.max(0,Math.floor(goals)); this.save();
    return xp;
  }
}
