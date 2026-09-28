# Correctif unique — buts surélevés

Projet : E:\cj_project\jet clash. Correctif du 28 septembre 2026, à valider visuellement par CJ. Aucun commit ni push.

## Position exacte

Repère du Canvas : 1280 × 720, origine en haut à gauche ; y augmente vers le bas. Hauteur jouable : de y=100 à y=644, soit 544 px.

Les deux ouvertures sont remontées de 136 px, sans changement de taille :

- Haut : y=388 (anciennement 524).
- Bas : y=508 (anciennement 644).
- Centre vertical : y=448.
- Hauteur d’ouverture : 120 px, inchangée.
- Bas à 136 px du sol, soit exactement 25 % de la hauteur jouable. Les plateformes latérales restent à y=392.
- Lignes de but inchangées : x=82 à gauche, x=1198 à droite.
- Rendu bleu : boîte de placement x=0, y=387, largeur 181, hauteur 122.
- Rendu rouge : boîte de placement x=1082, y=387, largeur 198, hauteur 122.

Ces boîtes de placement sont inchangées en largeur et hauteur ; les PNG sont ajustés en conservant leur proportion exactement comme auparavant. Les deux rendus sont translatés de 136 px vers le haut. Les PNG originaux sont inchangés.

## Détection et collisions

Zone géométrique gauche : x=0..82, y=388..508. Zone droite : x=1198..1280, y=388..508. Toute la balle doit franchir la ligne et être strictement entre les deux bords horizontaux ; une tangence avec un bord n’est pas un but.

Pour le rayon actuel de 19 px, la détection exige :

- Centre de balle : 407 < y < 489.
- But gauche, point pour Heavy : x + 19 ≤ 82, donc x ≤ 63.
- But droit, point pour Fluid : x − 19 ≥ 1198, donc x ≥ 1217.

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
