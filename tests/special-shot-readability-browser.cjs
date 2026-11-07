const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');const assert=require('node:assert/strict');require('node:fs').mkdirSync('work',{recursive:true});
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{for(const width of [844,1440]){
 const page=await browser.newPage({viewport:{width,height:width===844?390:900},hasTouch:width===844}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>Object.defineProperty(navigator,'getGamepads',{value:()=>[]}));await page.goto('http://127.0.0.1:4173/?test=1');await page.waitForFunction(()=>window.__jetclash&&!document.querySelector('#start').disabled);
 await page.locator('#mobile-play').click();await page.locator('[data-select-mode="training"]').click();await page.locator('[data-launch-tutorial]').click();
 const panel=page.locator('.tutorial-panel:not(.drill-panel)');await panel.waitFor({state:'visible'});
 await page.evaluate(()=>{__jetclash.setPaused(true);document.querySelector('#pause').hidden=true;__jetclash.tutorial.stop();});
 for(const type of ['gold','purple'])for(const mode of ['aimed','impulse']){
 const labels=await page.evaluate(async({type,mode})=>{
 const g=__jetclash,m=g.match,p=m.player,b=m.ball;const {prepareAerialShot,applyAerialShot}=await import('/src/aerial-shots.js');m.prepare({countdown:false});
 Object.assign(p,{x:600,y:300,grounded:false,contactSurface:null,footX:0,footY:1,facing:1,backPoseHeld:false,vx:0,vy:0});Object.assign(b,{x:type==='gold'?550:600,y:type==='gold'?300:368,vx:0,vy:0});
 m.control.update(p,b,{},0);g.contactFeedback.reset();g.contactFeedback.update(m,0);const ready=g.contactFeedback.specialType;
 if(mode==='aimed'){m.control.update(p,b,{shoot:true,aimX:1,aimY:-1,aimIntent:true},.35);m.control.update(p,b,{aimX:1,aimY:-1,aimIntent:true},0);}else{applyAerialShot(p,b,prepareAerialShot(p,b,{jump:true,axis:type==='gold'?1:0}));}
 g.contactFeedback.update(m,0);const result=g.contactFeedback.resultLabel,text=[],c=g.renderer.ctx,fill=c.fillText;c.fillText=function(label,...args){text.push(label);return fill.call(this,label,...args);};g.renderer.render(m);c.fillText=fill;
 return {ready,result,text,mode:b.shotMode};},{type,mode});assert.equal(labels.ready,type);assert.equal(labels.mode,mode);assert.ok(labels.text.includes(labels.result));assert.ok(labels.result.endsWith(mode==='aimed'?'VISÉ':'IMPULSION'));
 await page.screenshot({path:`work/special-${width}-${type}-${mode}.png`});
 }
 await page.evaluate(()=>{__jetclash.tutorial.start();__jetclash.tutorial.step=3;__jetclash.tutorial.setup();});assert.match(await panel.textContent(),/impulsion fixe/);
 await page.evaluate(()=>{__jetclash.tutorial.step=4;__jetclash.tutorial.setup();});assert.match(await panel.textContent(),/viser librement/);
 assert.deepEqual(errors,[]);console.log(`${width}: gold/purple contact, aimed/impulse labels, canvas rendering and tutorial PASS`);await page.close();
}}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
