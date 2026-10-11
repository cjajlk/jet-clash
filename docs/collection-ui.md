# Collection — interface et vérifications

Mission limitée à la présentation Collection. Les changements de la mission précédente étaient déjà présents et non commités au démarrage ; ils sont conservés.

## Résultat

- Bandeau de dix catégories alignées, état actif néon cyan et disposition adaptée à la largeur.
- Cartes sélectionnables : visuel, nom, rareté, état débloqué/équipé/verrouillé/non ouverte.
- Panneau dédié : grand aperçu, état, informations existantes, progression des couleurs, variantes verrouillées, Prismatique et action d'équipement/retrait/ouverture.
- Sélection locale uniquement, sans nouveau champ de sauvegarde. Équipement, retrait, couleurs et ouvertures utilisent les fonctions existantes.
- Aperçus verrouillés des deux récompenses niveau 50 existantes ; aucun nouvel objet acquis ou nouvelle récompense inventée.
- Caisses : groupes de contenants non ouverts conservés, quantité affichée et ouverture existante. Les caisses déjà ouvertes restent exclues de la grille.
- États vides avec explication et accès au Pass. Choix de couleur après doublon conservé dans son panneau existant.
- Desktop : grille et panneau de détail côte à côte. Portrait : grille puis détail, accès au panneau lors de la sélection. Paysage court : page entière défilante, catégories compactes, nav basse indépendante.

## Fichiers de cette mission

Modifiés : index.html ; src/mobile-menu.js ; tests/character-cosmetics-browser.cjs ; tests/systems-stabilization-browser.cjs.

Ajoutés : src/collection-view.js ; styles/collection-ui.css ; tests/collection-ui-browser.cjs ; docs/collection-ui.md.

Les deux anciens tests navigateur ont été adaptés pour sélectionner une carte avant d'utiliser les actions désormais placées dans le panneau de détail. Aucune vérification supprimée.

Aucun changement de cette mission dans les modèles Collection, Profil, Pass, Défis, récompenses, sauvegardes ou les fichiers gameplay/physique/caméra/match.

## Tests

- 387 tests unitaires réussis, aucun échec ou skip.
- Nouveau test navigateur Collection réussi à 1440×900, 1024×768, 390×844, 844×390 : dix catégories, sélection, aperçus verrouillés, variantes inéquipables, équipement/retrait, quantités de caisses et exclusion des caisses ouvertes, états vides, absence de débordement horizontal et séparation avec la navigation.
- Test complet des systèmes réussi à 1440×900, 800×600, 390×844, 844×390 : acquisition/doublons/Prismatique, récupération Pass/Défis, Profil et persistance, réactions, modes, fullscreen et manette simulée. Relancé après l'ajustement paysage.
- Personnages niveau 50 : test navigateur réussi dans les quatre formats.
- Captures des quatre formats Collection inspectées, enregistrées sous C:/Users/User/AppData/Local/Temp/jetclash-collection-ui.
- Aucun message d'erreur JavaScript ni ressource manquante dans les parcours Collection.
- git diff --check sans erreur (avertissements LF/CRLF habituels seulement).

## Git à la livraison (avant autorisation de commit/push)

Branche main, HEAD 13e4091 conservé. 22 fichiers suivis modifiés et 10 fichiers nouveaux non suivis au total, incluant les travaux précédents. Aucun fichier staged. Aucun commit et aucun push.

L'ancien test mobile-v2-browser.cjs déjà signalé obsolète dans la mission précédente n'est ni changé ni présenté comme validé par cette mission.
