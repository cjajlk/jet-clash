const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
  for(const touch of [false,true]){
    const context=await browser.newContext({viewport:{width:1280,height:720},hasTouch:touch}),page=await context.newPage(),errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.addInitScript(()=>{window.pad={index:2,id:'DualSense Wireless Controller',mapping:'standard',connected:true,axes:[0,0,0,0],buttons:Array.from({length:18},()=>({value:0,pressed:false}))};navigator.getGamepads=()=>pad.connected?[null,null,pad]:[];});
    await page.goto('http://127.0.0.1:4173/?test=1');await page.waitForFunction(()=>window.__jetclash&&!document.querySelector('#start').disabled);
    await page.waitForFunction(()=>__jetclash.input.gamepad.status.supported);
    await page.evaluate(()=>{pad.axes[2]=1;});await page.waitForFunction(()=>__jetclash.input.gamepad.previous.axis===1);
    for(let i=0;i<3;i++){
      await page.locator('#mobile-play').click();await page.locator('#mobile-training').click();
      const start=await page.evaluate(()=>__jetclash.match.player.x);
      try{await page.waitForFunction(x=>__jetclash.match.player.x>x+20,start,{timeout:2500});}
      catch(error){console.log('Startup diagnosis',await page.evaluate(()=>({status:__jetclash.input.gamepad.status,needsNeutral:__jetclash.input.gamepad.needsNeutral,axis:__jetclash.input.gamepad.previous.axis,stick:pad.axes[2]})));throw error;}
      await page.locator('#leave-game').click();
    }
    await page.evaluate(()=>{pad.connected=false;pad.axes[2]=0;});await page.waitForFunction(()=>!__jetclash.input.gamepad.status.connected);
    await page.locator('#mobile-play').click();await page.locator('#mobile-training').click();
    await page.evaluate(()=>{pad.connected=true;pad.axes[2]=1;});await page.waitForFunction(()=>__jetclash.input.gamepad.status.connected);
    await page.waitForFunction(()=>__jetclash.match.player.x>340,null,{timeout:2500});
    await page.evaluate(()=>{pad.axes[2]=0;pad.buttons[0].value=1;pad.buttons[1].value=1;});
    await page.waitForFunction(()=>__jetclash.match.player.boosting&&__jetclash.match.player.y<__jetclash.match.arena.floor-50);
    await page.evaluate(()=>{pad.axes[2]=1;pad.buttons[0].value=0;pad.buttons[1].value=0;});
    await page.locator('#leave-game').click();await page.locator('.mm-gear').click();await page.locator('[data-fullscreen]').click();await page.waitForFunction(()=>!!document.fullscreenElement);
    await page.locator('.mm-nav [data-route=home]').click();await page.locator('#mobile-play').click();await page.locator('#mobile-training').click();
    await page.waitForFunction(()=>__jetclash.match.player.x>340,null,{timeout:2500});
    await page.setViewportSize({width:1200,height:680});
    const resized=await page.evaluate(()=>__jetclash.match.player.x);await page.waitForFunction(x=>__jetclash.match.player.x>x+10,resized,{timeout:2500});
    await page.evaluate(()=>window.dispatchEvent(new Event('blur')));assert.ok(await page.locator('#pause').isVisible());
    await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
    const focused=await page.evaluate(()=>__jetclash.match.player.x);await page.waitForFunction(x=>__jetclash.match.player.x>x+10,focused,{timeout:2500});
    // Movement resumes immediately; a held shooting trigger still requires release.
    await page.evaluate(()=>{pad.buttons[6].value=1;});await page.locator('#leave-game').click();
    await page.locator('#mobile-play').click();await page.locator('#mobile-training').click();
    assert.equal(await page.evaluate(()=>__jetclash.input.readBallControls().shoot),false);
    await page.evaluate(()=>{pad.buttons[6].value=0;});await page.waitForFunction(()=>!__jetclash.input.ball.blocked);
    await page.evaluate(()=>{pad.buttons[6].value=1;});await page.waitForFunction(()=>__jetclash.input.readBallControls().shoot);
    assert.equal(await page.evaluate(()=>__jetclash.input.gamepad.status.label),'PS5');assert.deepEqual(errors,[]);
    console.log(`PS5 startup, held stick, relaunch, reconnect, jump/boost, fullscreen and resize PASS touch=${touch}`);await context.close();
  }
}finally{await browser.close();}})().catch(error=>{console.error(error);process.exitCode=1;});
