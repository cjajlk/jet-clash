const {chromium}=require('C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
const output='C:/Users/User/Documents/Codex/2026-10-08/e-cj-project-jet-clash/outputs';
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
  for(const viewport of [{width:1440,height:900},{width:800,height:600},{width:390,height:844},{width:844,height:390}]){
    const context=await browser.newContext({viewport,isMobile:viewport.width===390||viewport.height===390,hasTouch:viewport.width===390||viewport.height===390});const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('/favicon.ico'))errors.push(`${r.status()} ${r.url()}`);});
    await page.addInitScript(()=>navigator.getGamepads=()=>[]);await page.goto('http://127.0.0.1:4173/?test=1');await page.waitForFunction(()=>window.__jetclash&&!document.querySelector('#start').disabled);
    await page.locator('.mm-nav [data-route=shop]').click();assert.equal(await page.locator('[data-capsule-buy]').count(),4);assert.equal(await page.locator('[data-capsule-buy]:disabled').count(),4);assert.equal(await page.locator('[data-capsule-buy=armure]').count(),0);
    await page.evaluate(()=>{const p=__jetclash.match.profile;p.data.coins=1000;p.save();const open=p.collection.open.bind(p.collection);p.collection.open=id=>open(id,()=>0);});
    await page.waitForFunction(()=>!document.querySelector('[data-capsule-buy=noyau]').disabled);
    for(const category of ['noyau','propulsion','impact','style'])await page.locator(`[data-capsule-buy=${category}]`).click();
    assert.equal(await page.evaluate(()=>__jetclash.match.profile.data.coins),200);
    await page.locator('details summary').first().click();assert.ok(await page.locator('.shop-content').first().isVisible());
    await page.screenshot({path:`${output}/shop-capsules-${viewport.width}x${viewport.height}.png`});
    await page.locator('[data-show-capsules]').click();assert.equal(await page.locator('[data-inventory-filter=crate]').getAttribute('aria-pressed'),'true');
    for(let sequence=1;sequence<=4;sequence++){
      await page.locator(`[data-crate-open="purchased-capsule-${sequence}"]`).click();await page.locator('.crate-opening.is-revealed').waitFor();assert.ok(await page.locator('.crate-opening-reward').isVisible());await page.locator('[data-opening-equip]').click();
    }
    for(const id of ['capsule-noyau-epine','capsule-propulsion-aile','capsule-impact-fracture','capsule-style-aura'])await page.locator(`[data-item-color="${id}"][data-palette="2"]`).click();
    await page.locator('.mm-nav [data-route=shop]').click();await page.locator('[data-capsule-buy=noyau]').click();assert.equal(await page.evaluate(()=>__jetclash.match.profile.data.coins),0);
    await page.locator('.mm-nav [data-route=collection]').click();await page.locator('[data-crate-open="purchased-capsule-5"]').click();await page.locator('.crate-opening.is-revealed').waitFor();assert.equal(await page.locator('.crate-opening h2').textContent(),'Déjà obtenu !');assert.match(await page.locator('.crate-opening-description').textContent(),/50 Coins/);await page.locator('[data-opening-close]').click();
    assert.equal(await page.evaluate(()=>__jetclash.match.profile.data.coins),50);assert.ok(await page.locator('[data-crate-open="purchased-capsule-5"]').isDisabled());
    for(const selector of ['.mm-header','.mm-nav']){const rect=await page.locator(selector).boundingBox();assert.ok(rect.y>=0&&rect.y+rect.height<=viewport.height+1);}assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await page.reload();await page.waitForFunction(()=>window.__jetclash&&!document.querySelector('#start').disabled);
    assert.equal(await page.evaluate(()=>__jetclash.match.profile.data.coins),50);assert.equal(await page.evaluate(()=>__jetclash.match.profile.collection.equipped('ball').palette),2);assert.equal(await page.evaluate(()=>__jetclash.match.profile.data.capsuleInventory.filter(i=>i.type!=='crate').length),4);
    await page.evaluate(()=>{
      const {match:m,renderer:r,setPaused}=__jetclash;setPaused(true);const fit=r.fit.bind(r);
      for(const mode of ['duel','2v2','training']){
        m.start(mode);m.player.boosting=true;m.player.vx=100;m.ball.flash=.12;
        const before=JSON.stringify([m.player,m.ball]),draws=[];r.fit=(key,...args)=>{draws.push(key);return fit(key,...args);};r.render(m);r.fit=fit;
        for(const id of ['capsule-noyau-epine','capsule-propulsion-aile','capsule-impact-fracture','capsule-style-aura'])if(!draws.includes(`${id}-2`))throw Error(`Missing rendered ${id} in ${mode}`);
        if(JSON.stringify([m.player,m.ball])!==before)throw Error('Rendering changed gameplay');
      }
    });
    await page.screenshot({path:`${output}/capsules-gameplay-${viewport.width}x${viewport.height}.png`});assert.deepEqual(errors,[]);console.log(`Capsules verified ${viewport.width}x${viewport.height}`);await context.close();
  }
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
