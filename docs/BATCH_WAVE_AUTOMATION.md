# Automatisation des vagues de lots

## Objet

`scripts/run-batch-wave.ts` orchestre le traitement d'un ou plusieurs lots
`planned` deja presents dans `data/generated/archive-batches.example.json`.

Il enchaine:

1. agent de lot local ;
2. verification des compteurs locaux ;
3. promotion de `public-assets.json` et `assisted-readings.json` ;
4. mise a jour du registre global ;
5. mise a jour du registre TypeScript des manifestes ;
6. verification finale `lint`, `build`, `git diff --check`, `git status`.

Le script ne valide jamais une transcription. Les lectures assistees restent
`assisted_unverified`, ou `assisted_unavailable` quand aucun texte exploitable
n'a ete produit.

## Prerequis

Les secrets restent dans l'environnement local ou dans `.local/`. Ne jamais les
committer.

Variables attendues pour un traitement complet:

```powershell
$env:GOOGLE_SERVICE_ACCOUNT_KEY_PATH = ".local\secrets\google-service-account.json"
$env:OPENAI_API_KEY = "<openai-api-key>"
$env:R2_ACCOUNT_ID = "<cloudflare-account-id>"
$env:R2_ACCESS_KEY_ID = "<r2-access-key-id>"
$env:R2_SECRET_ACCESS_KEY = "<r2-secret-access-key>"
$env:R2_BUCKET_NAME = "<r2-bucket-name>"
$env:R2_PUBLIC_BASE_URL = "<r2-public-base-url>"
```

Le dossier Drive source doit etre partage avec l'adresse e-mail du compte de
service. Le fichier JSON du compte de service doit rester dans `.local/` ou un
autre emplacement ignore par Git.

## Dry-run obligatoire avant execution

Afficher la liste cible et les fichiers qui seraient modifies:

```powershell
npm.cmd run batch:wave -- --lots lot-bleuite-fln-w3-amirouche-001 --dry-run --limit 100
```

Pour une vague issue de `.local/drive-inventory/drive-root-inventory.json`:

```powershell
npm.cmd run batch:wave -- --wave wave_1 --dry-run --limit 100
```

Le mode `--wave` ne traite que les lots `planned` deja connus du registre.

## Execution d'un seul lot

Apres verification du dry-run:

```powershell
npm.cmd run batch:wave -- --lots lot-bleuite-fln-w3-amirouche-001 --limit 100 --confirm
```

Cette commande lance Drive, OCR, lecture assistee vision, upload R2, promotion
dans `data/generated`, puis les controles de build.

## Execution avec poursuite sur erreur

Pour une vague courte, en conservant un rapport local par lot:

```powershell
npm.cmd run batch:wave -- --lots lot-bleuite-fln-w3-amirouche-001,lot-autre --limit 100 --continue-on-error --confirm
```

Un echec de lot ecrit:

```text
.local/archive-batches/<lotId>/reports/wave-automation.json
```

et la vague continue si `--continue-on-error` est present.

## Reprise

Les options de reprise de l'agent sont preservees et transmises:

```powershell
npm.cmd run batch:wave -- --lots <lotId> --skip-inventory --skip-download --limit 100 --confirm
```

Options supportees:

```text
--skip-inventory
--skip-download
--skip-conversion
--skip-ocr
--skip-normalization
--skip-vision
--skip-upload
```

Pour une promotion complete, ne pas utiliser `--skip-vision` ni `--skip-upload`
sauf si les sorties locales correspondantes existent deja.

## Fichiers modifies

Dans `data/generated/`, le script peut creer ou mettre a jour:

```text
data/generated/batches/<lotId>/public-assets.json
data/generated/batches/<lotId>/assisted-readings.json
data/generated/archive-batches.example.json
```

Il met aussi a jour:

```text
src/lib/archiveBatches.ts
```

afin que Next.js embarque les nouveaux manifestes JSON dans les routes `/lots`.

## Fichiers locaux

Les sorties de travail restent dans:

```text
.local/archive-batches/<lotId>/
```

Elles comprennent les images brutes, images converties, OCR, lectures assistees,
manifestes locaux, rapports d'erreurs Drive et rapports d'automatisation. Ce
dossier ne doit pas etre committe.

## Garde-fous

- Le script refuse d'executer sans `--confirm`.
- `--dry-run` n'ecrit rien et ne lance aucun traitement.
- Seuls les lots `planned` sont acceptes.
- Les compteurs locaux doivent correspondre avant promotion.
- Les lectures vides deviennent `assisted_unavailable`.
- `humanValidation.validated` doit rester `false`.
- Aucun fichier ou texte manquant n'est invente.
