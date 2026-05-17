# Reprise de l'agent de lots

Ce document couvre uniquement la reprise technique des lots dans
`.local/archive-batches/<lotId>/`. Les fichiers de ce dossier restent locaux et
ne doivent pas etre committes.

## Regle de separation

Ne jamais confondre les etats suivants:

- image source;
- OCR brut;
- OCR nettoye;
- lecture assistee vision;
- correction humaine;
- transcription validee.

Une lecture assistee vision reste non validee. Une image publiee peut exister
sans lecture assistee exploitable.

## Lancement standard

```powershell
npm.cmd run batch:agent -- --lot <lotId> --limit 100 --confirm
```

Cette commande peut lancer inventaire Drive, telechargement, conversion, OCR,
normalisation, lecture assistee vision et upload R2 selon les options et les
variables d'environnement disponibles.

## Rapports locaux

L'agent ecrit des rapports dans:

```text
.local/archive-batches/<lotId>/reports/
```

Rapports attendus:

- `download-errors.json`: fichiers Drive ignores, notamment 403/quota/anti-abus.
- `assisted-reading-errors.json`: lectures assistees vision echouees ou images
  correspondantes absentes.
- `batch-summary.json`: synthese locale des fichiers presents et des reprises
  possibles.

Ces rapports ne valident aucune page. Ils servent seulement a savoir quelles
images, OCR et lectures assistees doivent etre repris.

## Google Drive 403, quota ou anti-abus

Si Drive renvoie un HTTP 403 ou 429 pendant le telechargement d'un fichier,
le fichier est marque localement avec un statut `skipped_download_403` ou
`skipped_download_429`. L'agent continue les autres fichiers et n'ecrit aucune
image ni aucun contenu pour le fichier ignore.

Rapport:

```text
.local/archive-batches/<lotId>/reports/download-errors.json
```

Si tous les fichiers sont ignores, l'etape suivante doit s'arreter: il n'y a
aucune image locale a convertir ou publier.

## OpenAI quota ou lecture assistee indisponible

Si la lecture assistee vision echoue pour une page, l'agent continue les autres
pages et ecrit:

```text
.local/archive-batches/<lotId>/reports/assisted-reading-errors.json
```

Ne pas remplir `assistedReadingText` artificiellement. Une lecture absente,
vide ou invalide doit rester absente ou etre representee explicitement comme
`assisted_unavailable` lors d'une promotion controlee.

Pour promouvoir uniquement les fichiers locaux valides en ignorant les JSON
invalides:

```powershell
npx.cmd tsx scripts/promote-assisted-readings.ts --input .local/archive-batches/<lotId>/assisted-reading-vision --out data/generated/batches/<lotId>/assisted-readings.json --skip-invalid
```

Cette commande ne valide pas les lectures. Elle ne doit pas etre utilisee pour
inventer des lectures manquantes.

## Publier les images seulement

Quand les images sont deja converties mais que les lectures assistees sont
partielles, bloquantes ou couteuses a reprendre, publier seulement les assets:

```powershell
npm.cmd run batch:agent -- --lot <lotId> --publish-assets-only --limit 100 --confirm
```

Cette strategie saute inventaire, telechargement, conversion, OCR,
normalisation et lecture assistee vision. Elle utilise les JPG deja presents
dans:

```text
.local/archive-batches/<lotId>/converted/
```

Elle produit seulement le manifeste public local des images:

```text
.local/archive-batches/<lotId>/public/public-assets.json
```

Image disponible ne veut pas dire lecture assistee disponible, et lecture
assistee disponible ne veut pas dire transcription validee.

## Reprise d'un lot partiellement traite

Reprendre apres un telechargement partiel en evitant de relancer l'inventaire:

```powershell
npm.cmd run batch:agent -- --lot <lotId> --skip-inventory --limit 100 --confirm
```

Reprendre uniquement depuis les images converties deja presentes:

```powershell
npm.cmd run batch:agent -- --lot <lotId> --skip-inventory --skip-download --skip-conversion --limit 100 --confirm
```

Reprendre sans appel OpenAI:

```powershell
npm.cmd run batch:agent -- --lot <lotId> --skip-vision --limit 100 --confirm
```

Reprendre sans upload R2:

```powershell
npm.cmd run batch:agent -- --lot <lotId> --skip-upload --limit 100 --confirm
```

## Verifications avant commit

```powershell
npm.cmd run lint
npm.cmd run build
git diff --check
```

Verifier aussi:

- aucun fichier `.local/` n'est suivi par Git;
- aucun secret n'apparait dans le diff;
- aucun manifeste historique n'a ete modifie sans decision explicite;
- aucun embedding n'a ete cree;
- les lectures assistees restent non validees.
