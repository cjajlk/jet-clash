// Simulated Gamepad API in Edge. This does not replace CJ's physical DualSense test.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');fs.mkdirSync('work',{recursive:true});
(async()=>{
  const browser=await chromium.launch({headless:true,channel:'msedge'});
  try{
    const page=await browser.newPage({viewport:{width:1440,height:1120}}),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.addInitScript(()=>{
      const makePad=()=>({id:'DualSense Wireless Controller (Vendor: 054c Product: 0ce6)',index:0,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))});
      window.testPads=[makePad()];
      Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>window.testPads});
      window.connectTestPad=()=>{window.testPads=[makePad()];const e=new Event('gamepadconnected');e.gamepad=window.testPads[0];window.dispatchEvent(e);};
      window.disconnectTestPad=()=>{const pad=window.testPads[0];window.testPads=[null];const e=new Event('gamepaddisconnected');e.gamepad=pad;window.dispatchEvent(e);};
    });
    await page.goto('http://127.0.0.1:4173/?test=1');await page.waitForFunction(()=>!document.querySelector('#start').disabled);
    assert.equal(await page.locator('#gamepad-help').getAttribute('hidden'),null);
    assert.match(await page.locator('#gamepad-help').textContent(),/Stick droit.*Stick gauche.*L2/s);
    assert.equal(await page.locator('#gamepad-jump').textContent(),'Croix / A');assert.equal(await page.locator('#gamepad-boost').textContent(),'Rond / B');assert.equal(await page.locator('#gamepad-shoot').textContent(),'L2 / LT');assert.equal(await page.locator('#gamepad-flip').textContent(),'Carré / X');
    assert.match(await page.locator('#controller-status').textContent(),/PS5 connectée/);
    await page.click('#mobile-play');await page.click('#mobile-duel');await page.waitForFunction(()=>window.__jetclash.match.state==='PLAYING');
    // At-rest stick noise must leave the character at rest.
    await page.evaluate(()=>{Object.assign(window.__jetclash.match.player,{x:300,y:606,vx:0,vy:0,grounded:true});window.testPads[0].axes[2]=.1;});
    await page.waitForTimeout(200);assert.ok(Math.abs(await page.evaluate(()=>window.__jetclash.match.player.x)-300)<.01);
    await page.evaluate(()=>window.testPads[0].axes[2]=1);await page.waitForTimeout(250);
    assert.ok(await page.evaluate(()=>window.__jetclash.match.player.x>315));assert.equal(await page.locator('#gamepad-help').getAttribute('data-active'),'true');
    // Keyboard is immediately usable despite a held opposite stick.
    await page.keyboard.down('ArrowLeft');await page.waitForTimeout(220);assert.ok(await page.evaluate(()=>window.__jetclash.match.player.vx<0));assert.equal(await page.locator('#keyboard-help').getAttribute('data-active'),'true');await page.keyboard.up('ArrowLeft');
    await page.evaluate(()=>{window.testPads[0].axes[2]=0;Object.assign(window.__jetclash.match.player,{x:300,y:606,vx:0,vy:0,grounded:true});window.testPads[0].buttons[0].value=1;});
    await page.waitForTimeout(150);assert.ok(await page.evaluate(()=>window.__jetclash.match.player.y<590));
    await page.evaluate(()=>{window.testPads[0].buttons[0].value=0;window.testPads[0].buttons[1].value=1;});
    await page.waitForTimeout(500);assert.ok(await page.evaluate(()=>window.__jetclash.match.player.boosting&&window.__jetclash.match.player.fuel<90));
    await page.screenshot({path:'work/gamepad-ps5.png'});
    await page.evaluate(()=>window.testPads[0].buttons[1].value=0);await page.waitForFunction(()=>!window.__jetclash.match.player.boosting);
    const fuel=await page.evaluate(()=>window.__jetclash.match.player.fuel);await page.waitForTimeout(150);assert.ok(await page.evaluate(f=>window.__jetclash.match.player.fuel>f,fuel));
    // Disconnect while holding B: there must be no cached jetpack command.
    await page.evaluate(()=>window.testPads[0].buttons[1].value=1);await page.waitForFunction(()=>window.__jetclash.match.player.boosting);
    await page.evaluate(()=>window.disconnectTestPad());await page.waitForFunction(()=>!window.__jetclash.match.player.boosting);
    assert.equal(await page.locator('#gamepad-help').isVisible(),false);assert.equal(await page.locator('#keyboard-help').isVisible(),true);
    await page.keyboard.down('ShiftLeft');await page.waitForFunction(()=>window.__jetclash.match.player.boosting);await page.keyboard.up('ShiftLeft');
    await page.evaluate(()=>window.connectTestPad());await page.waitForFunction(()=>!document.querySelector('#gamepad-help').hidden);
    await page.evaluate(()=>window.testPads[0].axes[2]=-1);await page.waitForFunction(()=>window.__jetclash.input.lastMethod==='gamepad');
    // Disconnect/reconnect at another point in the running match.
    await page.evaluate(()=>window.disconnectTestPad());await page.waitForFunction(()=>!window.__jetclash.input.gamepad.status.connected);
    await page.evaluate(()=>window.connectTestPad());await page.waitForFunction(()=>window.__jetclash.input.gamepad.status.supported);
    assert.deepEqual(errors,[]);
    console.log('Edge + Gamepad simulé : connexion initiale/à chaud, deadzone, stick, Croix, Rond maintenu/relâché, Carré flip, coexistence clavier, déconnexion/reconnexion et aide PS5 : OK. Aucune erreur JavaScript.');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
