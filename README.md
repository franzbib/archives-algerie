# Archives Algerie

Application Next.js V0 pour explorer des archives historiques scannees sur
l'Algerie, actuellement referencees dans Google Drive.

La V0 ne connecte pas Google Drive automatiquement, ne lance pas d'OCR et
n'utilise pas d'IA. Elle pose une base stable: manifeste JSON local, pages de
navigation, fiches collections, fiches documents et architecture prete pour OCR,
indexation et recherche en langage naturel sourcee.

## Objectif V0

- Naviguer dans les collections d'archives.
- Consulter une fiche collection.
- Consulter une fiche document preparatoire.
- Afficher les metadonnees utiles: cote, lieu, periode, type documentaire et statut.
- Preparer l'affichage futur image + texte OCR.
- Preparer une future interrogation en langage naturel fondee sur OCR + embeddings.

## Limites assumées

- Pas encore d'OCR dans l'application web.
- Pas encore d'IA.
- Pas encore de connexion automatique a Google Drive.
- Les liens Drive restent de simples URL dans le manifeste local.
- Les filtres sont visibles comme contrat d'interface, mais pas encore dynamiques.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Composants reutilisables
- Donnees dans `src/data/archives-manifest.json`
- Types dans `src/types/archive.ts`
- Fonctions utilitaires dans `src/lib/archiveManifest.ts`

## Demarrage

```bash
npm install
npm run dev
```

Ouvrir ensuite `http://localhost:3000`.

## Pages

- `/` : accueil et presentation du principe archivistique.
- `/collections` : liste des collections avec filtres prevus.
- `/collections/[id]` : fiche collection et documents rattaches.
- `/documents/[id]` : fiche document preparatoire, avec zone image et zone OCR futures.
- `/questionnement` : placeholder de recherche future.

## Modele minimal

`Collection`

- `id`
- `title`
- `sourceInstitution`
- `archiveReference`
- `region`
- `period`
- `description`
- `driveUrl`
- `status`
- `documentCount`

`Document`

- `id`
- `collectionId`
- `title`
- `documentType`
- `dateLabel`
- `place`
- `peopleMentioned`
- `keywords`
- `driveUrl`
- `ocrStatus`
- `summary`

Statuts autorises:

- `to_inventory`
- `inventoried`
- `ocr_pending`
- `ocr_done`
- `indexed`
- `verified`

Le modele conserve la logique archivistique: fonds, cote, dossier, document,
page. Les images ne sont pas le modele principal; elles seront rattachees a des
pages appartenant a des documents.

## Scripts web

```bash
npm run dev
npm run build
npm run lint
```

## Scripts de preparation hors application

Les scripts du dossier `scripts/` sont independants de l'application web. Ils
servent a preparer les sources avant ingestion. Ils n'utilisent pas OpenAI et ne
connectent pas l'API Google Drive.

```bash
npm run manifest:build
npm run manifest:validate
npm run ocr:local
npm run ocr:normalize
npm run chunks:prepare
```

### Construire le manifeste

```bash
copy scripts\archive-sources.example.json scripts\archive-sources.json
npm run manifest:build -- --config scripts/archive-sources.json --out src/data/archives-manifest.json
```

Le script lit une liste locale de collections/documents et produit le manifeste
JSON stable utilise par l'application.

Pour verifier le manifeste courant:

```bash
npm run manifest:validate
```

### OCR local

```bash
npm run ocr:local -- --input C:\archives\images --out C:\archives\ocr --lang fra+ara
```

Prerequis:

- Tesseract disponible dans le `PATH`.
- Pour les PDF: Poppler avec `pdftoppm` disponible dans le `PATH`.

Sorties:

- `*.txt` pour le texte OCR brut.
- `ocr-metadata.json` pour les metadonnees de traitement.

### Normalisation OCR

```bash
npm run ocr:normalize -- --input C:\archives\ocr --out C:\archives\normalized
```

Le script conserve toujours le texte brut original dans `.raw.txt` et cree un
texte nettoye separe dans `.clean.txt`.

### Preparation des chunks

```bash
npm run chunks:prepare -- --input C:\archives\normalized --out C:\archives\chunks.json --size 900 --overlap 120
```

Le script decoupe les textes en passages courts pour une future etape
d'embeddings. Il ne calcule aucun embedding.

## Structure

```text
src/
  app/              Routes App Router
  components/       Composants d'interface
  data/             Manifeste local JSON
  lib/              Fonctions de lecture du manifeste
  types/            Types TypeScript du domaine archives
docs/
  ARCHITECTURE.md
  ROADMAP.md
scripts/
  build-manifest.ts
  validate-manifest.ts
  ocr-local.ts
  normalize-ocr.ts
  prepare-chunks.ts
```

## Verification

```bash
npm run lint
npm run build
```
