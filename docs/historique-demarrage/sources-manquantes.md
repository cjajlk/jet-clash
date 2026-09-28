# Sources à récupérer

## Document maître

Deux entrées ont été repérées dans les fichiers du téléphone associé au PC, dossier `Download` :

- JetClash_Etape_1_Document_general_v1.1.docx
- JetClash_Etape_1_Document_general_v1.1-1.docx

Leur copie a échoué avec le message Windows : « L’opération est réservée à un fournisseur de synchronisation du cloud connecté. » Les contenus et l’identité des deux copies n’ont pas pu être vérifiés. Aucun fichier vide ou substitut DOCX n’est inclus.

Pour récupérer la source : reconnecter le téléphone et rendre le fichier disponible sur le PC, ou télécharger l’original depuis la Library ChatGPT. Placer une copie intacte dans `docs/originaux/`, puis vérifier version et mention de validation.

## Modules techniques

À retrouver : jetClashConfig.js v1.2.2, profile.js v1.2.6, gameState.js v1.3.0. Aucun module JetClash correspondant n’a été retrouvé parmi les fichiers accessibles examinés. Les autres fichiers profile.js repérés ne présentent pas de correspondance JetClash établie et ne sont pas inclus.

Recherches effectuées : noms des fichiers dans le profil utilisateur hors AppData, .codex, .git et node_modules ; mentions JetClash dans les fichiers JS/JSON/Markdown de Documents, Downloads et Desktop ; noms des entrées dans les ZIP accessibles de ces dossiers ; recherche d’un dépôt JetClash parmi les installations GitHub connectées (aucun résultat). Le dossier Intel/Logs était inaccessible. Cette recherche ne garantit pas l’absence de sources dans d’autres comptes, branches, archives imbriquées ou emplacements non accessibles.

La conversation fournie a été lue intégralement ; aucune pièce jointe récupérable n’y était exposée. Aucun accès direct à la Library n’était disponible dans les outils de cette session.

Conserver les originaux techniques avec leur version dans `docs/originaux/` avant intégration. Inspecter leurs dépendances et exports avant de décider de leur emplacement d’exécution. Ne pas créer de fichiers homonymes de remplacement sans une nouvelle instruction explicite.
