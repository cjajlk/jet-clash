# Correctif — cages verticales agrandies

Projet : E:\cj_project\jet clash. Correctif du 28 septembre 2026, à valider visuellement par CJ. Aucun commit ni push.

## Position et dimensions actuelles

Repère du Canvas : 1280 × 720, origine en haut à gauche ; y augmente vers le bas. Hauteur jouable : de y=100 à y=644, soit 544 px.

Les cages encadrent une ouverture haute et plus large que la balle :

- Haut : y=300 ; bas : y=570 ; hauteur : 270 px.
- Profondeur de chaque ouverture : 150 px.
- Diamètre de la balle : 95 px ; l’ouverture est supérieure dans les deux dimensions.
- Ligne de but : x=150 à gauche et x=1130 à droite.
- Les sprites de but sont tournés verticalement et occupent la même zone que les ouvertures de collision et de score.
- Les rampes rejoignent le sol à x=260 et x=1020, en restant sous une pente de 0,7 et sans rebord caché dans la bouche du but.

## Détection et collisions

Zone géométrique gauche : x=0..150, y=300..570. Zone droite : x=1130..1280, y=300..570. Toute la balle doit franchir la ligne et être strictement entre les bords verticaux ; une tangence avec un bord n’est pas un but.

Pour le rayon actuel de 47,5 px, la détection exige :

- Centre de balle : 347,5 < y < 522,5.
- But gauche, point pour Heavy : x + 47,5 ≤ 150, donc x ≤ 102,5.
- But droit, point pour Fluid : x − 47,5 ≥ 1130, donc x ≥ 1177,5.

Socles solides et visibles : gauche [0,82] × [508,644] ; droite [1198,1280] × [508,644]. Les toits existants suivent les cages : gauche [0,82] × [373,388] ; droite [1198,1280] × [373,388]. Ces rectangles passent par les collisions existantes de balle et de personnage. Aucun paramètre du moteur physique n’a changé.

## Fichiers modifiés

- E:\cj_project\jet clash\src\config.js — nouvelle hauteur des ouvertures et borne basse indépendante du sol.
- E:\cj_project\jet clash\src\arena.js — déplacement des toits et ajout des deux socles solides.
- E:\cj_project\jet clash\src\goals.js — détection bornée à l’ouverture surélevée ; tangences exclues.
- E:\cj_project\jet clash\src\renderer.js — translation des cages et dessin des socles.
- E:\cj_project\jet clash\tests\match.test.mjs — scénarios de buts et de toit adaptés à la nouvelle hauteur.
- E:\cj_project\jet clash\tests\browser.cjs — tirs de vérification placés au centre des nouvelles ouvertures.

Fichiers ajoutés :

- E:\cj_project\jet clash\tests\raised-goals.test.mjs — tests ciblés du correctif.
- E:\cj_project\jet clash\docs\correctif-buts-sureleves.md — ce rapport.

Une comparaison des empreintes des fichiers confirme que les autres modules src/, les styles et les PNG n’ont pas changé. Les plateformes et l’obstacle conservent leur géométrie et leur rendu. Aucun réglage de physique, IA, chrono, récompense ou HUD n’a été modifié. Les copies de contrôle et captures sont uniquement dans work/.

## Tests

| Cas demandé | Résultat |
| --- | --- |
| Balle roulant au sol vers le but gauche | Réussite : rebond, pas de but |
| Balle roulant au sol vers le but droit | Réussite : rebond, pas de but |
| Tir dans l’ouverture gauche | Réussite : but pour Heavy |
| Tir dans l’ouverture droite | Réussite : but pour Fluid |
| Rebonds sous les cages | Réussite des deux côtés, pas de but |
| Contact avec les bords | Réussite : tangences et chevauchements haut/bas rejetés |
| Remise en jeu après vrai but | Réussite des deux côtés : compte à rebours puis PLAYING |
| Score compté une fois | Réussite : doublon refusé des deux côtés |

Les contrôles supplémentaires vérifient que Fluid et Heavy ne traversent pas les socles et que les coordonnées des structures sont symétriques.

- Tests ciblés : **11/11 réussis**.
- Suite complète : **25/26 réussis**.
- Parcours Edge : réussi, sans erreur JavaScript ; buts, remise en jeu, mort subite, XP, rejeu, retour menu et profil rechargé vérifiés.
- Capture en jeu inspectée : cages relevées, mêmes tailles, socles visibles, plateformes inchangées.

### Échec conservé et signalé

Le scénario historique où le bot doit récupérer une balle posée sur le toit du but droit échoue après adaptation à la hauteur du nouveau toit : avec l’IA inchangée et les décisions déterministes du test, la balle n’est pas récupérée en 20 secondes. Le cas au bord de l’obstacle central passe toujours. Cet échec est laissé visible dans la suite ; aucune modification de l’IA n’a été faite, conformément au périmètre imposé. La suite globale n’est donc pas déclarée entièrement validée.

Commandes : `node --test tests/raised-goals.test.mjs` pour le correctif ; `node --test tests/match.test.mjs tests/raised-goals.test.mjs` pour la suite complète.

CJ doit encore effectuer son test réel avant validation.
