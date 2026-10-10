const {chromium}=require('C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const output='C:/Users/User/AppData/Local/Temp/jetclash-cosmetic-audit';fs.mkdirSync(output,{recursive:true});
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
  for(const viewport of [{width:1440,height:900},{width:800,height:600},{width:390,height:844},{width:844,height:390}]){
    const mobile=viewport.width===390||viewport.height===390,context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile}),page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('/favicon.ico'))errors.push(`${r.status()} ${r.url()}`);});
    await page.addInitScript(()=>navigator.getGamepads=()=>[]);await page.goto('http://127.0.0.1:4173/?test=1');await page.waitForFunction(()=>window.__jetclash&&!document.querySelector('#start').disabled);
    await page.evaluate(()=>{const p=__jetclash.match.profile;p.pass.addXp(50000);p.pass.setPremium(true);});
    await page.locator('.mm-nav [data-route=pass]').click();await page.locator('.sp-track').evaluate(el=>el.scrollLeft=el.scrollWidth);
    const last=page.locator('.sp-level').last();assert.equal(await last.locator('.sp-reward').count(),2);assert.match(await last.locator('.sp-reward').first().getAttribute('src'),/fluid_idle/);assert.match(await last.locator('.sp-reward').last().getAttribute('src'),/heavy_idle_clean/);
    await page.evaluate(()=>{
      const images=__jetclash.renderer.images;
      for(const [key,image] of Object.entries(images))if(key.startsWith('fluid_air_')||key==='fluid_ceiling'){
        if(!/fluid_(jump|jetpack)\.png$/.test(image.src))throw Error(`Inconsistent aerial artwork ${key}`);
      }
    });
    for(const track of ['free','premium'])await page.locator(`[data-pass-claim="50"][data-pass-track="${track}"]`).click();
    await page.locator('.mm-nav [data-route=collection]').click();await page.locator('[data-inventory-filter=skin]').click();assert.equal(await page.locator('.collection-item').count(),2);
    for(const [track,name] of [['premium','heavy'],['free','fluid']]){
      const id=`s1-${track}-50`;await page.locator(`[data-equip="${id}"]`).click();await page.locator(`[data-item-color="${id}"][data-palette="2"]`).click();
      await page.locator('.mm-nav [data-route=home]').click();assert.match(await page.locator('#mobile-fluid').getAttribute('src'),new RegExp(name));
      await page.reload();await page.waitForFunction(()=>window.__jetclash&&!document.querySelector('#start').disabled);assert.equal(await page.evaluate(()=>__jetclash.match.profile.collection.equipped('skin').id),id);assert.equal(await page.evaluate(()=>__jetclash.match.profile.collection.equipped('skin').palette),2);
      await page.locator('#mobile-play').click();await page.locator('#mobile-training').click();
      await page.evaluate(name=>{
        const {match:m,renderer:r,setPaused}=__jetclash;setPaused(true);const fit=r.fit.bind(r),sprite=r.drawSprite.bind(r);
        for(const mode of ['duel','2v2','training']){
          m.start(mode);
          for(const state of [{grounded:true,boosting:false,vx:0},{grounded:true,boosting:false,vx:100},{grounded:false,boosting:false,vx:0},{grounded:false,boosting:true,vx:0}]){
            Object.assign(m.player,state);const before=JSON.stringify([m.player,m.bot,m.ball]),draws=[];r.fit=(key,...args)=>{draws.push(key);return fit(key,...args);};r.drawSprite=(key,...args)=>{draws.push(key);return sprite(key,...args);};r.render(m);r.fit=fit;r.drawSprite=sprite;
            if(!draws[0].startsWith(name+'_'))throw Error(`Wrong human sprite ${draws[0]}`);
            if(JSON.stringify([m.player,m.bot,m.ball])!==before)throw Error('Cosmetic rendering mutated gameplay');
            if(m.player.skin!=='fluid')throw Error('Cosmetic changed player mechanics');
            if(mode!=='training'&&!draws.slice(1).some(key=>key.startsWith('heavy_')))throw Error('Bot skin changed');
          }
        }
      },name);
      fs.writeFileSync(`${output}/pass50-${name}-${viewport.width}x${viewport.height}-canvas.png`,Buffer.from(await page.locator('canvas').evaluate(c=>c.toDataURL().split(',')[1]),'base64'));
      await page.screenshot({path:`${output}/pass50-${name}-${viewport.width}x${viewport.height}.png`});
      await page.evaluate(()=>__jetclash.match.menu());await page.locator('.mm-nav [data-route=collection]').click();await page.locator('[data-inventory-filter=skin]').click();
    }
    await page.locator('[data-unequip=skin]').click();assert.equal(await page.evaluate(()=>__jetclash.match.profile.collection.equipped('skin')),undefined);
    await page.evaluate(()=>{const p=__jetclash.match.profile;p.data.coins=400;p.save();});await page.locator('.mm-nav [data-route=shop]').click();assert.equal(await page.locator('[data-capsule-buy]').count(),4);await page.locator('[data-capsule-buy=noyau]').click();assert.equal(await page.evaluate(()=>__jetclash.match.profile.data.coins),200);
    await page.locator('[data-show-capsules]').click();await page.locator('[data-crate-open="purchased-capsule-1"]').click();await page.locator('.crate-opening.is-revealed').waitFor();await page.locator('[data-opening-close]').click();assert.equal(await page.evaluate(()=>__jetclash.match.profile.data.passInventory.length),2);
    for(const selector of ['.mm-header','.mm-nav']){const rect=await page.locator(selector).boundingBox();assert.ok(rect.y>=0&&rect.y+rect.height<=viewport.height+1);}assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);
    console.log(`Pass level-50 cosmetics verified ${viewport.width}x${viewport.height}`);await context.close();
  }
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
