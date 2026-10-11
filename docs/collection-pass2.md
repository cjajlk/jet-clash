# Collection PASS 2 — vitrine cosmétique

## Visuel

Grand aperçu des personnages avec lumière discrète et flottement UI ; rareté, saison, couleurs et équipement conservés. Fluid de base est sélectionnable en plus des prototypes niveau 50. Même équipement persistant que Profil et la configuration de match, via les méthodes existantes.

Bannières présentées comme cartes joueur : avatar disponible ou personnage, pseudo, titre équipé et teinte de bannière. Identité actuelle affichée depuis les données réelles du Profil. Titres et avatars acquis inclus dans le filtre Bannières, sans nouvelle catégorie ni second profil.

Les seize réactions existantes sont visibles dans Tout : huit de départ et huit verrouillées pour les futures récompenses. Texte et emplacement équipé affichés ; les réactions débloquées ouvrent la configuration existante du Profil. Ces aperçus ne créent aucun objet ni aucune acquisition dans la sauvegarde.

Traînées, propulsions, impacts : démonstrations UI légères et identifiées comme aperçus. Buts : mention explicite « Effet de but à venir ». Ballons agrandis, rotation lente facultative. Animations conditionnées à prefers-reduced-motion ; Prismatique existante préservée, sans remplacer son animation par le flottement.

Changement de catégorie revient en haut. Sélection mobile amène au début du détail, afin de montrer le personnage entier ; couleurs/actions accessibles par défilement. Navigation basse séparée du contenu.

## Fichiers de cette mission

- src/mobile-menu.js : entrées de présentation Fluid/réactions, titres/avatars dans Bannières, états et actions existants, défilement.
- src/collection-view.js : branchement des aperçus.
- src/collection-previews.js : nouveau module purement visuel.
- styles/collection-ui.css : scènes, carte joueur, animations et responsive.
- tests/collection-ui-browser.cjs : cohérence Collection/Profil/configuration, bannière persistante, emplacements/réactions verrouillées, animations réduites et aperçus d'effets.
- tests/character-cosmetics-browser.cjs : quantité visuelle adaptée à Fluid de base, sans changement des deux récompenses.
- docs/collection-pass2.md : ce rapport.

Aucun changement de cette mission aux règles Collection, Pass, Défis, récompenses, économie, sauvegardes, ouverture des caisses, Prismatique, gameplay, physique, caméra, contrôles ou renderer gameplay. Aucun nouvel asset ni sprite gameplay.

## Vérifications

387 tests unitaires réussis ; zéro échec ou skip. Tests Collection réussis en 1440×900, 1024×768, 390×844 et 844×390, avec vérification des autres pages et absence d'erreurs JavaScript/ressources manquantes. Test systèmes complet réussi dans les quatre formats (desktop moyen 800×600), notamment doublons, Prismatique, Pass/Défis, Profil/persistance, réactions, modes et fullscreen/manette simulée. Test personnages niveau 50 réussi dans quatre formats.

Captures de personnages, bannières et réactions enregistrées pour les quatre formats dans C:/Users/User/AppData/Local/Temp/jetclash-collection-ui ; captures desktop et mobile inspectées. git diff --check sans erreur ; avertissements LF/CRLF habituels seulement.

L'ancien mobile-v2-browser.cjs déjà signalé obsolète dans les missions précédentes est laissé inchangé et n'est pas présenté comme validé.

## Git à la livraison (avant autorisation de commit/push)

main, HEAD 13e4091 inchangé. 22 fichiers suivis modifiés et 12 fichiers nouveaux non suivis au total, travaux des missions précédentes inclus. Rien staged. Aucun commit, aucun push.
