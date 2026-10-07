const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,channel:'msedge'});try{
for(const viewport of [{width:1280,height:720},{width:390,height:844},{width:844,height:390}]){
const context=await browser.newContext({viewport}),page=await context.newPage(),errors=[];
page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:4173/?test=1');await page.waitForFunction(()=>!document.querySelector('#start').disabled);
await page.locator('.mm-nav [data-route="challenges"]').click();
assert.equal(await page.locator('.mm-challenges article').count(),9);
assert.equal(await page.locator('.mm-challenges progress').count(),9);
await page.evaluate(()=>window.__jetclash.match.profile.challenges.record('goals',3));
await page.waitForFunction(()=>document.querySelector('.mm-challenges').textContent.includes('250 XP de saison'));
assert.equal(await page.locator('.mm-challenges .mm-soon').filter({hasText:'TERMINÉ'}).count(),2);
await page.locator('.mm-challenges').evaluate(el=>el.scrollTop=el.scrollHeight);
assert.ok(await page.locator('.mm-nav').isVisible());
assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
const last=await page.locator('.mm-challenges article').last().boundingBox();
assert.ok(last.y>=0&&last.y+last.height<=viewport.height);
await page.reload();await page.waitForFunction(()=>!document.querySelector('#start').disabled);await page.locator('.mm-nav [data-route="challenges"]').click();
assert.ok((await page.locator('.mm-challenges').textContent()).includes('250 XP de saison'));
await page.evaluate(()=>window.__jetclash.match.profile.challenges.record('goals'));
assert.equal(await page.evaluate(()=>window.__jetclash.match.profile.data.seasonXp),250);
assert.deepEqual(errors,[]);await context.close();console.log(`Défis navigateur OK : ${viewport.width}x${viewport.height}`);
}
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
