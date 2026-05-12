# Roadmap

## V0 - Socle archivistique

- Page d'accueil sobre.
- Arborescence des collections et dossiers.
- Manifeste local pour lister les collections, sources, regions, periodes,
  statuts et dossiers Drive.
- Modele TypeScript pour collection, cote, dossier, document et page.
- Donnees de demonstration locales.
- Documentation d'architecture.

## V1 - Persistance et inventaire

- Brancher une source de donnees persistante.
- Ajouter une page de detail collection.
- Ajouter une page de detail dossier.
- Ajouter une page de detail document avec liste des pages.
- Gerer les droits, restrictions et statuts de communicabilite.

## V2 - Numerisation et OCR

- Ajouter un module d'ingestion de fichiers numerises.
- Relier chaque image a une page existante.
- Ajouter une file de traitement OCR.
- Stocker les transcriptions par page avec etat de validation.

## V3 - Indexation et recherche

- Indexer les metadonnees archivistiques.
- Ajouter une recherche plein texte.
- Filtrer par collection, cote, periode, type documentaire et langue.
- Afficher les resultats au niveau pertinent: collection, dossier, document ou
  page.

## V4 - Recherche semantique

- Generer des embeddings a partir des metadonnees et transcriptions validees.
- Ajouter une recherche semantique explicable.
- Conserver les liens vers les cotes et le contexte archivistique.
- Separarer les reponses assistees par IA de l'inventaire source.
