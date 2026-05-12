# Architecture

## Intention

L'application explore des archives historiques scannees sur l'Algerie. Elle doit
rester archivistique avant d'etre visuelle: une image est une representation de
page, une page appartient a un document, un document appartient a un dossier, et
le dossier reste rattache a un fonds et a une cote.

## Source de donnees V0

La V0 lit uniquement `src/data/archives-manifest.json`.

Ce manifeste est une couche intermediaire stable entre les dossiers Google Drive
et l'application. Il reference les collections et documents sans appeler l'API
Google Drive.

## Domaine

Types principaux dans `src/types/archive.ts`:

- `Collection`: fonds ou ensemble de dossiers repere par institution, cote,
  region, periode et URL Drive.
- `Document`: unite documentaire preparatoire avec type, lieu, date, mots-cles,
  statut OCR et resume.
- `ArchivePage`: point d'ancrage futur pour une image scannee et un texte OCR.
- `ArchiveStatus`: cycle de traitement de l'inventaire a la verification.

Statuts:

- `to_inventory`
- `inventoried`
- `ocr_pending`
- `ocr_done`
- `indexed`
- `verified`

## Organisation

```text
src/app
```

Routes App Router:

- `/`
- `/collections`
- `/collections/[id]`
- `/documents/[id]`
- `/questionnement`

```text
src/components
```

Composants reutilisables: listes, filtres prevus, badges, cartes et blocs de
consultation.

```text
src/lib/archiveManifest.ts
```

Fonctions de lecture et de derivation:

- collections
- documents
- documents par collection
- details par identifiant
- facettes de filtrage
- libelles de statuts et types documentaires

```text
scripts
```

Outils Node independants pour preparer les donnees hors application web:
construction et validation de manifeste, OCR local, normalisation et chunks.

## Frontieres futures

- Google Drive: remplacera progressivement les URL manuelles par une ingestion
  controlee.
- OCR: produira du texte par page sans ecraser le brut.
- Indexation: indexera metadonnees, OCR et references archivistiques.
- Embeddings: creeront des passages interrogeables, toujours rattaches a une
  cote, un document et une page.
- Recherche en langage naturel: devra citer les sources du manifeste et les
  passages OCR.
