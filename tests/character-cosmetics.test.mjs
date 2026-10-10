import test from 'node:test';
import assert from 'node:assert/strict';
import {access} from 'node:fs/promises';
import {CHARACTER_COSMETICS,CHARACTER_AIR_POSES,characterCosmetic,characterSpriteKey} from '../src/character-cosmetics.js';
import {ProfileStore} from '../src/profile-store.js';
import {PASS_LEVELS} from '../src/season-pass.js';
import {Renderer,coherentAirVisual} from '../src/renderer.js';
import {Match} from '../src/match.js';
function fixture(){let raw;const storage={getItem:()=>raw,setItem:(_k,v)=>raw=v};return {p:new ProfileStore(storage),storage};}
test('wolf aerial artwork follows feet orientation without changing player state',()=>{
  for(const [footX,footY,angle] of [[0,1,0],[-1,0,Math.PI/2],[1,0,-Math.PI/2],[0,-1,-Math.PI]]){
    const player={footX,footY,facing:1,grounded:false};const before=structuredClone(player);
    assert.ok(Math.abs(coherentAirVisual(player).rotation-angle)<1e-9);assert.deepEqual(player,before);
  }
  assert.equal(coherentAirVisual({contactSurface:'ceiling',facing:-1}).rotation,Math.PI);
  assert.equal(coherentAirVisual({facing:-1}).flip,true);
});
test('level 50 uses two audited existing full render sets and actual previews',async()=>{
  assert.equal(PASS_LEVELS.length,50);
  for(const c of CHARACTER_COSMETICS){assert.ok(c.poses.length===14||c.poses.length===6);await access(c.preview);for(const pose of c.poses){assert.equal(characterSpriteKey(c,pose),`${c.character}_${pose}`);await access(`assets/characters/${c.character}/${c.character}_${pose}.png`);}const r=PASS_LEVELS[49][c.character==='fluid'?'free':'premium'];assert.equal(r.characterCosmetic,c.id);assert.equal(characterCosmetic(r),c);}
  assert.equal(characterCosmetic({type:'skin',id:'unowned',characterCosmetic:'heavy-couronne'}),null);
  for(const pose of CHARACTER_AIR_POSES)assert.equal(characterSpriteKey(CHARACTER_COSMETICS[1],pose),null);
});
test('level and Premium locks, unique claims, equipment colors and persistence remain intact',()=>{
  const {p,storage}=fixture();p.pass.addXp(49000);assert.equal(p.pass.claim(50,'free'),false);p.pass.addXp(1000);assert.equal(p.pass.claim(50,'free'),true);assert.equal(p.pass.claim(50,'free'),false);assert.equal(p.pass.claim(50,'premium'),false);p.pass.setPremium(true);assert.equal(p.pass.claim(50,'premium'),true);
  const before=[p.data.xp,p.data.coins,p.data.tokens,p.data.seasonXp];assert.ok(p.collection.equip('s1-premium-50'));assert.equal(characterCosmetic(p.collection.equipped('skin')).character,'heavy');assert.ok(p.collection.setColor('s1-premium-50',3));
  const reload=new ProfileStore(storage);assert.equal(characterCosmetic(reload.collection.equipped('skin')).character,'heavy');assert.equal(reload.collection.equipped('skin').palette,3);assert.equal(reload.data.passInventory.length,2);assert.deepEqual([reload.data.xp,reload.data.coins,reload.data.tokens,reload.data.seasonXp],before);
  reload.collection.unequip('skin');assert.equal(reload.collection.equipped('skin'),undefined);
});
test('already claimed old level-50 rewards acquire presentation metadata without changing stored inventory',()=>{
  const {p,storage}=fixture();p.data.pass.claimed=['s1-free-50','s1-premium-50'];p.data.passInventory=p.data.pass.claimed.map(id=>({id,type:'skin',label:'Style exclusif Saison 1',season:1,prepared:true}));p.data.equipment.skin='s1-premium-50';p.data.cosmeticColors['s1-premium-50']=1;p.save();
  const saved=structuredClone(p.data.passInventory),reload=new ProfileStore(storage);assert.equal(characterCosmetic(reload.collection.equipped('skin')).character,'heavy');assert.equal(reload.collection.equipped('skin').palette,1);assert.deepEqual(reload.data.passInventory,saved);assert.equal(reload.pass.claim(50,'premium'),false);
});
test('Heavy cosmetic changes only human sprite selection; bots and physical bodies are untouched',()=>{
  const {p}=fixture();p.pass.addXp(50000);p.pass.setPremium(true);p.pass.claim(50,'premium');p.collection.equip('s1-premium-50');const m=new Match(p);m.start('duel');
  const noop=()=>{},ctx=new Proxy({createLinearGradient:()=>({addColorStop:noop})},{get:(o,k)=>o[k]??noop,set:(o,k,v)=>(o[k]=v,true)}),r=new Renderer({getContext:()=>ctx}),draws=[];r.fit=(key)=>draws.push(key);r.drawSprite=(key)=>draws.push(key);
  for(const state of [{grounded:true,boosting:false,vx:0},{grounded:true,boosting:false,vx:100},{grounded:false,boosting:false,vx:0},{grounded:false,boosting:true,vx:0}]){Object.assign(m.player,state);const before=structuredClone([m.player,m.bot,m.ball]);draws.length=0;r.render(m);const pose=state.boosting?'jetpack':!state.grounded?'jump':state.vx?'sprint':'walk';assert.ok(draws.includes(`heavy_${pose}`));assert.ok(draws.includes('heavy_walk'));assert.deepEqual([m.player,m.bot,m.ball],before);assert.equal(m.player.skin,'fluid');}
});
test('equipping either cosmetic has no effect on training simulation, inputs or ball physics',()=>{
  for(const track of ['free','premium']){const {p}=fixture(),baseline=new ProfileStore({getItem:()=>null,setItem:()=>{}});p.pass.addXp(50000);p.pass.setPremium(true);p.pass.claim(50,track);p.collection.equip(`s1-${track}-50`);const a=new Match(p),b=new Match(baseline);a.start('training');b.start('training');for(let i=0;i<600;i++){const input={axis:i%180<90?1:-1,jump:i%70===0,boost:i%60<20,rotate:i%120<10,aimX:1,aimY:0,shoot:false};a.update(1/60,input);b.update(1/60,input);assert.deepEqual(a.player,b.player);assert.deepEqual(a.ball,b.ball);}}
});
