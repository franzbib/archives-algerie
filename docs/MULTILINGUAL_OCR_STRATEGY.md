# Strategie OCR multilingue

## Objectif

Cette note prepare une detection linguistique prudente des pages deja integrees
dans les lots d'archives. L'objectif est de savoir si une page semble relever du
francais, de l'arabe, d'un melange francais+arabe, d'une autre langue ou d'une
image illisible avant de choisir un futur modele OCR.

Cette etape ne produit aucune transcription.

## Script prepare

Le script local est:

```powershell
npx.cmd tsx scripts/detect-page-languages.ts --lot lot-fln-w4-001 --limit 5 --confirm
```

Pour tester une page precise:

```powershell
npx.cmd tsx scripts/detect-page-languages.ts --lot lot-fln-w4-001 --review-id page-01 --confirm
```

Le script:

- lit `data/generated/archive-batches.example.json` ;
- lit le manifeste public du lot integre ;
- utilise l'image locale si elle existe dans `.local/archive-batches/<lotId>/converted/` ;
- utilise l'image R2 publique sinon ;
- appelle OpenAI uniquement avec `--confirm` et `OPENAI_API_KEY` ;
- demande uniquement la langue et l'ecriture visibles ;
- refuse de produire une transcription.

## Sortie locale

La sortie est ecrite dans:

```text
.local/archive-batches/<lotId>/language-detection/language-detection.json
```

Chaque entree contient:

```json
{
  "lotId": "...",
  "reviewId": "...",
  "sourceFileName": "...",
  "detectedLanguages": ["fr", "ar"],
  "detectedScripts": ["latin", "arabic"],
  "confidence": "low|medium|high",
  "method": "vision_language_detection",
  "notes": "...",
  "humanValidated": false
}
```

Le fichier de sortie reste dans `.local/` et ne doit pas etre committe.

## Promotion controlee dans l'application

Les detections linguistiques peuvent etre promues explicitement vers une couche
controlee:

```powershell
npx.cmd tsx scripts/promote-language-detection.ts --input .local/archive-batches/lot-fln-w4-002/language-detection/language-detection.json --out data/generated/language-detection/lot-fln-w4-002.language.json
```

Cette promotion:

- verifie la structure du fichier local ;
- refuse les entrees sans `lotId` ou `reviewId` ;
- refuse les langues ou ecritures inconnues ;
- force `humanValidated: false` ;
- ne lit pas les OCR bruts ou nettoyes ;
- ne modifie pas les lectures assistees ;
- ne modifie ni R2 ni Google Drive.

Les fichiers promus dans `data/generated/language-detection/` constituent une
couche separee des manifestes d'assets et des lectures assistees. Ils servent a
afficher un repere discret dans `/lots/[lotId]` et une section methodologique
dans `/lots/[lotId]/[reviewId]`.

Ces detections ne valent pas validation humaine. Elles doivent rester des aides
techniques pour preparer le choix d'un futur OCR (`fra`, `ara`, `fra+ara`), pas
des informations archivistiques definitives.

## Principes de prudence

- La detection linguistique n'est pas une transcription.
- Une page detectee comme arabe ou francais+arabe ne valide pas son contenu.
- Une faible confiance ne doit pas exclure la page du traitement futur.
- La detection doit aider a choisir les parametres OCR, par exemple `fra`,
  `ara` ou `fra+ara`.
- Une validation humaine reste necessaire, surtout pour les pages manuscrites,
  floues, mixtes ou partiellement illisibles.

## Etape suivante possible

Apres detection sur un petit lot, comparer les resultats avec un controle visuel
humain. Seulement ensuite, preparer des commandes OCR adaptees par sous-ensemble:

- pages francaises : OCR `fra` ;
- pages arabes : OCR `ara` ;
- pages mixtes : OCR `fra+ara` ou traitement separe ;
- pages illisibles : mise de cote ou reprise image avant OCR.

Cette strategie ne modifie ni R2, ni Google Drive, ni les manifestes applicatifs.
