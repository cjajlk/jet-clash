import {enhanceCollectionPreviews} from './collection-previews.js';
// Collection presentation only: selection is local UI state, never saved inventory.
const rarities={common:'Commun',uncommon:'Peu commun',rare:'Rare',epic:'Épique',legendary:'Légendaire'};
export function layoutCollection(menu,inventory,grid){
  const cards=[...grid.querySelectorAll('.collection-item')];
  const selected=cards.find(card=>card.dataset.collectionId===menu.collectionSelected)||cards.find(card=>card.dataset.equipped==='true')||cards[0];
  menu.collectionSelected=selected?.dataset.collectionId;
  const title=inventory.querySelector('h3');title.textContent=`Ton inventaire · ${cards.filter(card=>card.dataset.owned==='true').length} objets`;
  const notice=inventory.querySelector('.collection-reveal');if(!menu.revealed)notice.textContent='Choisis un objet pour découvrir ses couleurs et personnaliser ton équipement.';
  const layout=document.createElement('div');layout.className='collection-workspace';
  const shelf=document.createElement('section');shelf.className='collection-shelf';shelf.setAttribute('aria-label','Objets de la catégorie');
  const detail=document.createElement('section');detail.className='collection-inspector';detail.setAttribute('aria-label','Détail de l’objet sélectionné');
  for(const card of cards){
    const status=card.dataset.owned!=='true'?'Verrouillé':card.dataset.equipped==='true'?'Équipé':card.dataset.itemType==='crate'||card.dataset.itemType==='mystery'?'Non ouverte':'Débloqué';
    const button=document.createElement('button');button.type='button';button.className='collection-select';button.dataset.collectionSelect=card.dataset.collectionId;button.setAttribute('aria-pressed',String(card===selected));
    const image=card.querySelector('img').cloneNode(true),name=card.querySelector('strong').cloneNode(true);
    const rarity=document.createElement('span');rarity.className='collection-rarity';rarity.textContent=rarities[card.dataset.rarity]||card.dataset.rarity;
    const state=document.createElement('span');state.className='collection-state';state.textContent=status;
    button.append(image,name,rarity,state);
    const tile=document.createElement('article');tile.className='collection-item';tile.dataset.rarity=card.dataset.rarity;tile.append(button);card.replaceWith(tile);
    if(card===selected){
      card.className='collection-detail';card.querySelector('img').loading='eager';
      const eyebrow=document.createElement('p');eyebrow.className='collection-detail-meta';eyebrow.textContent=`${rarity.textContent} · ${status}`;card.querySelector('strong').after(eyebrow);
      const item=menu.profileStore.collection.item(card.dataset.collectionId);
      const variants=item&&menu.profileStore.collection.variants(item.id);
      if(variants){const count=document.createElement('p');count.className='collection-variant-count';count.textContent=`${variants.normal.length} / ${card.querySelectorAll('.collection-swatch:not(.prismatic-swatch)').length} couleurs débloquées${variants.prismatic?' · Prismatique obtenue':''}`;card.querySelector('.collection-colors').before(count);}
      detail.append(card);
    }
  }
  if(!selected){detail.innerHTML='<div class="collection-empty"><span aria-hidden="true">◇</span><h3>Ta collection commence ici</h3><p>Récupère des récompenses dans le Pass ou ouvre tes capsules pour personnaliser ton pilote.</p><button type="button" class="mm-secondary" data-route="pass">DÉCOUVRIR LE PASS</button></div>';grid.textContent='';const empty=document.createElement('p');empty.className='collection-empty-list';empty.textContent='Aucun objet dans cette catégorie pour le moment.';grid.append(empty);}
  enhanceCollectionPreviews(menu,inventory,detail,detail.querySelector('.collection-detail'));
  shelf.append(grid);layout.append(shelf,detail);inventory.append(layout);
}
