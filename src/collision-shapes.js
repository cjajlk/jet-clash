// Convex polygons use clockwise screen coordinates (positive signed area).
// These are ordinary contact normals and penetration depths, with no timers or forces.
export function circlePolygonContact(ball, vertices, contactEdges=null) {
  let inside=true, nearest=null;
  for(let i=0;i<vertices.length;i++){
    const a=vertices[i],b=vertices[(i+1)%vertices.length];
    const ex=b.x-a.x,ey=b.y-a.y,length=Math.hypot(ex,ey);
    const side=ex*(ball.y-a.y)-ey*(ball.x-a.x);
    if(side<0)inside=false;
    // A joined exterior collider has no playable back/bottom face. A compressed
    // body must be separated toward the field, never through a buried seam.
    if(contactEdges&&!contactEdges.includes(i))continue;
    const t=Math.max(0,Math.min(1,((ball.x-a.x)*ex+(ball.y-a.y)*ey)/(length*length)));
    const dx=ball.x-(a.x+t*ex),dy=ball.y-(a.y+t*ey),distance=Math.hypot(dx,dy);
    if(!nearest||distance<nearest.distance)nearest={distance,dx,dy,nx:ey/length,ny:-ex/length};
  }
  if(!inside&&nearest.distance>=ball.r)return null;
  if(inside)return {nx:nearest.nx,ny:nearest.ny,depth:ball.r+nearest.distance};
  if(nearest.distance<1e-9)return {nx:nearest.nx,ny:nearest.ny,depth:ball.r};
  return {nx:nearest.dx/nearest.distance,ny:nearest.dy/nearest.distance,depth:ball.r-nearest.distance};
}

// Separating-axis test for a character rectangle against a convex ramp.
export function boxPolygonContact(body,vertices,contactEdges=null){
  const axes=[{x:1,y:0},{x:0,y:1}];
  for(let i=0;i<vertices.length;i++){
    const a=vertices[i],b=vertices[(i+1)%vertices.length],dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy);
    axes.push({x:dy/length,y:-dx/length});
  }
  let best=null;
  for(const axis of axes){
    const center=body.x*axis.x+body.y*axis.y;
    const radius=body.w/2*Math.abs(axis.x)+body.h/2*Math.abs(axis.y);
    const projected=vertices.map(p=>p.x*axis.x+p.y*axis.y);
    const lo=Math.min(...projected),hi=Math.max(...projected);
    const negative=center+radius-lo,positive=hi-(center-radius);
    if(negative<=0||positive<=0)return null;
    const direction=negative<positive?-1:1,depth=Math.min(negative,positive);
    if(!best||depth<best.depth)best={nx:axis.x*direction,ny:axis.y*direction,depth};
  }
  if(!contactEdges)return best;
  best=null;
  for(const i of contactEdges){
    const a=vertices[i],b=vertices[(i+1)%vertices.length],ex=b.x-a.x,ey=b.y-a.y,length=Math.hypot(ex,ey);
    const nx=ey/length,ny=-ex/length;
    const radius=body.w/2*Math.abs(nx)+body.h/2*Math.abs(ny);
    const depth=a.x*nx+a.y*ny-(body.x*nx+body.y*ny-radius);
    if(depth>0&&(!best||depth<best.depth))best={nx,ny,depth};
  }
  return best;
}
