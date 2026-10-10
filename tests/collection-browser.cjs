const {chromium}=require('C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:844,height:390}]){
const context=await browser.newContext({viewport,isMobile:viewport.width<900,hasTouch:viewport.width<900});const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>navigator.getGamepads=()=>[]);await page.goto('http://127.0.0.1:4173/?test=1');await page.waitForFunction(()=>window.__jetclash&&!document.querySelector('#start').disabled);
await page.locator('.mm-nav [data-route=shop]').click();assert.equal(await page.locator('.collection-item').count(),5);assert.equal(await page.locator('[data-equip]').count(),0);
await page.locator('[data-item-color][data-palette="2"]').first().click();assert.equal(await page.evaluate(()=>Object.keys(__jetclash.match.profile.data.equipment).length),0);assert.equal(await page.evaluate(()=>Object.keys(__jetclash.match.profile.data.cosmeticColors).length),0);
await page.evaluate(()=>{const p=__jetclash.match.profile;p.pass.addXp(50000);p.pass.setPremium(true);for(let n=1;n<=50;n++)p.pass.claim(n,'premium');});
await page.locator('.mm-nav [data-route=shop]').click();
assert.equal(await page.locator('.collection-item').count(),5);
const ballId=await page.evaluate(()=>__jetclash.match.profile.collection.items().find(i=>i.type==='ball').id);
await page.locator(`[data-item-color="${ballId}"][data-palette="2"]`).click();
assert.equal(await page.locator(`[data-item-color="${ballId}"][data-palette="2"]`).getAttribute('aria-pressed'),'true');
assert.ok((await page.locator(`[data-item-color="${ballId}"]`).first().locator('..').locator('..').locator('img').getAttribute('style')).includes('hue-rotate(0deg)'));
await page.screenshot({path:`C:/Users/User/Documents/Codex/2026-10-08/e-cj-project-jet-clash/outputs/shop-colors-${viewport.width}x${viewport.height}.png`});
await page.locator('.mm-nav [data-route=collection]').click();
await page.locator('[data-crate-open="s1-premium-3"]').click();await page.waitForFunction(()=>document.querySelector('.collection-reveal').textContent.includes('Caisse ouverte'));
assert.ok(await page.locator('[data-crate-open="s1-premium-3"]').isDisabled());
const ids=await page.evaluate(()=>{const p=__jetclash.match.profile;return ['skin','trail','ball','banner','explosion'].map(type=>p.collection.items().find(i=>i.type===type).id);});
for(const id of ids)await page.locator(`[data-equip="${id}"]`).click();
assert.equal(await page.locator('[data-unequip]').count(),5);
for(const selector of ['.mm-header','.mm-nav']){const rect=await page.locator(selector).boundingBox();assert.ok(rect.y>=0&&rect.y+rect.height<=viewport.height+1);}
await page.locator('[data-inventory-filter=crate]').click();assert.equal(await page.locator('[data-equip]').count(),0);await page.locator('[data-inventory-filter=all]').click();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
await page.screenshot({path:`C:/Users/User/Documents/Codex/2026-10-08/e-cj-project-jet-clash/outputs/collection-${viewport.width}x${viewport.height}.png`});
await page.reload();await page.waitForFunction(()=>window.__jetclash&&!document.querySelector('#start').disabled);assert.equal(await page.evaluate(()=>Object.keys(__jetclash.match.profile.data.equipment).length),5);assert.equal(await page.evaluate(()=>__jetclash.match.profile.collection.equipped('ball').palette),2);
await page.locator('#mobile-play').click();await page.locator('#mobile-training').click();await page.waitForTimeout(500);
await page.evaluate(()=>{const {match:m,renderer:r}=__jetclash;const filters=[],old=r.ctx.drawImage.bind(r.ctx);r.ctx.drawImage=(...args)=>{filters.push(r.ctx.filter);return old(...args);};r.render(m);r.ctx.drawImage=old;if(!filters.some(f=>f.includes('hue-rotate')))throw Error('Cosmetics not rendered');if(!r.cosmeticTrails.get(m.player)?.length)throw Error('Missing equipped trail');});
assert.deepEqual(errors,[]);console.log(`Collection verified ${viewport.width}x${viewport.height}`);await context.close();
}
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
