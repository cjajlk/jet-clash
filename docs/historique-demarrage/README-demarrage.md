# JetClash — dossier de démarrage de l’Étape 2

Préparé le 28 septembre 2026. **Socle de préparation, pas encore un jeu jouable.**

## État des sources

L’Étape 1 est annoncée « terminée / VALIDÉ » dans la conversation de référence, qui cite le document maître validé le 23 juillet 2026. Le contenu du document n’a toutefois pas pu être consulté ici : sa conformité n’est donc pas vérifiée indépendamment.

| Source attendue | Version | Présence dans ce ZIP |
| --- | --- | --- |
| JetClash_Etape_1_Document_general_v1.1.docx | 1.1 | Absent : repéré sur le téléphone, contenu inaccessible |
| jetClashConfig.js | 1.2.2 | Absent : non retrouvé |
| profile.js | 1.2.6 | Absent : non retrouvé pour JetClash |
| gameState.js | 1.3.0 | Absent : non retrouvé |

Aucun de ces fichiers n’a été réinventé. Le récapitulatif dans `docs/reference-conversation.md` est une référence secondaire, **pas une copie du document maître**. Les fichiers web et la checklist sont nouveaux et ne sont pas des éléments validés de l’Étape 1.

## Ouvrir la base web

1. Extraire entièrement le ZIP.
2. Ouvrir `index.html` dans un navigateur.

Aucune installation ni dépendance n’est nécessaire. La page affiche uniquement l’état du dossier. Elle n’implémente aucune règle de jeu et ne charge aucun module manquant. Pour le futur code utilisant des modules JavaScript, employer un serveur HTTP local adapté à l’environnement de développement.

## Structure

```text
JetClash-demarrage/
  index.html                 Accueil du dossier
  styles/main.css            Présentation de cet accueil
  src/README.md              Emplacement du futur code
  assets/README.md           Emplacement des ressources
  docs/reference-conversation.md
  docs/sources-manquantes.md
  docs/etape-2.md             Checklist de reprise proposée
  docs/originaux/README.md    Emplacement des originaux à récupérer
  README.md
  .gitignore
```

## Prochaine étape

Récupérer le document maître et les trois bases validées, conserver leurs originaux, puis vérifier leurs interfaces et les décisions de l’Étape 1 avant de développer la boucle complète d’un match. Suivre `docs/etape-2.md`. Ce ZIP permet de préparer cette reprise ; il ne remplace pas les sources nécessaires pour une implémentation fidèle.
