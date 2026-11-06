const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');const assert=require('node:assert/strict');require('node:fs').mkdirSync('work',{recursive:true});
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
for(const viewport of [{width:844,height:390},{width:1440,height:900}]){
 const page=await browser.newPage({viewport,hasTouch:viewport.width<1000}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>Object.defineProperty(navigator,'getGamepads',{value:()=>[]}));
 await page.goto('http://127.0.0.1:4173/?test=1');await page.waitForFunction(()=>window.__jetclash&&!document.querySelector('#start').disabled);
 await page.locator('#mobile-play').click();await page.locator('[data-select-mode="training"]').click();await page.locator('[data-drill="target"]').click();
 await page.locator('.drill-panel').waitFor({state:'visible'});
 const frozen=await page.evaluate(()=>__jetclash.match.ball.y);await page.waitForTimeout(150);assert.equal(await page.evaluate(()=>__jetclash.match.ball.y),frozen);
 if(viewport.width<1000)await page.waitForFunction(()=>__jetclash.mobile.active);
 if(viewport.width<1000){assert.equal(await page.locator('[data-touch="back"]').isVisible(),false);assert.equal(await page.locator('[data-touch="rot"]').isVisible(),false);for(const key of ['jump','boost','shoot'])assert.equal(await page.locator(`[data-touch="${key}"]`).isVisible(),true);}
 await page.screenshot({path:`work/gameplay-drill-${viewport.width}.png`});
 await page.locator('[data-drill-begin]').click();assert.equal(await page.evaluate(()=>__jetclash.drills.running),true);
 // Deterministic physical exercise ticks, using the same controller as the live loop.
 await page.evaluate(()=>{__jetclash.setPaused(true);document.querySelector('#pause').hidden=true;});
 for(const id of ['target','save','reset']){
 const result=await page.evaluate(id=>{const g=__jetclash,d=g.drills,m=g.match;d.start(id);d.begin();const tick=input=>{d.before(input);m.update(1/120,input);g.contactFeedback.update(m,1/120);d.after(input,1/120);};
 if(id==='target'){for(let i=0;i<8;i++)tick({shoot:true,aimX:1,aimY:-.55,aimIntent:true});tick({aimX:1,aimY:-.55,aimIntent:true});for(let i=0;i<100&&!d.done;i++)tick({});}
 if(id==='save')for(let i=0;i<80&&!d.done;i++)tick({shoot:i<25,aimX:1,aimY:0,aimIntent:true});
 if(id==='reset'){for(let i=0;i<80&&!d.resetEarned;i++)tick({});tick({jump:true});}
 return {done:d.done,xp:m.profile.data.xp};},id);assert.equal(result.done,true,id);assert.equal(result.xp,0);
 await page.locator('[data-drill-retry]').click();assert.equal(await page.evaluate(()=>__jetclash.drills.running),false);
 }
 await page.locator('[data-drill-exit]').click();assert.equal(await page.locator('.drill-panel').isVisible(),false);
 if(viewport.width<1000){await page.evaluate(async()=>{const {controlSettings}=await import('/src/control-settings.js');controlSettings.setTouchPreset('advanced');});await page.waitForFunction(()=>!document.querySelector('[data-touch="back"]').hidden);assert.equal(await page.locator('[data-touch="rot"]').isVisible(),true);}
 assert.deepEqual(errors,[]);console.log(`${viewport.width}: simple/advanced controls, ready/retry/free play, three physical exercises PASS`);await page.close();
}
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
