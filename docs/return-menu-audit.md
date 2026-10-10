# Retour au menu et plein écran

## Diagnostic

Le retour normal n’a pas bloqué pendant 48 cycles automatisés 1v1, 2v2 et entraînement, avec victoires, défaites et mort subite. Le symptôme exact rapporté n’est donc pas reproduit sur ce chemin.

Une incohérence avérée existe dans le code précédent : les options demandent le plein écran de `document.documentElement`, mais le bouton en partie demandait celui de `game-shell`. Le menu est un frère de l’arène et reste en dehors de ce deuxième élément. Revenir au menu en conservant ce plein écran peut donc rendre le menu inaccessible. Cela dépend du bouton utilisé pour entrer en plein écran, notamment sur un PC tactile.

Deux autres fragilités ont été testées : une pause résiduelle n’était pas réinitialisée au lancement ; une exception isolée dans l’affichage interrompait la boucle car la prochaine image n’était demandée qu’après la fin du traitement.

## Correction

- `src/touch-controls.js` : le bouton de plein écran en partie englobe désormais toute la page, comme les options.
- `src/main.js` : sortie du plein écran limité à l’arène au retour au menu pour récupérer les anciennes sessions ; remise à zéro de la pause et des commandes tactiles en attente au lancement ; programmation de la prochaine image avant le traitement, pour survivre à une erreur isolée sans la masquer.
- `tests/return-menu-browser.cjs` : répétitions victoire/défaite/mort subite/entraînement, navigation et relance, connexion/déconnexion d’une manette simulée, pause résiduelle, erreur temporaire de rendu, deux entrées en plein écran, récupération du plein écran historique limité à l’arène, refus du plein écran.

Aucune mécanique, récompense ou sauvegarde de match modifiée.

## Vérification

- 376 tests unitaires réussis.
- 48 cycles de retour/relance réussis sur 1440×900 et 844×390, plus les scénarios de panne ciblés.
- Script `options-fullscreen-browser.cjs` réussi sur 1920×1080, 1366×768, 1280×1024 et 2560×1080 : navigation, déplacements, menu et sortie.
- Revue des points de blocage dans les sources : plein écran, overlays, dialogue de caisses, capture tactile, pause/focus, boucle d’affichage et sauvegarde. Aucun autre blocage établi dans ces chemins.
- Ancien script `mobile-v2-browser.cjs` essayé : il échoue au contrôle des boutons tactiles car sa manette simulée connectée masque ces boutons. Ce script ne valide donc pas le rendu mobile actuel ; les vérifications ciblées ci-dessus couvrent les changements de cette correction.

La panne exacte sur la machine de l’utilisateur reste à confirmer par son essai : les corrections couvrent les défauts identifiés, pas une preuve que toutes les causes intermittentes sont éliminées.

Modifications locales précédentes (cosmétiques et taille visuelle du ballon) conservées. Aucun commit ni push.
