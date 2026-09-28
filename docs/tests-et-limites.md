# Vérification de l’Étape 2 — 28 septembre 2026

## Résultats

15 tests Node.js réussis, zéro échec, couvrant :

1. Menu, lancement, difficulté et compte à rebours sans consommation du chrono.
2. Déplacement, saut, jetpack, recharge et égalité physique Fluid/Heavy.
3. Sol, plateformes, dessous de plateforme et obstacle pour les personnages.
4. Gravité, inertie, rebonds et limites de la balle.
5. Contacts identiques pour les deux personnages, absence d’attraction à distance.
6. Franchissement complet dans l’ouverture du but.
7. Buts des deux camps, refus du doublon, remise en jeu et chrono suspendu.
8. Priorité de fin du chrono, immobilité après résultat, récompense unique.
9. Mort subite après égalité et fin au premier but.
10. 300 secondes simulées de temps actif jusqu’à la fin automatique.
11. Rejouer et retour menu avec profil conservé et score réinitialisé.
12. Profil relu, seuil de niveau et absence de double XP après rechargement.
13. Stockage refusé ou corrompu : fonctionnement en session avec avertissement.
14. Trois bots : commandes et capacités physiques bornées.
15. Récupération par le bot d’une balle au bord de l’obstacle ou sur le toit du but.

Le parcours automatisé Edge vérifie également les vraies entrées clavier et les écrans : menu → lancement → compte à rebours → mouvement/saut/jetpack/recharge → but Fluid → remise en jeu → but Heavy → mort subite → victoire et 170 XP → rejeu → défaite et 100 XP → menu → rechargement à 270 XP. Aucun plantage ou erreur JavaScript observé. Les buts et les fins de chrono du parcours navigateur sont provoqués par l’interface de test pour couvrir ces branches rapidement ; ils ne constituent pas un match humain joué intégralement.

Les captures de menu, jeu, annonce de but, mort subite et résultat ont été inspectées. Affichage vérifié à 1440 × 1080 et menu à 1024 × 768. Simulation prolongée du bot utilisée pour détecter et corriger le blocage contre le bord de l’obstacle.

## Reproduire

- Logique : `node --test tests/match.test.mjs`.
- Navigateur facultatif : serveur en route, Microsoft Edge et Playwright disponibles, puis `node tests/browser.cjs`. Si Playwright n’est pas résolu automatiquement, définir PLAYWRIGHT_MODULE vers son module installé. Playwright sert uniquement à la QA, pas au jeu. Les captures vont dans work/.
- Le paramètre `?test=1` expose les objets de simulation pour cette QA locale. Il n’est pas activé dans l’adresse normale du jeu.

## Limites et décisions de prototype à faire valider par CJ

- Paramètres de physique nouveaux, réglables dans config.js ; pas les constantes des modules historiques.
- Collisions rectangle/cercle simplifiées, non pixel par pixel. Le centre est une forme solide en marches sous le visuel en arche. Joueur et bot peuvent se croiser ; leur interaction avec la balle est physique.
- IA réactive simple avec imprécision ; pas de recherche de trajectoire optimale. Élite n’a aucun bonus physique et peut encore se tromper.
- Poses graphiques changées suivant le mouvement ; pas d’animation complète entre chaque pose. Les effets jetpack déjà dessinés sur les poses sont conservés. Aucun son fourni, donc aucun son ajouté.
- Mort subite à 00:00, sans durée maximale ; elle se termine sur un but réel, sans guidage de balle.
- Jauge restaurée à chaque remise en jeu, chrono arrêté durant préparation/annonce/pause, priorité au chrono au même pas de simulation : choix documentés du prototype.
- Sauvegarde locale par navigateur et adresse, sans synchronisation distante ni reprise de match interrompu. La protection de récompense vise un match dans une session ; plusieurs onglets jouant simultanément ne sont pas pris en charge.
- Les images originales sont intactes. Le fond agrandi peut paraître doux et certains assets peuvent conserver leurs petits libellés d’origine.
- Le document maître et les anciens fichiers techniques restent indisponibles ; aucune conformité indépendante à leur contenu complet n’est affirmée.

La validation finale n’est pas acquise : elle appartient à CJ sur test réel. Aucune nouvelle fonctionnalité ne sera ajoutée avant son retour.
