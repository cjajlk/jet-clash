// Presentation data only. No inventory, commerce or reward mutations live here.
export const MENU_TABS=Object.freeze([
  {id:'home',label:'Accueil'},{id:'collection',label:'Collection'},
  {id:'shop',label:'Boutique'},{id:'pass',label:'Pass'},{id:'challenges',label:'Défis'},
]);
export const COLLECTION_CATEGORIES=Object.freeze([
  {id:'fluid',label:'Fluid',title:'Fluid équipé',detail:'Ton combattant pour le duel.',image:'characters/fluid/fluid_idle.png'},
  {id:'heavy',label:'Heavy',title:'Heavy',detail:'Ton adversaire dans La Cour de l’Aube.',image:'characters/heavy/heavy_walk.png'},
  {id:'balls',label:'Ballons',title:'Balle d’énergie',detail:'Le ballon actuel de JetClash.',image:'ball/ball_idle.png'},
  {id:'jet',label:'Effets Jet',title:'Effets Jet',detail:'De nouvelles signatures énergétiques. À venir.'},
  {id:'hit',label:'Effets de frappe',title:'Effets de frappe',detail:'Donne du caractère à chaque tir. À venir.'},
  {id:'goal',label:'Effets de but',title:'Effets de but',detail:'Ta célébration, ton style. À venir.'},
  {id:'emblems',label:'Autocollants / emblèmes',title:'Emblèmes',detail:'Une signature pour ton profil. À venir.'},
  {id:'avatars',label:'Avatars',title:'Avatars',detail:'Affirme ton identité. À venir.'},
  {id:'banners',label:'Bannières / titres',title:'Bannières et titres',detail:'Habille ton profil. À venir.'},
]);
export const MENU_IDENTITY=Object.freeze({nickname:'Pilote',emblem:'JC'});
// Future event themes can supply these presentation fields, without a calendar.
export const DEFAULT_MENU_THEME=Object.freeze({id:'aube',background:'assets/arena/arena_background.png',event:null});
export function profilePresentation(profile){
  const value=profile?.data?.xp,xp=Number.isSafeInteger(value)&&value>=0?value:0;
  return {...MENU_IDENTITY,xp,level:1+Math.floor(xp/1000),progress:xp%1000};
}
export class MobileMenuModel {
  constructor(){this.route='home';this.previous='home';this.category='fluid';}
  navigate(route){
    if(![...MENU_TABS.map(t=>t.id),'options','modes'].includes(route))return false;
    if(route==='options')this.previous=['options','modes'].includes(this.route)?'home':this.route;
    this.route=route;return true;
  }
  back(){this.route=this.route==='options'?this.previous:'home';}
  home(){this.route='home';this.previous='home';}
  selectCategory(id){if(!COLLECTION_CATEGORIES.some(c=>c.id===id))return false;this.category=id;return true;}
  canLaunch(mode,ready){return this.route==='modes'&&['duel','2v2'].includes(mode)&&ready===true;}
}
