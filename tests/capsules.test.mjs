import test from 'node:test';
import assert from 'node:assert/strict';
import {access} from 'node:fs/promises';
import {ProfileStore} from '../src/profile-store.js';
import {CAPSULE_CATALOG,CAPSULE_COLORS,capsuleImage} from '../src/capsules.js';
function fixture(coins=1000){let raw;const storage={getItem:()=>raw,setItem:(_k,v)=>raw=v};const p=new ProfileStore(storage);p.data.coins=coins;return {p,storage};}
test('only complete categories are sold and all capsule/model/color assets exist',async()=>{
  assert.deepEqual(CAPSULE_CATALOG.map(c=>c.id),['noyau','propulsion','impact','style']);
  for(const c of CAPSULE_CATALOG){await access(c.image);for(const m of c.models)for(let palette=0;palette<CAPSULE_COLORS.length;palette++)await access(capsuleImage(m,palette));}
});
test('buy deducts exactly once; unopened capsule survives reload and cannot overdraw balance',()=>{
  const {p,storage}=fixture(200),crate=p.collection.buyCapsule('noyau');assert.ok(crate);assert.equal(p.data.coins,0);assert.equal(crate.pricePaid,200);
  assert.equal(p.collection.buyCapsule('noyau'),null);assert.equal(p.collection.buyCapsule('armure'),null);
  const reload=new ProfileStore(storage);assert.deepEqual(reload.collection.item(crate.id),crate);assert.equal(reload.data.coins,0);
  assert.ok(reload.collection.open(crate.id,()=>0));assert.equal(reload.collection.open(crate.id),null);
});
test('every model can drop and equip with all four authored colors, retaining Pass and balances',()=>{
  for(const category of CAPSULE_CATALOG)for(let i=0;i<category.models.length;i++){
    const {p,storage}=fixture();p.pass.addXp(50000);p.pass.claim(3,'free');const before=structuredClone(p.data.passInventory),xp=p.data.xp;
    const crate=p.collection.buyCapsule(category.id),reward=p.collection.open(crate.id,()=>i/category.models.length);
    assert.equal(reward.id,category.models[i].id);assert.equal(reward.duplicate,false);assert.equal(reward.refund,0);assert.equal(p.data.coins,800);
    assert.ok(p.collection.equip(reward.id));for(let palette=0;palette<4;palette++){assert.ok(p.collection.setColor(reward.id,palette));assert.equal(p.collection.equipped(category.type).palette,palette);}
    const reload=new ProfileStore(storage);assert.equal(reload.collection.equipped(category.type).id,reward.id);assert.equal(reload.collection.equipped(category.type).palette,3);assert.equal(reload.collection.open(crate.id),null);
    assert.deepEqual(p.data.passInventory,before);assert.equal(p.data.xp,xp);
  }
});
test('duplicate refunds one quarter of price paid once without adding another object or changing color',()=>{
  const {p,storage}=fixture();let crate=p.collection.buyCapsule('noyau'),reward=p.collection.open(crate.id,()=>0);p.collection.equip(reward.id);p.collection.setColor(reward.id,2);
  crate=p.collection.buyCapsule('noyau');reward=p.collection.open(crate.id,()=>0);assert.equal(reward.duplicate,true);assert.equal(reward.refund,50);assert.equal(p.data.coins,650);
  assert.equal(p.collection.items().filter(i=>i.id===reward.id).length,1);assert.equal(p.collection.equipped('ball').palette,2);
  assert.equal(p.collection.open(crate.id,()=>0),null);assert.equal(p.collection.openCapsule(crate,()=>0),null);assert.equal(p.data.coins,650);
  const reload=new ProfileStore(storage);assert.equal(reload.collection.open(crate.id,()=>0),null);assert.equal(reload.data.coins,650);
});
test('invalid balance, category, random and unowned equipment never grants a reward or charges',()=>{
  for(const coins of [-1,199,1.5,NaN,Infinity,'1000']){const {p}=fixture(coins);assert.equal(p.collection.buyCapsule('noyau'),null);assert.equal(p.collection.items().length,0);}
  const {p}=fixture();assert.equal(p.collection.buyCapsule('missing'),null);assert.equal(p.collection.equip('capsule-noyau-epine'),false);
  const crate=p.collection.buyCapsule('noyau');for(const v of [-1,1,NaN,Infinity])assert.equal(p.collection.open(crate.id,()=>v),null);
  assert.equal(Object.hasOwn(p.data.openedCrates,crate.id),false);assert.equal(p.data.coins,800);assert.equal(p.collection.items().length,1);
});
