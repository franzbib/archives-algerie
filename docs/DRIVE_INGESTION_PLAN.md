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

## Snapshot manuel pilote

Un snapshot manuel peut etre utilise pour tester l'interface avant une
connexion API Drive reelle. Dans ce cas, la liste de fichiers est fournie depuis
un connecteur Drive et enregistree localement dans un fichier genere, par
exemple `data/generated/drive-inventory.pilot.json`.

Cette methode reste un inventaire brut:

- les fichiers ont ete listes, mais leur contenu n'a pas ete lu ;
- aucune image n'a ete telechargee ;
- aucun OCR n'a ete lance ;
- les fichiers HEIC devront probablement etre convertis avant OCR ;
- la correspondance fichier -> page -> document reste a etablir par validation
  humaine.

Le snapshot manuel ne doit pas etre importe automatiquement dans
`src/data/archives-manifest.json`.

## Qualification preparatoire des fichiers

La sortie Drive peut ajouter une qualification technique non destructive aux
fichiers listes. Cette qualification sert a preparer le travail sans transformer
un fichier brut en notice archivistique validee.

On distingue volontairement:

- le fichier Drive, qui est une entree technique ;
- l'image, qui peut etre une vue numerisee ;
- la page, qui doit etre rattachee a un document ;
- le document, qui appartient a une cote, un dossier et une collection.

Les fichiers HEIC sont marques comme images necessitant une conversion vers JPG
avant tout test OCR. Cette conversion n'est pas effectuee par l'inventaire Drive:
elle restera une etape technique separee, limitee a un echantillon controle.

Le statut `needs_ordering` est prudent: il signifie que l'ordre des fichiers et
leur rattachement page/document doivent etre verifies avant exploitation. Une
image listee depuis Drive ne doit donc pas etre consideree automatiquement comme
une page validee, ni comme un document autonome.

L'inventaire Drive brut ne doit pas alimenter directement le manifeste principal.
Seules les informations relues et validees humainement pourront etre reportees
dans `src/data/archives-manifest.json`.

## Activer l'ingestion Drive reelle de niveau 1

L'ingestion Drive reelle de niveau 1 sert uniquement a lister les fichiers
visibles d'un dossier Drive. Elle ne telecharge pas les fichiers, ne lit pas les
images, ne lance pas d'OCR et ne cree aucune notice validee.

Pour l'activer, il faut disposer d'une cle API Google Drive et verifier que
l'API Google Drive est activee dans le projet Google Cloud associe. La cle doit
etre fournie uniquement en variable d'environnement locale:

```powershell
$env:GOOGLE_DRIVE_API_KEY="VOTRE_CLE"
npx.cmd tsx scripts/drive-inventory.ts --sources scripts/drive-sources.pilot.example.json --out data/generated/drive-inventory.pilot.json --limit 50
```

Le parametre `--limit` limite le nombre de fichiers listes. Par defaut, le
script limite deja la sortie a 50 fichiers afin d'eviter une ingestion trop
large.

La sortie de niveau 1 peut contenir:

- `id` du fichier Drive ;
- nom du fichier ;
- type MIME ;
- lien `webViewLink` si disponible ;
- `createdTime` si disponible ;
- `modifiedTime` si disponible.

Elle ne doit pas contenir de transcription, de contenu d'image ou de resultat
d'analyse. Les fichiers HEIC devront probablement etre convertis plus tard
avant OCR. La correspondance fichier -> page -> document doit etre etablie par
validation humaine avant toute integration au manifeste principal.

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
