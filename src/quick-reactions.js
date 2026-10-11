export const REACTIONS=Object.freeze([
  ['gg','GG'],['bien_joue','Bien joué !'],['joli_but','Joli but !'],['belle_passe','Belle passe !'],['merci','Merci !'],['oups','Oups !'],['bon_tir','Bon tir !'],['wow','Wow !'],
  ['a_toi','À toi !'],['defends','Défends !'],['desole','Désolé !'],['presque','Presque !'],['pas_de_souci','Pas de souci !'],['jarrive',"J’arrive !"],['incroyable','Incroyable !'],['ouf','Ouf !']
].map(([id,label],index)=>Object.freeze({id,label,image:`assets/capsules/reaction/reaction_${id}.png`,default:index<8})));
export const REACTION_COOLDOWN=2000;
const defaults=['gg','bien_joue','joli_but','merci'];
export class QuickReactions{
  constructor(profile,clock=()=>globalThis.performance?.now?.()??Date.now()){
    this.profile=profile;this.clock=clock;this.lastSent=-Infinity;this.message=null;
    const old=profile.data.reactions;profile.data.reactions=[];
    for(const id of Array.isArray(old)?old:[])if(this.available().some(r=>r.id===id)&&!profile.data.reactions.includes(id)&&profile.data.reactions.length<4)profile.data.reactions.push(id);
    for(const id of [...defaults,...this.available().map(r=>r.id)])if(profile.data.reactions.length<4&&!profile.data.reactions.includes(id))profile.data.reactions.push(id);
  }
  available(){return REACTIONS.filter(r=>r.default||this.profile.collection.items().some(item=>item.type==='reaction'&&(item.reactionId===r.id||item.id===`reaction-${r.id}`)));}
  equip(slot,id){const selected=this.profile.data.reactions;if(!Number.isInteger(slot)||slot<0||slot>=4||!this.available().some(r=>r.id===id))return false;const other=selected.indexOf(id);if(other>=0)[selected[slot],selected[other]]=[selected[other],selected[slot]];else selected[slot]=id;this.profile.save();return true;}
  get equipped(){return this.profile.data.reactions.map(id=>REACTIONS.find(r=>r.id===id));}
  send(slot){if(!Number.isInteger(slot)||slot<0||slot>=4||this.clock()-this.lastSent<REACTION_COOLDOWN)return null;const reaction=this.equipped[slot];if(!reaction)return null;this.lastSent=this.clock();this.message={...reaction,expiresAt:this.lastSent+1800};return this.message;}
  get coolingDown(){return this.clock()-this.lastSent<REACTION_COOLDOWN;}
}
export class QuickReactionUI{
  constructor(shell,reactions){this.reactions=reactions;this.match=null;this.key='';this.root=document.createElement('div');this.root.className='quick-chat';this.root.hidden=true;this.root.setAttribute('aria-label','Réactions rapides');this.bubble=document.createElement('div');this.bubble.className='quick-chat-bubble';this.bubble.setAttribute('role','status');this.bubble.hidden=true;shell.append(this.root,this.bubble);this.root.addEventListener('click',e=>{const button=e.target.closest('[data-quick-reaction]');if(button&&!button.disabled&&this.match?.state==='PLAYING')this.reactions.send(Number(button.dataset.quickReaction));});}
  update(match){this.match=match;const active=match.state==='PLAYING';this.root.hidden=!active;if(!active)this.reactions.message=null;const key=this.reactions.profile.data.reactions.join(',');if(key!==this.key){this.key=key;this.root.replaceChildren();this.reactions.equipped.forEach((reaction,slot)=>{const button=document.createElement('button');button.type='button';button.dataset.quickReaction=slot;button.title=reaction.label;button.setAttribute('aria-label',reaction.label);const image=document.createElement('img');image.src=reaction.image;image.alt='';button.append(image);this.root.append(button);});}for(const button of this.root.children)button.disabled=this.reactions.coolingDown;const message=this.reactions.message;this.bubble.hidden=!active||!message||message.expiresAt<=this.reactions.clock();if(message)this.bubble.textContent=message.label;}
}
