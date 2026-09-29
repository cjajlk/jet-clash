# Menu mobile V1 — accueil et navigation

Base : `b2d504ea941c782e77ea456251009c5a649be2b5`. Aucun commit/push pour ce pack ; test réel CJ requis avant publication.

## Accueil

L’accueil tactile remplace uniquement le menu mobile. Fluid est affiché en grand avec son asset existant `fluid_idle.png`, devant La Cour de l’Aube. Un ballon énergétique et un socle lumineux CSS accompagnent le personnage. Le profil compact est en haut à gauche ; Options en haut à droite ; JOUER en bas à droite en paysage, en bas au centre en portrait. La barre basse comporte Accueil, Collection, Boutique, Pass et Défis, avec icônes et état actif.

Le niveau et l’XP proviennent de `ProfileStore`, sans nouveau stockage ni écriture. Le pseudo « Pilote » et l’emblème JC sont provisoires, isolés dans `MENU_IDENTITY`. Le Pass indique explicitement la progression du profil : aucun vrai Pass n’est simulé.

## Parcours

JOUER ouvre la sélection de mode. DUEL 1V1 appelle le lancement existant, avec la difficulté Facile/Normal/Élite déjà disponible. Les autres modes sont uniquement indiqués « Bientôt ». Aucun matchmaking, nouveau mode ou multijoueur.

À la fin du match, le bouton de retour existant ramène à l’accueil mobile et met à jour l’XP du profil. Les commandes tactiles n’apparaissent pas dans le menu. Le gameplay reste paysage uniquement ; en portrait, sa consigne de rotation et sa pause restent celles de Mobile V2. Le menu fonctionne, lui, dans les deux orientations.

## Coques secondaires

- Collection : neuf catégories futures, aperçu de Fluid équipé, Heavy et du ballon ; textes « À venir » pour les effets, emblèmes, avatars et bannières. Aucun équipement modifiable.
- Boutique : objets permanents et événements à venir. Aucun prix, achat ou monnaie.
- Pass : cinq paliers provisoires sur piste horizontale ; sélection d’un aperçu et bouton RÉCUPÉRER désactivé. Aucune récompense attribuée.
- Défis : Quotidiens, Hebdomadaires, Saisonniers à venir. Aucun compteur de mission.
- Options : rappel des commandes et du cadrage, retour cohérent. Aucun réglage de gameplay nouveau.

`DEFAULT_MENU_THEME` porte le fond et un emplacement `event:null`. Le CSS et la séparation des vues permettent de futurs thèmes Halloween/Noël/Saint-Valentin, accès, boutiques et défis événementiels, sans calendrier ni activation automatique dans ce pack.

## Architecture et invariants

Modules dédiés : `mobile-menu-model.js` (données/état de navigation), `mobile-menu.js` (vues), `mobile-menu.css` (styles isolés). Pas de bibliothèque UI, vidéo, particules ou animation permanente. Le canvas est dispensé de dessin pendant l’accueil mobile ; le DOM du menu ne se reconstruit que lorsque son contenu change.

L’intégration dans `main.js` appelle le lancement de duel déjà existant. Aucun changement de physique, du stick 360°, de puissance JET, du contrôle de balle, de caméra Mobile V2, de scoring, de cages ou de bot. Le menu desktop garde ses styles, ses éléments et son bouton initial.

## Vérification

259 tests existants conservés + 15 tests de menu = 274 tests automatisés. `tests/mobile-menu-browser.cjs` vérifie accueil, profil, cinq onglets, catégories, sélection d’aperçu Pass, Options, absence d’écriture du profil pendant la navigation, lancement du duel, retour avec XP, contrôles tactiles masqués au menu, paysage/portrait et desktop.

Formats : 667×375, 844×390, 1024×768, 390×844 portrait et 1440×1080 desktop. Le parcours `mobile-v2-browser.cjs` commence désormais via JOUER → DUEL ; ses vérifications de gameplay sont conservées. Le test réel CJ sur téléphone reste nécessaire.

Lancement : `Lancer-JetClash-Mobile.cmd`, même Wi-Fi que le PC, adresse réseau affichée par le lanceur, puis actualiser la page.
