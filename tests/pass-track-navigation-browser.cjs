const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{for(const viewport of [{width:1440,height:900},{width:760,height:640},{width:390,height:844},{width:844,height:390}]){
  const mobile=viewport.width===390||viewport.height===390;
  const context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4173/?test=1');await page.waitForFunction(()=>!document.querySelector('#start').disabled);
  await page.locator('.mm-nav [data-route="pass"]').click();
  const track=page.locator('.sp-track'),next=page.locator('[data-pass-scroll="next"]'),previous=page.locator('[data-pass-scroll="previous"]');
  await track.scrollIntoViewIfNeeded();assert.equal(await previous.isDisabled(),true);
  const before=await page.evaluate(()=>JSON.stringify(window.__jetclash.match.profile.data));
  await next.click();await page.waitForFunction(()=>document.querySelector('.sp-track').scrollLeft>700);
  const step=await track.evaluate(el=>el.scrollLeft);assert.ok(step<1100);
  // Real arrow clicks, without assigning scrollLeft, must reach both ends.
  for(let i=0;i<12&&!(await next.isDisabled());i++){await next.click();await page.waitForTimeout(400);}
  assert.equal(await next.isDisabled(),true);
  assert.ok(await track.evaluate(el=>{const card=el.lastElementChild.getBoundingClientRect(),r=el.getBoundingClientRect();return card.left>=r.left-1&&card.right<=r.right+1;}));
  for(let i=0;i<12&&!(await previous.isDisabled());i++){await previous.click();await page.waitForTimeout(400);}
  assert.equal(await previous.isDisabled(),true);assert.ok(await track.evaluate(el=>el.scrollLeft<=1));
  await track.evaluate(el=>el.scrollIntoView({block:'start'}));const box=await track.boundingBox();await page.mouse.move(box.x+box.width/2,Math.max(box.y+100,180));await page.mouse.wheel(0,450);
  await page.waitForFunction(()=>document.querySelector('.sp-track').scrollLeft>300);
  await page.mouse.wheel(0,-900);await page.waitForFunction(()=>document.querySelector('.sp-track').scrollLeft<=1);
  if(mobile){
   // Native touch input through the browser, rather than synthetic DOM events.
   const cdp=await context.newCDPSession(page);
   const r=await track.boundingBox(),x=r.x+r.width-25,y=Math.max(r.y+100,180);
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
   for(let i=1;i<=8;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x-i*25,y}]});
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   await page.waitForFunction(()=>document.querySelector('.sp-track').scrollLeft>50);
  }
  assert.equal(await page.evaluate(()=>JSON.stringify(window.__jetclash.match.profile.data)),before);
  // Available reward: drag starting on its button must not claim it.
  await page.evaluate(()=>window.__jetclash.match.profile.pass.addXp(50000));
  await page.waitForFunction(()=>!document.querySelector('[data-pass-claim="2"][data-pass-track="free"]').disabled);
  let claim=page.locator('[data-pass-claim="2"][data-pass-track="free"]');await claim.scrollIntoViewIfNeeded();
  const b=await claim.boundingBox();await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.down();await page.mouse.move(b.x+b.width/2-100,b.y+b.height/2,{steps:10});await page.mouse.up();
  assert.equal(await page.evaluate(()=>window.__jetclash.match.profile.data.pass.claimed.length),0);
  claim=page.locator('[data-pass-claim="2"][data-pass-track="free"]');await claim.click();
  assert.equal(await page.evaluate(()=>window.__jetclash.match.profile.data.coins),100);
  assert.equal(await page.evaluate(()=>window.__jetclash.match.profile.data.pass.claimed.length),1);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);
  console.log(`Navigation Pass OK ${viewport.width}x${viewport.height} : flèches 1 → 50 → 1, molette, ${mobile?'swipe, ':''}drag sans réclamation, clic Récupérer`);
  await context.close();
 }}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
