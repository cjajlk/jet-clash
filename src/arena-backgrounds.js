// Decorative themes only. Dates use the player's local calendar; no profile state.
export const DEFAULT_BACKGROUND='assets/arena/backgrounds/arena_default.png';
const theme=(id,name,file,event=null)=>Object.freeze({id,name,image:`assets/arena/backgrounds/${file}.png`,event});
export const STANDARD_BACKGROUNDS=Object.freeze([
  theme('default','Ville Néon','arena_neon_city'),theme('sunset','Coucher de soleil','arena_sunset')
]);
export const ARENA_EVENTS=Object.freeze([
  Object.freeze({id:'halloween',start:[10,15],end:[11,1],theme:theme('halloween','Halloween','arena_halloween','Halloween')}),
  Object.freeze({id:'christmas',start:[12,1],end:[12,31],theme:theme('christmas','Noël','arena_christmas','Noël')})
]);
export function getActiveEvent(date=new Date()){
  if(!(date instanceof Date)||!Number.isFinite(date.getTime()))return null;
  const day=(date.getMonth()+1)*100+date.getDate();
  return ARENA_EVENTS.find(event=>day>=event.start[0]*100+event.start[1]&&day<=event.end[0]*100+event.end[1])||null;
}
export function getAvailableStandardBackgrounds(){return STANDARD_BACKGROUNDS;}
export function getCurrentArenaTheme(date=new Date()){
  const event=getActiveEvent(date);if(event)return event.theme;
  if(!(date instanceof Date)||!Number.isFinite(date.getTime()))return STANDARD_BACKGROUNDS[0];
  // Deterministic daily rotation, independent of DST and page reloads.
  const day=Math.floor(Date.UTC(date.getFullYear(),date.getMonth(),date.getDate())/86400000);
  return STANDARD_BACKGROUNDS[((day%STANDARD_BACKGROUNDS.length)+STANDARD_BACKGROUNDS.length)%STANDARD_BACKGROUNDS.length];
}
