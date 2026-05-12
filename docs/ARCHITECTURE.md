# Architecture

## Principes

L'application respecte une logique archivistique et ne reduit pas les archives a
des fichiers images. Une image numerisee represente au mieux une page; elle doit
rester rattachee a un document, lui-meme classe dans un dossier, avec une cote et
un contexte de collection.

## Modele de domaine

- `ArchiveCollection`: ensemble coherent de provenance, de periode et de
  description commune.
- `ArchiveFolder`: dossier ou sous-dossier classe par cote.
- `ArchiveDocument`: unite documentaire consultable, par exemple registre,
  correspondance, carte ou dossier administratif.
- `ArchivePage`: page physique ou numerisee appartenant a un document.
- `DateRange`: periode normalisee avec libelle d'affichage.

Les types sont definis dans `src/lib/archive-types.ts`.

## Manifeste d'archives

`src/data/archives-manifest.json` sert de couche intermediaire stable. Il liste
les collections, leur source, leur region, leur periode, leur statut de
traitement et un lien vers le dossier Drive. Il ne connecte pas l'API Google
Drive: le lien reste une reference externe, lisible et remplacable.

Les statuts prevus sont:

- `to_inventory`
- `inventoried`
- `ocr_pending`
- `ocr_done`
- `indexed`
- `verified`

Les types du manifeste sont dans `src/types/archive.ts`. Les fonctions de lecture
et de presentation sont dans `src/lib/archiveManifest.ts`.

## Organisation applicative

```text
src/app
```

Contient les routes Next.js App Router, le layout global et les styles.

```text
src/components
```

Contient les composants d'affichage. La V0 expose notamment l'arborescence des
collections, dossiers et documents.

```text
src/data
```

Contient le manifeste local des collections. Cette couche permet de faire evoluer
les sources, les statuts et les liens Drive sans coupler l'interface a une API
externe.

```text
src/lib
```

Contient le domaine, les donnees de demonstration et, plus tard, les services
metier: chargement de donnees, indexation, normalisation, recherche.

```text
src/types
```

Contient les types partages du manifeste et des futures couches d'ingestion.

## Futures frontieres techniques

- OCR: module separe qui produit du texte par page sans ecraser les metadonnees
  archivistiques.
- Indexation: service qui indexe collections, dossiers, documents, pages et
  transcriptions.
- Recherche semantique: couche optionnelle au-dessus de l'index, avec vecteurs
  rattaches aux entites du domaine.
- Persistance: remplacement des donnees de demonstration par une base ou une API
  sans changer les composants d'affichage.
