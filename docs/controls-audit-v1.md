# Vérification des commandes : duel, 2v2 et entraînement

Un défaut commun aux trois modes empêchait les touches personnalisées de tir et
de visée de fonctionner : BallInput acceptait uniquement F/I/J/K/L et lisait
uniquement la première touche de chaque action. Il consulte maintenant les
réglages actuels, y compris les touches alternatives, à chaque événement et lecture.
Les anciennes touches cessent de déclencher les actions remplacées. Les champs
de formulaire restent exclus et la perte de focus annule les commandes.

La physique, les bots, les rampes et les paramètres de gameplay ne changent pas.

Validation :

- Test de régression reproduit en échec avant correction puis réussi après.
- 262 tests unitaires réussis.
- `tests/all-mode-controls-browser.cjs` : les trois modes, 1280×720, 844×390 et
  568×320 ; événements clavier et pointeur réels, manette standard simulée.
  Vérifie déplacement gauche/droite, double saut, jet, flip, frappe au relâchement,
  tir personnalisé, commandes tactiles sur mobile, reset réservé à l'entraînement,
  annulation à la pause et retour au menu. La simulation avance par pas contrôlés
  pour isoler chaque action ; ce test ne remplace pas un essai sur manette physique.
- `tests/team-mode-browser.cjs` : déroulement actif du 2v2, buts, score, récompense,
  rejeu et transitions vers duel/entraînement sur les trois dimensions.
- `tests/ball-control-regression-browser.cjs` : tirs gauche/droite, absence de frappe
  distante et récompenses uniques sauvegardées.
