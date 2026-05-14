# Project State for LLMs — Archives Algérie

## 1. Dépôt et branche

- Repo : franzbib/archives-algerie
- Branche officielle de travail : main
- main est désormais la branche de référence pour Codex, Antigravity et Vercel
- master est conservée comme branche historique ou miroir, mais ne doit plus être la branche de travail principale
- Vercel doit déployer depuis main
- toute nouvelle modification doit être poussée sur origin/main

## 2. Nature du projet

Application Next.js d’exploration d’archives historiques scannées concernant l’Algérie, avec une attention particulière aux dossiers SHD, à Boghari, à la frontière marocaine, aux documents FLN récupérés, aux microfilms et aux ensembles généalogiques.

L’application doit respecter une logique archivistique :
- fonds ;
- cote ;
- dossier ;
- document ;
- page ;
- image scannée ;
- OCR futur ;
- analyse future.

Elle ne doit pas être conçue comme une simple galerie d’images.

## 3. État actuel

État : V0 archivistique.

La V0 contient :
- une application Next.js + TypeScript + Tailwind ;
- un manifeste local JSON ;
- une page d’accueil ;
- une page de collections ;
- des fiches collections ;
- des fiches documents préparatoires ;
- une page de questionnement préparatoire ;
- des scripts préparatoires pour manifeste, OCR local, normalisation OCR et chunks.

Ce qui n’est pas encore actif :
- pas d’OCR réel dans l’application ;
- pas d’appel OpenAI ;
- pas d’embeddings ;
- pas de base PostgreSQL ;
- pas de connexion automatique à Google Drive ;
- pas d’authentification ;
- pas d’ingestion massive.

## 4. Fichiers importants

- `README.md`
- `docs/ARCHITECTURE.md`
- `docs/ROADMAP.md`
- `src/data/archives-manifest.json`
- `src/types/archive.ts`
- `src/lib/archiveManifest.ts`
- `src/app/page.tsx`
- `src/app/collections/page.tsx`
- `src/app/collections/[id]/page.tsx`
- `src/app/documents/[id]/page.tsx`
- `src/app/questionnement/page.tsx`
- `scripts/build-manifest.ts`
- `scripts/ocr-local.ts`
- `scripts/normalize-ocr.ts`
- `scripts/prepare-chunks.ts`

## 5. Règles de développement

Tout futur travail doit respecter ces règles :

1. Travailler par petites étapes vérifiables.
2. Toujours indiquer les fichiers modifiés.
3. Toujours indiquer les commandes de vérification.
4. Ne jamais inventer de données archivistiques.
5. Ne jamais créer de faux OCR.
6. Ne jamais produire de réponse IA sans source.
7. Ne pas transformer l’application en galerie décorative.
8. Ne pas connecter Google Drive automatiquement sans étape de contrôle.
9. Ne pas ajouter OpenAI ou embeddings avant validation de l’OCR et des chunks.
10. Conserver la logique collection → document → page.

## 6. Règles pour Codex

Quand Codex intervient :
- il doit auditer avant de modifier si la demande est large ;
- il doit éviter les refontes globales ;
- il doit faire des commits courts et nommés clairement ;
- il doit préserver l’architecture existante ;
- il doit vérifier npm run lint et npm run build si le code applicatif change.

## 7. Règles pour Antigravity

Quand Antigravity intervient :
- il doit se limiter à l’interface et à l’expérience visuelle ;
- il ne doit pas modifier la logique métier ;
- il ne doit pas modifier le manifeste sans demande explicite ;
- il doit conserver une esthétique sobre : archives, bibliothèque, papier, fiches, catalogues ;
- il doit éviter l’esthétique spectaculaire, militaire ou ludique.

## 8. Roadmap courte

Prochaine progression recommandée :

1. Stabiliser la V0.
2. Activer les filtres de collections.
3. Améliorer les fiches collection.
4. Améliorer les fiches document.
5. Préparer l’inventaire enrichi V1.
6. Préparer l’ingestion Drive contrôlée.
7. Préparer l’OCR local sur un échantillon.
8. Préparer les chunks.
9. Préparer la recherche plein texte.
10. Préparer seulement ensuite la recherche en langage naturel sourcée.

## 9. Risques principaux

- ne pas réintroduire de divergence entre main et master ;
- ingestion trop rapide de Google Drive ;
- OCR de mauvaise qualité non signalé ;
- réponses IA non sourcées ;
- confusion entre document, page et image ;
- surcharge visuelle ;
- perte de la logique archivistique ;
- développement trop ambitieux d’un coup.

## 10. Dernière consigne

Le projet doit avancer comme un instrument de recherche historique progressif :
d’abord inventorier, puis OCRiser, puis vérifier, puis indexer, puis interroger.

Ne pas faire l’inverse.
