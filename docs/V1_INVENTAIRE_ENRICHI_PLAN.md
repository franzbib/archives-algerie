# V1 — Inventaire enrichi

## 1. Objectif de la V1

La V1 doit améliorer la qualité de l'inventaire avant OCR massif et avant tout
usage d'IA. Elle doit consolider la description archivistique afin que les
prochaines étapes reposent sur des notices stables, vérifiables et non
inventées.

La V1 doit permettre :

- de mieux décrire les collections ;
- de mieux décrire les documents ;
- de mieux distinguer dossier, document, page et image ;
- d'ajouter des statuts de traitement plus lisibles ;
- de préparer l'ingestion Drive contrôlée ;
- de préparer un premier échantillon OCR limité.

L'objectif n'est pas d'accélérer l'automatisation, mais de rendre l'inventaire
plus fiable.

## 2. Ce que la V1 ne doit pas encore faire

La V1 ne doit pas inclure :

- OCR massif ;
- appel OpenAI ;
- embeddings ;
- recherche en langage naturel active ;
- base PostgreSQL ;
- authentification ;
- ingestion automatique non contrôlée ;
- modification automatique du manifeste depuis Google Drive sans validation
  humaine.

Les scripts et documents préparatoires peuvent cadrer ces étapes, mais
l'application ne doit pas encore les activer.

## 3. Champs à envisager pour enrichir les collections

Champs possibles pour `Collection` :

- `historicalContext` : contexte historique court de la collection ;
- `archivalScope` : périmètre archivistique couvert ;
- `provenanceNote` : provenance ou chaîne de conservation connue ;
- `communicabilityNote` : note sur les limites de consultation ;
- `physicalDescription` : support, volume, format ou nature matérielle ;
- `language` : langue principale des documents ;
- `dateStart` : date de début normalisée si connue ;
- `dateEnd` : date de fin normalisée si connue ;
- `placesMentioned` : lieux importants mentionnés ;
- `organizationsMentioned` : organisations mentionnées ;
- `peopleMentioned` : personnes mentionnées au niveau collection ;
- `processingNotes` : remarques d'inventaire ;
- `reliabilityLevel` : niveau de fiabilité de la notice.

Prioritaires pour la V1 :

- `historicalContext` ;
- `archivalScope` ;
- `language` ;
- `dateStart` ;
- `dateEnd` ;
- `placesMentioned` ;
- `processingNotes` ;
- `reliabilityLevel`.

Peuvent attendre :

- `provenanceNote` ;
- `communicabilityNote` ;
- `physicalDescription` ;
- `organizationsMentioned` ;
- `peopleMentioned`, sauf si les noms sont déjà relevés de manière fiable.

## 4. Champs à envisager pour enrichir les documents

Champs possibles pour `Document` :

- `folderTitle` ;
- `pageCount` ;
- `imageCount` ;
- `documentLevel` ;
- `archivalUnitType` ;
- `transcriptionStatus` ;
- `ocrQuality` ;
- `hasImage` ;
- `hasOcrText` ;
- `requiresHumanReview` ;
- `uncertaintyNotes` ;
- `relatedPlaces` ;
- `relatedPeople` ;
- `relatedOrganizations` ;
- `sourceImagePath` ;
- `sourceDriveFileId` ;
- `sourceDriveUrl`.

Prioritaires pour la V1 :

- `folderTitle` ;
- `pageCount` ;
- `imageCount` ;
- `documentLevel` ;
- `archivalUnitType` ;
- `hasImage` ;
- `hasOcrText` ;
- `requiresHumanReview` ;
- `uncertaintyNotes` ;
- `relatedPlaces` ;
- `sourceDriveFileId` ;
- `sourceDriveUrl`.

Peuvent attendre :

- `transcriptionStatus`, si `ocrStatus` suffit encore provisoirement ;
- `ocrQuality`, avant le premier échantillon OCR ;
- `relatedPeople` et `relatedOrganizations`, tant que les noms et organismes ne
  sont pas relevés manuellement ;
- `sourceImagePath`, tant que les images ne sont pas téléchargées localement.

## 5. Statuts de traitement

Statuts à clarifier pour la suite :

- `to_inventory` : notice ou unité à inventorier ;
- `inventoried` : notice minimale validée ;
- `image_linked` : image ou fichier source identifié et rattaché ;
- `ocr_pending` : OCR prévu mais non produit ;
- `ocr_done` : OCR produit ;
- `ocr_needs_review` : OCR produit mais nécessitant relecture humaine ;
- `indexed` : texte ou notice intégré à un index de recherche ;
- `verified` : notice, OCR ou rattachement vérifié humainement.

Ces statuts ne doivent pas être inventés automatiquement. Ils doivent reposer
sur des données observables ou sur une validation humaine explicite. Un fichier
Drive repéré ne suffit pas à prouver qu'un document est inventorié, OCRisé ou
vérifié.

## 6. Évolution du manifeste

Le manifeste principal est :

`src/data/archives-manifest.json`

Pour le faire évoluer sans casser les pages existantes :

- conserver les champs actuels ;
- ajouter les nouveaux champs comme champs optionnels ;
- éviter les ruptures de type et les renommages brutaux ;
- mettre à jour `src/types/archive.ts` seulement quand la structure V1 est
  validée ;
- garder les fonctions de `src/lib/archiveManifest.ts` compatibles avec les
  données V0 ;
- créer éventuellement un fichier d'exemple V1 avant de migrer le manifeste
  principal.

Stratégie recommandée :

1. Documenter le modèle V1 attendu.
2. Créer un exemple réduit, par exemple `src/data/archives-manifest.v1.example.json`.
3. Valider manuellement 2 ou 3 collections enrichies.
4. Mettre à jour les types avec des champs optionnels.
5. Adapter les pages seulement après validation du modèle.

## 7. Ingestion Drive contrôlée

L'ingestion Drive préparatoire doit articuler :

- `scripts/drive-sources.example.json` : liste contrôlée de dossiers Drive
  sources ;
- `scripts/drive-inventory.ts` : script d'inventaire brut ;
- `data/generated/drive-inventory.json` : sortie générée non validée ;
- `src/data/archives-manifest.json` : manifeste principal validé.

Principes à respecter :

- l'inventaire Drive brut n'est pas encore une notice validée ;
- les données Drive doivent être relues avant d'entrer dans le manifeste
  principal ;
- les images ne doivent pas être traitées comme des documents autonomes sans
  vérification ;
- un dossier Drive peut correspondre à un fonds, un dossier, un document, une
  série d'images ou un mélange à clarifier ;
- aucune modification automatique du manifeste principal ne doit être faite sans
  étape de contrôle.

## 8. Premier échantillon OCR futur

Méthode prudente pour un premier test OCR :

- choisir une seule collection ;
- choisir 10 à 20 images ou pages maximum ;
- produire un OCR brut ;
- conserver l'OCR brut ;
- créer un OCR nettoyé séparé ;
- mesurer les erreurs visibles ;
- relever les noms propres mal reconnus ;
- signaler les dates ambiguës ;
- ne pas indexer avant vérification minimale ;
- noter toutes les incertitudes.

Ce test doit servir à évaluer la qualité de la chaîne OCR, pas à produire une
recherche générale.

## 9. Risques

- confusion image / page / document ;
- OCR médiocre ;
- noms propres mal reconnus ;
- dates ambiguës ;
- documents non datés ;
- mélange entre source brute et notice validée ;
- inflation des champs ;
- automatisation trop rapide ;
- réponses IA prématurées.

Ces risques doivent être visibles dans l'interface et dans la documentation
lorsqu'ils affectent une notice ou un résultat.

## 10. Ordre de développement recommandé

1. Valider le modèle V1 sur papier.
2. Ajouter les champs optionnels aux types.
3. Enrichir manuellement 2 ou 3 collections.
4. Enrichir manuellement 5 à 10 documents.
5. Adapter les fiches collection/document à ces nouveaux champs.
6. Tester l'inventaire Drive brut.
7. Sélectionner un petit échantillon OCR.
8. Lancer OCR local sur cet échantillon.
9. Vérifier l'OCR.
10. Préparer seulement ensuite la recherche.

Chaque étape doit rester petite, vérifiable et réversible.

## 11. Critères de validation de la V1

La V1 sera considérée comme correcte si :

- les collections sont mieux décrites ;
- les documents sont mieux distingués des pages/images ;
- les statuts de traitement sont plus clairs ;
- aucune donnée n'est inventée ;
- l'interface reste lisible ;
- le projet est prêt pour un premier test OCR limité.

La V1 ne doit pas chercher à répondre aux questions historiques à la place des
sources. Elle doit préparer un instrument de recherche plus solide.
