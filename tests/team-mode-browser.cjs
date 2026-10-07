const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,channel:'msedge'});try{
  for(const viewport of [{width:1280,height:720},{width:844,height:390},{width:568,height:320}]){
    const touch=viewport.width<1000,context=await browser.newContext({viewport,hasTouch:touch,isMobile:touch}),page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:4173/?test=1');await page.waitForFunction(()=>!document.querySelector('#start').disabled);
    const click=async selector=>touch?page.locator(selector).tap():page.locator(selector).click();
    await click('#mobile-play');assert.equal(await page.locator('#mobile-teams').count(),1);
    await click('[data-difficulty="elite"]');await click('#mobile-teams');
    await page.waitForFunction(()=>window.__jetclash.match.state==='PLAYING');
    assert.deepEqual(await page.evaluate(()=>{
      const m=window.__jetclash.match;return {mode:m.mode,players:m.players.length,bots:m.bots.length,blue:m.players.filter(p=>p.team==='player').length,red:m.players.filter(p=>p.team==='bot').length,difficulty:m.difficulty};
    }),{mode:'2v2',players:4,bots:3,blue:2,red:2,difficulty:'elite'});
    assert.equal(await page.locator('#team-player-name').textContent(),'BLEUS');assert.equal(await page.locator('#team-bot-name').textContent(),'ROUGES');assert.equal(await page.locator('#mode-label').textContent(),'MATCH 2V2');
    await page.evaluate(()=>window.startBots=window.__jetclash.match.bots.map(e=>e.body.x));
    await page.waitForFunction(()=>window.__jetclash.match.bots.every((entry,index)=>Math.abs(entry.body.x-window.startBots[index])>1));
    const x=await page.evaluate(()=>window.__jetclash.match.player.x);await page.keyboard.down('ArrowRight');await page.waitForTimeout(180);await page.keyboard.up('ArrowRight');
    assert.ok(await page.evaluate(x=>window.__jetclash.match.player.x>x,x));
    if(process.env.TEAM_SCREENSHOT_DIR&&viewport.width===1280){require('node:fs').mkdirSync(process.env.TEAM_SCREENSHOT_DIR,{recursive:true});await page.screenshot({path:require('node:path').join(process.env.TEAM_SCREENSHOT_DIR,'JetClash-2v2.png')});}
    if(touch){
      assert.equal(await page.evaluate(()=>window.__jetclash.match.players.every(p=>window.__jetclash.renderer.camera.project(p.x,p.y).visible)),true);
      assert.deepEqual(await page.evaluate(()=>{
        const b=document.querySelector('#leave-game').getBoundingClientRect(),r=document.querySelector('#hud').getBoundingClientRect();
        return b.left<r.right&&b.right>r.left&&b.top<r.bottom&&b.bottom>r.top;
      }),false);
    }
    await page.evaluate(async()=>{
      const {CONFIG:C}=await import('/src/config.js'),m=window.__jetclash.match;
      for(const entry of m.bots)Object.assign(entry.body,{x:600,y:400,vx:0,vy:0});
      m.lastTouch=m.player;Object.assign(m.ball,{x:C.goalRight+m.ball.r*C.goalEntryRadiusFactor+1,y:(C.goalTop+C.goalBottom)/2,vx:0,vy:0});
    });
    await page.waitForFunction(()=>window.__jetclash.match.state==='GOAL_SCORED');
    assert.equal(await page.locator('#score-player').textContent(),'1');assert.equal(await page.locator('#announcement').textContent(),'BUT POUR LES BLEUS !');
    await page.evaluate(async()=>{
      const {CONFIG:C}=await import('/src/config.js'),m=window.__jetclash.match;
      m.update(C.goalPause+.01);m.update(C.countdown+.01);m.remaining=C.step;m.update(C.step);
    });
    await page.locator('#result').waitFor({state:'visible'});assert.equal(await page.locator('#xp-earned').textContent(),'+160 XP');
    await click('#replay');assert.equal(await page.evaluate(()=>window.__jetclash.match.mode),'2v2');assert.equal(await page.evaluate(()=>window.__jetclash.match.players.length),4);
    assert.equal(await page.evaluate(()=>window.__jetclash.match.difficulty),'elite');
    await click('#leave-game');await page.locator('#mobile-menu').waitFor({state:'visible'});
    await click('#mobile-play');await click('#mobile-duel');assert.equal(await page.evaluate(()=>window.__jetclash.match.mode),'duel');assert.equal(await page.evaluate(()=>window.__jetclash.match.players.length),2);
    await click('#leave-game');await click('#mobile-play');await click('#mobile-training');assert.equal(await page.evaluate(()=>window.__jetclash.match.players.length),1);await click('#leave-game');
    assert.deepEqual(errors,[]);console.log(`2v2 navigateur OK ${viewport.width}x${viewport.height} : menu, 3 bots actifs, équipe alliée/adverse, commandes, but, score, XP, remise en jeu, rejeu et retour 1v1/entraînement.`);
    await context.close();
  }
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
