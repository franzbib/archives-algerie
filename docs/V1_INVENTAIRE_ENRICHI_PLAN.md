# V1 - Inventaire enrichi

## 1. Ce que la V1 doit ajouter

La V1 doit renforcer l'inventaire sans changer la nature du projet. L'objectif
reste une application d'exploration archivistique fondee sur un manifeste local,
avec une logique collection, cote, dossier, document, page.

La V1 doit viser:

- des filtres réellement utilisables et lisibles ;
- une meilleure qualite des notices de collection et de document ;
- un statut de traitement plus clair ;
- une preparation propre de l'ingestion Google Drive controlee ;
- une page ou un niveau "dossiers" si le manifeste montre que ce niveau devient
  necessaire.

## 2. Ce que la V1 ne doit pas encore ajouter

La V1 ne doit pas inclure:

- OCR massif ;
- appel OpenAI ;
- embeddings ;
- stockage PostgreSQL ;
- authentification ;
- ingestion Google Drive automatique non controlee ;
- generation de resultats ou resumes non sources.

## 3. Fichiers concernes

Fichiers de donnees et domaine:

- `src/data/archives-manifest.json`
- `src/types/archive.ts`
- `src/lib/archiveManifest.ts`

Pages:

- `src/app/collections/page.tsx`
- `src/app/collections/[id]/page.tsx`
- `src/app/documents/[id]/page.tsx`
- eventuellement `src/app/dossiers/[id]/page.tsx` si le niveau dossier devient
  explicite.

Composants:

- `src/components/collections/collections-browser.tsx`
- `src/components/collection-list.tsx`
- `src/components/document-list.tsx`
- `src/components/ui/status-badge.tsx`

Scripts:

- `scripts/build-manifest.ts`
- `scripts/validate-manifest.ts`

Documentation:

- `README.md`
- `docs/ARCHITECTURE.md`
- `docs/ROADMAP.md`
- `docs/PROJECT_STATE_FOR_LLMS.md`

## 4. Modele de donnees a enrichir

Le modele actuel est dans `src/types/archive.ts`.

Champs a surveiller cote `Collection`:

- `sourceInstitution`
- `archiveReference`
- `region`
- `period`
- `status`
- `documentCount`

Champs a surveiller cote `Document`:

- `collectionId`
- `title`
- `documentType`
- `dateLabel`
- `place`
- `peopleMentioned`
- `keywords`
- `ocrStatus`
- `summary`
- `folderTitle`
- `archiveReference`
- `pages`

La V1 doit eviter de remplacer ces types par un nouveau modele concurrent. Toute
evolution doit rester compatible avec le manifeste local.

## 5. Champs a ajouter eventuellement au manifeste

Champs possibles pour `Collection`:

- `fondsTitle`
- `repository`
- `series`
- `language`
- `accessConditions`
- `processingNotes`
- `driveFolderId`
- `lastInventoryAt`

Champs possibles pour `Document`:

- `folderId`
- `folderTitle`
- `physicalDescription`
- `language`
- `pageCount`
- `scanStatus`
- `inventoryStatus`
- `indexStatus`
- `verificationStatus`
- `sourceQuality`
- `notes`

Champs possibles pour un futur niveau `Folder`:

- `id`
- `collectionId`
- `title`
- `archiveReference`
- `driveUrl`
- `period`
- `description`
- `documentCount`

Ne pas ajouter tous ces champs d'un coup. Commencer par ceux qui servent une
page ou un filtre concret.

## 6. Risques

- Creer un second modele de donnees au lieu d'enrichir le manifeste existant.
- Transformer l'application en galerie d'images.
- Confondre statut d'inventaire, statut OCR, statut d'indexation et validation
  humaine.
- Ajouter trop de champs avant d'avoir de vrais dossiers Drive inventories.
- Introduire une ingestion Drive automatique avant d'avoir une etape de controle.
- Produire des notices ou resumes non sources.
- Casser les routes dynamiques si les identifiants du manifeste changent.

## 7. Ordre de developpement recommande

1. Clarifier les statuts.
   Distinguer inventaire, OCR, indexation et verification sans casser les statuts
   actuels.

2. Enrichir progressivement le manifeste.
   Ajouter seulement les champs necessaires aux pages et filtres V1.

3. Ameliorer les filtres.
   Ajouter les filtres utiles sur les donnees reelles: institution, cote, region,
   periode, statut, type de document, mots-cles.

4. Ameliorer les fiches.
   Rendre les notices collection/document plus lisibles et plus homogenes.

5. Decider du niveau dossier.
   Si plusieurs documents partagent un meme `folderTitle` ou une cote
   intermediaire, creer un type `Folder` et une page dossier.

6. Preparer l'ingestion Drive controlee.
   Utiliser `driveFolderId`, detecter les dossiers, produire un manifeste, puis
   valider avant toute integration dans l'application.

7. Mettre a jour la documentation et les validateurs.
   Chaque champ ajoute au manifeste doit etre documente et verifie par
   `scripts/validate-manifest.ts`.
