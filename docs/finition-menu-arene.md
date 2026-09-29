# Finition menu PC/mobile et essai d’arène ouverte

État initial vérifié : main, HEAD ca6365ba31dc6bf28aa4ac85cbaaf9175bcf7d5c ; menu unifié déjà présent localement, 9 fichiers suivis modifiés et 3 fichiers nouveaux. Ces modifications ont été conservées. Aucun fichier n’était stagé.

## Résultat

- Ballon de l’accueil : taille visuelle multipliée par 1,8 aux sept formats demandés, sans superposition avec Fluid ou JOUER.
- Carte Duel : Fluid à 87,5 % de la hauteur de Heavy, VS conservé, images source intactes.
- Difficulté : trois boutons radio personnalisés, Normal par défaut ; sélection cyan, souris/tactile, Tab puis flèches, Début/Fin, Espace/Entrée. Même composant et mêmes valeurs easy/normal/elite pour tous les appareils. Aucune navigation de menu à la manette n’existait ; les commandes de match restent intactes.
- Arène ouverte active : plateformes et obstacle central absents du rendu et des solides transmis au solveur. Aucune collision invisible résiduelle correspondante.
- Les mêmes objets de sol et de cages restent utilisés. Murs/plafond, buts, rampes, scoring et protection de sortie conservés.
- Rayon/hitbox du ballon et dimensions de Fluid/Heavy en match inchangés. Physique, IA, contrôle de balle, commandes, caméra, HUD et assets inchangés.

## Réversibilité

Dans src/arena.js, passer OPEN_ARENA de true à false puis recharger restaure l’affichage et les collisions des deux plateformes et de l’obstacle central. Leur géométrie est conservée dans classicSolids, et leurs assets restent disponibles.

## Tests

285 PASS, 0 FAIL, 0 ignoré : les 274 tests existants et 11 nouveaux tests d’arène ouverte. Les tests historiques ciblant l’ancienne géométrie utilisent explicitement classicSolids pour conserver leur couverture ; les nouveaux tests couvrent la géométrie active. Les tests spécifiques aux cages continuent d’utiliser l’arène active.

Huit scripts navigateur PASS : browser, gamepad-browser, ball-control-browser, pressure-shot-browser, mobile-v2-browser, desktop-menu-browser, mobile-menu-browser, menu-finish-browser.

PC : 1280×720, 1440×900, 1920×1080 PASS ; parcours du menu également vérifié à 1440×1080.
Mobile/tablette : 667×375, 844×390, 390×844, 1024×768 PASS.

Vérifications : accueil et Duel, proportions, absence de chevauchement ballon/personnage/bouton, limites d’affichage, sélection souris/tactile/clavier, lancement et retour pour les trois difficultés à chaque format, conservation des sélections, navigation, redimensionnement, rotation portrait/paysage, Mobile V2, PS5 simulée, frappes normales/chargées/sous pression. Le test de rotation attend l’invite portrait avant de tourner, afin de ne pas anticiper la mise à jour de l’interface.

Arène : balle, Fluid et Heavy libres dans les trois anciens volumes ; absence des dessins et des colliders intérieurs ; scoring gauche/droite, cages et sécurité de réengagement sans point PASS. Inspection visuelle des captures de menu et de l’arène ouverte réalisée. Validation physique PC/téléphone par CJ encore attendue.

## Fichiers locaux, y compris l’unification précédente

Modifiés :

- index.html
- src/arena.js
- src/main.js
- src/mobile-menu.js
- src/renderer.js
- tests/anti-block.test.mjs
- tests/ball-control-browser.cjs
- tests/browser.cjs
- tests/gamepad-browser.cjs
- tests/match.test.mjs
- tests/mobile-menu-browser.cjs
- tests/mobile-v2-browser.cjs
- tests/pressure-shot-browser.cjs

Ajoutés :

- docs/finition-menu-arene.md
- docs/menu-unifie-v1.md
- styles/menu-desktop.css
- styles/menu-finish.css
- tests/desktop-menu-browser.cjs
- tests/menu-finish-browser.cjs
- tests/open-arena.test.mjs

## git diff --stat

```text
 index.html                      |  2 +-
 src/arena.js                    |  5 ++++-
 src/main.js                     |  2 +-
 src/mobile-menu.js              | 22 ++++++++++++++++++----
 src/renderer.js                 |  4 ++--
 tests/anti-block.test.mjs       |  3 ++-
 tests/ball-control-browser.cjs  |  2 +-
 tests/browser.cjs               |  6 +++---
 tests/gamepad-browser.cjs       |  4 ++--
 tests/match.test.mjs            |  3 ++-
 tests/mobile-menu-browser.cjs   |  4 ++--
 tests/mobile-v2-browser.cjs     |  2 +-
 tests/pressure-shot-browser.cjs |  2 +-
 13 files changed, 40 insertions(+), 21 deletions(-)
```

Cette commande exclut les nouveaux fichiers non suivis, listés ci-dessus.

## git status --short

```text
 M index.html
 M src/arena.js
 M src/main.js
 M src/mobile-menu.js
 M src/renderer.js
 M tests/anti-block.test.mjs
 M tests/ball-control-browser.cjs
 M tests/browser.cjs
 M tests/gamepad-browser.cjs
 M tests/match.test.mjs
 M tests/mobile-menu-browser.cjs
 M tests/mobile-v2-browser.cjs
 M tests/pressure-shot-browser.cjs
?? docs/finition-menu-arene.md
?? docs/menu-unifie-v1.md
?? styles/menu-desktop.css
?? styles/menu-finish.css
?? tests/desktop-menu-browser.cjs
?? tests/menu-finish-browser.cjs
?? tests/open-arena.test.mjs
```

Staging vide. HEAD inchangé. Vérification git diff --check sans erreur.

**AUCUN COMMIT / AUCUN PUSH. Arrêt pour validation réelle CJ.**
