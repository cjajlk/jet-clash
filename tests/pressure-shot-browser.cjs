const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
(async()=>{
  const browser=await chromium.launch({headless:true,channel:'msedge'});
  try{
    const page=await browser.newPage({viewport:{width:1440,height:1120}}),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.addInitScript(()=>{
      window.pad={index:0,id:'DualSense Wireless Controller',connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({value:0}))};
      Object.defineProperty(navigator,'getGamepads',{value:()=>[window.pad]});
    });
    await page.goto('http://127.0.0.1:4173/?test=1');await page.waitForFunction(()=>!document.querySelector('#start').disabled);
    await page.click('#start');await page.waitForFunction(()=>window.__jetclash.match.state==='PLAYING');
    await page.evaluate(()=>{
      const m=window.__jetclash.match;m.control.reset();
      Object.assign(m.player,{x:300,y:606,vx:0,vy:0,grounded:true,facing:1});
      Object.assign(m.ball,{x:338,y:625,vx:0,vy:0});Object.assign(m.bot,{x:376,y:606,vx:0,vy:0,grounded:true,facing:-1});
      m.ai.update=()=>({axis:-1});window.pad.axes=[1,0,1,-1];
      window.samples=[];const render=window.__jetclash.renderer.render.bind(window.__jetclash.renderer);
      window.__jetclash.renderer.render=m=>{if(m.control.charging)window.samples.push({charge:m.control.charge,visible:!!m.control.indicator});render(m);};
    });
    await page.waitForFunction(()=>window.__jetclash.match.control.pressure);
    assert.ok(await page.evaluate(()=>{const a=window.__jetclash.match.control.indicator;return a.x>0&&a.y<0;}));
    await page.evaluate(()=>window.pad.buttons[2].value=1);
    await page.waitForFunction(()=>window.__jetclash.match.control.charge>.2);
    await page.screenshot({path:'work/pressure-charge-partial.png'});
    await page.waitForFunction(()=>window.__jetclash.match.control.charge===.7);
    await page.screenshot({path:'work/pressure-charge-full.png'});
    const samples=await page.evaluate(()=>window.samples);
    assert.ok(samples.length>10&&samples.every(s=>s.visible));assert.ok(samples.some(s=>s.charge<.2));assert.ok(samples.some(s=>s.charge===.7));
    await page.evaluate(()=>window.pad.buttons[2].value=0);
    await page.waitForFunction(()=>window.__jetclash.match.control.indicator===null);
    await page.waitForFunction(()=>window.__jetclash.match.ball.y<570);
    assert.equal(await page.evaluate(()=>window.__jetclash.match.boundaryRecoveries),0);
    await page.screenshot({path:'work/pressure-shot-release.png'});
    assert.deepEqual(errors,[]);console.log('Pressure PS5 browser PASS: simultaneous contact, continuous aim/charge 0–0.7s, release and physical upward escape; no JS errors.');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
