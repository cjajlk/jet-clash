# Étape 2 — boucle complète d’un match

Checklist de travail proposée pour la reprise, non validée comme partie de l’Étape 1. Elle n’ajoute aucune règle de gameplay.

## Prérequis

- [ ] Récupérer et lire le document maître v1.1 ; comparer le récapitulatif à l’original, qui prévaut.
- [ ] Récupérer les trois modules et vérifier leurs versions, interfaces et dépendances.
- [ ] Recenser les décisions encore ouvertes dans l’original ; les résoudre avec CJ au moment nécessaire sans choisir des valeurs implicites.

## Implémentation après récupération

- [ ] Brancher l’accueil et le lancement du match sur les états existants.
- [ ] Mettre en place la préparation de manche et la remise en jeu conformément aux sources.
- [ ] Relier joueur, bot, déplacements, jetpack, balle libre et collisions aux paramètres validés.
- [ ] Relier buts, score et chrono de cinq minutes à la boucle.
- [ ] Appliquer les transitions après un but et à la fin du temps selon les règles vérifiées.
- [ ] Traiter l’égalité après décision sur le point laissé ouvert.
- [ ] Afficher le résultat, attribuer les XP via le module existant et sauvegarder le profil.
- [ ] Permettre le retour au menu et un nouveau match selon les interfaces existantes.

## Vérifications utiles

- [ ] Parcours complet depuis le menu jusqu’au résultat, puis deuxième match sans état résiduel.
- [ ] Un même but n’incrémente le score qu’une fois ; remise en jeu conforme à l’original.
- [ ] Fin de partie et récompenses exécutées une seule fois, même avec plusieurs notifications.
- [ ] Comportement au moment où un but coïncide avec la fin du chrono conforme à la règle décidée.
- [ ] Sauvegarde puis rechargement du profil : progression conservée, sans nouvelle attribution.
- [ ] Deux apparences avec caractéristiques identiques ; balle toujours libre.
- [ ] Les trois difficultés sont reliées aux réglages validés.

Les cas limites (égalité, interruption, stockage indisponible, chronométrage en arrière-plan) doivent être confrontés aux sources avant de fixer leur comportement. Aucun moteur, framework ou système de sauvegarde nouveau n’est imposé par ce squelette.
