const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
(async()=>{
  const browser=await chromium.launch({headless:true,channel:'msedge'});
  try{
    for(const viewport of [{width:1280,height:720},{width:844,height:390},{width:568,height:320}]){
      const touch=viewport.width<1000,context=await browser.newContext({viewport,hasTouch:touch,isMobile:touch}),page=await context.newPage(),errors=[];
      page.on('pageerror',error=>errors.push(error.message));
      await page.goto('http://127.0.0.1:4173/?test=1');await page.waitForFunction(()=>!document.querySelector('#start').disabled);
      for(const mode of ['2v2','duel','training']){
        await page.locator('#mobile-play').click();await page.locator(`#mobile-${mode==='2v2'?'teams':mode}`).click();
        await page.evaluate(()=>{window.__jetclash.setPaused(true);document.querySelector('#pause').hidden=true;});
        const reset=()=>page.evaluate(async()=>{
          const g=window.__jetclash,{CONFIG:C}=await import('/src/config.js');g.input.clear();g.mobile.clear();
          g.match.prepare();g.match.state='PLAYING';g.input.read();g.input.readBallControls();g.mobile.input.read();
          Object.assign(g.match.player,{x:640,y:C.floor-C.playerHeight/2,vx:0,vy:0,grounded:true,contactSurface:'floor',facing:1,footX:0,footY:1});
          for(const bot of g.match.bots)Object.assign(bot.body,{x:1000,y:400,vx:0,vy:0});
          Object.assign(g.match.ball,{x:850,y:250,vx:0,vy:0});document.querySelector('#arena').focus();
        });
        const step=()=>page.evaluate(async()=>{
          const g=window.__jetclash,{combineTouch}=await import('/src/touch-input.js'),{CONFIG:C}=await import('/src/config.js');
          const controls=combineTouch({...g.input.read(),...g.input.readBallControls()},g.mobile.input.read());
          g.match.update(C.step,controls);const p=g.match.player;
          return {controls,x:p.x,vy:p.vy,fuel:p.fuel,boosting:p.boosting,flip:p.flipTimer,impulseReady:p.impulseReady,ballVx:g.match.ball.vx};
        });
        await reset();await page.keyboard.down('ArrowRight');assert.ok((await step()).x>640);await page.keyboard.up('ArrowRight');
        await reset();await page.keyboard.down('ArrowLeft');assert.ok((await step()).x<640);await page.keyboard.up('ArrowLeft');
        await reset();await page.keyboard.down('Space');assert.ok((await step()).vy<0);await page.keyboard.up('Space');await step();
        await page.keyboard.down('Space');assert.equal((await step()).impulseReady,false);await page.keyboard.up('Space');
        await reset();await page.keyboard.down('ShiftLeft');const jet=await step();assert.ok(jet.boosting&&jet.fuel<100);await page.keyboard.up('ShiftLeft');assert.equal((await step()).boosting,false);
        await reset();await page.keyboard.down('Space');await step();await page.keyboard.up('Space');await step();
        await page.keyboard.down('KeyR');assert.ok((await step()).flip>0);await page.keyboard.up('KeyR');
        for(const [key,aim] of [['KeyF','KeyL'],['KeyE','KeyL']]){
          await reset();await page.evaluate(async key=>{
            const {controlSettings}=await import('/src/control-settings.js');controlSettings.setKeyboard('shoot',[key]);
            const m=window.__jetclash.match;Object.assign(m.ball,{x:m.player.x+25,y:m.player.y-10,vx:0,vy:0});
          },key);
          await page.keyboard.down(aim);await page.keyboard.down(key);assert.equal((await step()).controls.shoot,true);
          await page.keyboard.up(key);assert.ok((await step()).ballVx>500,`${mode}: tir ${key}`);await page.keyboard.up(aim);
        }
        await page.evaluate(async()=>{const {controlSettings}=await import('/src/control-settings.js');controlSettings.reset();});
        if(touch){
          for(const [control,check] of [['jump',r=>r.vy<0],['boost',r=>r.boosting&&r.fuel<100],['move',r=>r.x>640]]){
            await reset();const box=await page.locator(`[data-touch="${control}"]`).boundingBox();assert.ok(box,`${mode}: ${control} visible`);
            await page.mouse.move(box.x+box.width/2+(control==='move'?box.width*.3:0),box.y+box.height/2);await page.mouse.down();
            assert.ok(check(await step()),`${mode}: tactile ${control}`);await page.mouse.up();assert.equal((await step()).controls[control==='move'?'axis':control],control==='move'?0:false);
          }
          await reset();await page.evaluate(()=>{const m=window.__jetclash.match;Object.assign(m.ball,{x:m.player.x+25,y:m.player.y-10,vx:0,vy:0});});
          const box=await page.locator('[data-touch="shoot"]').boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();assert.equal((await step()).controls.shoot,true);
          await page.mouse.up();assert.ok((await step()).ballVx>500,`${mode}: tir tactile`);
        }
        await reset();
        await page.evaluate(()=>{
          const g=window.__jetclash;window.controlPad={index:0,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};
          g.input.gamepad.source=g.input.ball.source={getGamepads:()=>[window.controlPad]};
        });
        await page.waitForTimeout(50);await reset();
        const pad=async(index,pressed)=>page.evaluate(({index,pressed})=>{window.controlPad.buttons[index]={pressed,value:pressed?1:0};},{index,pressed});
        await page.evaluate(()=>window.controlPad.axes[2]=-1);assert.ok((await step()).x<640);await page.evaluate(()=>window.controlPad.axes[2]=0);
        await reset();await pad(0,true);assert.ok((await step()).vy<0);await pad(0,false);await step();await pad(0,true);assert.equal((await step()).impulseReady,false);await pad(0,false);await step();
        await reset();await pad(1,true);assert.equal((await step()).boosting,true);await pad(1,false);await step();
        await reset();await pad(0,true);await step();await pad(0,false);await step();await pad(2,true);assert.ok((await step()).flip>0);await pad(2,false);await step();
        await reset();await page.evaluate(()=>{const m=window.__jetclash.match;Object.assign(m.ball,{x:m.player.x+25,y:m.player.y-10,vx:0,vy:0});window.controlPad.axes[2]=1;});
        await pad(6,true);assert.equal((await step()).controls.shoot,true);await pad(6,false);assert.ok((await step()).ballVx>500,`${mode}: tir manette`);
        await page.evaluate(()=>{const g=window.__jetclash;g.input.gamepad.source=g.input.ball.source=navigator;g.input.clear();});
        await page.waitForTimeout(50);
        await reset();await page.keyboard.down('KeyT');await page.waitForTimeout(50);
        assert.equal(await page.evaluate(()=>window.__jetclash.match.ball.x),mode==='training'?640:850);
        assert.equal((await step()).controls.resetBall,false);await page.keyboard.up('KeyT');
        await reset();await page.keyboard.down('KeyF');await step();await page.keyboard.down('ShiftLeft');
        await page.evaluate(()=>window.__jetclash.setPaused(true));
        const cleared=await page.evaluate(()=>{const g=window.__jetclash;return {keys:g.input.keyboard.keys.size,shotKeys:g.input.ball.keys.size,pointers:g.mobile.input.pointers.size,charging:g.match.control.charging};});
        assert.deepEqual(cleared,{keys:0,shotKeys:0,pointers:0,charging:false});await page.keyboard.up('KeyF');await page.keyboard.up('ShiftLeft');
        await page.evaluate(()=>document.querySelector('#pause').hidden=true);await page.locator('#leave-game').click();
        assert.equal(await page.evaluate(()=>window.__jetclash.match.state),'MENU');
        console.log(`Commandes ${mode} OK ${viewport.width}x${viewport.height} : clavier, manette simulée${touch?', tactile':''}, mouvement, double saut, jet, flip, tir personnalisé, reset et pause/retour.`);
      }
      assert.deepEqual(errors,[]);await context.close();
    }
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
