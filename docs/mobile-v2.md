# Mobile V2 — direction, ergonomie et cadrage

Base : `db0b924f3282a8d557f087445023ddd9e8d4bb57`. Version locale, à tester réellement par CJ sur téléphone avant publication.

## Deux zones de commande

À gauche : un seul joystick compact, sans grand libellé. Il fournit un vecteur X/Y normalisé après la deadzone radiale de 0,18. Au sol, l’axe horizontal garde le déplacement actuel. En l’air, le vecteur oriente Fluid visuellement et dirige la poussée quand JET est maintenu. Le stick seul conserve le contrôle horizontal déjà existant ; il n’ajoute aucune accélération verticale.

À droite : groupe triangulaire, SAUT en bas à gauche, JET en bas à droite, TIR au-dessus. Boutons de 48 à 62 pixels CSS, joystick de 78 à 108 pixels, marges safe-area conservées. Plus de deuxième gros joystick de visée permanent.

TIR : poser le doigt, maintenir pour charger, glisser puis relâcher. La visée se mesure à partir du point où le doigt a été posé, pas du centre du bouton. Environ 9 pixels de déplacement restent dans la zone morte ; un simple appui ne crée pas de visée accidentelle. Le doigt reste capturé même hors du bouton. La dernière direction est conservée jusqu’au pas physique qui traite le relâchement. Les chevrons, l’anneau, les puissances, la charge maximale de 0,7 seconde et la frappe sous pression sont ceux du contrôle de balle existant.

Trois doigts peuvent combiner direction + JET + glissement/charge/TIR. Relâcher ou déplacer un pointeur ne supprime pas les autres. Une annulation, perte de focus ou rotation en portrait efface la charge sans tirer. Le portrait reste un écran d’invitation à tourner l’appareil, avec le match suspendu.

## Jet directionnel et invariants

Seule la commande tactile explicite `touchDirection` redirige la poussée en l’air. Sans ce vecteur, JET garde sa poussée verticale habituelle. Au sol, le décollage reste vertical ; SAUT garde sa mécanique actuelle. La poussée utilise toujours `CONFIG.thrust` (1850), la consommation 31/s et la recharge 23/s. Gravité, inertie, limites de vitesse existantes et collisions sont conservées. Cette adaptation de direction tactile est la seule modification du pilotage physique du personnage.

Le mapping manette est désormais Croix/A pour saut et double saut, Rond/B pour jetpack, Carré/X pour flip aérien, et L2/LT pour tir chargé. En l’air, le flip tourne le personnage et donne une impulsion à la balle lors du premier contact, une seule fois par envol ; l’axe de déplacement dirige l’impact. Sur mobile, le bouton FLIP déclenche la même action ; SAUT ×2 permet le second appui en l’air. Les cages sont dessinées verticalement ; leur ouverture mesure 150 × 270 px, contre 95 px de diamètre pour la balle. Les rampes suivent les contours de collision.

## Caméra mobile

`src/mobile-camera.js` : mode équilibré à 1,30× (+30 % de taille apparente par rapport au cadrage V1). Le zoom peut redescendre vers 1× lorsque les acteurs s’éloignent ; il suit les acteurs présents (Fluid et balle en entraînement, Fluid, Heavy et balle en duel) et inclut la bouche du but quand la balle approche d’une extrémité. Élargissement immédiat si nécessaire, recentrage et rapprochement progressifs. Un halo fin renforce la balle sur mobile.

Le zoom est un changement de rendu global de la scène, sans modification des coordonnées gameplay. Le HUD ne zoome pas. Le PC reste à 1× avec son cadrage et ses tailles précédents. Les constantes proche/équilibré/large et la projection monde-écran préparent d’éventuelles options/indicateurs futurs ; aucun menu ni indicateur hors écran n’est ajouté.

## Tests et lancement

`node --test tests/*.test.mjs` : 228 tests existants conservés et 31 tests V2, soit 259.

`tests/touch-browser.cjs` redirige maintenant vers le parcours V2 : `tests/mobile-v2-browser.cjs`. Il vérifie 667×375, 844×390, 1024×768 et desktop 1440×1080, ainsi que le portrait, la coexistence PS5, les contacts indépendants, le saut/JET diagonal, une rencontre aérienne préparée, le tir glissé, la charge, le duel sous pression et le refus de plein écran. La rencontre utilise un placement de balle de test, sans téléportation dans le jeu. Les tests navigateur PC et manette précédents restent applicables.

Pour le téléphone : lancer `Lancer-JetClash-Mobile.cmd`, ouvrir l’adresse réseau affichée sur le même Wi-Fi, puis recharger la page. Voir `mobile-v1.md` pour les détails réseau et la disponibilité de Gamepad API/HTTPS. Aucun commit ni push effectué pour ce pack.
