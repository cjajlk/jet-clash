const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{
  for(const [width,height] of [[1920,1080],[1440,900],[1280,720],[1024,768],[844,390],[667,375],[390,844]]){
   const touch=width<=1024,context=await browser.newContext({viewport:{width,height},hasTouch:touch,isMobile:touch}),page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:4173/?test=1');await page.waitForFunction(()=>!document.querySelector('#start').disabled);
   const activate=async selector=>touch?page.locator(selector).tap():page.locator(selector).click();
   const boxes=await page.evaluate(()=>['#mobile-fluid','.mm-hero-ball','#mobile-play'].map(s=>{const b=document.querySelector(s).getBoundingClientRect();return {x:b.x,y:b.y,r:b.right,b:b.bottom,w:b.width,h:b.height};}));
   const [fluid,ball,play]=boxes;
   for(const other of [fluid,play])assert.ok(ball.r<=other.x||other.r<=ball.x||ball.b<=other.y||other.b<=ball.y,`${width}: ball overlaps fighter/play`);
   const oldSize=width>=1100?Math.min(76,Math.max(48,width*.04)):height>width?42:Math.min(48,Math.max(28,width*.04));
   assert.ok(Math.abs(ball.w/oldSize-1.8)<.02,`${width}: ball scale`);
   await page.screenshot({path:`work/finish-home-${width}x${height}.png`});await activate('#mobile-play');
   assert.equal(await page.locator('#mobile-difficulty select').count(),0);
   assert.equal(await page.locator('[data-difficulty="normal"]').getAttribute('aria-checked'),'true');
   const fighters=await page.locator('.mm-duel-art img').evaluateAll(imgs=>imgs.map(i=>i.getBoundingClientRect().height));assert.ok(fighters[0]/fighters[1]>=.85&&fighters[0]/fighters[1]<=.9);
   await page.locator('[data-difficulty="normal"]').focus();await page.keyboard.press('ArrowRight');assert.equal(await page.locator('[data-difficulty="elite"]').getAttribute('aria-checked'),'true');await page.keyboard.press('Home');assert.equal(await page.locator('[data-difficulty="easy"]').getAttribute('aria-checked'),'true');await page.keyboard.press('ArrowRight');
   assert.deepEqual(await page.evaluate(()=>{
    const bad=[];for(const s of ['.mm-duel-art','.mm-duel-card','#mobile-difficulty','#mobile-duel','.mm-difficulty-title','.mm-future-modes']){const el=document.querySelector(s),b=el.getBoundingClientRect();if(b.left<0||b.right>innerWidth+1||b.top<0||b.bottom>innerHeight+1||el.scrollWidth>el.clientWidth+1)bad.push(s);}
    if(document.documentElement.scrollWidth>innerWidth)bad.push('page');return bad;
   }),[],`${width}: bounds and text`);
   await page.screenshot({path:`work/finish-duel-${width}x${height}.png`});
   for(const difficulty of ['easy','normal','elite']){
    await activate(`[data-difficulty="${difficulty}"]`);await activate('#mobile-duel');await page.waitForFunction(()=>window.__jetclash.match.state==='PRE_ROUND');assert.equal(await page.evaluate(()=>window.__jetclash.match.difficulty),difficulty);
    if(height>width){await page.locator('#touch-rotate').waitFor({state:'visible'});await page.setViewportSize({width:844,height:390});await page.locator('#touch-controls').waitFor({state:'visible'});}
    await page.evaluate(()=>{window.__jetclash.match.phase=0;});await page.waitForFunction(()=>window.__jetclash.match.state==='PLAYING');await page.waitForTimeout(500);
    const drawn=await page.evaluate(()=>{const {renderer:r,match:m}=window.__jetclash,keys=[],fit=r.fit;r.fit=function(key,...args){keys.push(key);return fit.call(this,key,...args);};r.render(m);r.fit=fit;return keys;});assert.ok(!drawn.includes('platform')&&!drawn.includes('obstacle'));assert.ok(drawn.includes('left')&&drawn.includes('right'));
    await page.evaluate(()=>{const m=window.__jetclash.match;m.score.player=1;m.remaining=.001;});await page.waitForFunction(()=>window.__jetclash.match.state==='POST_MATCH');await activate('#back-menu');await page.locator('#mobile-play').waitFor({state:'visible'});
    if(height>width)await page.setViewportSize({width,height});await activate('#mobile-play');assert.equal(await page.locator(`[data-difficulty="${difficulty}"]`).getAttribute('aria-checked'),'true');
   }
   assert.deepEqual(errors,[]);console.log(`Finition ${width}x${height} PASS: ball x1.8, fighter ratio, keyboard, ${touch?'touch':'mouse'}, all difficulties launch/return, open render.`);await context.close();
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
