# Défis V1 — audit et fonctionnement

Avant modification : la route Défis dans mobile-menu.js contenait trois aperçus « À venir » (quotidien, hebdomadaire, saisonnier). Aucun gestionnaire, compteur, reset ou récompense de défis ne figurait dans src ou tests. ProfileStore sauvegardait uniquement XP et identifiants de matchs récompensés ; Match disposait des événements fiables but, fin et lancement entraînement. Pass et boutique restent des aperçus.

Le gestionnaire challenges.js est relié au ProfileStore existant, avec la même clé de sauvegarde v1. Les propriétés inconnues du profil sont conservées. Les récompenses sont automatiques à l’objectif, plafonné ; progression et attribution sont enregistrées ensemble. seasonXp désigne l’XP de saison, distincte de xp (niveau du profil et récompenses de match inchangés). Aucun Coin ajouté : aucune économie Coins fonctionnelle n’existe dans cette base.

Quotidiens : terminer 1 match (100 XP), terminer 3 matchs (150), gagner 1 match (150), marquer 2 buts en duel (100), marquer 3 buts en duel (150), lancer un entraînement (75).
Hebdomadaires : terminer 10 matchs (500 XP), gagner 5 matchs (600), marquer 15 buts en duel (500).

Les matchs abandonnés ne comptent pas comme terminés. Les buts d’entraînement et du bot ne comptent pas. Les buts de duel comptent dès leur validation. Un lancement d’entraînement compte une fois par lancement, avec objectif quotidien plafonné. L’attribution de match existante et le garde de fin évitent les doublons.

Reset local au changement de date UTC, semaine le lundi à 00:00 UTC. Vérification au chargement, à chaque événement et à l’affichage du menu : fonctionne sans serveur, même après plusieurs jours hors ligne. En France : minuit UTC = 01:00 en hiver / 02:00 en été. Un retour arrière de l’horloge n’ouvre pas un ancien cycle. Une horloge locale peut être modifiée ; cette V1 ne propose pas de garantie serveur contre la triche. Aucun reset de seasonXp ou de saison automatique, faute de calendrier de saison existant.

Contacts/frappes, BOOST, sauts, doubles sauts et buts aériens différés : pas de statistique persistante fiable existante. Aucun changement de physique, contrôles, BOOST, bot, caméra ou écran de match. Nouveaux objectifs ajoutables dans CHALLENGES, alimentés par record(event, amount).

Échec de stockage : avertissement dans Défis, progression disponible seulement dans la session. Tests ciblés dans challenges.test.mjs couvrent seuils, plafonds, attribution unique après rechargement, resets, migration, conservation du profil et intégration Match.

Validation finale après correction : suite complète de 239 tests réussie, aucun échec. Les 13 échecs initiaux ont été traités : fixtures adaptées au sol et aux cages actuels, tests actualisés pour les rampes et le fond complet, attentes alignées sur la précharge existante. Deux défauts corrigés dans ball-control.js : ordre du contour miroir vers la gauche et frappe distante autorisée par un contact récent. Deux tests unitaires supplémentaires couvrent ces défauts. Test navigateur challenges-browser.cjs : 1280×720, 390×844 et 844×390 réussis. ball-control-regression-browser.cjs : tirs gauche/droite, interdiction de frappe distante, buts, victoire, XP de match et de saison, attribution unique et rechargement réussis.
