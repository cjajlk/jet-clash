const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
(async()=>{
  const browser=await chromium.launch({headless:true,channel:'msedge'});
  try{
    for(const viewport of [{width:667,height:375},{width:844,height:390},{width:1024,height:768},{width:390,height:844}]){
      const context=await browser.newContext({viewport,isMobile:true,hasTouch:true,deviceScaleFactor:1}),page=await context.newPage(),errors=[];
      page.on('pageerror',e=>errors.push(e.message));
      page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('/favicon.ico'))errors.push(`${r.status()} ${r.url()}`);});
      await page.addInitScript(()=>{if(location.protocol.startsWith('http')&&!localStorage.getItem('jetclash.etape2.profile.v1'))localStorage.setItem('jetclash.etape2.profile.v1',JSON.stringify({xp:1250,completed:[]}));});
      await page.goto('http://127.0.0.1:4173/?test=1');await page.waitForFunction(()=>!document.querySelector('#start').disabled);
      const root=page.locator('#mobile-menu');await root.waitFor({state:'visible'});
      assert.equal(await root.getAttribute('data-route'),'home');assert.equal(await page.locator('#touch-controls').isVisible(),false);
      assert.match(await page.locator('[data-profile-level]').textContent(),/Niveau 2.*250/);
      const saved=await page.evaluate(()=>localStorage.getItem('jetclash.etape2.profile.v1'));
      const fits=async()=>{
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
        for(const selector of ['.mm-header','.mm-nav']){const b=await page.locator(selector).boundingBox();assert.ok(b.x>=0&&b.y>=0&&b.x+b.width<=viewport.width+1&&b.y+b.height<=viewport.height+1);}
        assert.ok(await page.evaluate(()=>{const r=document.querySelector('.mm-body').getBoundingClientRect(),n=document.querySelector('.mm-nav').getBoundingClientRect();return r.bottom<=n.top;}));
      };
      await fits();const fluid=await page.locator('#mobile-fluid').boundingBox(),play=await page.locator('#mobile-play').boundingBox();
      assert.ok(fluid.height>=150&&play.height>=44);assert.ok(fluid.x+fluid.width<=play.x||play.x+play.width<=fluid.x||fluid.y+fluid.height<=play.y||play.y+play.height<=fluid.y);
      await page.screenshot({path:`work/menu-mobile-home-${viewport.width}x${viewport.height}.png`});
      for(const route of ['collection','shop','pass','challenges','home']){
        await page.locator(`.mm-nav [data-route="${route}"]`).tap();assert.equal(await root.getAttribute('data-route'),route);
        assert.equal(await page.locator(`.mm-nav [data-route="${route}"]`).getAttribute('aria-current'),'page');await fits();
        if(route==='collection'){
          assert.equal(await page.locator('[data-category]').count(),9);await page.locator('[data-category="banners"]').tap();assert.match(await page.locator('.mm-preview h3').first().textContent(),/Bannières/);
          await page.locator('[data-category="fluid"]').tap();assert.match(await page.locator('.mm-preview h3').first().textContent(),/Fluid équipé/);
        }
        if(route==='pass'){assert.equal(await page.locator('.sp-level').count(),50);assert.equal(await page.locator('.sp-card').count(),100);}
        await page.screenshot({path:`work/menu-mobile-${route}-${viewport.width}x${viewport.height}.png`});
      }
      await page.locator('.mm-gear').tap();assert.equal(await root.getAttribute('data-route'),'options');await page.locator('[data-back]').tap();assert.equal(await root.getAttribute('data-route'),'home');
      await page.locator('.mm-gear').tap();assert.ok(await page.locator('select[data-setting]').count()>0);await page.locator('[data-back]').tap();
      await page.locator('.mm-gear').tap();await page.locator('select[data-action="movementStick"]').selectOption('left');await page.locator('select[data-action="layout"]').selectOption('mirrored');await page.locator('[data-back]').tap();
      await page.reload();await page.waitForFunction(()=>!document.querySelector('#start').disabled);
      await page.locator('.mm-gear').tap();assert.equal(await page.locator('select[data-action="movementStick"]').inputValue(),'left');assert.equal(await page.locator('select[data-action="layout"]').inputValue(),'mirrored');await page.locator('[data-back]').tap();
      assert.equal(await page.evaluate(()=>localStorage.getItem('jetclash.etape2.profile.v1')),saved);
      await page.locator('#mobile-play').tap();assert.equal(await root.getAttribute('data-route'),'modes');
      await page.locator('[data-difficulty="easy"]').tap();await page.screenshot({path:`work/menu-mobile-modes-${viewport.width}x${viewport.height}.png`});
      await page.locator('#mobile-training').tap();await page.waitForFunction(()=>window.__jetclash.match.state==='PLAYING'&&window.__jetclash.match.training===true);
      assert.equal(await page.evaluate(()=>window.__jetclash.match.bot),null);assert.equal(await page.locator('#timer').isHidden(),true);await page.locator('#back-menu').tap();await root.waitFor({state:'visible'});
      await page.locator('#mobile-duel').tap();await page.waitForFunction(()=>window.__jetclash.match.state!=='MENU');
      assert.equal(await root.isVisible(),false);assert.equal(await page.evaluate(()=>window.__jetclash.match.difficulty),'easy');
      if(viewport.height>viewport.width){await page.locator('#touch-rotate').waitFor({state:'visible'});assert.equal(await page.locator('#touch-controls').isVisible(),false);await page.setViewportSize({width:844,height:390});}
      await page.waitForFunction(()=>window.__jetclash.match.state==='PLAYING');assert.ok(await page.locator('#touch-controls').isVisible());assert.ok(await page.evaluate(()=>window.__jetclash.renderer.camera.zoom>1));
      await page.evaluate(()=>{const m=window.__jetclash.match;m.score.player=1;m.remaining=.01;});await page.waitForFunction(()=>window.__jetclash.match.state==='POST_MATCH');
      await page.locator('#back-menu').tap();await root.waitFor({state:'visible'});assert.equal(await root.getAttribute('data-route'),'home');
      assert.match(await page.locator('[data-profile-level]').textContent(),/Niveau 2.*410/);assert.equal(await page.locator('#touch-controls').isVisible(),false);
      assert.deepEqual(errors,[]);console.log(`Menu mobile ${viewport.width}x${viewport.height} PASS: profile, 5 tabs, categories, pass preview, options, duel, return, no gameplay controls in menu.`);await context.close();
    }
    const page=await browser.newPage({viewport:{width:1440,height:1080}});await page.goto('http://127.0.0.1:4173/?test=1');await page.waitForFunction(()=>!document.querySelector('#start').disabled);
    assert.equal(await page.locator('#mobile-menu').isVisible(),true);await page.click('#mobile-play');await page.click('#mobile-duel');await page.waitForFunction(()=>window.__jetclash.match.state==='PLAYING');assert.equal(await page.evaluate(()=>window.__jetclash.renderer.camera.zoom),1);console.log('Desktop menu/gameplay 1440x1080 PASS: shared menu and original camera.');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
