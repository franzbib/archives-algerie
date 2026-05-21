# Telechargements Drive authentifies

## Pourquoi la cle API peut bloquer

`GOOGLE_DRIVE_API_KEY` suffit souvent pour lister un dossier Drive public ou
accessible par lien. Cette cle n'incarne cependant pas un utilisateur Google et
ne porte pas les droits reels du proprietaire du dossier.

Pour telecharger le contenu avec `files/{id}?alt=media`, Google Drive peut
renvoyer `403` si le fichier n'est pas vraiment public, si une restriction de
partage s'applique, si un quota est atteint ou si Drive exige une identite
autorisee. Dans ce cas, le pipeline doit continuer a signaler l'echec, produire
`download-errors.json`, puis s'arreter si aucun fichier n'a ete telecharge.

## Option recommandee: compte de service

Pour les lots Archives Algerie, le mode le plus adapte est un compte de service:

- il est stable pour traiter plusieurs dizaines de lots ;
- il ne depend pas d'une session navigateur locale ;
- il fonctionne bien depuis Windows et PowerShell ;
- il garde les donnees de travail et les secrets dans `.local/`, hors Git ;
- il peut etre partage explicitement sur les dossiers Drive a traiter.

Le dossier Drive source doit etre partage avec l'adresse e-mail du compte de
service, par exemple:

```text
archives-drive-ingest@<project-id>.iam.gserviceaccount.com
```

Le role `Lecteur` suffit pour l'inventaire et le telechargement.

## Configuration locale

Placez le fichier JSON du compte de service dans un emplacement ignore par Git,
par exemple:

```powershell
New-Item -ItemType Directory -Force .local\secrets
```

Copiez ensuite le JSON dans:

```text
.local/secrets/google-service-account.json
```

Ne jamais committer:

- le JSON du compte de service ;
- un token OAuth ;
- une cle API ;
- un `.env` contenant des secrets.

Le dossier `.local/` est ignore par Git.

## Activer le mode authentifie

Dans PowerShell:

```powershell
$env:GOOGLE_SERVICE_ACCOUNT_KEY_PATH = ".local\secrets\google-service-account.json"
```

La variable standard Google est aussi acceptee:

```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS = ".local\secrets\google-service-account.json"
```

Si aucune de ces variables n'est definie, les scripts conservent le fallback
historique:

```powershell
$env:GOOGLE_DRIVE_API_KEY = "<cle-api-drive>"
```

Le compte de service est prioritaire quand il est configure. La cle API reste
utile pour un inventaire public ou pour comparer le comportement existant.

## Relancer un lot complet

Avec compte de service configure:

```powershell
$env:GOOGLE_SERVICE_ACCOUNT_KEY_PATH = ".local\secrets\google-service-account.json"
npm.cmd run batch:agent -- --lot lot-pam-cim-liberes-001 --limit 100 --skip-vision --skip-upload --confirm
```

Cette commande relance l'inventaire, le telechargement brut, la preparation
locale des images, l'OCR et la normalisation. Elle ne lance pas OpenAI, ne cree
pas d'embeddings et ne publie pas le lot.

## Reprendre apres blocage Drive

Si le telechargement Drive a echoue mais que des fichiers ont ete places
manuellement dans `raw/`:

```powershell
npm.cmd run batch:agent -- --lot lot-pam-cim-liberes-001 --skip-inventory --skip-download --skip-vision --skip-upload --limit 100 --confirm
```

Si les JPG sont deja places dans `converted/`:

```powershell
npm.cmd run batch:agent -- --lot lot-pam-cim-liberes-001 --skip-inventory --skip-download --skip-conversion --skip-vision --skip-upload --limit 100 --confirm
```

Ces reprises ne doivent jamais inventer une image ou une lecture. Les fichiers
absents restent absents et doivent rester visibles dans les rapports locaux.

## Rapports d'erreurs

Les erreurs Drive `403` et `429` restent traitees comme des telechargements
ignores. Le rapport est conserve dans:

```text
.local/archive-batches/<lotId>/reports/download-errors.json
```

Si aucun fichier n'est telecharge, le lot s'arrete explicitement avec
`fileCount === 0`. C'est volontaire: le pipeline ne compense jamais un
telechargement echoue par un fichier ou une lecture inventee.
