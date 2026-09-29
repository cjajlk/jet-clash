const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
(async()=>{
  const browser=await chromium.launch({headless:true,channel:'msedge'});
  try{
    const page=await browser.newPage({viewport:{width:1440,height:1120}}),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.addInitScript(()=>{
      window.pad={index:0,id:'DualSense Wireless Controller',connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({value:0,pressed:false}))};
      Object.defineProperty(navigator,'getGamepads',{value:()=>[window.pad]});
    });
    await page.goto('http://127.0.0.1:4173/?test=1');
    await page.waitForFunction(()=>!document.querySelector('#start').disabled);
    // CJ regression: aiming throughout launch must not lock the new controls.
    await page.evaluate(()=>window.pad.axes[3]=-1);
    await page.click('#mobile-play');await page.click('#mobile-duel');await page.waitForFunction(()=>window.__jetclash.match.state==='PLAYING');
    // Capture the actual shot impulse, before gravity/browser scheduling changes it.
    await page.evaluate(()=>{
      const control=window.__jetclash.match.control,apply=control.applyShot.bind(control);
      control.applyShot=(ball,shot)=>{apply(ball,shot);window.lastShot={vx:ball.vx,vy:ball.vy};};
    });
    assert.equal(await page.evaluate(()=>window.__jetclash.input.readBallControls().aimY),-1);
    assert.match(await page.locator('#gamepad-shoot').textContent(),/Carré/);
    // Approach a free ball with Square already held, using actual simulated input.
    await page.evaluate(()=>{
      const m=window.__jetclash.match;m.control.reset();
      Object.assign(m.player,{x:250,y:606,vx:0,vy:0,grounded:true,facing:1});
      Object.assign(m.ball,{x:320,y:625,vx:0,vy:0});Object.assign(m.bot,{x:1000,y:300});
      window.pad.axes[0]=.467;window.pad.buttons[2].value=1;
    });
    await page.waitForFunction(()=>window.__jetclash.match.control.charge===.7);
    await page.screenshot({path:'work/ball-control-approach-charge.png'});
    await page.evaluate(()=>{window.pad.axes[0]=0;window.pad.buttons[2].value=0;});
    await page.waitForFunction(()=>!window.__jetclash.match.control.owned);
    await page.waitForFunction(()=>window.lastShot?.vy<-850);
    const arrange=async()=>{
      await page.evaluate(()=>{
        const m=window.__jetclash.match;m.control.reset();window.lastShot=null;
        Object.assign(m.player,{x:300,y:606,vx:0,vy:0,grounded:true,facing:1});
        Object.assign(m.ball,{x:339,y:625,vx:0,vy:0});Object.assign(m.bot,{x:1000,y:300,vx:0,vy:0});
        window.pad.axes=[0,0,0,0];window.pad.buttons[2].value=0;
      });
      await page.waitForFunction(()=>window.__jetclash.match.control.owned);
    };
    await arrange();assert.equal(await page.evaluate(()=>window.__jetclash.match.control.indicator),null);
    await page.evaluate(()=>{window.pad.axes[2]=1;window.pad.axes[3]=-1;});
    await page.waitForFunction(()=>window.__jetclash.match.control.indicator?.y<0);
    await page.screenshot({path:'work/ball-control-aim.png'});
    await page.evaluate(()=>window.pad.buttons[2].value=1);await page.waitForTimeout(60);
    await page.evaluate(()=>window.pad.buttons[2].value=0);
    await page.waitForFunction(()=>!window.__jetclash.match.control.owned);
    const normal=await page.evaluate(()=>{const m=window.__jetclash.match;return Math.hypot(m.ball.vx,m.ball.vy);});
    assert.ok(normal>400);assert.equal(await page.evaluate(()=>window.__jetclash.match.control.indicator),null);
    await arrange();await page.evaluate(()=>{window.pad.axes[3]=-1;window.pad.buttons[2].value=1;});
    await page.waitForFunction(()=>window.__jetclash.match.control.charge===.7);
    await page.screenshot({path:'work/ball-control-charge.png'});
    await page.evaluate(()=>window.pad.buttons[2].value=0);
    await page.waitForFunction(()=>!window.__jetclash.match.control.owned);
    await page.waitForFunction(()=>window.lastShot?.vy<-850);
    await arrange();await page.keyboard.down('KeyI');await page.keyboard.down('KeyF');
    await page.waitForFunction(()=>window.__jetclash.match.control.charging);
    assert.ok(await page.evaluate(()=>window.__jetclash.match.control.indicator.y<0));
    await page.keyboard.up('KeyF');await page.keyboard.up('KeyI');
    await page.waitForFunction(()=>!window.__jetclash.match.control.owned);
    await arrange();await page.evaluate(()=>window.pad.buttons[2].value=1);
    await page.waitForFunction(()=>window.__jetclash.match.control.charging);
    await page.evaluate(()=>window.__jetclash.setPaused(true));
    assert.equal(await page.evaluate(()=>window.__jetclash.match.control.charging),false);
    await page.evaluate(()=>{window.pad.buttons[2].value=0;window.__jetclash.setPaused(false);});
    await page.waitForTimeout(80);assert.ok(await page.evaluate(()=>Math.abs(window.__jetclash.match.ball.vx)<100));
    // Loss of possession immediately removes visible aim.
    await arrange();await page.evaluate(()=>{window.pad.axes[2]=1;});
    await page.waitForFunction(()=>window.__jetclash.match.control.indicator);
    await page.evaluate(()=>window.__jetclash.match.ball.x=600);
    await page.waitForFunction(()=>window.__jetclash.match.control.indicator===null);
    await page.evaluate(()=>Object.assign(window.__jetclash.match.ball,{x:1220,y:448,vx:0,vy:0}));
    await page.waitForFunction(()=>window.__jetclash.match.state==='GOAL_SCORED');
    assert.equal(await page.locator('#score-player').textContent(),'1');
    await page.waitForFunction(()=>window.__jetclash.match.state==='PLAYING');
    await page.evaluate(()=>window.__jetclash.match.remaining=.01);
    await page.waitForFunction(()=>window.__jetclash.match.state==='POST_MATCH');
    assert.deepEqual(errors,[]);
    console.log('Ball-control browser PASS: PS5 + keyboard, acquisition, aim/chevrons, normal/charged release, loss, goal, kickoff, match end.');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
