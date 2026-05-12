# Roadmap

## V0 - Exploration archivistique locale

- Manifeste local JSON.
- Page d'accueil.
- Liste des collections.
- Fiche collection.
- Fiche document preparatoire.
- Affichage des champs cote, lieu, periode, type de document et statut.
- Zones reservees pour image scannee et texte OCR.
- Documentation technique.

## V1 - Inventaire enrichi

- Activer les filtres par cote, lieu, periode, type et statut.
- Ajouter une page dossier si le niveau intermediaire devient explicite dans les
  donnees.
- Ajouter des champs de communicabilite et de provenance plus fins.
- Ameliorer la qualite des notices de documents.

## V2 - Ingestion Drive controlee

- Lire une configuration de dossiers Drive.
- Importer la structure sans telecharger automatiquement les contenus sensibles.
- Generer ou mettre a jour le manifeste.
- Detecter les nouveaux dossiers et les changements de nom.

## V3 - OCR et consultation image + texte

- Executer l'OCR localement ou dans une file de traitement.
- Conserver le texte brut.
- Produire un texte nettoye separe.
- Afficher image scannee et OCR cote a cote sur la fiche document.
- Rattacher chaque texte OCR a une page source.

## V4 - Indexation et recherche

- Indexer les metadonnees et le texte OCR.
- Ajouter une recherche plein texte.
- Preparer les chunks pour embeddings.
- Ajouter une recherche en langage naturel qui cite collection, cote, document
  et page.

## V5 - Verification et production

- Workflow de validation humaine.
- Statut `verified` pour les notices et OCR relus.
- Gestion des droits et restrictions.
- Export des donnees sourcees.
