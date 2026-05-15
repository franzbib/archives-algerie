# Strategie de publication progressive des images d'archives

## Objectif

Ce document prepare une strategie prudente pour publier progressivement des
images d'archives vers un stockage dedie gratuit ou a tres faible cout.

Il ne code aucun upload, n'ajoute aucune dependance et ne modifie pas le
manifeste principal. Il sert a distinguer les espaces de travail, les espaces de
conservation et les futurs espaces de publication.

Principe central: la publication d'une image ne valide ni la page, ni le
document, ni l'OCR, ni la lecture assistee.

## 1. Google Drive

Google Drive reste le depot source actuel.

Role:

- conserver les originaux ;
- maintenir le lien avec les dossiers sources ;
- permettre l'inventaire controle ;
- servir de reference pour retrouver les fichiers bruts.

Limites:

- Drive n'est pas necessairement optimise pour l'affichage public dans une app
  web ;
- les liens publics ou partages peuvent changer selon les droits ;
- les performances et les quotas ne doivent pas etre supposes stables pour une
  consultation publique ;
- l'application ne doit pas modifier les fichiers Drive.

Regle:

- Google Drive est une source de conservation et d'inventaire, pas le stockage
  public cible de l'application.

## 2. `.local/`

Le dossier `.local/` est l'espace de travail local.

Role:

- telechargement controle de l'echantillon ;
- conversion HEIC -> JPG ;
- OCR brut ;
- normalisation mecanique ;
- index local de recherche ;
- essais techniques non publies.

Limites:

- `.local/` est ignore par Git ;
- les fichiers locaux ne sont pas publies tels quels ;
- les chemins locaux ne doivent pas entrer dans le manifeste principal comme URL
  publique ;
- cet espace peut contenir des fichiers de travail non valides.

Regle:

- `.local/` sert a preparer et verifier, pas a publier.

## 3. GitHub

GitHub reste le depot du code et des donnees legeres.

Role:

- code applicatif ;
- documentation ;
- manifestes legers ;
- exemples limites ;
- specifications de formats.

Ce que GitHub ne doit pas contenir:

- HEIC originaux ;
- JPG d'archives en masse ;
- OCR de masse volumineux ;
- fichiers locaux issus de `.local/` ;
- secrets ou cles d'API.

Regle:

- GitHub doit rester lisible, versionnable et leger. Les assets d'archives
  publies doivent etre stockes ailleurs.

## 4. Vercel

Vercel heberge l'interface web Next.js.

Role:

- pages publiques ;
- navigation ;
- fiches collection et document ;
- consultation des manifestes legers ;
- eventuelle lecture d'URLs publiques d'assets.

Limites:

- Vercel ne doit pas etre utilise comme stockage principal des images
  d'archives ;
- le depot deploye ne doit pas embarquer les JPG/HEIC d'archives ;
- les limites de build et de bande passante doivent rester protegees.

Regle:

- Vercel affiche les archives, mais ne doit pas les stocker massivement.

## 5. Stockage dedie

Un stockage dedie doit recevoir les images publiees progressivement, apres
controle. Les prix et quotas evoluent: ils doivent etre reverifies sur les pages
officielles avant toute publication importante.

### Cloudflare R2

Points forts:

- stockage objet compatible S3 ;
- adapte a des fichiers statiques ;
- bon candidat pour servir des images depuis une app Next.js ;
- politique attractive sur les frais de sortie, selon la tarification officielle
  en vigueur ;
- migration possible grace a l'API compatible S3.

Points de vigilance:

- necessite de configurer proprement buckets, acces public ou URLs signees ;
- couts d'operations et de stockage a surveiller si la consultation augmente ;
- gestion des noms d'objets, metadonnees et invalidation a definir ;
- ne remplace pas le manifeste archivistique valide.

Lecture:

- candidat prioritaire pour un pilote de publication d'images.

### Supabase Storage

Points forts:

- integration simple avec une app web ;
- tableau de bord accessible ;
- buckets publics ou controles ;
- peut etre interessant si le projet adopte plus tard Supabase pour d'autres
  donnees.

Points de vigilance:

- quota gratuit plus limite pour le stockage de fichiers ;
- les projets gratuits peuvent avoir des contraintes d'inactivite ;
- risque de coupler trop tot stockage, base de donnees et authentification ;
- moins prioritaire si le besoin immediat est seulement du stockage objet
  public.

Lecture:

- bon choix pour prototypage integre, moins neutre qu'un stockage objet dedie.

### Vercel Blob

Points forts:

- tres simple a connecter avec une app Vercel ;
- coherent pour petits assets applicatifs ou uploads limites ;
- bonne ergonomie dans l'ecosysteme Vercel.

Points de vigilance:

- risque de coupler l'hebergement web et le stockage des archives ;
- couts a verifier si le volume d'images grossit ;
- moins ideal si l'on veut pouvoir migrer facilement vers un autre hebergeur ;
- ne doit pas transformer Vercel en depot principal d'archives.

Lecture:

- utile pour de petits usages applicatifs, mais pas premier choix pour une base
  d'images d'archives appelee a grossir.

### Google Cloud Storage

Points forts:

- stockage objet robuste ;
- bonne integration avec l'ecosysteme Google ;
- URLs publiques ou signees possibles ;
- separation claire entre Drive source et bucket de publication.

Points de vigilance:

- configuration IAM et facturation plus techniques ;
- modele de couts plus complexe ;
- risque de confusion avec Google Drive si les roles ne sont pas documentes ;
- peut etre disproportionne pour un premier pilote.

Lecture:

- option solide a long terme, mais plus lourde pour demarrer.

## Comparaison synthetique

| Option | Gratuit ou tres faible cout | Simplicite | Next.js/Vercel | URLs publiques ou signees | Cout futur | Migration |
| --- | --- | --- | --- | --- | --- | --- |
| Cloudflare R2 | Bon candidat pilote, a verifier | Moyenne | Bonne | Oui | A surveiller | Bonne grace a S3 |
| Supabase Storage | Bon pour petit prototype | Bonne | Bonne | Oui | Peut monter avec stockage/egress | Moyenne |
| Vercel Blob | Simple pour Vercel | Tres bonne | Excellente | Oui | A surveiller si volume | Moyenne |
| Google Cloud Storage | Possible mais plus technique | Moyenne a faible | Bonne | Oui | Flexible mais complexe | Bonne |

## Recommandation

Recommandation prioritaire: utiliser Cloudflare R2 comme stockage dedie pilote,
sauf contre-indication technique ou budgetaire lors de la verification finale
des quotas.

Raisons:

- separation nette entre source, travail local, code et publication ;
- stockage objet adapte aux images ;
- compatibilite S3 utile pour eviter un verrouillage fort ;
- bon positionnement pour un pilote public leger ;
- possibilite de migrer plus tard si les besoins changent.

Supabase Storage reste une alternative credible si le projet decide plus tard
d'utiliser Supabase pour une base applicative. Vercel Blob doit rester reserve a
des usages applicatifs simples ou a un prototype tres limite. Google Cloud
Storage est solide mais probablement plus lourd pour la premiere publication.

## Premiere etape proposee

Publier uniquement les 8 JPG pilotes deja convertis localement.

Ne pas publier:

- les HEIC originaux ;
- toute la collection Boghari ;
- les OCR locaux complets ;
- les lectures assistees comme transcriptions validees.

Creer plus tard un manifeste dedie:

```text
data/generated/public-pilot-assets.json
```

Structure indicative:

```json
{
  "generatedAt": "...",
  "storageProvider": "cloudflare_r2",
  "status": "pilot",
  "assets": [
    {
      "collectionId": "shd-1h4382-d1-boghari",
      "sourceDriveFileId": "...",
      "sourceDriveUrl": "...",
      "localConvertedFile": ".local/archive-sample/converted/...",
      "publicImageUrl": "...",
      "publicationStatus": "image_published_unvalidated",
      "ocrStatus": "ocr_raw",
      "assistedReadingStatus": "assisted_unverified",
      "note": "Image pilote publiee pour consultation technique ; page et document non valides."
    }
  ]
}
```

Statuts a conserver:

- `image_published_unvalidated` : image publiee, mais non validee comme page ou
  document ;
- `ocr_raw` : OCR brut existant, non relu ;
- `assisted_unverified` : lecture assistee hypothetique, non validee.

Chaque JPG publie doit rester relie a son fichier Drive d'origine. Le lien Drive
permet de remonter au fichier source, tandis que l'URL publique sert seulement a
l'affichage.

## Regles de prudence

- Ne pas publier en masse avant d'avoir valide le flux sur 8 images.
- Ne pas remplacer Google Drive par le stockage public.
- Ne pas supprimer les originaux Drive.
- Ne pas presenter une image publiee comme une page validee.
- Ne pas presenter un OCR brut ou une lecture assistee comme transcription
  fiable.
- Ne pas introduire de dependance applicative au fournisseur sans garder un
  manifeste exportable.
- Garder les couts observables avant toute montee en volume.

## Etapes futures recommandees

1. Creer un bucket R2 pilote.
2. Definir une convention de chemins d'objets:
   `pilot/shd-1h4382-d1-boghari/images/01-...jpg`.
3. Uploader manuellement les 8 JPG pilotes.
4. Generer `public-pilot-assets.json` sans modifier le manifeste principal.
5. Verifier les URLs publiques ou signees.
6. Ajouter une lecture applicative du manifeste public pilote.
7. Afficher les images dans la fiche document avec avertissement
   `image_published_unvalidated`.
8. Evaluer couts, performances, migration et risques avant publication plus
   large.

## Sources tarifaires a reverifier

Pages officielles consultees pour orienter la comparaison:

- Cloudflare R2 pricing: https://developers.cloudflare.com/r2/pricing/
- Supabase pricing: https://supabase.com/pricing
- Supabase Storage pricing: https://supabase.com/docs/guides/storage/pricing
- Vercel Blob pricing: https://vercel.com/docs/vercel-blob/usage-and-pricing
- Google Cloud Storage pricing: https://cloud.google.com/storage/pricing

Ces pages peuvent evoluer. Les quotas, limites et prix doivent etre controles a
nouveau avant toute publication publique significative.
