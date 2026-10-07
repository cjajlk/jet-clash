const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
  const browser=await chromium.launch({headless:true,channel:'msedge'});
  try{
    for(const viewport of [{width:1280,height:720},{width:390,height:844},{width:844,height:390}]){
      const context=await browser.newContext({viewport}),page=await context.newPage(),errors=[];
      page.on('pageerror',e=>errors.push(e.message));
      await page.goto('http://127.0.0.1:4173/?test=1');await page.waitForFunction(()=>!document.querySelector('#start').disabled);
      assert.equal(await page.evaluate(()=>window.__jetclash.audio.context),null);
      await page.locator('.mm-gear').click();
      await page.waitForFunction(()=>window.__jetclash.audio.context?.state==='running');
      await page.evaluate(()=>{
        const {audio,setPaused}=window.__jetclash;setPaused(true);audio.setPaused(false);
        window.soundEvents=[];const play=audio.play.bind(audio);
        audio.play=(kind,detail)=>{const played=play(kind,detail);if(played)window.soundEvents.push(kind);return played;};
      });
      await page.waitForFunction(()=>window.__jetclash.audio.context.state==='running');
      await page.evaluate(()=>{
        const m=window.__jetclash.match;m.start();m.state='PLAYING';
        Object.assign(m.player,{x:600,y:350,grounded:true,footX:0,footY:1,controlX:1,controlY:0});
        Object.assign(m.ball,{x:625,y:340,vx:0,vy:0});
        m.control.update(m.player,m.ball,{shoot:true},.35);
        m.control.update(m.player,m.ball,{},1/120);
        m.control.update(m.player,m.ball,{},1/120);
        m.goal('player');m.goal('player');m.menu();
      });
      assert.deepEqual(await page.evaluate(()=>window.soundEvents),['shot','goal']);
      await page.locator('.mm-gear').click();await page.locator('[data-toggle-sound]').click();
      assert.equal(await page.locator('[data-toggle-sound]').getAttribute('aria-pressed'),'false');
      assert.equal(await page.evaluate(()=>window.__jetclash.audio.voices.size),0);
      assert.equal(await page.evaluate(()=>window.__jetclash.audio.play('goal')),false);
      assert.equal(await page.evaluate(()=>window.__jetclash.match.profile.data.settings.sound),false);
      await page.reload();await page.waitForFunction(()=>!document.querySelector('#start').disabled);
      assert.equal(await page.evaluate(()=>window.__jetclash.audio.enabled),false);
      await page.locator('.mm-gear').click();await page.locator('[data-toggle-sound]').click();
      await page.waitForFunction(()=>window.__jetclash.audio.context?.state==='running');
      assert.equal(await page.evaluate(()=>window.__jetclash.match.profile.data.settings.sound),true);
      await page.evaluate(()=>window.__jetclash.setPaused(true));
      assert.equal(await page.evaluate(()=>window.__jetclash.audio.play('shot')),false);
      assert.deepEqual(errors,[]);
      console.log(`Audio navigateur OK : ${viewport.width}x${viewport.height}, activation, tirs/buts uniques, pause et choix persistant.`);
      if(process.env.AUDIO_OUTPUT_DIR&&viewport.width===1280){
        for(const kind of ['shot','goal']){
          const rendered=await page.evaluate(async kind=>{
            const {scheduleEffect}=await import('/src/gameplay-audio.js');
            const context=new OfflineAudioContext(1,44100,44100),gain=context.createGain();
            gain.gain.value=.45;gain.connect(context.destination);scheduleEffect(context,gain,kind,{power:.75,scorer:'player'});
            const buffer=await context.startRendering(),samples=buffer.getChannelData(0);
            let peak=0,energy=0;for(const sample of samples){peak=Math.max(peak,Math.abs(sample));energy+=sample*sample;}
            return {samples:Array.from(samples),peak,energy};
          },kind);
          assert.ok(rendered.peak>.005&&rendered.peak<1);assert.ok(rendered.energy>0);
          const samples=rendered.samples,buffer=Buffer.alloc(44+samples.length*2);
          buffer.write('RIFF',0);buffer.writeUInt32LE(buffer.length-8,4);buffer.write('WAVEfmt ',8);
          buffer.writeUInt32LE(16,16);buffer.writeUInt16LE(1,20);buffer.writeUInt16LE(1,22);
          buffer.writeUInt32LE(44100,24);buffer.writeUInt32LE(88200,28);buffer.writeUInt16LE(2,32);buffer.writeUInt16LE(16,34);
          buffer.write('data',36);buffer.writeUInt32LE(samples.length*2,40);
          samples.forEach((sample,index)=>buffer.writeInt16LE(Math.round(Math.max(-1,Math.min(1,sample))*32767),44+index*2));
          fs.mkdirSync(process.env.AUDIO_OUTPUT_DIR,{recursive:true});
          fs.writeFileSync(require('node:path').join(process.env.AUDIO_OUTPUT_DIR,`JetClash-${kind==='shot'?'tir':'but'}.wav`),buffer);
          console.log(`Effet ${kind} rendu, pic ${rendered.peak.toFixed(3)}, aucun écrêtage.`);
        }
      }
      await context.close();
    }
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
