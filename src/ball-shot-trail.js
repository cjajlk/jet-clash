// One authored trail per special shot; canvas fallback while images are unavailable.
export function drawBallShotTrail(c,b,image=null){
  if(!(b.shotTimer>0)||!['gold','purple'].includes(b.shotColor))return;
  if(image?.width&&image?.height){
    const width=b.r*6,height=width*image.height/image.width;
    c.save();c.translate(b.x,b.y);c.rotate(Math.atan2(b.vy,b.vx));
    c.globalAlpha=Math.min(1,b.shotTimer/.25);
    // The bright leading tip overlaps the ball; the tail extends behind its velocity.
    c.drawImage(image,-width+b.r*.7,-height/2,width,height);c.restore();return;
  }
  const color=b.shotColor==='gold'?'#ffd34d':'#b75cff';
  const points=[...(b.shotTrail||[]),{x:b.x,y:b.y}];
  c.save();c.lineCap='round';c.lineJoin='round';c.strokeStyle=color;c.shadowColor=color;c.shadowBlur=22;
  const fade=Math.min(1,b.shotTimer/.25);
  for(let i=1;i<points.length;i++){
    const strength=i/points.length;
    c.globalAlpha=fade*strength*.8;c.lineWidth=b.r*(.25+strength*.65);
    c.beginPath();c.moveTo(points[i-1].x,points[i-1].y);c.lineTo(points[i].x,points[i].y);c.stroke();
  }
  c.restore();
}
export function drawBallShotTint(c,b){
  if(!(b.shotTimer>0)||!['gold','purple'].includes(b.shotColor))return;
  const color=b.shotColor==='gold'?'#ffd34d':'#b75cff';
  c.save();c.fillStyle=c.strokeStyle=c.shadowColor=color;c.shadowBlur=24;
  c.globalAlpha=.38*Math.min(1,b.shotTimer/.25);c.beginPath();c.arc(b.x,b.y,b.r,0,Math.PI*2);c.fill();
  c.globalAlpha=Math.min(1,b.shotTimer/.25);c.lineWidth=5;c.beginPath();c.arc(b.x,b.y,b.r+4,0,Math.PI*2);c.stroke();c.restore();
}
