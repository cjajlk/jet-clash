# Affichage plein écran du match

## Modification

`styles/main.css` ajuste uniquement les sélecteurs de plein écran. Le chemin actuel utilise le plein écran natif sur `html` pour inclure le menu ; le plein écran historique de `game-shell` reste pris en charge.

Le conteneur et le canvas utilisent la plus grande surface 16:9 contenue dans le viewport, avec largeur et hauteur explicites, centrage et dimensions minimales remises à zéro. Cela évite notamment le minimum de 440 px prévu par les anciens styles tactiles sur un écran plus bas. Les bandes restantes sur un écran non 16:9 sont nécessaires pour ne pas déformer ou recadrer l’image.

Le score et le chrono sont rapprochés du haut et réduits ; le bouton retour mesure 36 px sur desktop. Les panneaux BOOST passent à 78 px et leurs anneaux à 44 px, dans les coins inférieurs. Sur mobile avec commandes tactiles visibles, les boutons gardent leur espace et les jauges restent en haut comme auparavant. Les zones tactiles du bouton retour restent de 44 px. Les aides clavier/manette sont masquées en plein écran.

Aucun changement dans `index.html`, le JavaScript, la caméra, les contrôles, le gameplay, les assets ou les données du profil.

## Tests

`tests/fullscreen-layout-browser.cjs` vérifie les formats 1920×1080, 1440×900, 1280×720, téléphone paysage 844×390 et tablette paysage 1024×768 :

- entrée plein écran via les options ;
- ratio du canvas et du conteneur, dimensions maximales, centrage et absence de dépassement ;
- HUD, bouton retour et panneaux BOOST contenus dans le viewport ;
- attributs du canvas toujours 1280×720 ;
- resize pendant le plein écran ;
- détection et déplacement avec une manette Bluetooth simulée, conservée après sortie ;
- retour au menu et relance ;
- restauration des dimensions desktop en fenêtre ;
- sortie par bouton et API native.

Résultats : tous les formats passent. Captures inspectées en 1920×1080, 1440×900 et 844×390. Le script existant `options-fullscreen-browser.cjs` passe également sur ses quatre formats desktop. `return-menu-browser.cjs` passe les 48 cycles et les scénarios ciblés de reprise. Les 376 tests unitaires passent.

Limites : le navigateur headless ne transmet pas la touche Échap à la fenêtre native, donc sa sortie reste à confirmer manuellement. La manette Bluetooth est simulée ; la liaison matérielle réelle reste à confirmer sur l’appareil. Aucun gestionnaire de focus/manette ni de sortie native n’a été modifié.

Les anciens tests mobiles obsolètes signalés dans `docs/return-menu-audit.md` n’ont été ni modifiés ni masqués ; ils ne sont pas annoncés comme réussis.

Fichiers de cette mission : `styles/main.css`, `tests/fullscreen-layout-browser.cjs`, ce rapport.
