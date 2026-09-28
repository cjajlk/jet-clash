# JetClash — Étape 2 jouable

Version de travail 0.2.0, 28 septembre 2026. **Validation finale réservée à CJ après essai réel.**

Cette version réalise un match Fluid contre Heavy dans La Cour de l’Aube : menu, difficulté, compte à rebours, jeu, buts et remises en jeu, chrono de cinq minutes, mort subite si égalité, résultat, XP, sauvegarde, rejeu et retour au menu sans recharger la page.

## Lancer sur PC

1. Extraire tout le ZIP dans un dossier, ou utiliser le projet `E:\cj_project\jet clash`.
2. Double-cliquer sur `Lancer-JetClash.cmd`.
3. Le jeu est disponible sur **http://localhost:4173**. Garder la fenêtre du serveur ouverte. Si la page s’ouvre avant le serveur, l’actualiser.

Le lanceur utilise Node.js installé ou le runtime fourni avec Codex sur ce PC. Sur un autre PC, Node.js 18 ou plus récent est nécessaire. Aucune dépendance npm à installer pour jouer, aucun service distant, aucun téléchargement d’asset.

Alternative depuis un terminal dans le dossier : `node tools/serve.mjs` ou `npm start`. Arrêter avec Ctrl+C. L’ouverture directe d’index.html ne suffit pas car le code utilise des modules JavaScript.

Toujours utiliser la même adresse et le même navigateur pour retrouver son profil : localhost et 127.0.0.1 ont des sauvegardes séparées.

## Commandes

| Action | Touches |
| --- | --- |
| Gauche / droite | Flèches ← →, Q/D ou A/D |
| Saut | Espace ; alternatives Z, W ou flèche ↑ |
| Jetpack | Maintenir Maj gauche ou droite |
| Recharge | Relâcher Maj |
| Frappe | Contact physique avec la balle, sans touche spéciale |

Cliquer sur l’arène si nécessaire pour lui rendre le focus. Aucun contrôle mobile ou manette à cette étape. Une pause automatique protège le match quand la fenêtre perd le focus ; le jeu reprend au retour. Les commandes maintenues sont alors relâchées automatiquement.

## Règles mises en œuvre

- Fluid et Heavy utilisent exactement les mêmes dimensions physiques, accélération, vitesse, saut, jetpack et réponse au contact. Les apparences ne donnent aucun bonus.
- La balle est indépendante, soumise à la gravité, à l’inertie et aux collisions ; aucun aimant, guidage vers le but ou possession. Les repositionnements sont limités au lancement et aux remises en jeu.
- Facile / Normal / Élite changent uniquement la réaction, l’erreur de visée, l’anticipation et l’agressivité du bot.
- Le but compte une fois lorsque toute la balle franchit la ligne à l’intérieur de l’ouverture. Après un but : annonce de 1,8 s, remise au centre, compte à rebours de 3 s.
- Cinq minutes de **temps de jeu actif** : le chrono s’arrête pendant les comptes à rebours, annonces de but et pauses de focus.
- À 00:00, une avance termine le match avant tout nouveau contact du même pas de simulation. Une égalité active la mort subite à 00:00 ; le prochain but termine immédiatement le match.
- XP : 100 pour un match terminé + 50 si victoire + 10 par but de Fluid. Niveau initial 1, puis un niveau par tranche de 1 000 XP. Attribution unique par identifiant de match, enregistrée avec le total dans le profil local.
- Le profil est stocké sous `jetclash.etape2.profile.v1`. Si le stockage est refusé, un avertissement apparaît et le jeu reste jouable avec une progression de session. Fermer ou recharger une partie en cours l’abandonne sans récompense.

Les valeurs de physique, dimensions de collision, temps de préparation, recharge à la remise en jeu, priorité de fin de chrono et pause automatique sont des **choix de prototype documentés**, pas des constantes prétendument récupérées de l’Étape 1. Ils restent soumis au test de CJ.

## Provenance et état validé

L’Étape 1 reste considérée verrouillée suivant la demande de CJ. Son document maître `JetClash_Etape_1_Document_general_v1.1.docx` n’a pas pu être lu ni inclus : les copies repérées sur le téléphone étaient inaccessibles. Les anciens `jetClashConfig.js v1.2.2`, `profile.js v1.2.6` et `gameState.js v1.3.0` restent absents. **Aucun ancien fichier n’est présenté comme retrouvé.**

Tous les modules de `src/` sont une nouvelle implémentation réalisée à partir de la mission fournie, conservée dans `docs/mission-etape-2.txt`. La mission résout notamment la mort subite, la recharge et le choix des commandes laissés ouverts dans le récapitulatif. Celui-ci est conservé comme référence secondaire dans `docs/reference-conversation.md` ; il ne remplace pas le maître.

Les 50 PNG proviennent de `JetClash_assets_propres.zip`, copiés sans modification et vérifiés par SHA-256. Le fond est affiché avec proportions conservées et débordement hors cadre ; les personnages et objets gardent leurs proportions. Les poses jetpack incluent leurs effets fournis. Les images d’attaque avec balle incorporée ne sont pas utilisées pour éviter l’apparence d’une deuxième balle ou d’une possession. Les éléments HUD statiques contiennent des chiffres fixes, des libellés ou des jauges préremplies : les valeurs dynamiques sont donc réalisées en HTML/CSS dans la même palette, conformément à la mission. Tous les fichiers fournis restent dans le pack.

## Architecture

| Module | Rôle |
| --- | --- |
| src/config.js | Paramètres communs et trois difficultés |
| src/match.js | États, transitions, chrono et fin de match unique |
| src/profile-store.js | Profil, XP et sauvegarde locale idempotente |
| src/player.js / src/input.js | Capacités partagées et adaptation du clavier |
| src/bot.js | Décisions du bot, appliquées par les mêmes capacités |
| src/ball.js / src/physics.js | Intégration, rebonds et impulsions de contact |
| src/arena.js / src/goals.js | Géométrie, placements et détection des buts |
| src/renderer.js / src/hud.js | Rendu Canvas des vrais assets et interface HTML |
| src/main.js | Assemblage, pause et boucle fixe à 120 pas/seconde |

Les futures entrées mobile/manette pourront produire le même objet `{axis, jump, boost}` ; elles ne sont pas implémentées. Aucun framework ni moteur externe n’est requis.

## Tests et limites

`npm test` ou `node --test tests/match.test.mjs` : **15 tests de logique réussis**. Parcours navigateur automatisé vérifié sous Edge : menu, difficulté, clavier, saut, jetpack/recharge, buts des deux équipes, remise en jeu, mort subite, résultat, XP, rejeu, retour menu et rechargement du profil. Aucun message d’erreur JavaScript relevé. Détails dans `docs/tests-et-limites.md`.

Le bot reste simple, les collisions utilisent des formes géométriques simplifiées et les PNG sont des poses, pas des animations squelettiques. La précision visuelle des contacts et l’équilibrage sont à éprouver en jouant. La durée complète est couverte par une simulation déterministe, pas par un essai humain de cinq minutes. La validation de confort et de difficulté appartient à CJ.

Pas de multijoueur, boutique, pass complet, capacités spéciales, nouvelles arènes, nouveaux personnages ou intégration CJEngine. Aucun commit ni push effectué. **Prochaine étape : test réel de CJ, puis corrections sur son retour uniquement.**

Voir `docs/fichiers-livres.md` pour la liste exacte des fichiers.
