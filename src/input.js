export class KeyboardInput {
  constructor(target=window) {
    this.keys=new Set();
    this.codes=new Set(['ArrowLeft','ArrowRight','KeyA','KeyQ','KeyD','Space','ArrowUp','KeyW','KeyZ','ShiftLeft','ShiftRight']);
    target.addEventListener('keydown',e=>{
      if (!this.codes.has(e.code) || /^(INPUT|SELECT|BUTTON|TEXTAREA)$/.test(e.target.tagName)) return;
      e.preventDefault(); this.keys.add(e.code);
    });
    target.addEventListener('keyup',e=>this.keys.delete(e.code));
    target.addEventListener('blur',()=>this.clear());
  }
  clear() { this.keys.clear(); }
  read() {
    const any=(...keys)=>keys.some(k=>this.keys.has(k));
    return { axis:Number(any('ArrowRight','KeyD'))-Number(any('ArrowLeft','KeyA','KeyQ')),
      jump:any('Space','ArrowUp','KeyW','KeyZ'), boost:any('ShiftLeft','ShiftRight') };
  }
}
