const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,channel:'msedge'});try{
 const context=await browser.newContext({viewport:{width:1280,height:720}}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(()=>navigator.getGamepads=()=>[]);await page.goto('http://127.0.0.1:4173/?test=1');await page.waitForFunction(()=>!document.querySelector('#start').disabled);
 await page.locator('#mobile-play').click();await page.locator('#mobile-training').click();
 for(const skin of ['fluid','heavy'])for(const side of ['left','right']){
  const result=await page.evaluate(async({skin,side})=>{
   const g=window.__jetclash,{CONFIG:C}=await import('/src/config.js'),{createPlayer,drive}=await import('/src/player.js'),{movePlayer}=await import('/src/physics.js'),{solids}=await import('/src/arena.js');
   g.setPaused(true);document.querySelector('#pause').hidden=true;
   const sign=side==='left'?-1:1,line=sign<0?C.goalLeft:C.goalRight,p=createPlayer(skin);
   Object.assign(p,{x:line-sign*230,y:C.floor-p.h/2,grounded:true,contactSurface:'floor'});
   for(let i=0;i<240;i++){drive(p,{axis:sign},C.step);movePlayer(p,solids,C.step);}
   const inside=sign*(p.x-line)>p.w/2,position={x:p.x,y:p.y};
   Object.assign(g.match.player,p);g.renderer.render(g.match,{dt:1});
   return {inside,position};
  },{skin,side});
  assert.equal(result.inside,true);
  if(process.env.GOAL_SCREENSHOTS)await page.screenshot({path:`${process.env.GOAL_SCREENSHOTS}/goal-entry-${skin}-${side}.png`});
  console.log(`${skin} ${side}: corps entier dans cage x=${result.position.x}, y=${result.position.y}`);
 }
 // Actual keyboard input in the running game, without substituting collision logic.
 for(const side of ['left','right']){
  await page.evaluate(async side=>{const g=window.__jetclash,{CONFIG:C}=await import('/src/config.js');g.match.start('training');Object.assign(g.match.player,{x:side==='left'?400:880,y:C.floor-C.playerHeight/2});g.setPaused(false);},side);
  await page.locator('#arena').focus();const key=side==='left'?'ArrowLeft':'ArrowRight';await page.keyboard.down(key);await page.waitForTimeout(2200);await page.keyboard.up(key);
  const inside=await page.evaluate(async side=>{const {CONFIG:C}=await import('/src/config.js');const p=window.__jetclash.match.player;return side==='left'?p.x+p.w/2<C.goalLeft:p.x-p.w/2>C.goalRight;},side);
  assert.equal(inside,true,`keyboard ${side}`);console.log(`Marche clavier ${side} : entrée réelle OK`);
 }
 assert.deepEqual(errors,[]);await context.close();
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
