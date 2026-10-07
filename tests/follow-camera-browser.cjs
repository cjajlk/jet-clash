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
        await page.evaluate(()=>{const g=window.__jetclash;g.setPaused(true);document.querySelector('#pause').hidden=true;g.match.state='PLAYING';
          Object.assign(g.match.player,{x:550,y:532,vx:0,vy:0,grounded:true,contactSurface:'floor',footX:0,footY:1});
          Object.assign(g.match.ball,{x:600,y:530,vx:0,vy:0});for(const [i,e] of g.match.bots.entries())Object.assign(e.body,{x:i===1?20:1250,y:532,vx:0,vy:0});
          window.cameraWorld=JSON.stringify([g.match.players,g.match.ball]);
        });
        await page.waitForFunction(()=>window.__jetclash.renderer.camera.zoom>1.45);
        assert.equal(await page.evaluate(()=>JSON.stringify([window.__jetclash.match.players,window.__jetclash.match.ball])===window.cameraWorld),true);
        const visible=()=>page.evaluate(()=>{const g=window.__jetclash,c=g.renderer.camera;return [g.match.player,g.match.ball].every(p=>c.project(p.x,p.y).visible);});
        assert.equal(await visible(),true);
        if(mode==='2v2'){
          const markers=await page.evaluate(()=>{const g=window.__jetclash,r=g.renderer,labels=[],original=r.ctx.fillText;r.ctx.fillText=function(text,...args){labels.push(text);return original.call(this,text,...args);};r.render(g.match);r.ctx.fillText=original;return labels;});
          for(const label of ['ALLIÉ','BOT 1','BOT 2'])assert.ok(markers.includes(label));
          if(process.env.CAMERA_SCREENSHOT_DIR){const fs=require('node:fs'),path=require('node:path');fs.mkdirSync(process.env.CAMERA_SCREENSHOT_DIR,{recursive:true});await page.screenshot({path:path.join(process.env.CAMERA_SCREENSHOT_DIR,`JetClash-camera-${viewport.width}.png`)});}
        }
        const x=await page.evaluate(()=>window.__jetclash.renderer.camera.x);
        await page.evaluate(()=>{const m=window.__jetclash.match;m.player.x=750;m.ball.x=800;});
        await page.waitForFunction(x=>window.__jetclash.renderer.camera.x>x+60,x);assert.equal(await visible(),true);
        await page.evaluate(()=>{const m=window.__jetclash.match;m.player.x=100;m.ball.x=1200;m.ball.vx=1200;});
        await page.waitForFunction(()=>window.__jetclash.renderer.camera.zoom<1.1);assert.equal(await visible(),true);
        await page.evaluate(()=>{const m=window.__jetclash.match;m.player.x=1000;m.ball.x=1100;m.ball.y=200;m.ball.vx=0;});
        await page.waitForTimeout(350);
        assert.equal(await page.evaluate(async()=>{const {CONFIG:C}=await import('/src/config.js'),c=window.__jetclash.renderer.camera;return [C.goalTop,C.goalBottom].every(y=>c.project(C.goalRight,y).visible);}),true);
        await page.evaluate(()=>{const g=window.__jetclash;g.match.prepare();});
        await page.waitForFunction(()=>{const g=window.__jetclash;return g.match.training?g.renderer.camera.active:g.renderer.camera.zoom===1;});
        await page.locator('#leave-game').click();assert.equal(await page.evaluate(()=>window.__jetclash.renderer.camera.zoom),1);
        console.log(`Caméra ${mode} OK ${viewport.width}x${viewport.height} : zoom, suivi, frappe longue, cage, repères et retour, sans mutation physique.`);
      }
      assert.deepEqual(errors,[]);await context.close();
    }
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
