# Caméra de suivi joueur/ballon

Inspiration : le mode « Focused » et les repères hors écran documentés dans les
[notes officielles de Sideswipe](https://sideswipe.rocketleague.com/news/sideswipe-patch-notes-s3).
Ce comportement est une adaptation pour JetClash ; les notes ne publient pas
l’algorithme de caméra du jeu de référence.

Le moteur de cadrage existant (`MobileCamera`, nom conservé pour compatibilité)
sert maintenant au duel, au 2v2 et à l’entraînement sur PC et mobile.

- Suivi amorti du joueur humain et du ballon, centre légèrement favorisé vers le joueur.
- Zoom équilibré maximal 1,50×, rapprochement progressif depuis la vue entière.
- Anticipation bornée de la trajectoire du ballon (90 px horizontal, 45 px vertical).
- Dézoom immédiat si nécessaire pour conserver joueur et ballon dans le cadre.
- Inclusion des bots à moins de 260 px du ballon et de toute l’ouverture de la cage proche.
- Bots éloignés : repères cyan pour l’allié, rouges pour les adversaires ; flèche
  et nom, taille adaptée à l’écran, séparation des repères voisins.
- Cadre figé pendant l’annonce du but ; vue entière pendant le décompte, au menu
  et à la fin du match. Retour menu réinitialise explicitement la caméra.
- Décor contenu dans les limites de l’arène, sans zones vides exposées.

La transformation touche uniquement le rendu du monde. Le HUD, le jetpack,
les boutons tactiles et Retour menu restent fixes. Les coordonnées, tailles de
collision, rampes, physiques, bots et commandes ne sont pas modifiés.

Validation : 270 tests unitaires réussis, dont 8 nouveaux tests de suivi,
anticipation, visibilité, limites, cadence et séparation des repères.
Les assertions historiques imposant tous les bots visibles ou un PC fixe à 1×
ont été adaptées au nouveau comportement demandé.

Parcours navigateur :

- `follow-camera-browser.cjs` : les trois modes sur 1280×720, 844×390 et 568×320 ;
  zoom, suivi, balle lointaine, cage, repères, coup d’envoi et retour menu,
  coordonnées physiques intactes ; captures vérifiées visuellement.
- `all-mode-controls-browser.cjs` : mouvement, double saut, jet, flip, tir clavier
  standard/personnalisé, manette simulée, tactile et pause/retour dans les trois modes.
- `team-mode-browser.cjs` : match actif, équipes, buts, score, XP, rejeu et transitions.
- `desktop-menu-browser.cjs` : menus, redimensionnement, lancement et retour sur
  1280×720, 1440×900, 1920×1080 et 1440×1080. L’assertion des cartes a été corrigée
  pour tenir compte des conteneurs défilants des défis et options.

Les tests de cadrage utilisent des situations placées et une simulation en pause
pour isoler le rendu. Le parcours 2v2 vérifie aussi le suivi pendant un match actif.

Les anciens parcours optionnels `mobile-v2-browser.cjs` et `mobile-menu-browser.cjs`
ne constituent pas une validation complète : le premier commence avec une manette
simulée qui masque ses boutons tactiles ; le second utilise encore le bouton de
fin de match pour quitter l’entraînement. Une tentative d’adaptation de ce dernier
a validé les trois tailles paysage, puis rencontré un problème de coordonnées de
tap après rotation émulée depuis le portrait. Ces adaptations exploratoires n’ont
pas été conservées. Les parcours récents ci-dessus couvrent le cadrage et les
commandes dans les trois modes, sans prétendre corriger ces anciens scénarios.
