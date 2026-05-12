# Plan d'ingestion Google Drive controlee

## Objectif

Les archives sources sont actuellement organisees dans Google Drive. L'objectif
est de preparer un inventaire local brut de ces dossiers sans telecharger les
images, sans OCR, sans IA et sans modifier les fichiers Drive.

Cette etape sert uniquement a observer la structure source avant de choisir ce
qui doit entrer dans le manifeste valide.

## Pourquoi une ingestion controlee

Une ingestion directe serait risquee:

- un dossier Drive n'est pas toujours une collection ;
- une image n'est pas toujours un document autonome ;
- une suite d'images peut representer les pages d'un meme document ;
- les noms de fichiers peuvent etre incomplets ou ambigus ;
- le manifeste principal doit rester valide et relu.

Le flux doit donc rester progressif:

1. lister les dossiers sources ;
2. produire un inventaire brut local ;
3. relire et regrouper manuellement ;
4. enrichir le manifeste valide seulement apres controle.

## Ce que fait le script

Le script `scripts/drive-inventory.ts` lit une liste de dossiers dans
`scripts/drive-sources.example.json` ou dans un fichier equivalent passe avec
`--sources`.

Il produit:

```text
data/generated/drive-inventory.json
```

Structure de sortie:

- `collectionId`
- `folderTitle`
- `driveFolderUrl`
- `files`
- `fileName`
- `mimeType`
- `driveFileId`
- `driveUrl`
- `probablePageNumber`
- `status: "to_inventory"`

Sans configuration Google Drive, le script fonctionne en mode mock: il reprend
les dossiers sources et cree un inventaire avec `files: []`.

Avec une cle API Google Drive, il peut lister les fichiers visibles dans les
dossiers publics ou accessibles a la cle.

## Ce que le script ne fait pas

- Il ne telecharge aucun fichier.
- Il ne lance aucun OCR.
- Il n'appelle pas OpenAI.
- Il ne cree pas d'embeddings.
- Il ne modifie aucun fichier Google Drive.
- Il ne modifie pas `src/data/archives-manifest.json`.
- Il ne suppose pas qu'une image correspond a un document autonome.

## Configuration optionnelle

Mode mock:

```bash
npx tsx scripts/drive-inventory.ts --sources scripts/drive-sources.example.json --out data/generated/drive-inventory.json
```

Mode Google Drive API:

```bash
$env:GOOGLE_DRIVE_API_KEY="votre-cle-api"
npx tsx scripts/drive-inventory.ts --sources scripts/drive-sources.example.json --out data/generated/drive-inventory.json
```

Aucune dependance lourde n'est ajoutee. Le script utilise `fetch`, disponible
dans Node.js moderne.

## Risques

- Confondre dossier Drive, collection, dossier archivistique et document.
- Importer trop vite un inventaire brut dans le manifeste valide.
- Traiter chaque image comme un document autonome.
- Perdre le lien entre image, page, document, cote et fonds.
- Produire un OCR sur des images mal ordonnees ou mal rattachees.
- Croire qu'un nom de fichier suffit a decrire une piece d'archive.

## Etapes suivantes

1. Remplacer ou completer `scripts/drive-sources.example.json` avec les vrais
   dossiers a inventorier.
2. Lancer l'inventaire en mode mock pour verifier le format.
3. Configurer une cle API Google Drive si la liste automatique est necessaire.
4. Relire `data/generated/drive-inventory.json`.
5. Identifier les regroupements: collection, dossier, document, pages.
6. Ajouter seulement les donnees validees au manifeste principal.
7. Lancer l'OCR local uniquement sur un echantillon controle.

## Passage futur vers OCR

L'OCR ne doit commencer qu'apres validation du rattachement:

- chaque image doit etre reliee a une page ;
- chaque page doit etre reliee a un document ;
- chaque document doit etre relie a une cote et a une collection ;
- le texte OCR brut doit etre conserve ;
- le texte nettoye doit etre produit separement ;
- toute recherche future devra citer ses sources.
