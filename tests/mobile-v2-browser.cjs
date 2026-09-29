const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
(async()=>{
  const browser=await chromium.launch({headless:true,channel:'msedge'});
  try{
    for(const viewport of [{width:667,height:375},{width:844,height:390},{width:1024,height:768}]){
      const context=await browser.newContext({viewport,isMobile:true,hasTouch:true,deviceScaleFactor:1}),page=await context.newPage(),errors=[];
      page.on('pageerror',e=>errors.push(e.message));
      await page.addInitScript(()=>{window.pad={index:0,id:'DualSense Wireless Controller',connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({value:0}))};Object.defineProperty(navigator,'getGamepads',{value:()=>[window.pad]});});
      await page.goto('http://127.0.0.1:4173/?test=1');await page.waitForFunction(()=>!document.querySelector('#start').disabled);
      await page.locator('#start').tap();await page.waitForFunction(()=>window.__jetclash.match.state==='PLAYING');
      assert.equal(await page.locator('[data-touch="aim"]').count(),0);
      const boxes={};for(const control of ['move','jump','boost','shoot'])boxes[control]=await page.locator(`[data-touch="${control}"]`).boundingBox();
      for(const [name,b] of Object.entries(boxes)){
        assert.ok(b.width>=44&&b.height>=44&&b.x>=0&&b.y>=0&&b.x+b.width<=viewport.width+1&&b.y+b.height<=viewport.height+1);
        if(name!=='move')assert.ok(b.x>viewport.width*.65);
        for(const [other,a] of Object.entries(boxes))if(name!==other)assert.ok(b.x+b.width<=a.x||a.x+a.width<=b.x||b.y+b.height<=a.y||a.y+a.height<=b.y,`${name}/${other}`);
      }
      assert.ok(await page.evaluate(()=>window.__jetclash.renderer.camera.zoom>1.2));
      const cdp=await context.newCDPSession(page),points=new Map();
      const down=async(id,control,x=0,y=0)=>{const b=boxes[control];points.set(id,{id,x:b.x+b.width/2+x*b.width*.35,y:b.y+b.height/2+y*b.width*.35});await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[...points.values()]});};
      const move=async(id,x,y)=>{const p=points.get(id);p.x+=x;p.y+=y;await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[...points.values()]});};
      const up=async id=>{const p=points.get(id);points.delete(id);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[p]});};
      const cancel=async()=>{points.clear();await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});await page.waitForTimeout(40);};
      // Movement + jump, then direction NE + JET, without lifting the left thumb.
      await page.evaluate(()=>Object.assign(window.__jetclash.match.player,{x:300,y:606,vx:0,vy:0,grounded:true}));
      await down(1,'move',.707,-.707);await down(2,'jump');await page.waitForFunction(()=>window.__jetclash.match.player.y<590);await up(2);
      await down(2,'boost');await page.waitForFunction(()=>window.__jetclash.match.player.boosting&&window.__jetclash.match.player.vx>100);
      assert.ok(await page.evaluate(()=>{const p=window.__jetclash.match.player;return p.touchDirection.x>0&&p.touchDirection.y<0&&p.vy<0;}));
      // Controlled airborne encounter fixture; the shot uses the same live inputs.
      await page.evaluate(()=>{const m=window.__jetclash.match;m.control.reset();Object.assign(m.ball,{x:m.player.x+40,y:m.player.y,vx:m.player.vx,vy:m.player.vy});window.shots=[];const apply=m.control.applyShot.bind(m.control);m.control.applyShot=(b,s)=>{apply(b,s);window.shots.push({vx:b.vx,vy:b.vy});};});
      await page.waitForFunction(()=>window.__jetclash.match.control.available);
      await down(3,'shoot');await move(3,35,-35);
      await page.waitForFunction(()=>window.__jetclash.match.control.indicator?.y<0);
      assert.equal(await page.evaluate(()=>window.__jetclash.mobile.input.pointers.size),3);
      await up(3);await page.waitForFunction(()=>window.shots.length>0);
      assert.ok(await page.evaluate(()=>window.shots.at(-1).vx>0&&window.shots.at(-1).vy<0));
      await up(2);assert.equal(await page.evaluate(()=>window.__jetclash.mobile.input.read().boost),false);await cancel();
      // A moving ground charge completes at 0.7 s with drag aim retained on release.
      await page.evaluate(()=>{const m=window.__jetclash.match;m.control.reset();Object.assign(m.player,{x:250,y:606,vx:0,vy:0,grounded:true,facing:1});Object.assign(m.ball,{x:289,y:625,vx:0,vy:0});Object.assign(m.bot,{x:1000,y:300});window.shots=[];});
      await down(1,'move',.467,0);await down(3,'shoot');
      assert.equal(await page.evaluate(()=>window.__jetclash.mobile.input.read().aimActive),false);
      await move(3,0,-48);await page.waitForFunction(()=>window.__jetclash.match.control.charge===.7);
      await page.screenshot({path:`work/mobile-v2-${viewport.width}x${viewport.height}.png`});
      await up(3);await page.waitForFunction(()=>window.shots.length===1);assert.ok(await page.evaluate(()=>window.shots[0].vy<-850));await cancel();
      // Opposed bodies, same pressure-shot gameplay and visible drag indicators.
      await page.evaluate(()=>{const m=window.__jetclash.match;m.control.reset();Object.assign(m.player,{x:300,y:606,vx:0,vy:0,grounded:true,facing:1});Object.assign(m.ball,{x:338,y:625,vx:0,vy:0});Object.assign(m.bot,{x:376,y:606,vx:0,vy:0,grounded:true,facing:-1});window.originalAI=m.ai.update.bind(m.ai);m.ai.update=()=>({axis:-1});window.shots=[];});
      await down(1,'move',1,0);await down(3,'shoot');await move(3,40,-40);
      await page.waitForFunction(()=>window.__jetclash.match.control.charge===.7);
      assert.ok(await page.evaluate(()=>window.__jetclash.match.control.indicator?.x>0));
      await up(3);await page.waitForFunction(()=>window.shots.length===1);await page.waitForFunction(()=>window.__jetclash.match.ball.y<570);await cancel();
      await page.evaluate(()=>{window.__jetclash.match.ai.update=window.originalAI;window.pad.axes[0]=-1;window.pad.buttons[7].value=1;});
      await page.waitForFunction(()=>window.__jetclash.match.player.vx<0&&window.__jetclash.match.player.boosting);
      assert.ok(await page.locator('#touch-controls').isVisible());assert.equal(await page.evaluate(()=>window.__jetclash.match.player.touchDirection),undefined);
      await page.evaluate(()=>{window.pad.axes[0]=0;window.pad.buttons[7].value=0;});
      // Losing a pointer/orientation must cancel, not fire a queued shot.
      await down(3,'shoot');await move(3,0,-40);await page.setViewportSize({width:viewport.height,height:viewport.width});points.clear();
      await page.waitForFunction(()=>window.__jetclash.mobile.portrait);assert.ok(await page.locator('#touch-rotate').isVisible());
      const time=await page.evaluate(()=>window.__jetclash.match.remaining);await page.waitForTimeout(150);assert.equal(await page.evaluate(()=>window.__jetclash.match.remaining),time);
      assert.equal(await page.evaluate(()=>window.__jetclash.mobile.input.pointers.size),0);
      await page.setViewportSize(viewport);await page.waitForFunction(()=>!window.__jetclash.mobile.portrait);assert.equal(await page.evaluate(()=>window.__jetclash.match.control.charging),false);
      await page.evaluate(()=>{window.fullscreenRequests=0;document.getElementById('game-shell').requestFullscreen=()=>{window.fullscreenRequests++;return Promise.reject(new Error('Unavailable'));};});
      await page.locator('.touch-fullscreen').tap();await page.waitForFunction(()=>document.querySelector('.touch-notice').textContent.length>0);assert.equal(await page.evaluate(()=>window.fullscreenRequests),1);
      assert.equal(await page.evaluate(()=>window.__jetclash.match.boundaryRecoveries),0);assert.deepEqual(errors,[]);
      console.log(`Mobile V2 ${viewport.width}x${viewport.height} PASS: jump, NE jet, airborne shot, drag/release, full charge, pressure duel, 3 pointers, PS5, camera and rotation.`);await context.close();
    }
    const page=await browser.newPage({viewport:{width:1440,height:1080}});
    await page.goto('http://127.0.0.1:4173/?test=1');await page.waitForFunction(()=>!document.querySelector('#start').disabled);await page.click('#start');await page.waitForFunction(()=>window.__jetclash.match.state==='PLAYING');
    assert.equal(await page.evaluate(()=>window.__jetclash.renderer.camera.zoom),1);assert.equal(await page.locator('#touch-controls').isVisible(),false);
    console.log('Desktop 1440x1080 PASS: original framing 1x, no touch overlay.');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
