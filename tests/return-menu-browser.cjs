const {chromium}=require('C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
  for(const viewport of [{width:1440,height:900},{width:844,height:390}]){
    const context=await browser.newContext({viewport,hasTouch:true}),page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.stack));
    await page.addInitScript(()=>{window.__testPads=[];navigator.getGamepads=()=>window.__testPads;});
    await page.goto('http://127.0.0.1:4173/?test=1');await page.waitForFunction(()=>window.__jetclash&&!document.querySelector('#start').disabled);
    if(viewport.width===1440){await page.locator('.mm-gear').click();await page.locator('[data-fullscreen]').click();await page.waitForFunction(()=>!!document.fullscreenElement);await page.locator('.mm-nav [data-route=home]').click();}
    for(let i=0;i<24;i++){
      // A result/menu can hide the pause overlay while the window is inactive.
      // Launch must explicitly release that stale pause, regardless of focus events.
      if(i%4===0)await page.evaluate(()=>__jetclash.setPaused(true));
      await page.locator('#mobile-play').click();const mode=['duel','teams','training'][i%3];await page.locator(`#mobile-${mode}`).click();
      const elapsed=await page.evaluate(()=>__jetclash.match.elapsed);
      await page.waitForFunction(before=>__jetclash.match.elapsed>before,elapsed);
      await page.evaluate(i=>{
        const m=__jetclash.match;for(let tick=0;tick<300;tick++)m.update(1/60,{axis:1,boost:tick%60<20,jump:tick%90===0});
        if(!m.training){m.state='PLAYING';m.score={player:i%2?0:2,bot:i%2?1:0};if(i%2){m.overtime=true;m.goal('bot');}else{m.remaining=0;m.update(1/60,{});}}
      },i);
      if(mode==='training')await page.locator('#leave-game').click();else{await page.locator('#result').waitFor({state:'visible'});await page.locator('#back-menu').click();}
      await page.locator('#mobile-play').waitFor({state:'visible'});
      await page.evaluate(i=>{window.__testPads=i%2?[{connected:true,mapping:'standard',index:0,id:'Test controller',axes:[0,0,0,0],buttons:Array.from({length:18},()=>({pressed:false,value:0}))}]:[];},i);
      await page.locator('.mm-nav [data-route=collection]').click();await page.locator('.mm-nav [data-route=home]').click();
      assert.equal(await page.evaluate(()=>__jetclash.match.state),'MENU');assert.deepEqual(errors,[]);
    }
    // One transient drawing failure previously stopped requestAnimationFrame forever.
    await page.locator('#mobile-play').click();await page.locator('#mobile-duel').click();
    await page.evaluate(()=>{const r=__jetclash.renderer,render=r.render;r.render=function(...args){r.render=render;throw Error('return-menu-test-transient-render');};});
    await page.waitForFunction(()=>__jetclash.match.elapsed>.2);
    assert.equal(errors.filter(e=>e.includes('return-menu-test-transient-render')).length,1);
    errors.splice(0);
    await page.locator('#leave-game').click();await page.locator('#mobile-play').click();await page.locator('#mobile-training').click();
    await page.waitForFunction(()=>__jetclash.match.elapsed>.2);assert.deepEqual(errors,[]);
    if(await page.evaluate(()=>!!document.fullscreenElement))await page.evaluate(()=>document.exitFullscreen());
    await page.evaluate(()=>{window.__testPads=[];});
    await page.locator('.touch-fullscreen').click();await page.waitForFunction(()=>document.fullscreenElement===document.documentElement);
    await page.locator('#leave-game').click();await page.locator('.mm-gear').click();await page.locator('[data-fullscreen]').click();await page.waitForFunction(()=>!document.fullscreenElement);
    await page.locator('.mm-nav [data-route=home]').click();await page.locator('#mobile-play').click();await page.locator('#mobile-duel').click();
    // Reproduce the old arena-only fullscreen path, then verify return leaves it.
    await page.evaluate(()=>document.querySelector('#game-shell').requestFullscreen());await page.waitForFunction(()=>document.fullscreenElement?.id==='game-shell');
    await page.evaluate(()=>{const m=__jetclash.match;m.state='PLAYING';m.score={player:2,bot:0};m.finish();});
    await page.locator('#back-menu').click();await page.waitForFunction(()=>!document.fullscreenElement);
    await page.locator('#mobile-play').click();await page.locator('#mobile-duel').click();await page.waitForFunction(()=>__jetclash.match.elapsed>.2);
    await page.evaluate(()=>{window.__testPads=[];window.savedFullscreen=document.documentElement.requestFullscreen;document.documentElement.requestFullscreen=()=>Promise.reject(Error('Fullscreen unavailable'));});
    await page.locator('.touch-fullscreen').click();await page.waitForFunction(()=>document.querySelector('.touch-notice').textContent.includes('non disponible'));
    await page.evaluate(()=>{document.documentElement.requestFullscreen=window.savedFullscreen;});
    assert.deepEqual(errors,[]);
    console.log(`24 return/relaunch cycles passed ${viewport.width}x${viewport.height}`);await context.close();
  }
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
