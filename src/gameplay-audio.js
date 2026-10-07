// Original procedural effects: no downloads, external assets or gameplay changes.
export function scheduleEffect(context, destination, kind, detail={}, register=()=>{}) {
  const now=context.currentTime;
  const tone=(type,frequency,endFrequency,start,duration,volume)=>{
    const source=context.createOscillator(),gain=context.createGain();
    source.type=type;
    source.frequency.setValueAtTime(frequency,now+start);
    source.frequency.exponentialRampToValueAtTime(endFrequency,now+start+duration);
    gain.gain.setValueAtTime(0,now+start);
    gain.gain.linearRampToValueAtTime(volume,now+start+.006);
    gain.gain.exponentialRampToValueAtTime(.0001,now+start+duration);
    source.connect(gain);gain.connect(destination);
    source.onended=()=>{source.disconnect();gain.disconnect();};
    register(source);source.start(now+start);source.stop(now+start+duration+.01);
  };
  if(kind==='shot'){
    const power=Math.max(0,Math.min(1,Number.isFinite(detail.power)?detail.power:.5));
    tone('triangle',210+power*100,55,0,.13+power*.05,.14);
    tone('sine',95,42,0,.18,.12);
    tone('triangle',1400+power*600,240,0,.075,.025+power*.025);
  }else if(kind==='goal'){
    const pitch=detail.scorer==='bot'?.75:1;
    tone('sine',100,38,0,.28,.12);
    for(const [index,note] of [392,523.25,783.99,1046.5].entries()){
      const start=index*.10,duration=index===3?.48:.22;
      tone('triangle',note*pitch,note*pitch,start,duration,.075);
      tone('sine',note*pitch*2,note*pitch*2,start,duration,.022);
    }
  }
}

export class GameplayAudio {
  constructor({enabled=true,onEnabledChange=()=>{},contextFactory}={}){
    this.enabled=enabled;this.onEnabledChange=onEnabledChange;
    this.contextFactory=contextFactory||(()=>{
      const AudioContext=globalThis.AudioContext||globalThis.webkitAudioContext;
      return AudioContext?new AudioContext():null;
    });
    this.context=null;this.master=null;this.paused=false;this.voices=new Set();
  }
  // Called on a user gesture. Never queue a sound while browser audio is locked.
  unlock(){
    if(!this.enabled||this.paused)return;
    try{
      if(!this.context){
        this.context=this.contextFactory();if(!this.context)return;
        this.master=this.context.createGain();this.master.gain.value=.45;
        this.master.connect(this.context.destination);
      }
      if(this.context.state==='suspended')this.context.resume().catch(()=>{});
    }catch{this.context=null;this.master=null;}
  }
  play(kind,detail={}){
    if(!this.enabled||this.paused||this.context?.state!=='running'||!['shot','goal'].includes(kind))return false;
    try{
      scheduleEffect(this.context,this.master,kind,detail,source=>{
        this.voices.add(source);
        source.addEventListener('ended',()=>this.voices.delete(source),{once:true});
      });
      return true;
    }catch{return false;}
  }
  stop(){
    for(const source of this.voices){try{source.stop();}catch{}}
    this.voices.clear();
  }
  setPaused(value){
    this.paused=!!value;
    if(this.paused){this.stop();try{this.context?.suspend().catch(()=>{});}catch{}}
    else this.unlock();
  }
  setEnabled(value){
    this.enabled=!!value;
    if(this.enabled)this.unlock();else this.stop();
    this.onEnabledChange(this.enabled);
  }
}
