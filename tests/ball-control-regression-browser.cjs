// Deterministic browser regression checks using the game's actual modules and profile.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
(async()=>{
  const browser=await chromium.launch({headless:true,channel:'msedge'});
  try{
    const context=await browser.newContext({viewport:{width:1280,height:720}}),page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:4173/?test=1');await page.waitForFunction(()=>!document.querySelector('#start').disabled);
    const result=await page.evaluate(async()=>{
      const [{BallControl},{createPlayer},{createBall},{CONFIG:C}]=await Promise.all([
        import('/src/ball-control.js'),import('/src/player.js'),import('/src/ball.js'),import('/src/config.js'),
      ]);
      const shots=[];
      for(const facing of [-1,1]){
        const p=createPlayer('fluid'),b=createBall(),control=new BallControl();
        Object.assign(p,{x:600,y:C.floor-p.h/2,grounded:true,facing,controlX:facing});
        Object.assign(b,{x:p.x+25*facing,y:p.y-10,vx:0,vy:0});
        control.update(p,b,{shoot:true},C.step);control.update(p,b,{},C.step);
        shots.push({vx:b.vx,vy:b.vy});
      }
      const p=createPlayer('fluid'),b=createBall(),control=new BallControl();
      Object.assign(p,{x:600,y:C.floor-p.h/2,grounded:true});Object.assign(b,{x:625,y:p.y-10,vx:0,vy:0});
      control.update(p,b,{shoot:true},.35);control.finishContacts(b,p,true);b.x=850;
      control.update(p,b,{},C.step);control.finishContacts(b,p,false);
      const distant={vx:b.vx,vy:b.vy,pending:!!control.pendingShot};
      window.__jetclash.setPaused(true);const m=window.__jetclash.match;m.start();
      for(let i=0;i<2;i++){
        m.state='PLAYING';Object.assign(m.ball,{x:C.goalRight+m.ball.r*C.goalEntryRadiusFactor+1,y:(C.goalTop+C.goalBottom)/2,vx:0,vy:0});
        m.update(C.step);
      }
      m.state='PLAYING';m.finish();const seasonXp=m.profile.data.seasonXp,xp=m.profile.data.xp;
      m.finish();m.menu();return {shots,distant,xp,seasonXp,afterRepeat:m.profile.data.seasonXp};
    });
    assert.ok(result.shots[0].vx< -520);assert.ok(result.shots[1].vx>520);
    assert.equal(result.shots[0].vy,0);assert.equal(result.shots[1].vy,0);
    assert.deepEqual(result.distant,{vx:0,vy:0,pending:true});
    assert.equal(result.xp,170);assert.equal(result.seasonXp,350);assert.equal(result.afterRepeat,350);
    await page.locator('.mm-nav [data-route="challenges"]').click();
    await page.waitForFunction(()=>document.querySelector('.mm-challenges').textContent.includes('350 XP de saison'));
    await page.reload();await page.waitForFunction(()=>!document.querySelector('#start').disabled);
    assert.equal(await page.evaluate(()=>window.__jetclash.match.profile.data.xp),170);
    assert.equal(await page.evaluate(()=>window.__jetclash.match.profile.data.seasonXp),350);
    assert.deepEqual(errors,[]);
    console.log('Régressions navigateur OK : tirs gauche/droite, aucun tir distant, buts/match/victoire, récompenses uniques et sauvegarde.');
    await context.close();
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
