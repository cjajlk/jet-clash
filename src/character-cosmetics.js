// Pass cosmetics reuse complete existing character render sets; no body mechanics change.
export const CHARACTER_BASE_POSES=Object.freeze(['idle','walk','sprint','jump','jetpack','attack']);
export const CHARACTER_AIR_POSES=Object.freeze(['air_idle','air_up','air_diagonal_up','air_horizontal','air_turn','ceiling','air_diagonal_down','air_dash']);
export const CHARACTER_COSMETICS=Object.freeze([
  Object.freeze({id:'fluid-aube',rewardId:'s1-free-50',character:'fluid',label:'Fluid cosmétique complet · Aube',palette:0,preview:'assets/characters/fluid/fluid_idle.png',poses:Object.freeze([...CHARACTER_BASE_POSES,...CHARACTER_AIR_POSES])}),
  Object.freeze({id:'heavy-couronne',rewardId:'s1-premium-50',character:'heavy',label:'Heavy cosmétique complet · Couronne',palette:2,preview:'assets/characters/heavy/heavy_idle_clean.png',poses:CHARACTER_BASE_POSES})
]);
export function characterCosmetic(item){
  if(item?.type!=='skin')return null;
  // Stable reward IDs also recognize already claimed season-one level-50 rewards.
  return CHARACTER_COSMETICS.find(cosmetic=>cosmetic.rewardId===item.id)||null;
}
export function characterSpriteKey(cosmetic,pose){
  return cosmetic?.poses.includes(pose)?`${cosmetic.character}_${pose}`:null;
}
