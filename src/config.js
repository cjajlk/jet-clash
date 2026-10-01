// NOUVEAU code Étape 2. Aucun lien de version avec les modules historiques absents.
export const CONFIG = Object.freeze({
  width: 1280, height: 720, floor: 644, duration: 300,
  step: 1 / 120, countdown: 3, goalPause: 1.8,
  gravity: 1120, runAcceleration: 2050, airAcceleration: 1250,
  runSpeed: 300, jumpSpeed: 545, thrust: 1850, maxRise: 450,
  fuelUse: 31, fuelRecharge: 23, playerWidth: 38, playerHeight: 76,
  ballRadius: 19, ballScale: 2.5, ballBounce: 0.78, maxBallSpeed: 1100,
  fluidVisualScale: 1.3,
  ballContactScale: 1.22,
  ballControlWidth: 72, ballControlHeight: 90, ballControlOffsetX: 12, ballControlOffsetY: -6,
  DEBUG_BALL_CONTACT: false,
  airImpulseSpeed: 260, airImpulseCooldown: .38,
  groundOrientationRate: 18, airOrientationRate: 8, airRotateRate: 12,
  airReturnOrientationRate: 4.5, airLeanFactor: .72, airLeanDepth: .42,
  airFlipIntentTime: .22, airFlipIntentY: -.68,
  // Opening shifted a little higher, with a separate ramp end so the slope
  // no longer feeds directly into the mouth.
  goalLeft: 82, goalRight: 1198, goalTop: 374, goalBottom: 494, goalRampBottom: 462,
});
export const DIFFICULTIES = Object.freeze({
  easy: { name: 'Facile', reaction: 0.34, error: 64, anticipation: 0.10, aggression: 0.55 },
  normal: { name: 'Normal', reaction: 0.18, error: 30, anticipation: 0.25, aggression: 0.78 },
  elite: { name: 'Élite', reaction: 0.075, error: 9, anticipation: 0.45, aggression: 1 },
});
