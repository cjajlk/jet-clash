# Commandes mobile V1 — test réel CJ requis

Les commandes tactiles sont une couche d’entrée : aucune modification des mécaniques de balle, de la charge (0,7 seconde), des collisions, du scoring ou de l’IA. Clavier et manette restent disponibles. Le HUD PC et les menus existants sont conservés.

## Tester sur téléphone

1. Sur le PC, lancer `Lancer-JetClash-Mobile.cmd` et laisser sa fenêtre ouverte. Il lance `node tools/serve.mjs --lan` sur le port 4174 ; le lancement PC habituel reste sur 4173.
2. Connecter le téléphone au même réseau Wi-Fi, puis ouvrir l’adresse affichée par le lanceur (adresse du PC, pas `localhost`). Au moment des tests : `http://192.168.1.150:4174` ; cette adresse peut changer avec le réseau.
3. Lancer un match et tourner le téléphone en paysage. Recharger la page après une mise à jour des fichiers.
4. Si Windows demande l’accès réseau de Node, l’autoriser sur le réseau privé utilisé. Aucun changement de pare-feu n’est effectué par le projet. Si la page reste inaccessible, vérifier que le Wi-Fi n’isole pas les appareils.

Ce serveur est destiné au test local, sans publication Internet. Son mode réseau ne sert que l’index, les sources, les styles et les assets nécessaires au jeu. Ctrl+C l’arrête.

## Disposition et gestes

- En bas à gauche : joystick de déplacement progressif, deadzone identique au stick gauche (0,18). SAUT au-dessus ; JET à sa droite.
- En bas à droite : joystick de visée, même normalisation et même deadzone radiale que le stick droit. TIR à sa gauche.
- JET fonctionne en maintien. TIR charge pendant le maintien et frappe au relâchement, avec les mêmes règles de possession/frappe sous pression que sur PC.
- Chaque doigt est indépendant. Mouvement + visée + JET + TIR peuvent être maintenus ensemble. Une capture interrompue annule le tir au lieu de le déclencher. Relâcher un doigt ne libère pas les autres.
- Les joysticks tactiles prennent priorité uniquement sur leur canal tant qu’ils sont touchés. Les actions clavier/manette/tactile se combinent. Lever le doigt restitue immédiatement le canal à la manette ou au clavier.
- Les boutons mesurent au moins 48 px ; marges avec `safe-area-inset`. Les commandes restent périphériques et semi-transparentes. Les gestes de page sont neutralisés seulement pendant le gameplay.

## Paysage et plein écran

L’arène conserve le rapport 16:9 et utilise la surface disponible. Le mode portrait pendant un match affiche une invitation à tourner le téléphone, suspend le chrono et libère tous les doigts/charges. Le retour en paysage reprend le jeu. La perte de focus libère aussi les entrées.

Le bouton ⛶ demande le plein écran uniquement à l’appui. Refus ou API absente : le jeu reste utilisable, sans nouvelle demande automatique. Aucun verrouillage forcé d’orientation. Les menus n’ont pas été refaits ; leur contenu reste accessible par défilement sur un écran court.

## Manette Bluetooth

Une manette reconnue par Gamepad API utilise les commandes PS5/Xbox existantes ; le tactile reste affiché. La connexion Bluetooth elle-même relève du téléphone. Certains navigateurs exigent un contexte HTTPS pour Gamepad API : le test tactile sur l’adresse HTTP du réseau local fonctionne sans cette API, mais la disponibilité d’une manette réelle peut nécessiter ultérieurement une adresse HTTPS reconnue par l’appareil. Aucune sécurité du navigateur n’est désactivée.

Référence : [Gamepad API et contexte sécurisé (Mozilla)](https://hacks.mozilla.org/2020/07/securing-gamepad-api/).

## Vérifications

`node --test tests/*.test.mjs` : les 207 tests précédents sont conservés ; 21 tests tactiles supplémentaires, soit 228 tests.

`tests/touch-browser.cjs` utilise de vrais événements tactiles simulés via Chromium/Edge (jusqu’à quatre pointeurs), sur 667×375, 844×390 et 1024×768, puis les orientations portrait inverses. Il vérifie les actions, la charge, le relâchement, la coexistence PS5 simulée, la rotation, les proportions, les chevauchements et le refus du plein écran. Les parcours PC et PS5 existants restent disponibles. Aucun de ces essais ne remplace le test réel CJ sur téléphone.
