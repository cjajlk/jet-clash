# JetClash — Pass Saison 1

## Audit de l’existant
Le dépôt était propre avant intervention. Le menu commun PC/mobile comporte déjà les onglets Pass, Collection, Boutique et Défis. Le Pass était un aperçu de cinq récompenses, avec XP du profil et bouton désactivé. Aucun niveau de saison, Premium ou récupération n’existait. ProfileStore sauvegarde XP de profil et matchs récompensés dans jetclash.etape2.profile.v1 et préserve les champs supplémentaires. ChallengeManager sauvegarde neuf défis et un compteur seasonXp. La Boutique et les catégories de Collection sont des aperçus ; aucun système d’ouverture de caisse ou équipement cosmétique n’existe. Les capsules présentes sont des images sans service d’inventaire.

## Structure finale
Saison 1, deux pistes, 50 niveaux chacune. Niveau 0 avant les premiers 1 000 XP ; palier 1 à 1 000 XP, palier 50 à 50 000 XP. Seuil constant de 1 000 XP, aucune progression croissante préexistante. XP total conservé après le plafond. Chaque piste comporte 11 caisses, 5 récompenses Coins, 5 Jetons et 29 autres récompenses. Niveau 50 : style exclusif Aube / Couronne, entrée préparée avec illustration générique.

## Gratuit et Premium
Récupération autorisée seulement si le niveau est atteint, l’identifiant non réclamé et le Premium actif pour sa piste. Bouton Premium informatif : aucune activation gratuite automatique, aucun paiement. Le service profile.pass.setPremium(true) est le point d’activation destiné à une intégration future. Les identifiants stables empêchent les doublons, y compris après rechargement.

## Sauvegarde et récompenses
Le seasonXp existant reste l’unique source de progression. Les défis passent par profile.pass.addXp ; aucune modification des événements de match. Le profil ajoute pass {season, level, claimed, premium}. Monnaies : coins et tokens ; XP de récompense : xp du profil, sans boucle XP de saison. Caisses et cosmétiques : passInventory avec identifiant, type, rareté, saison et prepared. Ils apparaissent dans la Collection ; ouverture, équipement et rendu en match restent à venir. Les anciennes données valides sont préservées. En cas de stockage indisponible, avertissement et unicité dans la session ; aucune garantie entre sessions sans stockage. Pas de calendrier ni de reset automatique de saison.

## Fichiers
42 PNG ajoutés dans assets/pass/. Modifiés : src/profile-store.js, src/challenges.js, src/mobile-menu.js, src/mobile-menu-model.js, styles/mobile-menu.css, tests/mobile-menu.test.mjs, tests/mobile-menu-browser.cjs. Ajoutés : src/season-pass.js, src/season-pass-view.js, tests/season-pass.test.mjs, tests/season-pass-browser.cjs et docs/pass-saison-1.md. L’ancien aperçu et sa sélection ont été retirés. Aucun fichier de physique, balle, tir, boost, contrôles, bot, caméra, buts, rampes, arène, matchmaking ou match modifié.

## Validation
289 tests unitaires réussis, zéro échec. Neuf tests ciblés couvrent XP, niveaux, plafond, gratuit, Premium, unicité, persistance, migration, monnaies, défis, inventaire et palier 50. Pass navigateur réussi à 1440×900, 760×640, 390×844, 844×390 : 100 cartes, réclamation, verrou Premium, reload, assets visibles, aucun débordement horizontal de page ni erreur JS. Défis navigateur réussis à 1280×720, 390×844, 844×390. Inspection visuelle des captures PC/mobile et correction du style desktop hérité. Le test général mobile-menu-browser passe la navigation des onglets puis échoue sur #back-menu masqué en entraînement (timeout). Échec hors parcours Pass ; son existence avant intervention n’a pas été confirmée. git diff --check vérifié. Aucun commit ni push.

## Tableau des 50 niveaux
| Niveau | XP saison requis | Gratuit | Premium |
|---:|---:|---|---|
| 1 | 1000 | 100 XP profil | Style |
| 2 | 2000 | 100 Coins | 200 Coins |
| 3 | 3000 | Caisse common | Caisse common |
| 4 | 4000 | Style | Style |
| 5 | 5000 | 5 Jetons | 10 Jetons |
| 6 | 6000 | 100 XP profil | Récompense mystère |
| 7 | 7000 | Caisse common | Caisse common |
| 8 | 8000 | Traînée | Traînée |
| 9 | 9000 | 100 XP profil | Balle |
| 10 | 10000 | 100 XP profil | Bannière |
| 11 | 11000 | Caisse uncommon | Caisse uncommon |
| 12 | 12000 | 100 Coins | 200 Coins |
| 13 | 13000 | 100 XP profil | Style |
| 14 | 14000 | 5 Jetons | 10 Jetons |
| 15 | 15000 | Caisse uncommon | Caisse uncommon |
| 16 | 16000 | Bannière | Bannière |
| 17 | 17000 | 100 XP profil | Explosion |
| 18 | 18000 | 100 XP profil | Récompense mystère |
| 19 | 19000 | Caisse uncommon | Caisse uncommon |
| 20 | 20000 | Explosion | Explosion |
| 21 | 21000 | 100 XP profil | Balle |
| 22 | 22000 | 100 Coins | 200 Coins |
| 23 | 23000 | Caisse rare | Caisse rare |
| 24 | 24000 | 5 Jetons | 10 Jetons |
| 25 | 25000 | 100 XP profil | Style |
| 26 | 26000 | 100 XP profil | Traînée |
| 27 | 27000 | Caisse rare | Caisse rare |
| 28 | 28000 | Style | Style |
| 29 | 29000 | 100 XP profil | Explosion |
| 30 | 30000 | 100 XP profil | Récompense mystère |
| 31 | 31000 | Caisse epic | Caisse epic |
| 32 | 32000 | 100 Coins | 200 Coins |
| 33 | 33000 | 100 XP profil | Balle |
| 34 | 34000 | 5 Jetons | 10 Jetons |
| 35 | 35000 | Caisse epic | Caisse epic |
| 36 | 36000 | Balle | Balle |
| 37 | 37000 | 100 XP profil | Style |
| 38 | 38000 | 100 XP profil | Traînée |
| 39 | 39000 | 100 XP profil | Balle |
| 40 | 40000 | Bannière | Bannière |
| 41 | 41000 | 100 XP profil | Explosion |
| 42 | 42000 | 100 Coins | 200 Coins |
| 43 | 43000 | Caisse legendary | Caisse legendary |
| 44 | 44000 | 5 Jetons | 10 Jetons |
| 45 | 45000 | 100 XP profil | Balle |
| 46 | 46000 | 100 XP profil | Bannière |
| 47 | 47000 | 100 XP profil | Explosion |
| 48 | 48000 | Récompense mystère | Récompense mystère |
| 49 | 49000 | Caisse legendary | Caisse legendary |
| 50 | 50000 | Style exclusif Saison 1 · Aube | Style exclusif Saison 1 · Couronne |

## Git status
État relevé avant l’ajout du présent rapport :

```text
 M src/challenges.js
 M src/mobile-menu-model.js
 M src/mobile-menu.js
 M src/profile-store.js
 M styles/mobile-menu.css
 M tests/mobile-menu-browser.cjs
 M tests/mobile-menu.test.mjs
?? assets/pass/
?? src/season-pass-view.js
?? src/season-pass.js
?? tests/season-pass-browser.cjs
?? tests/season-pass.test.mjs
?? work/
```
Le rapport docs/pass-saison-1.md est également ajouté.
