# Audit Heavy / Fluid et cosmétiques du Pass niveau 50

Audit réalisé avant modification des assets. Aucun PNG existant n’a été remplacé, retouché ou renommé. Les ZIP ont été inspectés sans importer leurs pièces dans le jeu.

## État réel des personnages

| Personnage | PNG présents | Poses actuellement utilisées | Conclusion |
| --- | ---: | --- | --- |
| Fluid | 14 | walk, sprint, jetpack + 8 poses aériennes | Jeu de rendu existant exploitable, mais les poses aériennes représentent un ancien astronaute et les poses terrestres un loup bleu. Cohérence visuelle imparfaite déjà présente avant cette mission. |
| Heavy | 6 | walk, sprint, jump, jetpack | Toutes les poses du rendu actuel Heavy sont présentes. Les 8 poses aériennes dédiées de Fluid n’ont pas d’équivalent Heavy. |

Les six poses de base existent pour chacun : idle, walk, sprint, jump, jetpack et attack. idle/attack ne sont pas utilisés par le rendu de match actuel ; Fluid jump est également remplacé à l’écran par ses poses aériennes ; leur existence ne signifie pas qu’une nouvelle mécanique d’animation a été ajoutée.

`assets/character/base` contient également 28 images génériques (idle et 6 frames de marche pour les quatre directions). Elles ne constituent pas de nouvelles poses Heavy/Fluid et ne sont pas chargées par le renderer actuel.

### Inventaire exact

| Fichier | Dimensions | Exploitation |
| --- | --- | --- |
| `assets/characters/fluid/fluid_air_dash.png` | 432 × 272 | Ancien astronaute : utilisée telle quelle par le jeu actuel, à remplacer par une pose du loup bleu pour une identité uniforme |
| `assets/characters/fluid/fluid_air_diagonal_down.png` | 360 × 254 | Ancien astronaute : utilisée telle quelle par le jeu actuel, à remplacer par une pose du loup bleu pour une identité uniforme |
| `assets/characters/fluid/fluid_air_diagonal_up.png` | 403 × 308 | Ancien astronaute : utilisée telle quelle par le jeu actuel, à remplacer par une pose du loup bleu pour une identité uniforme |
| `assets/characters/fluid/fluid_air_horizontal.png` | 470 × 193 | Ancien astronaute : utilisée telle quelle par le jeu actuel, à remplacer par une pose du loup bleu pour une identité uniforme |
| `assets/characters/fluid/fluid_air_idle.png` | 172 × 397 | Ancien astronaute : utilisée telle quelle par le jeu actuel, à remplacer par une pose du loup bleu pour une identité uniforme |
| `assets/characters/fluid/fluid_air_turn.png` | 357 × 351 | Ancien astronaute : utilisée telle quelle par le jeu actuel, à remplacer par une pose du loup bleu pour une identité uniforme |
| `assets/characters/fluid/fluid_air_up.png` | 270 × 378 | Ancien astronaute : utilisée telle quelle par le jeu actuel, à remplacer par une pose du loup bleu pour une identité uniforme |
| `assets/characters/fluid/fluid_attack.png` | 174 × 174 | Ancien astronaute : non utilisée par le renderer actuel ; dessin à remplacer par celui du loup bleu pour une identité uniforme |
| `assets/characters/fluid/fluid_ceiling.png` | 313 × 348 | Ancien astronaute : utilisée telle quelle par le jeu actuel, à remplacer par une pose du loup bleu pour une identité uniforme |
| `assets/characters/fluid/fluid_idle.png` | 108 × 191 | Pose propre réutilisée comme aperçu Fluid |
| `assets/characters/fluid/fluid_jetpack.png` | 157 × 203 | Pose existante conservée |
| `assets/characters/fluid/fluid_jump.png` | 124 × 207 | Pose existante conservée |
| `assets/characters/fluid/fluid_sprint.png` | 138 × 192 | Pose existante conservée |
| `assets/characters/fluid/fluid_walk.png` | 117 × 184 | Pose existante conservée |
| `assets/characters/heavy/heavy_attack.png` | 185 × 190 | Pose existante conservée |
| `assets/characters/heavy/heavy_idle.png` | 97 × 218 | Personnage complet, mais texte HEAVY_IDLE.png incrusté : ne pas utiliser comme vignette |
| `assets/characters/heavy/heavy_jetpack.png` | 140 × 216 | Pose existante conservée |
| `assets/characters/heavy/heavy_jump.png` | 100 × 190 | Pose existante conservée |
| `assets/characters/heavy/heavy_sprint.png` | 122 × 174 | Pose existante conservée |
| `assets/characters/heavy/heavy_walk.png` | 92 × 191 | Pose propre réutilisée comme aperçu Heavy |

Les PNG ont un canal alpha exploitable. Leur cadrage et leurs dimensions diffèrent : le renderer conserve son redimensionnement et son ancrage existants. Aucune nouvelle silhouette physique n’est calculée à partir des images.

## Contenu des archives reçues

- `C:/Users/User/Downloads/asset (65).zip` : 17 pièces bleues/violettes.
- `C:/Users/User/Downloads/asset (66).zip` : 17 pièces rouges/orange.
- Aucun des deux ZIP ne contient de personnage assemblé ou de pose idle/walk/sprint/jump/jetpack/attack complète.
- Ces pièces ne sont ni des nouvelles poses ni des instructions de travail. Elles restent dans leurs archives : pas d’assemblage modulaire, pas de remplacement des animations existantes.

| Nom dans chaque ZIP | Contenu observé |
| --- | --- |
| `asset_01.png` | Casque / visière |
| `asset_02.png` | Variante casque / visière |
| `asset_03.png` | Variante casque / visière |
| `asset_04.png` | Variante casque / visière |
| `asset_05.png` | Élément de torse / emblème |
| `asset_06.png` | Variante torse / emblème |
| `asset_07.png` | Variante torse / emblème |
| `asset_08.png` | Variante torse / emblème |
| `asset_09.png` | Épaulière |
| `asset_10.png` | Variante épaulière |
| `asset_11.png` | Variante épaulière |
| `asset_12.png` | Variante épaulière |
| `asset_13.png` | Gant / avant-bras |
| `asset_14.png` | Botte / jambière |
| `asset_15.png` | Écharpe / col |
| `asset_16.png` | Queue / ornement |
| `asset_17.png` | Élément de propulsion |

## Intégration minimale

| Piste niveau 50 | Récompense | ID historique conservé |
| --- | --- | --- |
| Gratuite | Fluid cosmétique complet · Aube | `s1-free-50` |
| Premium | Heavy cosmétique complet · Couronne | `s1-premium-50` |

- Le catalogue `src/character-cosmetics.js` centralise identité, poses, aperçu et couleur par défaut.
- Le choix gratuit/Premium suit les variantes Aube/Couronne déjà prévues au niveau 50 ; il est explicite et peut être inversé dans le catalogue sans ajouter de niveaux.
- Le type et le slot restent `skin`. Aucune armure modulaire ou nouvelle catégorie de boutique n’est introduite.
- Les personnages sont des variantes colorées du rendu actuel : pas de nouveau personnage entièrement dessiné à partir des pièces des ZIP.
- Pass et Collection affichent les vrais aperçus. La sélection et les couleurs sont sauvegardées avec le système existant.
- Les anciennes récompenses niveau 50 déjà récupérées sont reconnues à partir des mêmes IDs. Leur inventaire enregistré n’est pas réécrit et aucun objet n’est attribué une seconde fois.
- Heavy utilise ses poses existantes walk/sprint/jump/jetpack, y compris jump en l’air comme dans le rendu Heavy actuel. Aucune pose aérienne manquante n’est fabriquée.
- Le personnage contrôlé conserve son identité physique Fluid : seules les images affichées changent. Taille, masses, contrôles, sauts, flips, tirs, boost, collisions, buts et bots ne sont pas modifiés.
- Le HUD conserve les noms et équipes du match. Le nom cosmétique est affiché dans Pass/Collection et l’aperçu d’accueil.

## Manques précis pour une version visuellement parfaite

### Fluid

Fournir les huit poses aériennes suivantes avec le loup bleu, en remplacement des images historiques de l’astronaute. Les fichiers existent déjà, mais leur dessin n’est pas cohérent avec les poses terrestres :

- `assets/characters/fluid/fluid_air_idle.png` — nouvelle version du loup bleu.
- `assets/characters/fluid/fluid_air_up.png` — nouvelle version du loup bleu.
- `assets/characters/fluid/fluid_air_diagonal_up.png` — nouvelle version du loup bleu.
- `assets/characters/fluid/fluid_air_horizontal.png` — nouvelle version du loup bleu.
- `assets/characters/fluid/fluid_air_turn.png` — nouvelle version du loup bleu.
- `assets/characters/fluid/fluid_ceiling.png` — nouvelle version du loup bleu.
- `assets/characters/fluid/fluid_air_diagonal_down.png` — nouvelle version du loup bleu.
- `assets/characters/fluid/fluid_air_dash.png` — nouvelle version du loup bleu.

Le dessin de `assets/characters/fluid/fluid_attack.png` montre également cet astronaute : prévoir sa version loup bleu. Ce sont donc **9 dessins Fluid à rendre cohérents**, dont 8 actuellement utilisés en vol.

### Heavy

Pour la même variété aérienne que Fluid, les huit fichiers suivants n’existent pas :

- `assets/characters/heavy/heavy_air_idle.png`
- `assets/characters/heavy/heavy_air_up.png`
- `assets/characters/heavy/heavy_air_diagonal_up.png`
- `assets/characters/heavy/heavy_air_horizontal.png`
- `assets/characters/heavy/heavy_air_turn.png`
- `assets/characters/heavy/heavy_ceiling.png`
- `assets/characters/heavy/heavy_air_diagonal_down.png`
- `assets/characters/heavy/heavy_air_dash.png`

Prévoir également une version propre de `heavy_idle.png` sans texte incrusté si l’on veut l’utiliser comme pose de repos ou vignette. L’aperçu actuel utilise `heavy_walk.png`, sans création d’asset.

### Nouveaux designs issus des ZIP

Si Aube/Couronne doivent avoir une nouvelle armure dessinée à partir des 17 pièces de chaque ZIP, il faut fournir les personnages assemblés dans toutes les poses ci-dessus, avec transparence, proportions et pivots cohérents. Les pièces seules ne suffisent pas. Aucune reconstruction fragile n’a été tentée.

## Fichiers concernés

- `src/character-cosmetics.js` (nouveau catalogue)
- `src/season-pass.js` (récompenses niveau 50 seulement)
- `src/season-pass-view.js` (aperçus niveau 50)
- `src/collection.js` (métadonnées de présentation et reconnaissance des anciennes récompenses)
- `src/mobile-menu.js` (aperçus Collection et accueil)
- `src/renderer.js` (sélection des sprites selon le cosmétique ; images Heavy idle/attack chargées en complément)
- `tests/character-cosmetics.test.mjs`
- `tests/character-cosmetics-browser.cjs`
- `docs/character-cosmetics-audit.md`

## Validation

- Tests unitaires : assets référencés existants, verrouillage niveau/Premium, récupération unique, couleurs, sauvegarde, anciens inventaires, sélection des sprites et conservation des corps physiques.
- Comparaison de 600 pas de simulation d’entraînement pour chaque cosmétique contre un profil sans cosmétique : mêmes personnages physiques et même ballon.
- Vérification navigateur : PC large 1440×900, PC étroit 800×600, mobile portrait 390×844 et paysage 844×390 ; récupération au niveau 50, sélection, rechargement, rendu 1v1/2v2/entraînement et achat/ouverture d’une capsule existante.

Aucun commit, aucun push. Les PNG et les ZIP originaux sont inchangés.

## Harmonisation demandée après l’audit

Les tableaux ci-dessus décrivent l’état initial. Le rendu aérien de Fluid réutilise désormais les sprites loup `fluid_jump.png` et `fluid_jetpack.png`, orientés selon les pieds du personnage. Heavy utilise la même orientation avec ses propres sprites jump/jetpack. Les anciens astronautes sont conservés sur disque mais ne sont plus chargés. Il n’est pas nécessaire de disposer de huit nouveaux dessins aériens pour jouer avec une identité cohérente ; des poses dédiées restent une amélioration artistique possible.

Deux nouveaux PNG ont été créés avec l’outil imagegen intégré, en édition avec références, sans remplacer les originaux :

- `assets/characters/fluid/fluid_attack_wolf.png` : loup Fluid effectuant un coup de pied, sans ballon incrusté. Prompt : conserver l’identité, armure, écharpe et queue du loup de `fluid_idle.png`, reprendre seulement la pose de `fluid_attack.png`, supprimer l’astronaute, un personnage complet sur fond transparent, sans texte ni effets. Chargé pour la pose attack, actuellement non déclenchée par le rendu du match.
- `assets/characters/heavy/heavy_idle_clean.png` : repos Heavy sans étiquette de fichier, utilisé pour le Pass et la Collection. Prompt initial : retirer le texte de `heavy_idle.png`, conserver le loup et son armure, référence `heavy_walk.png`, fond transparent. Deuxième édition : supprimer le halo autour du personnage, préserver exactement son corps et sa pose, détourage transparent sans texte.

La balle est affichée à 83,33 % de sa taille précédente pour le test demandé (`ballVisualScale`). Son rayon physique reste 28,5 : réduire aussi ce rayon faisait échouer plusieurs tests de contacts or/violet. Les vitesses, rebonds, tirs et seuils de buts restent inchangés. Ce réglage visuel est réversible dans `src/config.js`.

Fichiers supplémentaires : `src/config.js`, les deux nouveaux PNG ; tests d’orientation ajoutés et vérification navigateur des sources aériennes effectivement chargées.

Validation finale : 376 tests unitaires réussis, contrôles navigateur réussis dans les quatre formats (1440×900, 800×600, 390×844, 844×390), aucune erreur JavaScript ni asset manquant. Vérification visuelle de la capture du match : loup Fluid conservé pendant le boost, ballon réduit. `git diff --check` réussi. État final : six fichiers existants modifiés et six nouveaux fichiers, tous liés à cette mission et à l’intégration niveau 50 précédente. Aucun commit ni push.
