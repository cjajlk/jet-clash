import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {TouchInput,combineTouch} from '../src/touch-input.js';
import {TouchControls} from '../src/touch-controls.js';
import {BallInput} from '../src/ball-input.js';
import {BallControl} from '../src/ball-control.js';
import {controlSettings} from '../src/control-settings.js';
import {createPlayer} from '../src/player.js';
import {createBall} from '../src/ball.js';

function fixture(){
  const t=new TouchInput(),handlers={},captures=[];
  const el={dataset:{touch:'shoot'},rect:{left:600,top:200,width:60,height:60},getBoundingClientRect(){return this.rect;},addEventListener(n,f){handlers[n]=f;},setPointerCapture(id){captures.push(id);}};
  TouchControls.prototype.bind.call({input:t,active:true,portrait:false,paint(){}},el);
  const event=(name,id,x,y)=>handlers[name]({pointerId:id,pointerType:'touch',clientX:x,clientY:y,preventDefault(){}});
  return {t,el,event,captures};
}
const vectors=[[1,0],[-1,0],[0,-1],[0,1],[1,1],[1,-1],[-1,1],[-1,-1]];
for(const [x,y] of vectors)test(`TIR réel : direction ${x},${y}, maintien, centre et relâchement identiques manette`,()=>{
  const {t,event}=fixture();event('pointerdown',1,630,230);event('pointermove',1,630+x*60,230+y*60);
  const pad={index:0,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:[]};
  const offset=controlSettings.gamepad.movementStick==='left'?0:2;pad.axes[offset]=x;pad.axes[offset+1]=y;pad.buttons[controlSettings.gamepad.shoot]={pressed:true};
  const bi=new BallInput({addEventListener(){}},{getGamepads:()=>[pad]},()=>{}),ref=bi.read(0);
  const p=Object.assign(createPlayer('fluid'),{x:300,y:606}),a=Object.assign(createBall(),{x:339,y:625,vx:0,vy:0}),b={...a},ca=new BallControl(),cb=new BallControl();
  for(let k=0;k<100;k++){const i=t.read();assert.equal(i.aimX,ref.aimX);assert.equal(i.aimY,ref.aimY);ca.update(p,a,i,1/120);cb.update(p,b,ref,1/120);}
  assert.equal(ca.charge,.7);event('pointermove',1,630,230);assert.equal(t.read().aimX,ref.aimX);
  event('pointerup',1,630,230);const release=t.read();assert.equal(release.aimY,ref.aimY);ca.update(p,a,release,1/120);cb.update(p,b,{...ref,shoot:false},1/120);assert.deepEqual(a,b);
});
test('TIR : propriétaire exclusif, déplacement + BOOST + TIR, capture hors bouton',()=>{
  const {t,event,captures}=fixture();t.start(10,'move',-1,0);t.start(11,'boost');event('pointerdown',1,630,230);event('pointermove',1,730,130);event('pointerdown',2,610,230);event('pointermove',2,500,230);event('pointerup',2,500,230);
  assert.deepEqual(captures,[1]);const i=t.read();assert.equal(i.axis,-1);assert.ok(i.boost&&i.shoot&&i.aimX>0&&i.aimY<0);assert.equal(t.pointers.size,3);t.end(11);assert.equal(t.pointers.size,2);assert.ok(t.read().shoot);
});
for(const name of ['pointercancel','lostpointercapture'])test(`TIR : ${name} annule sans frappe`,()=>{
  const {t,event}=fixture();const c=new BallControl(),p=Object.assign(createPlayer('fluid'),{x:300,y:606}),b=Object.assign(createBall(),{x:339,y:625,vx:0,vy:0});event('pointerdown',1,630,230);event('pointermove',1,600,180);c.update(p,b,t.read(),.5);event(name,1,600,180);c.update(p,b,t.read(),1/120);assert.equal(c.charging,false);assert.equal(c.pendingShot,null);assert.equal(b.flash,0);
});
test('TIR : centre réel après changement de dimensions fullscreen / portrait / zoom CSS',()=>{
  const {t,event,el}=fixture();for(const rect of [{left:30,top:80,width:90,height:90},{left:750,top:250,width:48,height:48},{left:150,top:600,width:120,height:120}]){
    t.clear();el.rect=rect;const cx=rect.left+rect.width/2,cy=rect.top+rect.height/2;
    event('pointerdown',1,cx+rect.width*.3,cy);assert.equal(t.read().aimX,1);event('pointermove',1,cx,cy-rect.height);assert.equal(t.read().aimY,-1);event('pointerup',1,cx,cy-rect.height);
  }
});
test('TIR : aucune frappe à distance, même chargé et visé',()=>{
  const t=new TouchInput(),c=new BallControl(),p=Object.assign(createPlayer('fluid'),{x:300,y:606}),b=Object.assign(createBall(),{x:900,y:300,vx:0,vy:0});t.start(1,'shoot',-1,-1);c.update(p,b,t.read(),.7);t.end(1);c.update(p,b,t.read(),1/120);for(let i=0;i<40;i++){c.finishContacts(b,p,false);c.update(p,b,{},1/120);}assert.equal(b.vx,0);assert.equal(b.vy,0);
});
test('main : relâchement entre deux ticks conserve direction ET intention',()=>{
  // Execute the actual frame input assembly across render frames without a physics tick.
  const source=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');const code=source.slice(source.indexOf('  const touch=mobile.input.read();'),source.indexOf('  controlsHelp.update(input);'))+'\nresult=controls;';
  const t=new TouchInput(),ctx={mobile:{input:t},touchCancelled:false,touchReleaseAim:null,input:{read:()=>({}),readBallControls:()=>({}),gamepad:{status:{connected:false}}},combineTouch,result:null};
  t.start(1,'shoot',0,-1);t.end(1);runInNewContext('{'+code+'}',ctx);runInNewContext('{'+code+'}',ctx);runInNewContext('{'+code+'}',ctx);assert.equal(ctx.result.aimY,-1);assert.equal(ctx.result.aimIntent,true);
  const c=new BallControl(),p=Object.assign(createPlayer('fluid'),{x:300,y:606}),b=Object.assign(createBall(),{x:339,y:625,vx:0,vy:0});c.update(p,b,{shoot:true,aimIntent:true,aimY:-1},.7);c.update(p,b,ctx.result,1/120);assert.ok(b.vy<-900);assert.equal(b.vx,0);
});

