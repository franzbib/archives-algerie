# Search Confidence Policy

## Objectif

Cette politique définit comment une future recherche devra traiter les textes
issus des archives, y compris lorsque l'OCR ou la lecture assistée sont bruités
ou faiblement fiables.

Elle ne crée pas de moteur de recherche. Elle ne déclenche aucun appel OpenAI et
ne crée aucun embedding.

## Couches textuelles

La future recherche devra distinguer quatre couches:

- `ocr_raw` : OCR brut produit localement, non relu.
- `ocr_clean_mechanical` : OCR nettoyé mécaniquement, sans correction
  interprétative.
- `assisted_unverified` : lecture assistée non validée, hypothétique.
- `validated_transcription` : transcription relue et validée humainement.

## Tous les documents restent interrogeables

Aucun document ne doit être exclu automatiquement parce que son OCR est bruité ou
parce que sa lecture assistée a une confiance faible. Les documents à faible
confiance peuvent contenir des indices utiles: noms propres, lieux, dates,
mentions partielles ou formulations rares.

Le filtrage par confiance doit donc être une option d'affichage, pas une règle
d'exclusion silencieuse.

## Qualification obligatoire des résultats

Chaque résultat de recherche devra afficher:

- couche utilisée: `ocr_raw`, `ocr_clean_mechanical`, `assisted_unverified` ou
  `validated_transcription` ;
- niveau de confiance: `low`, `medium` ou `high` ;
- statut de validation ;
- incertitudes principales ;
- source: collection, cote, document, image/page, fichier ;
- avertissement visible si la lecture est fragile.

Un résultat faible ne doit pas être présenté comme un résultat normal. Il doit
être lisible, mais qualifié.

## Pondération des résultats

La pondération recommandée est:

1. transcription validée ;
2. lecture assistée non validée ;
3. OCR nettoyé mécaniquement ;
4. OCR brut.

Cette pondération sert au classement, pas à l'exclusion. Un résultat faible mais
pertinent doit rester accessible, idéalement dans une section dédiée:

```text
Résultats incertains mais pertinents
```

Cette section doit permettre de repérer les documents à vérifier sur image sans
les faire disparaître.

## Affichage futur

L'interface de recherche pourra organiser les résultats en trois niveaux:

- résultats fiables ;
- résultats probables ;
- résultats incertains.

Des filtres devront permettre:

- d'inclure tous les résultats ;
- d'exclure temporairement les résultats faibles ;
- de revenir rapidement à l'affichage complet ;
- de filtrer par couche textuelle ;
- de filtrer par statut de validation.

Un avertissement méthodologique doit rester visible: l'OCR et les lectures
assistées non validées peuvent contenir des erreurs.

## Réponses en langage naturel

Toute future réponse en langage naturel devra:

- citer les sources utilisées ;
- indiquer le niveau de confiance ;
- distinguer fait attesté, hypothèse de lecture et contexte ;
- éviter de transformer une lecture probable en certitude ;
- signaler les passages à vérifier sur l'image.

Une réponse IA ne devra jamais masquer qu'elle s'appuie sur une couche faible ou
non validée.

## Structure technique future

Les futurs index devront prévoir au minimum les champs suivants:

```json
{
  "textLayer": "ocr_raw | ocr_clean_mechanical | assisted_unverified | validated_transcription",
  "confidence": "low | medium | high",
  "validationStatus": "unverified | assisted_unverified | human_validated",
  "uncertaintyCount": 0,
  "sourceImage": "...",
  "sourceDocument": "...",
  "collectionId": "...",
  "archiveReference": "..."
}
```

Ces champs devront accompagner chaque passage indexé afin que la recherche,
l'affichage et les futures réponses IA restent sourcés et prudents.

## Risques

- Faux positifs.
- Noms propres mal lus.
- Lieux mal reconnus.
- Hallucination si une IA travaille sur un OCR bruité.
- Disparition de documents intéressants si l'on filtre trop sévèrement.
- Excès de confiance si les résultats faibles sont affichés comme des résultats
  normaux.

## Règle de prudence

Le faible niveau de confiance ne doit pas rendre un document invisible. Il doit
rendre la prudence visible.

## Recherche future dans un modele multi-lots

La future recherche devra conserver l'information de lot pour chaque resultat.
En plus des champs deja prevus, les index devront pouvoir porter:

```json
{
  "lotId": "lot-boghari-001",
  "assetManifest": "data/generated/public-batch-assets.example.json",
  "assistedReadingManifest": "data/generated/pilot-batch-assisted-readings.example.json"
}
```

Un resultat issu d'un lot planifie, publie non valide ou valide humainement devra
afficher ce statut. Le passage au multi-lots ne doit jamais masquer la couche
textuelle utilisee, le niveau de confiance ou la necessite de verification sur
image.
