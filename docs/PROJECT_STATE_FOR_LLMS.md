# Project State For LLMs

## 1. Depot

- Repo: `franzbib/archives-algerie`
- Branche de travail: `master`
- Branche `main`: ne pas utiliser pour l'instant sauf decision explicite.
- Etat actuel: V0 archivistique.

## 2. Principe du projet

`archives-algerie` est une application web d'exploration d'archives historiques
scannees sur l'Algerie.

Le projet doit respecter une logique archivistique:

- collection / fonds
- cote
- dossier
- document
- page

La V0 repose sur un manifeste local JSON. Elle ne doit pas etre traitee comme
une simple galerie d'images.

Limites actuelles:

- pas encore d'OCR dans l'application web ;
- pas encore d'IA ;
- pas encore d'ingestion Google Drive automatique ;
- les liens Drive sont des URL conservees dans le manifeste local.

## 3. Architecture

Pages existantes:

- `/`
- `/collections`
- `/collections/[id]`
- `/documents/[id]`
- `/questionnement`

Types:

- `src/types/archive.ts`

Manifeste:

- `src/data/archives-manifest.json`

Fonctions de lecture:

- `src/lib/archiveManifest.ts`

Scripts:

- `scripts/build-manifest.ts`
- `scripts/validate-manifest.ts`
- `scripts/ocr-local.ts`
- `scripts/normalize-ocr.ts`
- `scripts/prepare-chunks.ts`

Composants importants:

- `src/components/collection-list.tsx`
- `src/components/document-list.tsx`
- `src/components/collections/collections-browser.tsx`
- `src/components/stat-card.tsx`
- `src/components/ui/status-badge.tsx`

## 4. Regles a respecter

- Ne pas transformer l'application en galerie d'images.
- Ne pas inventer de donnees historiques.
- Ne pas creer de faux OCR.
- Ne pas ajouter d'appel IA sans decision explicite.
- Toute future IA devra citer ses sources: collection, cote, document, page et
  extrait OCR.
- Travailler par petites etapes.
- Toujours indiquer les fichiers modifies.
- Toujours indiquer les tests ou commandes de verification lancees.
- Conserver la separation entre manifeste, types, fonctions utilitaires,
  composants et routes.

## 5. Roadmap courte

1. Stabilisation V0.
2. Filtres de collections.
3. Fiches collection et document.
4. Ingestion Google Drive controlee.
5. OCR.
6. Chunks.
7. Recherche sourcee.

## 6. Dernieres decisions

- Travailler sur `master`.
- `main` ne contient pas l'etat utile du projet pour l'instant.
- Conserver la logique collection / document / page.
- La page `/questionnement` est une preparation methodologique, pas une recherche
  active.
- Les donnees de la V0 doivent venir du manifeste local.
