const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
(async()=>{
  const browser=await chromium.launch({headless:true,channel:'msedge'});
  try{
    for(const viewport of [{width:667,height:375},{width:844,height:390},{width:1024,height:768}]){
      const context=await browser.newContext({viewport,isMobile:true,hasTouch:true,deviceScaleFactor:1});
      const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
      await page.addInitScript(()=>{
        window.pad={index:0,id:'DualSense Wireless Controller',connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({value:0}))};
        Object.defineProperty(navigator,'getGamepads',{value:()=>[window.pad]});
      });
      await page.goto('http://127.0.0.1:4173/?test=1');await page.waitForFunction(()=>!document.querySelector('#start').disabled);
      await page.locator('#start').tap();await page.waitForFunction(()=>window.__jetclash.match.state==='PLAYING');
      assert.ok(await page.locator('#touch-controls').isVisible());
      const boxes={};for(const control of ['move','aim','jump','boost','shoot'])boxes[control]=await page.locator(`[data-touch="${control}"]`).boundingBox();
      for(const [name,b] of Object.entries(boxes)){
        assert.ok(b.width>=44&&b.height>=44&&b.x>=0&&b.y>=0&&b.x+b.width<=viewport.width+1&&b.y+b.height<=viewport.height+1,`${name}: ${JSON.stringify(b)}`);
        for(const [other,a] of Object.entries(boxes))if(name!==other)assert.ok(b.x+b.width<=a.x||a.x+a.width<=b.x||b.y+b.height<=a.y||a.y+a.height<=b.y,`${name} overlaps ${other}`);
      }
      const arena=await page.locator('#arena').boundingBox();assert.ok(Math.abs(arena.width/arena.height-16/9)<.01,`arena distorted: ${JSON.stringify(arena)}`);
      const cdp=await context.newCDPSession(page),points=new Map();
      const dispatch=async type=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:[...points.values()]});
      const down=async(id,control,x=0,y=0)=>{const b=boxes[control];points.set(id,{id,x:b.x+b.width/2+x*b.width*.35,y:b.y+b.height/2+y*b.width*.35});await dispatch('touchStart');};
      const up=async id=>{const point=points.get(id);points.delete(id);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[point]});};
      const cancel=async()=>{points.clear();await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});};
      const state=()=>page.evaluate(()=>window.__jetclash.mobile.input.read());
      // Actual four-finger input stream, not synthetic JS PointerEvents.
      await down(1,'move',1,0);await down(2,'boost');await page.waitForTimeout(120);
      assert.ok(await page.evaluate(()=>window.__jetclash.match.player.boosting));
      let i=await state();assert.ok(i.axis>.9&&i.boost);
      await down(3,'aim',1,-1);await down(4,'shoot');i=await state();assert.ok(i.axis>.9&&i.boost&&i.shoot&&i.aimX>0&&i.aimY<0);
      assert.equal(await page.evaluate(()=>window.__jetclash.mobile.input.pointers.size),4);
      await up(2);i=await state();assert.ok(!i.boost&&i.shoot&&i.axis>.9&&i.aimY<0,JSON.stringify(i));
      await page.waitForTimeout(50);assert.equal(await page.evaluate(()=>window.__jetclash.match.player.boosting),false);
      // Cancel cannot synthesize a shot or leave a stick stuck.
      await cancel();await page.waitForTimeout(50);assert.equal(await page.evaluate(()=>window.__jetclash.mobile.input.pointers.size),0);
      await page.evaluate(()=>Object.assign(window.__jetclash.match.player,{x:300,y:606,vx:0,vy:0,grounded:true}));
      await down(2,'jump');await page.waitForFunction(()=>window.__jetclash.match.player.y<590);await up(2);
      await page.evaluate(()=>{
        const m=window.__jetclash.match;m.control.reset();Object.assign(m.player,{x:300,y:606,vx:0,vy:0,grounded:true,facing:1});
        Object.assign(m.ball,{x:339,y:625,vx:0,vy:0});Object.assign(m.bot,{x:1000,y:300});
        window.shots=[];const apply=m.control.applyShot.bind(m.control);m.control.applyShot=(b,s)=>{apply(b,s);window.shots.push({vx:b.vx,vy:b.vy});};
      });
      await down(1,'move',.467,0);await down(3,'aim',0,-1);await down(4,'shoot');
      await page.waitForFunction(()=>window.__jetclash.match.control.charge===.7);
      assert.ok(await page.evaluate(()=>window.__jetclash.match.control.indicator.y===-1));
      await page.screenshot({path:`work/touch-${viewport.width}x${viewport.height}.png`});
      await up(4);await page.waitForFunction(()=>window.shots.length===1);assert.ok(await page.evaluate(()=>window.shots[0].vy<-850));
      await cancel();
      // Controller continues to work while tactile controls stay visible.
      await page.evaluate(()=>{window.pad.axes[0]=-1;window.pad.buttons[7].value=1;});await page.waitForFunction(()=>window.__jetclash.match.player.vx<0&&window.__jetclash.match.player.boosting);
      assert.ok(await page.evaluate(()=>window.__jetclash.match.player.vx<0&&window.__jetclash.match.player.boosting),JSON.stringify(await page.evaluate(()=>({player:window.__jetclash.match.player,touch:window.__jetclash.mobile.input.read(),pad:window.__jetclash.input.read()}))));
      assert.ok(await page.locator('#touch-controls').isVisible());
      await page.evaluate(()=>{window.pad.axes[0]=0;window.pad.buttons[7].value=0;});
      await down(2,'jump');assert.equal((await state()).jump,true);await up(2);
      // Rotation cancels input, pauses the clock, and shows a landscape prompt.
      await down(4,'shoot');await page.setViewportSize({width:viewport.height,height:viewport.width});points.clear();
      await page.waitForFunction(()=>window.__jetclash.mobile.portrait);
      assert.ok(await page.locator('#touch-rotate').isVisible());assert.equal(await page.locator('#touch-controls').isVisible(),false);
      const time=await page.evaluate(()=>window.__jetclash.match.remaining);await page.waitForTimeout(150);
      assert.equal(await page.evaluate(()=>window.__jetclash.match.remaining),time);
      assert.equal(await page.evaluate(()=>window.__jetclash.mobile.input.pointers.size),0);
      await page.screenshot({path:`work/touch-portrait-${viewport.height}.png`});
      await page.setViewportSize(viewport);await page.waitForFunction(()=>!window.__jetclash.mobile.portrait);
      assert.equal(await page.evaluate(()=>window.__jetclash.match.control.charging),false);
      // A denied Fullscreen API request remains optional and never retries.
      await page.evaluate(()=>{window.fullscreenRequests=0;document.getElementById('game-shell').requestFullscreen=()=>{window.fullscreenRequests++;return Promise.reject(new Error('Unavailable'));};});
      await page.locator('.touch-fullscreen').tap();await page.waitForFunction(()=>document.querySelector('.touch-notice').textContent.length>0);
      assert.equal(await page.evaluate(()=>window.fullscreenRequests),1);assert.equal(await page.evaluate(()=>window.__jetclash.match.state),'PLAYING');
      assert.deepEqual(errors,[]);console.log(`Touch ${viewport.width}x${viewport.height} PASS: 4 pointers, charge/release, controller coexistence, portrait pause, landscape resume, no overlaps.`);
      await context.close();
    }
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
