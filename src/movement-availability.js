export function movementAvailability(p){
 const supported=!!(p.grounded||p.contactSurface);
 return {fuel:Math.round(Math.max(0,Math.min(100,p.fuel))),jump:supported?!!p.jumpReady:!!p.impulseReady&&p.impulseCooldown<=0};
}
