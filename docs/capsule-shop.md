# Boutique de capsules

La Boutique vend quatre catégories à 200 Coins chacune : Noyau, Propulsion,
Impact et Style. Armure n'est pas affichée tant que les poses nécessaires au
jeu ne sont pas disponibles. Réaction reste hors de ces cinq catégories.

- Achat : déduction des Coins et ajout d'une capsule non ouverte à Collection.
- Ouverture : animation courte puis tirage d'un modèle de la catégorie,
  avec chances égales. La récompense est sauvegardée avant l'animation.
- Un modèle débloque ses quatre images cyan, violet, or et rouge.
- Doublon : pas de deuxième objet ; remboursement unique de
  `floor(prix réellement payé / 4)` Coins (50 Coins pour 200 Coins).
- Une capsule ouverte ne peut plus donner d'objet ni rembourser de Coins.
- Objets du Pass, XP, Jetons et Premium sont conservés.

## Catégories prêtes

| Catégorie | Modèles | Application |
| --- | --- | --- |
| Noyau | Épine, Orbital, Réacteur | Apparence du ballon |
| Propulsion | Aile, Comète, Orbite, Triple | Effet visuel pendant le boost |
| Impact | Fracture, Orbite, Percée, Vortex | Effet bref aux contacts du ballon |
| Style | Aura, Crête, Épaulières, Halo | Décoration suivant le personnage |

Les 15 modèles ont leurs 60 variantes disponibles dans `assets/capsules`.
Le fichier existant `style_aura_cyan..png` est utilisé sous son nom exact.
Les collisions, vitesses et tailles physiques ne changent pas.

## Assets nécessaires pour Armure

Les armures Éclaireur, Spectre et Titan n'ont que les images face/dos dans les
quatre couleurs. Pour les intégrer sans remplacer les animations de Fluid
par une image fixe, fournir des PNG transparents ou une planche de poses,
avec pivots et proportions cohérents, pour chaque armure/couleur :

- repos, marche, course, saut, jetpack, attaque ;
- vol neutre, montée, diagonale montante, vol horizontal, retournement,
  plafond, diagonale descendante, dash aérien.

Ce sont les 14 poses utilisées par le rendu actuel de Fluid. Prévoir les
variantes dos si les décorations/armures ne peuvent pas être simplement
retournées. Les quatre catégories vendues ne nécessitent aucun autre asset
pour le fonctionnement actuel ; leurs effets utilisent les PNG disponibles.

## Validation

`node --test tests/*.test.mjs`

`node tests/capsules-browser.cjs` (serveur local sur le port 4173)

`node tests/collection-browser.cjs`

Ces tests vérifient les assets, achats sans solde négatif, tirages, couleurs,
doublons, remboursement unique, conservation après rechargement, animation,
compatibilité Pass et rendu sans modification physique dans les trois modes.
