import {characterCosmetic} from './character-cosmetics.js';
import {cosmeticVisual} from './collection.js';
import {REACTIONS} from './quick-reactions.js';
const node=(tag,className,text)=>{const el=document.createElement(tag);el.className=className;if(text)el.textContent=text;return el;};
function playerCard(profile,banner){
  const collection=profile.collection,character=characterCosmetic(collection.equipped('skin')),avatar=collection.equipped('avatar'),title=collection.equipped('title'),visual=cosmeticVisual(banner);
  const card=node('div','collection-player-card');card.dataset.bannerId=banner?.id||'base';if(visual)card.style.setProperty('--identity-color',visual.color);if(visual?.prismatic)card.classList.add('is-prismatic');
  const image=node('img','collection-avatar');image.alt='Avatar';image.src=typeof avatar?.image==='string'&&avatar.image.startsWith('assets/')&&!avatar.image.includes('..')?avatar.image:character?.preview||'assets/characters/fluid/fluid_idle.png';
  const content=node('div','collection-player-name');content.append(node('strong','',globalThis.CJajlkAccount?.getDisplayPseudo?.(profile.data.identity.nickname)||profile.data.identity.nickname),node('span','',title?.label||'Pilote de l’Aube'),node('small','',`${character?.label||'Fluid'} · ${banner?.label||'Bannière de base'}`));card.append(image,content);return card;
}
export function enhanceCollectionPreviews(menu,inventory,detail,card){
  const profile=menu.profileStore,collection=profile.collection;
  const identity=node('section','collection-current-identity');identity.setAttribute('aria-label','Identité actuelle');identity.append(node('h4','','Identité actuelle'),playerCard(profile,collection.equipped('banner')));inventory.prepend(identity);
  if(!card)return;
  const type=card.dataset.itemType,id=card.dataset.collectionId,item=collection.item(id),image=card.querySelector(':scope > img');card.dataset.previewType=type;
  if(type==='skin'){
    const stage=node('div','collection-character-stage');image.before(stage);stage.append(image);const caption=node('p','collection-preview-caption',`Apparence cosmétique · ${item?.season?`Saison ${item.season}`:id==='fluid-base'?'Personnage de base':'Saison 1'} · Statistiques identiques`);stage.after(caption);
  }else if(type==='banner'||type==='title'||type==='avatar'){
    const preview=playerCard(profile,type==='banner'?collection.appearance(item):collection.equipped('banner'));image.replaceWith(preview);preview.classList.add('collection-banner-preview');preview.after(node('p','collection-preview-caption','Aperçu de ta carte joueur'));
  }else if(type==='reaction'){
    const reaction=REACTIONS.find(r=>r.id===(item?.reactionId||id.replace('reaction-','')));image.after(node('p','collection-reaction-text',reaction?.label||item?.label));
    const slots=profile.data.reactions.map((value,index)=>value===reaction?.id?index+1:null).filter(Boolean);image.after(node('p','collection-preview-caption',slots.length?`Équipée · Emplacement ${slots.join(', ')}`:card.dataset.owned==='true'?'Débloquée · Configure tes 4 emplacements dans Profil':'Réaction verrouillée · Récompense future'));
  }else if(['trail','propulsion','impact','explosion'].includes(type)){
    const stage=node('div',`collection-effect-stage effect-${type}`);stage.setAttribute('aria-label','Démonstration visuelle');image.before(stage);stage.append(image,node('span','effect-demo-shape'));
    stage.after(node('p','collection-preview-caption',type==='explosion'?'Effet de but à venir · Aperçu cosmétique':'Aperçu UI · Démonstration visuelle'));
  }else if(type==='ball')image.classList.add('collection-ball-preview');
}
