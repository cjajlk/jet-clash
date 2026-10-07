# Zone de but limitée au filet visible

La poche physique allait de y=125 à y=365. Sa partie supérieure dépassait
largement le filet peint dans `arena_background_midfield_goals.png`, et son bas
acceptait aussi des ballons légèrement sous le quadrillage.

La validation utilise maintenant deux bornes propres au score : `goalScoreTop=195`
et `goalScoreBottom=350` dans les coordonnées 1280×720 du terrain. Elles resserrent
la zone vers l’intérieur du filet visible. Le ballon entier doit se trouver
strictement entre ces limites : un ballon qui touche une borne est refusé.
Avec le rayon actuel 28,5 px, son centre doit être entre 223,5 et 321,5 px.

La profondeur horizontale nécessaire pour marquer reste celle déjà validée.
Les deux côtés utilisent les mêmes bornes dans le moteur de match existant,
en duel, en 2v2 et en entraînement. L’effet lumineux est lui aussi limité à cette
hauteur. Le fond graphique, les collisions, rampes, physique, caméra, commandes
et progression n’ont pas été retouchés.

Validation :

- Échec reproduit avant correction sur les deux cages : y=170 et y=330 étaient
  acceptés alors qu’ils débordent du filet.
- 281 tests unitaires réussis, dont 11 nouveaux tests des anciennes bandes,
  des bords exacts, de l’intérieur du filet et des trois modes. Vérification du
  clipping lumineux dans les tests de célébration existants.
- `goal-net-zone-browser.cjs` : les deux côtés et les trois modes sur PC 1280×720
  et mobile 844×390 / 568×320. Situations contrôlées avec les vrais modules du jeu,
  faux buts refusés, bons buts validés, effet, HUD et retour au menu.
- `team-mode-browser.cjs` : match actif, but, score, XP, rejeu et changements de mode.
