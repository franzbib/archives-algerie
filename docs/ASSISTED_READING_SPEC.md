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
