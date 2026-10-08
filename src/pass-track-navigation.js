// Navigation only: this module never reads or changes profile data.
export function bindPassTrackNavigation(container){
  const track=container.querySelector('.sp-track');
  if(!track)return;
  const previous=container.querySelector('[data-pass-scroll="previous"]');
  const next=container.querySelector('[data-pass-scroll="next"]');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const behavior=reduced?'instant':'smooth';
  const limit=()=>Math.max(0,track.scrollWidth-track.clientWidth);
  const update=()=>{previous.disabled=track.scrollLeft<=1;next.disabled=track.scrollLeft>=limit()-1;};
  let wheelTarget=null,wheelTime=0,gesture=null,suppressClick=false;
  const scrollTo=left=>track.scrollTo({left:Math.max(0,Math.min(limit(),left)),behavior});
  for(const button of [previous,next])button.addEventListener('click',()=>{
    wheelTarget=null;
    const card=track.querySelector('.sp-level');
    const step=(card.getBoundingClientRect().width+parseFloat(getComputedStyle(track).columnGap))*5;
    scrollTo(track.scrollLeft+(button===next?step:-step));
  });
  track.addEventListener('wheel',event=>{
    if(event.ctrlKey||event.deltaX||!event.deltaY)return;
    event.preventDefault();
    const now=performance.now();
    if(wheelTarget===null||now-wheelTime>250)wheelTarget=track.scrollLeft;
    const unit=event.deltaMode===1?16:event.deltaMode===2?track.clientWidth:1;
    wheelTarget=Math.max(0,Math.min(limit(),wheelTarget+event.deltaY*unit));wheelTime=now;
    scrollTo(wheelTarget);
  },{passive:false});
  track.addEventListener('dragstart',event=>event.preventDefault());
  track.addEventListener('pointerdown',event=>{
    if(!event.isPrimary||event.button!==0)return;
    // Leave the native scrollbar to the browser.
    const rect=track.getBoundingClientRect();
    if(event.clientY>=rect.top+track.clientHeight)return;
    suppressClick=false;wheelTarget=null;
    gesture={id:event.pointerId,type:event.pointerType,x:event.clientX,y:event.clientY,left:track.scrollLeft,dragging:false};
  });
  track.addEventListener('pointermove',event=>{
    if(!gesture||event.pointerId!==gesture.id)return;
    const dx=event.clientX-gesture.x,dy=event.clientY-gesture.y;
    if(!gesture.dragging&&Math.abs(dx)>8&&Math.abs(dx)>Math.abs(dy)){
      gesture.dragging=true;suppressClick=true;
      if(gesture.type==='mouse'){
        track.scrollTo({left:track.scrollLeft,behavior:'instant'});
        track.setPointerCapture(event.pointerId);track.classList.add('sp-dragging');
      }
    }
    if(gesture.dragging&&gesture.type==='mouse'){
      event.preventDefault();track.scrollLeft=gesture.left-dx;
    }
  });
  const end=()=>{gesture=null;track.classList.remove('sp-dragging');};
  track.addEventListener('pointerup',end);
  track.addEventListener('pointercancel',end);
  track.addEventListener('lostpointercapture',end);
  track.addEventListener('click',event=>{
    if(suppressClick&&event.detail!==0){event.preventDefault();event.stopImmediatePropagation();suppressClick=false;}
  },true);
  track.addEventListener('scroll',update,{passive:true});
  const resize=new ResizeObserver(update);
  resize.observe(track);update();
  return ()=>resize.disconnect();
}
