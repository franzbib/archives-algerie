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

## Echantillon pilote de conversion

La conversion doit commencer sur un echantillon tres limite, idealement entre 5
et 10 images. Cette prudence permet de tester la chaine technique sans engager
tout le dossier Drive ni creer de faux sentiment de validation.

L'echantillon pilote sert uniquement a preparer une future conversion HEIC vers
JPG et un futur test OCR. Il ne valide ni le document, ni la page, ni l'ordre
archivistique. Les champs `sampleCandidate`, `sampleOrder` et `sampleNote`
peuvent marquer cette selection provisoire dans l'inventaire brut.

Il ne faut pas convertir tout le dossier avant d'avoir controle visuellement un
petit lot: qualite des images, orientation, lisibilite, ordre probable et
rattachement page/document. Ce controle visuel doit preceder tout OCR.

L'echantillon ne doit pas etre importe automatiquement dans le manifeste
principal. Il reste une aide technique pour organiser la prochaine etape.

## Telechargement controle de l'echantillon pilote

Le telechargement local doit rester limite a l'echantillon pilote. Il sert a
preparer un futur controle visuel et une future conversion technique, sans
engager tout le dossier Drive.

Le script `scripts/download-drive-sample.ts` lit
`data/generated/drive-inventory.pilot.json`, selectionne uniquement les fichiers
marques `sampleCandidate: true`, puis telecharge les originaux bruts dans:

```text
.local/archive-sample/raw/
```

Il cree aussi un manifeste local de telechargement:

```text
.local/archive-sample/download-manifest.json
```

Le dossier `.local/` est ignore par Git afin d'eviter de committer des originaux
telecharges. Les fichiers HEIC sont egalement ignores par precaution.

Le script refuse de fonctionner sans `GOOGLE_DRIVE_API_KEY`, sans candidats
d'echantillon ou sans l'option explicite `--confirm`. Cette confirmation evite
de lancer une ecriture locale par erreur.

Commande Windows PowerShell:

```powershell
$env:GOOGLE_DRIVE_API_KEY="VOTRE_CLE"
npx.cmd tsx scripts/download-drive-sample.ts --inventory data/generated/drive-inventory.pilot.json --out .local/archive-sample/raw --limit 8 --confirm
```

Cette etape ne convertit pas les fichiers HEIC, ne lance pas d'OCR, n'appelle
pas OpenAI et ne cree pas d'embeddings. Les fichiers telecharges ne deviennent
pas des pages ni des documents valides sans controle humain.

## Conversion locale controlee HEIC -> JPG

La conversion locale doit rester limitee a l'echantillon pilote. Convertir
seulement 5 a 10 images permet de tester la qualite technique sans propager une
erreur d'orientation, d'ordre ou de rattachement a tout le dossier.

Le script `scripts/convert-sample-heic.ts` lit
`.local/archive-sample/download-manifest.json`, retrouve uniquement les fichiers
HEIC listes dans le manifeste de telechargement, puis ecrit les JPG dans:

```text
.local/archive-sample/converted/
```

Il cree aussi:

```text
.local/archive-sample/conversion-manifest.json
```

Commande Windows PowerShell:

```powershell
npx.cmd tsx scripts/convert-sample-heic.ts --input .local/archive-sample/raw --out .local/archive-sample/converted --manifest .local/archive-sample/download-manifest.json --confirm
```

La conversion utilise la dependance Node `heic-convert`, adaptee a un usage local
Windows sans ajouter de traitement OCR. Les HEIC originaux sont conserves dans
`.local/archive-sample/raw/`; les JPG convertis restent locaux dans `.local/`,
ignore par Git.

Cette conversion ne valide ni page ni document. Elle produit seulement des
images JPG de travail pour un controle visuel. Avant tout OCR, il faut verifier:

- lisibilite ;
- orientation ;
- doublons ;
- pages floues ;
- ordre probable ;
- debut et fin de document.

L'OCR ne doit venir qu'apres ce controle visuel et seulement sur un echantillon
dont le rattachement fichier -> page -> document est compris.

## OCR local brut sur echantillon

L'OCR doit commencer uniquement sur l'echantillon pilote converti en JPG. Cette
limite permet de mesurer la qualite de reconnaissance avant tout traitement plus
large.

Le script `scripts/ocr-sample.ts` lit les JPG dans:

```text
.local/archive-sample/converted/
```

Il produit un fichier texte brut par image dans:

```text
.local/archive-sample/ocr/raw/
```

Il cree aussi:

```text
.local/archive-sample/ocr/ocr-manifest.json
```

Commande Windows PowerShell:

```powershell
npx.cmd tsx scripts/ocr-sample.ts --input .local/archive-sample/converted --out .local/archive-sample/ocr/raw --lang fra --confirm
```

Le script utilise Tesseract installe localement. La langue par defaut est `fra`.
Certains dossiers pourront necessiter plus tard `fra+ara` ou d'autres modeles si
des mentions arabes ou multilingues apparaissent.

Cette etape produit uniquement de l'OCR brut. Il ne faut pas nettoyer trop tot:
le texte brut doit rester conserve comme sortie primaire afin de mesurer les
erreurs, comparer les corrections futures et documenter les limites de la
reconnaissance.

L'OCR brut n'est pas une transcription validee. Il ne doit pas etre indexe ni
utilise pour des reponses automatiques avant relecture humaine. La relecture
devra signaler les erreurs de noms propres, dates, lieux, mots coupes et zones
illisibles.

## Normalisation mecanique de l'OCR brut

La normalisation mecanique intervient apres la production de l'OCR brut, mais
elle ne remplace jamais ce brut. Les fichiers originaux doivent rester conserves
dans:

```text
.local/archive-sample/ocr/raw/
```

Le script `scripts/normalize-ocr-sample.ts` lit ces fichiers `.txt` et produit
des textes legerement nettoyes dans:

```text
.local/archive-sample/ocr/clean/
```

Il cree aussi:

```text
.local/archive-sample/ocr/normalization-manifest.json
```

Commande Windows PowerShell:

```powershell
npx.cmd tsx scripts/normalize-ocr-sample.ts --input .local/archive-sample/ocr/raw --out .local/archive-sample/ocr/clean --confirm
```

Les nettoyages autorises sont strictement mecaniques: normalisation des retours
a la ligne, reduction des espaces multiples et suppression des lignes vides. Le
texte nettoye n'est pas une transcription validee.

Aucune IA n'est utilisee a ce stade. Les corrections de noms propres, lieux,
dates, sigles ou formulations historiques doivent rester humaines et tracees. Un
nettoyage automatique ne doit jamais remplacer un mot par un autre sur une base
semantique.

## Lecture assistee par IA - transcription hypothetique

Une future etape de lecture assistee par IA pourra aider a proposer une lecture
probable a partir de l'OCR brut et de l'OCR nettoye mecaniquement. Cette lecture
devra rester une hypothese de travail, distincte d'une transcription validee.

L'IA ne devra pas inventer de passage absent de l'OCR fourni. Elle devra marquer
explicitement les incertitudes: mots illisibles, noms propres incertains, dates
incertaines, lieux incertains ou fragments ambigus.

Les noms, lieux et dates devront toujours etre verifies sur l'image source avant
toute validation. Une lecture assistee ne pourra pas remplacer la relecture
humaine, et ne devra pas etre utilisee comme source definitive.

Les etats doivent rester separes:

- OCR brut ;
- OCR nettoye mecaniquement ;
- lecture assistee hypothetique ;
- transcription validee humainement.

## Lecture assistee non validee

La lecture assistee non validee est utile pour rendre un OCR bruité plus
lisible et preparer la relecture. Elle peut proposer une sequence de texte plus
coherente, mais elle ne doit jamais etre traitee comme une transcription
validee.

Les incertitudes doivent etre conservees dans la sortie: noms propres, lieux,
dates, sigles, mots illisibles et passages tronques. L'image scannee reste la
source de verite. Toute lecture assistee doit donc etre comparee a l'image avant
indexation, citation ou integration dans le manifeste principal.

La validation humaine reste obligatoire avant toute exploitation comme
transcription historique.

## Pipeline pilote local

Le script `scripts/run-pilot-pipeline.ts` orchestre les etapes locales du pilote
sans integrer d'IA. Il enchaine, dans l'ordre:

1. inventaire Drive ;
2. telechargement controle de l'echantillon ;
3. conversion HEIC -> JPG ;
4. OCR brut local ;
5. normalisation mecanique de l'OCR.

Commande Windows PowerShell:

```powershell
npx.cmd tsx scripts/run-pilot-pipeline.ts --sources scripts/drive-sources.pilot.example.json --inventory data/generated/drive-inventory.pilot.json --workspace .local/archive-sample --limit 8 --lang fra --confirm
```

Le meme script est disponible via npm:

```powershell
npm.cmd run pipeline:pilot -- --sources scripts/drive-sources.pilot.example.json --inventory data/generated/drive-inventory.pilot.json --workspace .local/archive-sample --limit 8 --lang fra --confirm
```

Le pipeline ne fait pas:

- appel OpenAI ;
- creation d'embeddings ;
- lecture assistee par IA ;
- modification du manifeste principal ;
- modification de Google Drive ;
- validation de transcription.

Les options `--skip-inventory`, `--skip-download`, `--skip-conversion`,
`--skip-ocr` et `--skip-normalization` servent a reprendre un pipeline deja
partiellement execute ou a relancer une seule portion controlee. Chaque etape
reste bloquante: si une commande echoue, le pipeline s'arrete et ne continue pas
silencieusement.

La validation humaine reste obligatoire apres OCR et normalisation. La lecture
assistee par IA reste une etape separee, non automatisee par ce pipeline, afin
de maintenir la distinction entre OCR brut, OCR nettoye, hypothese de lecture et
transcription validee.

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
