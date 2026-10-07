const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
(async()=>{
  const browser=await chromium.launch({headless:true,channel:'msedge'});
  try{
    for(const viewport of [{width:1280,height:720},{width:844,height:390},{width:568,height:320}]){
      const touch=viewport.width<1000,context=await browser.newContext({viewport,hasTouch:touch,isMobile:touch}),page=await context.newPage(),errors=[];
      page.on('pageerror',error=>errors.push(error.message));
      await page.goto('http://127.0.0.1:4173/?test=1');await page.waitForFunction(()=>!document.querySelector('#start').disabled);
      for(const mode of ['duel','2v2','training']){
        await page.locator('#mobile-play').click();await page.locator(`#mobile-${mode==='2v2'?'teams':mode}`).click();
        const results=await page.evaluate(async()=>{
          const g=window.__jetclash,m=g.match,{CONFIG:C}=await import('/src/config.js'),{goalEntryDepth}=await import('/src/goals.js');
          g.setPaused(true);document.querySelector('#pause').hidden=true;const results=[];
          for(const side of ['left','right']){
            const left=side==='left',line=left?C.goalLeft:C.goalRight,sign=left?-1:1,scorer=left?'bot':'player';
            m.prepare();m.state='PLAYING';for(const e of m.bots)Object.assign(e.body,{x:640,y:400,vx:0,vy:0});
            const score={...m.score};
            for(const y of [170,330]){
              Object.assign(m.ball,{x:line+sign*(goalEntryDepth(m.ball.r)+1),y,vx:0,vy:0});m.update(C.step);
              results.push({case:side+'-'+y,valid:m.state==='PLAYING'&&!m.goalEffect&&m.score.player===score.player&&m.score.bot===score.bot});
            }
            Object.assign(m.ball,{x:line+sign*(goalEntryDepth(m.ball.r)+1),y:(C.goalScoreTop+C.goalScoreBottom)/2,vx:0,vy:0});m.lastTouch=m.player;m.update(C.step);
            results.push({case:side+'-inside',valid:m.goalEffect?.side===side&&m.score[scorer]===score[scorer]+(m.training?0:1)});
          }
          g.renderer.render(m,{mobile:g.mobile.active,dt:1/60});return results;
        });
        assert.equal(results.length,6);for(const result of results)assert.equal(result.valid,true,`${mode} ${result.case}`);
        await page.waitForTimeout(50);
        if(mode!=='training'){assert.equal(await page.locator('#score-player').textContent(),'1');assert.equal(await page.locator('#score-bot').textContent(),'1');}
        await page.locator('#leave-game').click();assert.equal(await page.evaluate(()=>window.__jetclash.match.state),'MENU');
        console.log(`Zone filet ${mode} OK ${viewport.width}x${viewport.height} : faux buts haut/bas refusés, vrais buts gauche/droite validés, effet et score.`);
      }
      assert.deepEqual(errors,[]);await context.close();
    }
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
