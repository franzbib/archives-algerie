# Multi-batch workflow — Archives Algérie

## Objectif

Faire évoluer l'application d'un pilote limité vers une chaîne de traitement multi-lots, en conservant les garde-fous méthodologiques déjà validés :

- Google Drive conserve les originaux ;
- `.local/` reste l'espace local de traitement ;
- Cloudflare R2 sert les copies JPG de consultation ;
- GitHub contient le code, la documentation et les manifestes contrôlés ;
- Vercel sert l'interface ;
- aucune transcription assistée ne doit être présentée comme validée sans relecture humaine.

## État atteint

### Lot Boghari pilote complet

Le lot `shd-1h4382-d1-boghari` a permis de valider la chaîne complète :

1. inventaire Drive réel ;
2. téléchargement local HEIC ;
3. conversion HEIC → JPG ;
4. OCR brut local ;
5. OCR nettoyé mécaniquement ;
6. lecture assistée IA texte seul ;
7. lecture assistée IA vision, image + OCR ;
8. upload des JPG vers Cloudflare R2 ;
9. intégration dans `/controle-batch` ;
10. génération des routes `/controle-batch/page-01` à `/controle-batch/page-41`.

Les lectures assistées restent au statut `assisted_unverified` avec `humanValidation.validated: false`.

## Nouveau modèle cible

À partir de maintenant, le projet doit évoluer vers une logique générique de lots.

Un lot doit être défini par :

```ts
type ArchiveBatch = {
  lotId: string;
  collectionId: string;
  title: string;
  status: "planned" | "inventoried" | "processed_local" | "published" | "review_ready";
  sourceDriveFolderUrl?: string;
  publicAssetsManifest?: string;
  assistedReadingsManifest?: string;
  reviewBaseRoute?: string;
  itemCount?: number;
  notes?: string;
};
```

## Lot technique, dossier d'archives et unite documentaire

Un lot de traitement de 100 images est une unite technique de travail. Il sert a
decouper une source volumineuse en ensembles manipulables pour le telechargement,
la conversion, l'OCR, la lecture assistee, la publication R2 et la revue dans
l'interface.

Ce lot technique ne doit pas etre confondu avec:

- le dossier d'archives reel, qui releve de la cote, du fonds et de la structure
  archivistique d'origine ;
- l'unite documentaire, qui peut couvrir une ou plusieurs images ;
- la page archivistique validee, qui suppose un controle humain de l'ordre, du
  rattachement et de la lisibilite.

Les routes `/lots`, `/lots/[lotId]` et `/lots/[lotId]/[reviewId]` doivent donc
afficher des identifiants de tracabilite explicites: `lotId`, `collectionId`,
`reviewId`, nom de fichier source, position dans le lot et statut de validation.
Ces informations aident au reperage dans les lots nombreux sans transformer les
images publiees en documents valides.

## Conventions de nommage

### Identifiants de lots

- `lot-boghari-001`
- `lot-fln-w4-001`
- `lot-frontiere-maroc-001`

### Espaces locaux

- `.local/archive-batches/lot-boghari-001/raw/`
- `.local/archive-batches/lot-boghari-001/converted/`
- `.local/archive-batches/lot-boghari-001/ocr/raw/`
- `.local/archive-batches/lot-boghari-001/ocr/clean/`
- `.local/archive-batches/lot-boghari-001/assisted-reading-vision/`
- `.local/archive-batches/lot-boghari-001/public/`

Les anciens dossiers `.local/archive-sample/` et `.local/archive-batch-boghari/` peuvent rester comme historique de travail, mais les nouveaux lots doivent utiliser la convention `.local/archive-batches/<lotId>/`.

Pour un lot PDF, les PDF bruts restent dans `raw/` et les JPG issus de chaque
page sont ecrits dans `converted/`. Ces JPG restent des images techniques de
controle: ils ne valident ni les pages, ni les documents.

### Préfixes R2

- `batches/lot-boghari-001/images/`
- `batches/lot-fln-w4-001/images/`
- `batches/lot-frontiere-maroc-001/images/`

### Manifestes contrôlés dans GitHub

- `data/generated/batches/lot-boghari-001/public-assets.json`
- `data/generated/batches/lot-boghari-001/assisted-readings.json`
- `data/generated/archive-batches.example.json`

Ces fichiers ne doivent contenir ni clé, ni chemin absolu local, ni OCR brut/nettoyé complet si ce n'est pas explicitement décidé.

## Routes cibles

Conserver les routes historiques :

- `/controle-pilote`
- `/controle-batch`

Préparer les routes génériques :

- `/lots`
- `/lots/[lotId]`
- `/lots/[lotId]/[reviewId]`

Les routes historiques peuvent devenir des alias éditoriaux ou des redirections internes vers le nouveau modèle.

## Règles de publication

Pour chaque image publiée :

- conserver le lien vers le fichier Drive original ;
- conserver la clé R2 ;
- conserver l'URL publique R2 ;
- afficher `publicationStatus: image_published_unvalidated` ;
- afficher `validationStatus: unverified` ;
- rappeler que l'image n'est pas nécessairement une page validée.

## Règles de lecture assistée

La lecture assistée vision est prioritaire sur la lecture assistée texte seul.

Chaque lecture doit conserver :

- `status: assisted_unverified` ;
- `humanValidation.validated: false` ;
- `confidence` ;
- `uncertainties` ;
- une note rappelant que le résultat doit être vérifié sur l'image.

Il ne faut pas écraser l'OCR brut ni le considérer comme une transcription.

## Ordre de traitement recommandé pour un nouveau lot

1. Ajouter la source Drive du lot.
2. Générer l'inventaire Drive.
3. Télécharger localement dans `.local/archive-batches/<lotId>/raw/`.
4. Convertir en JPG dans `.local/archive-batches/<lotId>/converted/`.
5. Contrôler visuellement rapidement.
6. Lancer OCR brut.
7. Normaliser mécaniquement l'OCR.
8. Générer les lectures assistées vision.
9. Uploader les JPG vers R2.
10. Promouvoir les manifestes contrôlés dans `data/generated/batches/<lotId>/`.
11. Intégrer le lot dans l'index global `archive-batches.example.json`.
12. Vérifier l'affichage dans `/lots/<lotId>`.

## Agent local de traitement de lot

Le script `scripts/run-archive-batch-agent.ts` prépare une orchestration locale
générique pour un lot déclaré dans:

```text
data/generated/archive-batches.example.json
```

Commande cible:

```powershell
npx.cmd tsx scripts/run-archive-batch-agent.ts --lot lot-fln-w4-001 --limit 100 --confirm
```

Le script travaille par défaut dans:

```text
.local/archive-batches/<lotId>/
```

Il enchaîne, quand les prérequis sont disponibles:

1. inventaire Drive du lot ;
2. téléchargement local brut dans `raw/` ;
3. copie des JPG ou conversion HEIC vers JPG dans `converted/` ;
4. OCR brut dans `ocr/raw/` ;
5. normalisation mécanique dans `ocr/clean/` ;
6. lecture assistée vision dans `assisted-reading-vision/` ;
7. upload R2 des JPG ;
8. génération d'un manifeste public local dans `public/`.

Options de reprise:

```powershell
--skip-inventory
--skip-download
--skip-conversion
--skip-ocr
--skip-normalization
--skip-vision
--skip-upload
--limit 100
--confirm
```

Garde-fous:

- le script refuse de fonctionner sans `--confirm` ;
- il n'invente pas de source Drive: un lot `planned` sans URL Drive échoue
  explicitement à l'étape d'inventaire ;
- il n'appelle OpenAI que si `OPENAI_API_KEY` est disponible et si
  `--skip-vision` n'est pas fourni ;
- il n'upload vers R2 que si les variables R2 sont disponibles et si
  `--skip-upload` n'est pas fourni ;
- il s'arrête dès qu'une étape échoue ;
- il ne modifie pas `src/data/archives-manifest.json` ;
- il ne promeut pas automatiquement les sorties locales vers `data/generated/`.

Pour préparer seulement les étapes locales sans IA ni upload:

```powershell
npm.cmd run batch:agent -- --lot lot-boghari-001 --limit 41 --skip-vision --skip-upload --confirm
```

Les sorties `.local/` restent ignorées par Git. Elles doivent être relues,
contrôlées et promues explicitement dans une étape séparée avant toute
intégration applicative.

## Lots PDF

Le lot `lot-frontiere-maroc-001` est prepare comme lot PDF. Son traitement ne
doit pas supposer qu'un PDF correspond automatiquement a un document valide, ni
qu'une page JPG issue du PDF est deja une page archivistique controlee.

La conversion PDF est preparee par:

```powershell
npx.cmd tsx scripts/convert-pdf-batch-to-jpg.ts --input .local/archive-batches/lot-frontiere-maroc-001/raw --out .local/archive-batches/lot-frontiere-maroc-001/converted --manifest .local/archive-batches/lot-frontiere-maroc-001/download-manifest.json --limit 8 --confirm
```

Le script exige un convertisseur local:

- Poppler, via `pdftoppm` ;
- ou ImageMagick, via `magick`.

S'il ne trouve aucun de ces outils, il echoue clairement et ne produit aucun
fichier. Il ne lance pas OCR, ne contacte pas OpenAI, ne cree pas d'embeddings
et ne promeut rien dans `data/generated/`.

L'agent generique detecte les PDF dans `raw/` et appelle cette conversion avant
l'OCR. Les lots mixtes PDF/images sont refuses dans cette premiere version afin
de ne pas melanger des sequences de pages heterogenes.

## Tâches à déléguer à Codex

### 1. Généraliser les helpers de revue

Créer une logique de lecture de lot indépendante de Boghari :

- `src/lib/archiveBatches.ts`
- lecture de `data/generated/archive-batches.example.json`
- lecture des manifestes de chaque lot
- helpers :
  - `getArchiveBatches()`
  - `getArchiveBatchById(lotId)`
  - `getBatchReviewItems(lotId)`
  - `getBatchReviewItem(lotId, reviewId)`

### 2. Créer les routes génériques

Créer :

- `src/app/lots/page.tsx`
- `src/app/lots/[lotId]/page.tsx`
- `src/app/lots/[lotId]/[reviewId]/page.tsx`

Réutiliser le plus possible les composants déjà conçus pour `/controle-batch`.

### 3. Préserver les routes existantes

Ne pas casser :

- `/controle-pilote`
- `/controle-batch`
- `/controle-batch/page-01` à `/controle-batch/page-41`

### 4. Préparer un script de promotion générique

Adapter ou créer un script générique :

- `scripts/promote-batch-manifests.ts`

Il doit pouvoir promouvoir les manifestes depuis `.local/archive-batches/<lotId>/public/` vers `data/generated/batches/<lotId>/`.

### 5. Préparer les prochains lots planifiés

Ajouter au registre global, en statut `planned` :

- `lot-fln-w4-001`
- `lot-frontiere-maroc-001`

Ne pas inventer de fichiers ni d'URLs si les sources exactes ne sont pas encore validées.

## Tâches à déléguer à Antigravity

Une fois les routes génériques créées :

- améliorer `/lots` comme tableau sobre de pilotage ;
- améliorer `/lots/[lotId]` pour la navigation dans de gros lots ;
- optimiser la lecture longue image + transcription assistée ;
- conserver l'esthétique papier, fiches, archives ;
- ne pas modifier la logique métier.

## Contraintes permanentes

- Ne pas committer `.local/`.
- Ne pas committer de clés API.
- Ne pas publier les HEIC originaux.
- Ne pas modifier Google Drive.
- Ne pas modifier R2 sans action locale explicite.
- Ne pas modifier `src/data/archives-manifest.json` sans demande explicite.
- Ne pas présenter une lecture assistée comme transcription validée.
- Ne pas créer d'embeddings avant validation de la politique de recherche.

## Prochain jalon

Le prochain jalon attendu est :

> `/lots` affiche les lots disponibles et planifiés ; `lot-boghari-001` réutilise les 41 images et lectures assistées vision déjà intégrées ; les prochains lots apparaissent comme planifiés.
