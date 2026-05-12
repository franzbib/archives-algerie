# Archives Algerie

Prototype Next.js pour inventaire archivistique autour de la logique:
collection, cote, dossier, document, page.

## Objectif de la V0

- Afficher une page d'accueil sobre.
- Afficher une arborescence des dossiers d'archives.
- Lire un manifeste local servant de couche intermediaire stable.
- Poser un modele de donnees propre pour les collections, dossiers, documents et pages.
- Ne pas faire d'OCR.
- Ne pas utiliser d'IA.
- Preparer l'ajout ulterieur de l'OCR, de l'indexation et de la recherche semantique.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Organisation en `src/app`, `src/components`, `src/data`, `src/lib`, `src/types`

## Demarrage

```bash
npm install
npm run dev
```

Ouvrir ensuite `http://localhost:3000`.

## Scripts

```bash
npm run dev
npm run build
npm run lint
```

## Structure

```text
src/
  app/              Routes App Router et styles globaux
  components/       Composants UI sobres
  data/             Manifeste local des collections
  lib/              Types, donnees et futures fonctions metier
  types/            Types partages du domaine archives
docs/
  ARCHITECTURE.md
  ROADMAP.md
```

Le manifeste est dans `src/data/archives-manifest.json` et se lit via
`src/lib/archiveManifest.ts`. Les donnees d'arborescence de demonstration sont
dans `src/lib/archive-data.ts`.
