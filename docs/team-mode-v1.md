# Mode local 2v2

Composition : Fluid piloté par le joueur + un Heavy allié contre deux Heavy adversaires. Les anneaux et noms cyan/rouges identifient les équipes (VOUS, ALLIÉ, BOT 1, BOT 2). Aucun nouveau personnage ni asset requis.

Le bouton 2V2 est dans le choix des modes existant. La difficulté s’applique aux trois bots. Le rejeu conserve le mode et la difficulté ; Retour menu permet de sortir pendant le jeu et de choisir ensuite duel ou entraînement sans conserver les bots supplémentaires.

Le Match existant gère les quatre joueurs. team-mode.js compose l’IA Heavy existante : miroir horizontal pour l’allié, interception pour le partenaire le plus proche et soutien défensif pour l’autre, sauf danger immédiat devant sa cage. Pas de collision entre personnages, comme en 1v1 ; chacun utilise les collisions de balle et d’arène existantes.

Les modules de physique, balle, commandes, joueur, paramètres, buts, bot 1v1 et géométrie d’arène restent inchangés. Même chrono de cinq minutes, compte à rebours, pause après but, mort subite, BOOST, sauts, flips et tirs. La caméra garde ses réglages et inclut les quatre positions seulement en 2v2. Le duel 1v1 reste le mode par défaut.

Score par équipe : entrée dans la cage droite = point bleu ; entrée dans la cage gauche = point rouge. XP de match inchangée (100 pour terminer, 50 pour une victoire). Le bonus de 10 XP par but et les défis de buts sont crédités uniquement lorsque le dernier contact validé en 2v2 est celui du joueur humain et que le point revient aux bleus ; un but du coéquipier ou un but contre son camp ne donne pas de bonus personnel. Les contacts physiques, touches contrôlées et frappes humaines alimentent cette attribution locale simple ; elle ne prétend pas gérer les assists ou une attribution sportive avancée des déviations. Victoires et matchs terminés alimentent les défis existants sans deuxième système.

Tests unitaires dédiés : composition 2+2 et 3 IA indépendantes, capacités inchangées, mouvement des trois bots, miroir et soutien, contact avec chacun des bots, score et buts personnels, reset des quatre acteurs, chrono, mort subite, abandon, changements de mode, cadrage mobile et cinq minutes simulées.

Validation navigateur : tests/team-mode-browser.cjs couvre 1280×720, 844×390 et 568×320, avec lancement, difficulté, trois bots actifs, commandes, score, XP, remise en jeu, rejeu et retour vers 1v1/entraînement. Les bots sont locaux ; ce mode n’ajoute pas de multijoueur réseau.

Validation finale : 261 tests unitaires réussis, dont les 246 tests existants. Un match 2v2 complet avec buts réellement produits par la physique, chrono actif, fin de match et attribution unique est simulé sans correction de balle hors arène. Parcours navigateur 2v2, régressions de contrôle, défis et sons réussis.
