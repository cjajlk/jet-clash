# Complément Menu V1 — PC et mobile

Base publiée constatée : `ca6365ba31dc6bf28aa4ac85cbaaf9175bcf7d5c`.
Le Menu Mobile V1 est déjà inclus dans `280a63df95d1c9b46970e422554e42ae0cf44b45`.

Le même `MobileMenu` et le même modèle servent désormais tous les appareils.
Le nom historique des modules et des identifiants est conservé pour éviter une
migration sans rapport avec le rendu. Aucun routeur ni profil supplémentaire.

À partir de 1100 px de largeur et 600 px de hauteur, la feuille
`styles/menu-desktop.css` dispose la navigation à gauche, le profil en haut,
Fluid au centre et JOUER à droite. Collection, Boutique et Défis occupent la
largeur disponible. Le Pass affiche un grand aperçu et une piste horizontale.
Il reste provisoire : les XP affichés sont ceux du profil existant, sans
progression de Pass ni économie inventée.

En dessous du seuil, la composition mobile existante et sa navigation basse
restent utilisées, même avec une souris. Le redimensionnement conserve le DOM,
la destination, la catégorie et la récompense sélectionnées. Les commandes
tactiles et la caméra continuent de dépendre du dispositif de jeu existant,
indépendamment de cette mise en page.

JOUER ouvre les modes ; DUEL 1V1 appelle le lancement de match existant.
Aucune modification des commandes, paramètres physiques, cages, assets, IA ou HUD.

## Vérification

- Suite actuelle : `node --test tests/*.test.mjs` (274 tests conservés).
- `tests/desktop-menu-browser.cjs` : 1280×720, 1440×900, 1920×1080,
  1440×1080 ; navigation, sélection, redimensionnement, limites d'affichage,
  lancement du duel et retour ; erreurs JavaScript et chargement des assets.
- `tests/mobile-menu-browser.cjs` : 667×375, 844×390, 390×844, 1024×768.
- Les parcours navigateur existants utilisent désormais JOUER puis DUEL,
  y compris les vérifications clavier, PS5 simulée et contrôle de balle.

Complément local à faire valider par CJ sur PC et téléphone avant publication.
