# Local Search Index Plan

## Objectif

L'index local de recherche prepare une premiere recherche plein texte sur
l'echantillon pilote, sans OpenAI, sans embeddings et sans moteur de recherche
web complet.

Il sert uniquement a rassembler les couches textuelles deja produites localement
dans un format commun et qualifie.

## Contenu de l'index

Le script `scripts/build-local-search-index.ts` produit:

```text
.local/archive-sample/search/search-index.json
```

Chaque entree de l'index contient:

- `id` ;
- `collectionId` ;
- `sourceImage` ou `sourceFile` ;
- `textLayer` ;
- `confidence` ;
- `validationStatus` ;
- `text` ;
- `sourceTextFile` ;
- `uncertaintyCount` si disponible ;
- `createdAt`.

Les couches prises en compte sont:

- `ocr_raw` : OCR brut local, confiance faible, non verifie ;
- `ocr_clean_mechanical` : OCR nettoye mecaniquement, confiance faible, non
  verifie ;
- `assisted_unverified` : lecture assistee exemple, confiance moyenne par
  defaut, non verifiee ;
- `validated_transcription` : reserve aux transcriptions humaines futures.

## Pas encore semantique

Cet index n'est pas un index semantique. Il ne calcule aucun vecteur, ne cree
aucun embedding et n'appelle aucun service d'IA.

La prochaine etape logique serait d'abord une recherche plein texte locale,
capable de filtrer par couche, confiance et statut de validation. La recherche
semantique ne doit venir qu'apres stabilisation des sources textuelles et des
citations.

## Inclusion des faibles confiances

Les OCR brutes et nettoyes restent inclus meme lorsqu'ils sont bruites. Une
faible confiance ne doit pas rendre un document invisible: elle doit rendre la
prudence visible.

Les futurs resultats devront donc qualifier chaque occurrence au lieu de
l'exclure silencieusement:

- couche textuelle utilisee ;
- niveau de confiance ;
- statut de validation ;
- image, page ou fichier source ;
- avertissement si la lecture est fragile.

## Statut documentaire

L'index local n'est pas une base historique validee. Il ne modifie pas le
manifeste principal, ne cree pas de nouvelles notices et ne transforme pas une
image ou un OCR en document valide.

Les textes indexes restent des couches de travail:

- l'OCR brut documente la sortie primaire ;
- l'OCR nettoye documente un nettoyage mecanique ;
- la lecture assistee reste hypothetique ;
- seule une transcription validee humainement pourra servir de reference forte.

## Commande locale

Commande Windows PowerShell:

```powershell
npx.cmd tsx scripts/build-local-search-index.ts --workspace .local/archive-sample --examples data/examples --out .local/archive-sample/search/search-index.json --confirm
```

Equivalent npm:

```powershell
npm.cmd run search:index:sample -- --workspace .local/archive-sample --examples data/examples --out .local/archive-sample/search/search-index.json --confirm
```

Le script refuse d'ecrire sans `--confirm`. La sortie reste sous `.local/`, qui
est ignore par Git.

## Recherche locale simple dans l'index

Le script `scripts/search-local-index.ts` permet de chercher un mot ou une
expression dans `search-index.json`.

Cette recherche n'est pas semantique: elle ne comprend pas le sens des textes et
ne fait aucune recherche par similarite. Elle cherche seulement dans le champ
`text` des entrees indexees.

Les resultats affichent toujours:

- la couche textuelle ;
- le niveau de confiance ;
- le statut de validation ;
- l'image source si elle est connue ;
- le fichier texte source ;
- la collection.

Les resultats a faible confiance restent visibles. Ils doivent etre lus comme
des indices de travail et verifies sur l'image avant toute citation ou
interpretation.

Exemples Windows PowerShell:

```powershell
npx.cmd tsx scripts/search-local-index.ts --index .local/archive-sample/search/search-index.json --query "BOGHARI"
```

```powershell
npx.cmd tsx scripts/search-local-index.ts --index .local/archive-sample/search/search-index.json --query "F.L.N."
```

```powershell
npx.cmd tsx scripts/search-local-index.ts --index .local/archive-sample/search/search-index.json --query "Wilaya" --limit 5
```

Des filtres peuvent limiter temporairement les resultats par couche ou par
niveau de confiance:

```powershell
npx.cmd tsx scripts/search-local-index.ts --index .local/archive-sample/search/search-index.json --query "BOGHARI" --layer assisted_unverified --confidence medium
```

Une sortie JSON brute est disponible avec `--json` pour de futures verifications
ou integrations locales. Le script ne modifie jamais l'index.

## Evolution future

1. Ajouter une recherche plein texte locale sur `search-index.json`.
2. Afficher les resultats par couche et niveau de confiance.
3. Ajouter des filtres pour inclure ou masquer temporairement les faibles
   confiances.
4. Relier chaque resultat a sa collection, sa cote, son document et son image.
5. Envisager seulement ensuite un index semantique source et verifiable.
