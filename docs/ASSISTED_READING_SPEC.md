# Assisted Reading Spec

## Objectif

La lecture assistee par IA est une couche hypothetique entre l'OCR nettoye
mecaniquement et une transcription validee humainement. Elle peut proposer une
lecture probable, mais elle ne valide pas le texte.

Cette specification ne declenche aucun appel IA. Elle decrit seulement le format
attendu pour une future sortie.

## Etats a distinguer

- OCR brut : sortie Tesseract non modifiee.
- OCR nettoye mecaniquement : texte avec nettoyage non interpretatif.
- Lecture assistee : hypothese produite a partir de l'OCR fourni.
- Transcription validee : texte relu et valide par un humain.

## Regles

- Travailler uniquement a partir de l'OCR fourni.
- Ne pas ajouter de contexte historique externe.
- Ne jamais inventer un passage absent ou illisible.
- Marquer les incertitudes dans une liste dediee.
- Verifier noms, lieux et dates sur l'image avant toute validation.
- Conserver `status: "assisted_unverified"` tant qu'aucune validation humaine
  n'a ete faite.

## Format JSON attendu

```json
{
  "sourceImage": "...",
  "rawOcrTextFile": "...",
  "cleanOcrTextFile": "...",
  "assistedReading": "...",
  "uncertainties": [
    {
      "fragment": "...",
      "issue": "mot illisible | nom propre incertain | date incertaine | lieu incertain",
      "suggestion": "...",
      "confidence": "low | medium | high"
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

## Notes de validation

Le champ `assistedReading` ne doit pas etre utilise comme transcription finale.
Il sert a orienter la relecture. Une validation humaine devra comparer la
lecture assistee avec l'image source, l'OCR brut et l'OCR nettoye.
