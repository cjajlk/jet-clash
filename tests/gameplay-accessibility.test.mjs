import test from 'node:test';
import assert from 'node:assert/strict';
import {TrainingDrill} from '../src/training-drills.js';
import {ContactFeedback} from '../src/contact-feedback.js';
import {Match} from '../src/match.js';
import {ProfileStore} from '../src/profile-store.js';
import {controlSettings} from '../src/control-settings.js';
const dt=1/120;
function scene(id){let drill;const m=new Match(new ProfileStore({getItem(){},setItem(){}}),kind=>drill?.onEvent(kind));m.start('training');drill=new TrainingDrill(m);drill.start(id);drill.begin();return {m,drill,tick(input={}){drill.before(input);m.update(dt,input);drill.after(input,dt);}};}
test('exercice cible : vraie frappe puis traversée, aucun succès à la seule charge',()=>{
 const {m,drill,tick}=scene('target');for(let i=0;i<8;i++)tick({shoot:true,aimX:1,aimY:-.55,aimIntent:true});assert.equal(drill.done,false);tick({aimX:1,aimY:-.55,aimIntent:true});for(let i=0;i<100&&!drill.done;i++)tick();assert.equal(drill.done,true);assert.equal(m.profile.data.xp,0);drill.retry();assert.equal(drill.done,false);assert.equal(drill.fired,false);assert.equal(drill.time,0);
});
test('exercice arrêt : une interception réelle renvoie le ballon',()=>{
 const {drill,tick}=scene('save');for(let i=0;i<80&&!drill.done;i++)tick({shoot:i<25,aimX:1,aimY:0,aimIntent:true});assert.equal(drill.done,true);
});
test('exercice rebond : récupérer puis consommer le saut en vol',()=>{
 const {drill,tick}=scene('reset');for(let i=0;i<80&&!drill.resetEarned;i++)tick();assert.equal(drill.resetEarned,true);assert.equal(drill.done,false);tick({jump:true});assert.equal(drill.done,true);
});
test('exercice : expiration, remise en place et sortie sans récompense',()=>{
 const {m,drill,tick}=scene('target');for(let i=0;i<1250;i++)tick();assert.equal(drill.failed,true);assert.equal(drill.done,false);drill.retry();assert.equal(drill.failed,false);drill.stop();assert.equal(m.trainingExercise,null);assert.equal(m.score.player,0);assert.equal(m.profile.data.xp,0);
});
test('signal contact : précharge éloignée distincte du contact réel et aucun changement physique',()=>{
 const {m}=scene('target'),sounds=[],f=new ContactFeedback(x=>sounds.push(x));m.ball.x=1000;m.control.update(m.player,m.ball,{shoot:true},dt);const before=JSON.stringify([m.player,m.ball]);f.update(m,dt);assert.equal(f.contact,false);assert.equal(JSON.stringify([m.player,m.ball]),before);m.ball.x=679;f.update(m,dt);assert.equal(f.contact,true);assert.deepEqual(sounds,[]);
});
test('signal saut récupéré : une seule notification par nouveau contact aérien',()=>{
 const {m}=scene('reset'),sounds=[],f=new ContactFeedback(x=>sounds.push(x));m.player.aerialContactLatched=true;for(let i=0;i<10;i++)f.update(m,dt);assert.deepEqual(sounds,['reset']);assert.ok(f.resetTime>0);m.player.aerialContactLatched=false;f.update(m,dt);m.player.aerialContactLatched=true;f.update(m,dt);assert.deepEqual(sounds,['reset','reset']);m.state='MENU';f.update(m,dt);assert.equal(f.contact,false);assert.equal(f.resetTime,0);
});
test('disposition simple et avancée indépendantes du miroir',()=>{try{controlSettings.setTouchLayout('mirrored');controlSettings.setTouchPreset('simple');assert.equal(controlSettings.touch.preset,'simple');assert.equal(controlSettings.touch.layout,'mirrored');controlSettings.setTouchPreset('advanced');assert.equal(controlSettings.touch.preset,'advanced');assert.equal(controlSettings.touch.layout,'mirrored');}finally{controlSettings.reset();}});
