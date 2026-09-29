const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');fs.mkdirSync('work',{recursive:true});
(async()=>{
  const browser=await chromium.launch({headless:true,channel:'msedge'});
  try{
    for(const viewport of [{width:1280,height:720},{width:1440,height:900},{width:1920,height:1080},{width:1440,height:1080}]){
      const context=await browser.newContext({viewport}),page=await context.newPage(),errors=[];
      page.on('pageerror',e=>errors.push(e.message));
      page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('/favicon.ico'))errors.push(`${r.status()} ${r.url()}`);});
      await page.goto('http://127.0.0.1:4173/?test=1');await page.waitForFunction(()=>!document.querySelector('#start').disabled);
      const root=page.locator('#mobile-menu');await root.waitFor({state:'visible'});
      const fits=async()=>assert.deepEqual(await page.evaluate(()=>{
        const bad=[];if(document.documentElement.scrollWidth>innerWidth||document.documentElement.scrollHeight>innerHeight)bad.push('page overflow');
        const body=document.querySelector('.mm-body').getBoundingClientRect(),nav=document.querySelector('.mm-nav').getBoundingClientRect();
        if(body.left<nav.right-1&&body.bottom>nav.top+1)bad.push('navigation overlap');
        for(const el of document.querySelectorAll('.mm-header,.mm-nav,.mm-body,.mm-page-heading,.mm-preview,.mm-selected-reward,.mm-card,#mobile-play,#mobile-duel')){
          const b=el.getBoundingClientRect();if(b.left<0||b.top<0||b.right>innerWidth+1||b.bottom>innerHeight+1)bad.push(el.className||el.id);
        }return bad;
      }),[]);
      await fits();assert.ok((await page.locator('#mobile-fluid').boundingBox()).height>400);assert.ok((await page.locator('#mobile-play').boundingBox()).height>=70);
      const fluid=await page.locator('#mobile-fluid').boundingBox(),play=await page.locator('#mobile-play').boundingBox();assert.ok(fluid.x+fluid.width<=play.x);
      const saved=await page.evaluate(()=>localStorage.getItem('jetclash.etape2.profile.v1'));
      for(const route of ['home','collection','shop','pass','challenges']){
        await page.locator(`.mm-nav [data-route="${route}"]`).click();assert.equal(await root.getAttribute('data-route'),route);await fits();
        if(route==='collection'){assert.equal(await page.locator('[data-category]').count(),9);await page.locator('[data-category="heavy"]').click();assert.match(await page.locator('.mm-preview h3').textContent(),/Heavy/);}
        if(route==='pass'){await page.locator('[data-reward="3"]').click();assert.match(await page.locator('.mm-selected-reward strong').textContent(),/Bannière/);assert.ok(await page.locator('.mm-selected-art').isVisible());assert.ok(await page.locator('.mm-selected-reward button').isDisabled());}
        await page.screenshot({path:`work/menu-desktop-${route}-${viewport.width}x${viewport.height}.png`});
      }
      await page.locator('.mm-gear').click();assert.equal(await root.getAttribute('data-route'),'options');await fits();await page.locator('[data-back]').click();assert.equal(await root.getAttribute('data-route'),'challenges');
      // Resizing must retain the same DOM instance, route, selection and profile.
      await page.locator('.mm-nav [data-route="collection"]').click();await page.locator('[data-category="banners"]').click();
      await page.evaluate(()=>window.menuBeforeResize=document.querySelector('#mobile-menu'));
      await page.setViewportSize({width:844,height:390});assert.equal(await root.getAttribute('data-route'),'collection');assert.equal(await page.locator('[data-category="banners"]').getAttribute('aria-pressed'),'true');
      assert.ok(await page.evaluate(()=>document.querySelector('.mm-nav').getBoundingClientRect().top>=document.querySelector('.mm-body').getBoundingClientRect().bottom));
      await page.setViewportSize(viewport);await fits();assert.ok(await page.evaluate(()=>window.menuBeforeResize===document.querySelector('#mobile-menu')));
      assert.equal(await page.evaluate(()=>localStorage.getItem('jetclash.etape2.profile.v1')),saved);
      await page.locator('.mm-nav [data-route="home"]').click();await page.click('#mobile-play');await fits();await page.click('[data-difficulty="easy"]');await page.click('#mobile-duel');
      await page.waitForFunction(()=>window.__jetclash.match.state==='PLAYING');assert.equal(await root.isVisible(),false);assert.equal(await page.evaluate(()=>window.__jetclash.renderer.camera.zoom),1);assert.equal(await page.evaluate(()=>window.__jetclash.match.difficulty),'easy');
      await page.evaluate(()=>{const m=window.__jetclash.match;m.score.player=1;m.remaining=.01;});await page.waitForFunction(()=>window.__jetclash.match.state==='POST_MATCH');await page.click('#back-menu');await root.waitFor({state:'visible'});assert.equal(await root.getAttribute('data-route'),'home');await fits();
      assert.deepEqual(errors,[]);console.log(`Desktop ${viewport.width}x${viewport.height} PASS: all destinations, shared state on resize, duel, return, bounds, assets and console.`);await context.close();
    }
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
