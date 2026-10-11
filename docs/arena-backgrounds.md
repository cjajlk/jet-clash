# Fonds d’arène — calendrier V1

## Assets rangés

Dossier exact : E:/cj_project/jet clash/assets/arena/backgrounds/

- arena_neon_city.png : deuxième image fournie, ville néon standard.
- arena_christmas.png : première image fournie, décor de Noël.
- arena_halloween.png : troisième image fournie.
- arena_sunset.png : quatrième image fournie.
- arena_default.png : copie conservée du fond principal actuel.

L’inversion des deux premières pièces jointes a été confirmée par CJ : nommage selon le contenu. Les quatre images sont copiées sans retouche. Le fichier original assets/arena/arena_flat_large_goals_v4.png est conservé et sert encore à l’entraînement et au repli du rendu.

## Calendrier et priorité

Dates locales du joueur. Halloween du 15 octobre à 00:00 au 1er novembre à 23:59:59.999 inclus ; Noël du 1er décembre à 00:00 au 31 décembre à 23:59:59.999 inclus. Dates centralisées dans ARENA_EVENTS (src/arena-backgrounds.js).

Événement prioritaire avant toute rotation. Hors événement, alternance quotidienne déterministe Ville Néon / Coucher de soleil, calculée depuis le jour civil local. Un refresh ne change pas le fond du jour. Aucun choix aléatoire, aucun stockage dans Profil.

Thème sélectionné au lancement du duel ou du 2v2 et conservé pendant le match. La configuration affiche sa vignette et la mention discrète de l’événement ; aucun bouton ne permet de désactiver celui-ci. En entraînement, sélection et décor existants conservés.

Identifiants d’extension disponibles : default, sunset, halloween, christmas. Le renderer expose arenaTheme pour de futurs effets. Aucune neige, brume, particule ou grosse architecture d’animation ajoutée.

## Chargement et secours

Le renderer conserve le fond actuel déjà utilisé par les menus/entraînements. Seul le nouveau fond actif est chargé, avec une référence d’image active ; aucun préchargement systématique des quatre PNG. Changer de thème libère la référence précédente, et un token évite qu’une réponse de chargement ancienne remplace une sélection plus récente.

Si le nouveau PNG manque, le chargement retourne sans bloquer l’entrée en match et le fond actuel est dessiné. La vignette de configuration utilise arena_default.png comme secours. Le test d’image absente provoque volontairement un HTTP 404 : aucun échec JavaScript ou chargement fatal.

## Fichiers de cette mission

Ajouts : les cinq PNG de assets/arena/backgrounds/ ; src/arena-backgrounds.js ; tests/arena-backgrounds.test.mjs ; tests/arena-backgrounds-browser.cjs ; docs/arena-backgrounds.md.

Complétés : src/renderer.js (image décorative uniquement) ; src/main.js (préchargement actif et choix au lancement) ; src/menu-panels.js (vignette de configuration) ; src/mobile-menu.js (secours vignette et changement du jour dans l’écran de configuration) ; styles/systems.css (vignette responsive).

Aucun changement de cette mission aux fichiers match.js, training-arenas.js, config.js, arena.js, physics.js, aux modules de caméra/contrôles, ni à Collection/Profil/Pass/Défis/économie. La géométrie reste la même pour chaque décor : 1280×720, sol 556, limites de buts 172/1108, ouverture verticale 176–386. Le calendrier mensuel historique de training-arenas reste intact pour sa compatibilité ; le nouveau calendrier central choisit seulement une illustration, pas une autre arène physique.

## Tests et captures

- 401 tests unitaires réussis, zéro échec/skip. Quatorze vérifications ajoutées : dates demandées, 1er novembre inclus, limites locales précises, trois années, changement d’année, priorité, stabilité quotidienne, date invalide, fichiers présents, références physiques partagées.
- Douze parcours navigateur : Halloween, Noël et standard sur 1440×900, 1024×768, 390×844 et 844×390. Duel et 2v2 couverts, vignette chargée, image active correcte, une seule URL de nouveau décor chargée, géométrie identique, entraînement conservé, absence de débordement et d’erreur JavaScript.
- PNG Halloween volontairement absent : configuration utilise la vignette de secours, 2v2 jouable avec ancien fond, aucun blocage.
- Tests systèmes complets réussis dans les quatre formats : Collection, doublons/couleurs/Prismatique, Pass, Défis, Profil/persistance, réactions, modes, fullscreen et manette simulée.
- Captures de configuration et match enregistrées sous C:/Users/User/AppData/Local/Temp/jetclash-arena-backgrounds. Captures desktop Halloween et mobile Noël inspectées visuellement.
- git diff --check : aucune erreur, uniquement avertissements LF/CRLF habituels.

## Git à la livraison (avant autorisation de commit/push)

main, HEAD 13e4091 inchangé. Travaux des missions précédentes conservés. 22 fichiers suivis modifiés et 21 fichiers nouveaux non suivis au total. Rien staged. Aucun commit, aucun push.
