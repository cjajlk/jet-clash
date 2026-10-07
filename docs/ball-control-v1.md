# Contrôle de balle V1 — test réel CJ requis

Base : `960b2c2e2db105f193c48f3565f7577d899c55ec`. Les dimensions verticales des cages et le contour de collision des rampes ont depuis été ajustés pour dégager les buts ; le contrôle de balle ci-dessous reste indépendant de ces réglages.

## Commandes

- PS5 : stick droit pour viser, L2 pour frapper. Maintenir L2 charge, relâcher frappe. Xbox : même stick, LT.
- Clavier : I haut, J gauche, K bas, L droite ; combinaisons pour les diagonales. F pour frapper, maintenir puis relâcher pour charger.
- Déplacement, saut et jetpack existants conservés. Audit : flèches gauche/droite, A/Q/D, Espace/flèche haut/W/Z, Maj sont déjà utilisés ; aucune nouvelle touche ne les remplace.
- Carré/X (ou FLIP tactile) déclenche une frappe aérienne au premier contact avec la balle. Le déplacement horizontal oriente l’impact ; le flip ne frappe qu’une fois par envol.
- Sans visée au relâchement, frappe horizontale dans l’orientation de Fluid. Aucun ciblage du but.

## Comportement

Le contrôle s’acquiert devant Fluid à proximité immédiate du contact et à vitesse relative modérée. Les touches contrôlées amortissent le rebond et peuvent ajouter une poussée limitée vers l’avant. Aucune attraction à distance, correction de position ou compensation de gravité : la balle garde ses collisions et son inertie. Une balle qui s’éloigne n’est pas ramenée. La conduite nécessite de suivre la balle ; le contrôle aérien reste temporaire, sans suspension de balle.

Distance, passage derrière Fluid, vitesse relative excessive, choc fort avec l’arène, contact avec Heavy ou frappe libèrent la possession. Une précharge maintenue reste active après cette perte de possession. Heavy garde sa réponse physique et son IA. Pause/déconnexion annulent la charge ; but, réengagement et fin de match effacent le contrôle.

Trois petits chevrons cyan contrastés apparaissent uniquement pendant le contrôle avec une visée active. Un anneau cyan signale la possession et se remplit pendant la charge, avec ou sans visée. Aucun nouveau panneau HUD. L2/F peut être maintenu avant le contact : la précharge commence immédiatement et reste plafonnée à 0,7 s. Au relâchement, la frappe exige un vrai contact ou un contact récent encore proche. Sinon, une intention de frappe attend un contact pendant 0,24 s, puis expire sans impulsion. Un stick droit déjà incliné au lancement ne bloque plus les nouvelles commandes.

## Réglages locaux

`src/ball-control.js`, constante `BALL_CONTROL` : capture à 430 px/s relatifs maximum ; perte à 600 px/s ; portée 78 px ; marge de contact 10 px ; poussée maximale 900 px/s² ; restitution des touches contrôlées 0,08 (contacts ordinaires inchangés à 0,88) ; charge plafonnée à 0,7 s ; frappe de 520 à 1000 px/s, avec 20 % de la vitesse de Fluid et respect du plafond existant de 1100 px/s ; délai de reprise 0,3 s ; perte sur variation de vitesse de collision supérieure à 260 px/s.

Deadzone radiale du stick droit : 0,18. `match.control.showAim` prépare l’activation/désactivation des chevrons pour de futures options, sans développer de menu.

## Vérification

### Duel sous pression

Lorsque les deux personnages encadrent la balle et sont au contact (marge de 10 px), Fluid peut viser et charger sans obtenir la possession. Le contact de Heavy enlève toujours la possession, mais ne coupe plus cette occasion de frappe. La charge et les chevrons restent continus tant que le contact contesté existe. L’éloignement supprime la possession ; si TIR reste maintenu, la précharge et sa flèche restent disponibles. La pause et la frappe effacent les indicateurs.

Une frappe volontaire sous pression utilise 700 à 1080 px/s selon la charge, avec le plafond global inchangé. Elle est appliquée après la résolution des contacts du pas courant ; aucun corps n’est déplacé par cette impulsion, aucune collision n’est désactivée. Les pas suivants emploient la physique normale. Aucun dégagement automatique ni changement de l’IA. Tests dédiés : `tests/pressure-shot.test.mjs` et `tests/pressure-shot-browser.cjs`.

`npm test` conserve les 171 tests initiaux et ajoute les cas de contrôle, conduite, visée, charge, interactions, contrôles clavier/PS5 et tirs dans les deux cages. Les parcours navigateur sont `tests/browser.cjs`, `tests/gamepad-browser.cjs` et `tests/ball-control-browser.cjs` (Edge et Playwright). Les manettes y sont simulées ; CJ doit valider le ressenti à la DualSense avant publication.

## Corrections validées le 7 octobre 2026

La zone sportive miroir est remise dans l’ordre attendu par le solveur uniquement pour la détection de contact et sa préparation. Une balle au centre de la zone gauche est ainsi détectée comme à droite, y compris en rotation aérienne. Le contour visuel et la physique générale restent inchangés.

Un contact récent (0,12 s) ne permet plus de tirer une balle déjà éloignée : la balle doit encore être dans l’enveloppe proche (zone sportive augmentée de 10 px). La tolérance après séparation physique proche reste disponible. Les tests couvrent les deux cas et le tir différé ne s’applique toujours qu’à un contact réel.

Validation : 239 tests unitaires réussis et régressions navigateur sous Edge réussies. Les anciennes fixtures d’arène ont été adaptées aux coordonnées actuelles du sol et des cages, avec vérification de montée sur les rampes et du fond complet sans superposition de cages.
