# Assisted Reading Spec

## Objectif

La lecture assistee par IA est une couche de travail hypothetique. Elle peut
aider a rendre un OCR bruité plus lisible, mais elle ne constitue jamais une
transcription validee.

Cette specification ne declenche aucun appel IA. Elle definit seulement le
format attendu pour une future sortie de lecture assistee.

## Etats a distinguer

### OCR brut

Texte produit directement par Tesseract. Il doit etre conserve tel quel pour
documenter les erreurs, comparer les corrections futures et garder une trace de
la sortie primaire.

### OCR nettoye mecaniquement

Texte issu de nettoyages non interpretatifs: espaces, lignes vides, retours a la
ligne. Il ne corrige pas les noms, les lieux, les dates ou le sens.

### Lecture assistee

Hypothese de lecture proposee a partir de l'OCR fourni. Elle peut restructurer
une lecture probable, mais doit marquer les incertitudes et ne pas inventer de
passages absents.

### Transcription validee

Texte relu et valide humainement par comparaison avec l'image source. C'est le
seul etat qui pourra servir de transcription fiable.

## Hypothese et validation

Une lecture assistee reste une hypothese meme si elle est plus exploitable que
l'OCR brut. La validation impose une relecture humaine sur l'image source,
notamment pour les noms propres, lieux, dates, sigles et passages tronques.

## Regles

- Travailler uniquement a partir de l'OCR fourni.
- Ne pas ajouter de contexte historique externe.
- Ne jamais inventer un passage absent ou illisible.
- Marquer les incertitudes dans une liste dediee.
- Conserver `status: "assisted_unverified"` tant qu'aucune validation humaine
  n'a ete faite.
- Utiliser `status: "assisted_unavailable"` quand aucune lecture assistee
  exploitable n'a pu etre produite pour une page.
- Ne conserver un `assistedReadingText` vide que si le statut est
  `assisted_unavailable`.
- Ne passer a une transcription validee qu'apres relecture humaine.

## Format JSON attendu

```json
{
  "sourceImage": "...",
  "rawOcrTextFile": "...",
  "cleanOcrTextFile": "...",
  "assistedReadingText": "...",
  "uncertainties": [
    {
      "fragment": "...",
      "suggestion": "...",
      "issue": "mot_illisible | nom_propre_incertain | date_incertaine | lieu_incertain | sigle_incertain | lecture_probable",
      "confidence": "low | medium | high",
      "note": "..."
    }
  ],
  "status": "assisted_unverified",
  "humanValidation": {
    "validated": false,
    "validatedBy": null,
    "validatedAt": null,
    "notes": null
  }
}
```

## Role de la relecture humaine

La relecture humaine doit comparer:

- l'image source ;
- l'OCR brut ;
- l'OCR nettoye mecaniquement ;
- la lecture assistee.

Elle doit confirmer ou corriger les incertitudes, signaler les zones illisibles
et documenter les choix de transcription. Sans cette etape, la lecture assistee
reste non validee.

## Generation locale controlee

Le script `scripts/generate-assisted-reading-sample.ts` prepare une generation
locale de lecture assistee pour une seule page OCR nettoyee.

Il doit etre lance uniquement avec `--confirm` et avec `OPENAI_API_KEY` dans
l'environnement local. Il ecrit uniquement dans:

```text
.local/archive-sample/assisted-reading/
```

Commande type:

```powershell
npx.cmd tsx scripts/generate-assisted-reading-sample.ts --input .local/archive-sample/ocr/clean/03-20251127_104448.clean.txt --source-image .local/archive-sample/converted/03-20251127_104448.jpg --out .local/archive-sample/assisted-reading/page-03.assisted.json --model gpt-4.1-mini --confirm
```

Cette generation ne cree pas de transcription validee. Le script force toujours:

- `status: "assisted_unverified"` ;
- `humanValidation.validated: false`.

Les sorties locales ne doivent pas etre commitees automatiquement dans
`data/examples/`. Elles doivent etre relues avant toute publication ou
integration applicative.

## Passage au lot pilote complet

Le passage du `pilot sample` de 8 images au `pilot batch` de 41 images ne change
pas le statut des lectures assistees. Chaque lecture reste rattachee a une seule
image et conserve `status: "assisted_unverified"` tant qu'elle n'a pas ete
relue humainement.

Le batch complet ne doit pas declencher une generation IA automatique de masse.
Il doit d'abord passer par les memes etapes que le sample: controle visuel,
OCR brut, normalisation mecanique, puis lecture assistee page par page si une
decision explicite est prise.

## Lecture assistee V2 avec image + OCR

Une V2 de lecture assistee peut utiliser simultanement:

- l'image JPG locale de la page ;
- l'OCR nettoye mecaniquement correspondant.

Cette approche peut ameliorer la lecture probable en comparant directement
l'OCR avec l'image. Elle ne change pas le statut methodologique: le resultat
reste une hypothese non validee, avec `status: "assisted_unverified"` et
`humanValidation.validated: false`.

Le script local dedie est:

```text
scripts/generate-assisted-reading-vision.ts
```

Commande type:

```powershell
npx.cmd tsx scripts/generate-assisted-reading-vision.ts --input .local/archive-batch-boghari/ocr/clean/03-20251127_104448.clean.txt --image .local/archive-batch-boghari/converted/03-20251127_104448.jpg --out .local/archive-batch-boghari/assisted-reading-vision/page-03.vision.assisted.json --model gpt-4.1 --confirm
```

Contraintes propres a cette V2:

- traiter une seule page a la fois ;
- refuser l'execution sans `--confirm` ;
- refuser l'execution sans `OPENAI_API_KEY` ;
- ecrire uniquement dans le sous-dossier `assisted-reading-vision/` du
  workspace local choisi, par defaut
  `.local/archive-batch-boghari/assisted-reading-vision/` ;
- ne pas ecraser les lectures assistees actuelles ;
- ne pas publier automatiquement les sorties dans `data/generated/` ;
- ne pas creer d'embeddings.

La relecture humaine reste obligatoire avant toute validation, citation,
indexation ou integration au manifeste principal.

## Lectures assistees dans un modele multi-lots

Dans une logique multi-lots, les lectures assistees ne doivent pas etre stockees
dans le manifeste principal. Chaque lot peut referencer son propre manifeste de
lectures assistees via `data/generated/archive-batches.example.json`.

Les sorties locales doivent rester dans le workspace du lot, par exemple:

```text
.local/lot-boghari-001/assisted-reading-vision/
```

Le script vision accepte un `--workspace` afin d'eviter une dependance implicite
a `.local/archive-batch-boghari/`:

```powershell
npx.cmd tsx scripts/generate-assisted-reading-vision.ts --workspace .local/lot-boghari-001 --input .local/lot-boghari-001/ocr/clean/03-20251127_104448.clean.txt --image .local/lot-boghari-001/converted/03-20251127_104448.jpg --model gpt-4.1 --confirm
```

Quel que soit le lot, le statut reste `assisted_unverified` jusqu'a validation
humaine.

## Lectures indisponibles et promotion tolerante

Un lot peut contenir des images sans lecture assistee exploitable: OCR vide,
image illisible, sortie locale interrompue ou fichier manipule manuellement. Ces
pages ne doivent pas bloquer la revue du reste du lot, mais elles ne doivent pas
recevoir de transcription inventee.

Pour une page sans lecture exploitable, la sortie locale doit utiliser:

```json
{
  "assistedReadingText": "",
  "status": "assisted_unavailable",
  "humanValidation": {
    "validated": false
  }
}
```

Le script `scripts/promote-assisted-readings.ts` peut etre lance avec
`--skip-invalid` pour debloquer une promotion controlee lorsqu'un ou plusieurs
fichiers locaux sont invalides JSON ou ne respectent pas le schema attendu. Dans
ce mode, les fichiers invalides sont ignores, signales en console et reportes
dans les metadonnees du manifeste genere. Ils devront etre repris plus tard.

Cette tolerance ne cree aucune lecture, ne corrige aucun OCR et ne modifie pas
les fichiers sources locaux.
