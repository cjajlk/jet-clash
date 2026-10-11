# Stabilisation des systèmes — audit initial du 11 octobre 2026

Avant modification : branche main propre, dernier commit `13e4091`.

- Collection : inventaires Pass/capsules, équipement par catégorie et couleur choisie persistants. Quatre variantes accessibles sans déblocage individuel. Aucun registre de couleurs réellement obtenues.
- Capsules : quatre catégories complètes vendues. Modèles uniques ; doublon remboursé à 25 %. Les caisses ouvertes restent dans les inventaires et leurs grandes cartes restent affichées.
- Pass : 50 niveaux, récompenses identifiées `s1-*`, récupération unique, Premium et XP saison sauvegardés. Dates et historique de saisons absents. Deux prototypes de personnages cosmétiques niveau 50 utilisent les sprites Fluid/Heavy existants avec corps physiques inchangés.
- Défis : progression numérique/barres déjà présentes, neuf objectifs quotidiens/hebdomadaires. XP automatiquement attribuée à l’atteinte ; pas de récupération manuelle ni de badge.
- Profil : XP, monnaies, réglages et matchs récompensés disponibles. Pas de page dédiée ni de compteurs fiables de victoires/buts historiques.
- Réactions : 16 PNG complets sous `assets/capsules/reaction`, non intégrés. Pas de configuration ou de cooldown.
- Modes : trois boutons de lancement dans un écran commun, arènes d’entraînement et difficulté déjà disponibles. Aucun écran de configuration distinct ni sélecteur de personnage.
- Fullscreen/manette : correctifs CSS et reprise manette existants, tests ciblés disponibles. Caméra/physique à conserver.

Migration prévue : garder les inventaires et historiques de récompenses ; retenir la couleur initiale et la couleur effectivement sauvegardée pour les anciens cosmétiques, sans considérer les anciens aperçus comme des acquisitions. Garder les anciens défis déjà récupérés, sans redonner d’XP. Préserver la saison courante et préparer des archives séparées. Ne pas inventer de victoires/buts pour les anciens matchs.

Pas de commit/push avant validation de CJ. Les résultats et le détail final seront ajoutés après vérification.


## Corrections réalisées et choix retenus

- Collection : registre des couleurs réellement obtenues par objet. Première acquisition = une couleur ; aperçus verrouillés et non équipables. Un doublon donne un choix unique sauvegardé, également accessible après fermeture de l'animation et rechargement. Six palettes pour les cosmétiques recolorables (deux nouvelles), quatre pour les capsules qui possèdent quatre PNG authentiques. Aucun nouveau PNG fictif.
- Prismatique : déblocage automatique quand toutes les couleurs normales sont acquises, impossible à tirer directement. Sauvegarde et sélection persistantes, défilement doux des couleurs en Collection et rendu cosmétique pendant le match. Respect du réglage de réduction des animations dans les menus.
- Caisses : cartes uniquement pour les contenants non ouverts, groupes avec quantité, suppression de la carte à zéro. Historique d'ouverture et contenu conservés pour empêcher une récupération supplémentaire. Les doublons de capsules complètement collectionnées gardent le remboursement existant de 25 %.
- Pass : Saison 1 du 11 octobre 2026 à 00:00 UTC au 6 décembre 2026 à 00:00 UTC, 56 jours. Affichage du temps restant et blocage des récupérations/XP après expiration. API explicite de changement de saison avec archivage de l'XP et des récompenses récupérées ; conservation de tous les objets acquis. Aucun changement de saison automatique ni catalogue commercial de Saison 2 finalisé.
- Niveau 50 : conservation des prototypes existants Fluid cosmétique complet (gratuit) et Heavy cosmétique complet (Premium), marqués exclusifs à leur saison. Acquisition, Collection, Profil et configuration de match utilisent la même source d'équipement. Les statistiques et boîtes physiques restent identiques.
- Défis : suivi numérique et barres conservés, états en cours / terminé / récupéré distincts, bouton manuel, XP une seule fois. Badge discret du nombre de récompenses disponibles, retiré après récupération.
- Profil : pseudo sauvegardé, avatar de base ou avatar équipé si disponible, niveau/XP, titre, bannière, personnage, couleur et statistiques. Compteurs uniquement sur matchs terminés et récompensés une fois. Aucun ancien résultat inventé ; les anciens profils portent une indication de statistiques historiques partielles. Protection du champ pseudo contre les mises à jour automatiques pendant la saisie et contre le rendu imbriqué lors du changement de focus.
- Réactions : 16 assets existants vérifiés, huit réactions de départ et huit préparées pour de futures récompenses. Quatre emplacements uniques et persistants, affichage local dans le match, délai de deux secondes. Récompenses de type reaction compatibles avec Collection/Profil, sans nouvelle catégorie de boutique ni achat fictif. Aucun texte libre ni réseau ajouté.
- Modes : trois cartes, puis configuration, puis JOUER. Personnage réellement acquis seulement, Fluid disponible par défaut. Difficulté du duel/2v2 conservée, choix de décor uniquement en entraînement, rotation compétitive existante conservée. Exhibition et didacticiel clairement annoncés comme futurs.
- Responsive : nouveaux panneaux défilants, hauteurs naturelles pour éviter les chevauchements du Profil, configuration compacte en paysage. Aucun remplacement des styles fullscreen/manette existants.

## Migration et éléments reportés

Les monnaies, XP, équipements, inventaires, réglages, ouvertures, récompenses Pass récupérées et défis déjà récupérés sont conservés. Sans registre historique de couleurs, la couleur initiale et celle effectivement enregistrée restent acquises ; les anciens aperçus ne sont pas considérés comme des acquisitions. Les nouvelles couleurs ajoutées restent à débloquer. Les choix de doublon survivent au rechargement.

Reportés volontairement : nouvelles planches gameplay du personnage exclusif, catalogue réel de Saison 2, nouvelles distributions de réactions/avatars/titres, communication multijoueur en ligne. Les prototypes et données existantes sont réutilisés. Aucun asset créé ou supprimé.

## Vérifications

- Suite unitaire : 387 tests réussis, zéro échec, zéro test ignoré. Migration, déblocage unique, Prismatique, caisses, fin de saison/archives, récupération manuelle, Profil, réactions et sélection des personnages couverts.
- Parcours navigateur complet : desktop 1440×900, desktop étroit 800×600, mobile portrait 390×844, mobile paysage 844×390. Achats, animations, choix différé après rechargement, verrouillage, complétion, équipement, ouverture de groupes jusqu'à zéro, Pass niveau 50, défis et badge, pseudo, réactions, mode 2v2 et entraînement, fullscreen et manette simulée. Zéro erreur JavaScript et zéro ressource manquante dans ces parcours.
- Personnages niveau 50 : tests navigateur réussis dans les quatre formats ; test de simulation physique identique sur 600 pas conservé dans la suite unitaire.
- Manette : démarrage avec stick maintenu, relancement, reconnexion, saut/boost, fullscreen et resize réussis sur contexte desktop et tactile. DualSense standard simulée ; matériel Bluetooth réel non vérifiable dans le navigateur automatisé.
- Retour menu : 24 cycles sur desktop et 24 sur mobile paysage réussis, y compris résultats, prolongation, plein écran et reconnexion manette.
- Fullscreen : 1920×1080, 1440×900, 1280×720, téléphone 844×390 et tablette 1024×768 réussis. Ratio, limites, HUD et retour visibles, resize et sortie native vérifiés. Échap natif n'est pas transmis par Edge headless : sortie via API native vérifiée et limite signalée, sans prétendre avoir validé la touche physique.
- Options fullscreen : quatre résolutions supplémentaires validées, navigation et commandes conservées.
- Captures Profil et configuration enregistrées dans le dossier temporaire jetclash-systems et inspectées visuellement.
- git diff --check : aucune erreur de whitespace ; avertissements habituels LF/CRLF uniquement.

### Anciens tests distingués

Les tests de couleurs auparavant toutes disponibles et d'XP automatique ont été adaptés aux nouvelles règles, sans suppression ni skip. Les cinq tests navigateur récents ont été adaptés au passage carte → configuration → JOUER, et relancés.

L'ancien tests/mobile-v2-browser.cjs reste inchangé et échoue à sa ligne 11 : il attend un lancement immédiat depuis la carte de mode. Son ancien scénario tactile/manette présentait déjà une attente obsolète avant cette mission. Cet échec est séparé des nouvelles vérifications et n'a pas été masqué. Tous les anciens scripts navigateur historiques n'ont pas été relancés.

## Fichiers modifiés

Application : index.html ; src/challenges.js ; src/collection.js ; src/main.js ; src/mobile-menu-model.js ; src/mobile-menu.js ; src/profile-store.js ; src/renderer.js ; src/season-pass-view.js ; src/season-pass.js.

Nouveaux modules/styles : src/menu-panels.js ; src/quick-reactions.js ; styles/systems.css.

Tests adaptés : tests/capsules.test.mjs ; tests/challenges.test.mjs ; tests/character-cosmetics.test.mjs ; tests/collection.test.mjs ; tests/mobile-menu.test.mjs ; tests/season-pass.test.mjs ; tests/team-mode.test.mjs ; tests/character-cosmetics-browser.cjs ; tests/fullscreen-layout-browser.cjs ; tests/gamepad-startup-browser.cjs ; tests/options-fullscreen-browser.cjs ; tests/return-menu-browser.cjs.

Tests ajoutés : tests/systems-stabilization.test.mjs ; tests/systems-stabilization-browser.cjs. Rapport : docs/systems-stabilization.md.

## État Git à la livraison (avant autorisation de commit/push)

Branche main, HEAD 13e4091 inchangé. 22 fichiers suivis modifiés et six fichiers nouveaux non suivis. Aucun fichier staged, aucun commit, aucun push. Modifications conservées pour validation de CJ.

Les fichiers physics.js, config.js, arena.js, match.js, bot.js et les modules de contrôles/caméra ne sont pas modifiés. Les modifications du renderer portent seulement sur les couleurs Prismatiques ; aucune dimension de balle ou de personnage, collision, force, tir ou calcul de caméra changé.
