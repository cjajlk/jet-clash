const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,channel:'msedge'});try{
 const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>navigator.getGamepads=()=>[]);await page.goto('http://127.0.0.1:4173/?test=1');await page.waitForFunction(()=>!document.querySelector('#start').disabled);
 await page.locator('#mobile-play').click();await page.locator('#mobile-training').click();await page.locator('#arena').focus();
 const start=await page.evaluate(()=>window.__jetclash.match.player.x);
 await page.keyboard.down('ArrowRight');await page.waitForTimeout(450);await page.keyboard.up('ArrowRight');
 assert.ok(await page.evaluate(x=>window.__jetclash.match.player.x>x+60,start));
 const groundY=await page.evaluate(()=>window.__jetclash.match.player.y);
 await page.keyboard.down('Space');await page.waitForTimeout(80);await page.keyboard.up('Space');await page.waitForTimeout(80);assert.ok(await page.evaluate(y=>window.__jetclash.match.player.y<y-25,groundY));
 await page.keyboard.down('ShiftLeft');await page.waitForTimeout(250);await page.keyboard.up('ShiftLeft');assert.ok(await page.evaluate(()=>window.__jetclash.match.player.fuel<98));
 await page.keyboard.press('Space');await page.keyboard.press('KeyR');await page.keyboard.down('KeyF');await page.waitForTimeout(150);await page.keyboard.up('KeyF');
 console.log('Clavier réel : déplacement, saut, double saut, boost, flip et commande tir sans erreur');
 const report=await page.evaluate(()=>{const g=window.__jetclash;g.setPaused(true);const results=[];let seed=17;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 for(const mode of ['training','duel','2v2']){g.match.start(mode);let maxPlayer=0,maxBall=0,goals=0;const m=g.match;
 for(let i=0;i<21600;i++){const block=Math.floor(i/90),axis=block%3-1;const input={axis,directionX:axis,directionY:block%4===0?-1:0,jump:i%90===0||i%90===35,boost:block%5===0,rotate:i%240===0,backPose:block%7===0,shootHeld:i%180<30,shootPressed:i%180===0,shootReleased:i%180===30,aimX:axis||1,aimY:-.4};m.update(1/120,input);
 for(const p of m.players){if(![p.x,p.y,p.vx,p.vy,p.fuel].every(Number.isFinite))throw Error(mode+' non-finite player');if(p.fuel<0||p.fuel>100)throw Error('fuel bounds');maxPlayer=Math.max(maxPlayer,Math.hypot(p.vx,p.vy));}
 if(![m.ball.x,m.ball.y,m.ball.vx,m.ball.vy].every(Number.isFinite))throw Error(mode+' non-finite ball');maxBall=Math.max(maxBall,Math.hypot(m.ball.vx,m.ball.vy));
 }
 results.push({mode,simulatedSeconds:180,score:m.score,recoveries:m.boundaryRecoveries,maxPlayer:Math.round(maxPlayer),maxBall:Math.round(maxBall)});
 }return results;});
 for(const r of report){console.log(JSON.stringify(r));assert.equal(r.recoveries,0,'Unexpected out-of-bounds recovery');assert.ok(r.maxBall<=1100,'Ball exceeds speed limit after contacts');}
 assert.deepEqual(errors,[]);await page.close();
 const mobile=await browser.newPage({viewport:{width:844,height:390},isMobile:true,hasTouch:true});await mobile.addInitScript(()=>navigator.getGamepads=()=>[]);mobile.on('pageerror',e=>errors.push(e.message));await mobile.goto('http://127.0.0.1:4173/?test=1');await mobile.waitForFunction(()=>!document.querySelector('#start').disabled);await mobile.locator('#mobile-play').tap();await mobile.locator('#mobile-training').tap();await mobile.locator('[data-touch="jump"]').tap();await mobile.waitForTimeout(120);assert.ok(await mobile.evaluate(()=>window.__jetclash.match.player.y<500));
 const jet=await mobile.locator('[data-touch="boost"]').boundingBox();await mobile.mouse.move(jet.x+jet.width/2,jet.y+jet.height/2);await mobile.mouse.down();await mobile.waitForTimeout(200);await mobile.mouse.up();assert.ok(await mobile.evaluate(()=>window.__jetclash.match.player.fuel<100));
 await mobile.setViewportSize({width:390,height:844});await mobile.waitForTimeout(150);assert.equal(await mobile.locator('#touch-rotate').isVisible(),true);await mobile.setViewportSize({width:844,height:390});await mobile.waitForTimeout(150);assert.equal(await mobile.locator('#touch-rotate').isVisible(),false);console.log('Mobile : saut tactile, boost par pointeur, rotation portrait/paysage OK');assert.deepEqual(errors,[]);
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
