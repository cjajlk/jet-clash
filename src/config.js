// NOUVEAU code Étape 2. Aucun lien de version avec les modules historiques absents.
export const CONFIG = Object.freeze({
  width: 1280, height: 720, ceiling: 90, floor: 570, duration: 300,
  step: 1 / 120, countdown: 3, goalPause: 1.8,
  goalEntryRadiusFactor: 1.75, goalEffectDuration: .8,
  gravity: 1120, runAcceleration: 1750, airAcceleration: 1000, airHorizontalDrag: .8,
  runSpeed: 260, jumpSpeed: 545, thrust: 1700, maxRise: 500,
  fuelUse: 31, fuelRecharge: 23, playerWidth: 38, playerHeight: 76,
  ballRadius: 19, ballScale: 1.50, ballBounce: 0.78, maxBallSpeed: 1100,
  fluidVisualScale: 1.0,
  ballContactScale: 1.22,
  ballControlWidth: 88, ballControlHeight: 124, ballControlOffsetX: 16, ballControlOffsetY: -20, ballControlAirOffsetY: -18,
  DEBUG_BALL_CONTACT: false,
  airImpulseSpeed: 180, airImpulseCooldown: .38,
  groundOrientationRate: 18, airOrientationRate: 8, airRotateRate: 12,
  airReturnOrientationRate: 4.5, airLeanFactor: .72, airLeanDepth: .42,
  airFlipIntentTime: .22, airFlipIntentY: -.68,
  airFlipDuration: .48, airFlipStrikeSpeed: 420,
  goalLeft: 165, goalRight: 1115, goalTop: 125, goalBottom: 365, goalRampBottom: 365,
  // Character-only rear wall aligned with the painted net, inside the canvas edge.
  playerGoalBackInset: 50,
  // Visible net interior in the authored arena background; scoring only.
  goalScoreTop: 195, goalScoreBottom: 350,
});
export const DIFFICULTIES = Object.freeze({
  easy: { name: 'Facile', reaction: 0.34, error: 64, anticipation: 0.10, aggression: 0.55 },
  normal: { name: 'Normal', reaction: 0.18, error: 30, anticipation: 0.25, aggression: 0.78 },
  elite: { name: 'Élite', reaction: 0.075, error: 9, anticipation: 0.45, aggression: 1 },
});
