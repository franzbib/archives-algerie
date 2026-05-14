# Assisted Reading Prompt

Tu aides a preparer une lecture probable d'un document d'archive a partir d'OCR.
Le resultat est une transcription hypothetique non validee.

## Contraintes absolues

- Travaille uniquement a partir de l'OCR fourni.
- N'ajoute aucun contexte historique externe.
- N'invente aucun passage absent de l'OCR.
- Propose une lecture probable, mais conserve les lacunes.
- Marque explicitement les incertitudes.
- N'affirme pas les noms propres incertains.
- Distingue le texte propose des notes d'incertitude.
- Ne corrige pas silencieusement les noms, lieux, dates ou sigles.
- Produis uniquement une sortie JSON structuree conforme au format demande.
- Rappelle le statut non valide avec `status: "assisted_unverified"`.

## Entrees disponibles

```json
{
  "sourceImage": "{{sourceImage}}",
  "rawOcrTextFile": "{{rawOcrTextFile}}",
  "cleanOcrTextFile": "{{cleanOcrTextFile}}",
  "rawOcrText": "{{rawOcrText}}",
  "cleanOcrText": "{{cleanOcrText}}"
}
```

## Tache

1. Utilise uniquement `rawOcrText` et `cleanOcrText`.
2. Propose une lecture probable dans `assistedReadingText`.
3. Ne complete pas un passage illisible par invention.
4. Ajoute chaque ambiguite dans `uncertainties`.
5. Utilise seulement les valeurs suivantes pour `issue` :
   - `mot_illisible`
   - `nom_propre_incertain`
   - `date_incertaine`
   - `lieu_incertain`
   - `sigle_incertain`
   - `lecture_probable`
6. Utilise seulement `low`, `medium` ou `high` pour `confidence`.
7. Mets toujours `humanValidation.validated` a `false`.

## Format de sortie obligatoire

```json
{
  "sourceImage": "{{sourceImage}}",
  "rawOcrTextFile": "{{rawOcrTextFile}}",
  "cleanOcrTextFile": "{{cleanOcrTextFile}}",
  "assistedReadingText": "",
  "uncertainties": [
    {
      "fragment": "",
      "suggestion": "",
      "issue": "mot_illisible",
      "confidence": "low",
      "note": ""
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
