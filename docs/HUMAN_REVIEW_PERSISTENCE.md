# Persistance des notes de relecture humaine

## Objectif

Les notes de relecture humaine doivent pouvoir exister comme une couche durable
et distincte des lectures assistees. Un fichier JSON versionne suffit pour un
mode exemple ou une promotion controlee, mais il ne convient pas a une saisie
progressive par plusieurs relecteurs.

Une persistance dediee devient necessaire des que l'on veut:

- ajouter des propositions sans modifier le depot Git a chaque fois ;
- conserver plusieurs propositions pour une meme page ;
- tracer le statut, le relecteur et la date de modification ;
- separer clairement proposition, validation et transcription finale ;
- eviter d'ecraser les lectures assistees existantes.

## Role de Supabase

Supabase est envisage comme stockage leger pour les propositions de relecture.
Il ne remplace pas les manifestes controles du projet et ne devient pas une
source archivistique. Son role V1 est limite a stocker des notes humaines
associees a un couple `lotId` + `reviewId`.

La table cible est:

```text
human_review_notes
```

Elle conserve:

- le lot et la page de revue ;
- le statut de relecture ;
- une proposition de transcription corrigee ;
- des notes libres et des notes ciblees ;
- l'identite libre du relecteur si elle est fournie ;
- les dates de creation et de mise a jour ;
- un booleen `validated`, false par defaut.

## Separation des couches

Les corrections humaines restent une couche separee:

- elles ne modifient pas l'image R2 ;
- elles ne modifient pas le fichier Drive ;
- elles ne modifient pas l'OCR brut ou nettoye ;
- elles ne remplacent pas la lecture assistee IA ;
- elles ne deviennent pas une transcription validee sans statut explicite.

La lecture assistee IA reste une hypothese `assisted_unverified`. Une note
humaine peut proposer une correction, mais cette correction doit rester
qualifiee par son statut.

## Statut non valide par defaut

Toute nouvelle note doit etre creee avec:

```text
validated = false
```

Le statut recommande pour une premiere proposition est:

```text
correction_proposed
```

Le passage a `validated` doit etre une decision explicite, distincte de la
simple saisie d'une note. Une proposition humaine peut etre utile sans etre
definitive.

## Risques d'edition publique

Une table ouverte en insertion publique expose plusieurs risques:

- spam ou propositions malveillantes ;
- erreurs non relues ;
- confusion entre proposition et validation ;
- divulgation involontaire d'informations personnelles dans `reviewed_by` ;
- multiplication de propositions contradictoires ;
- tentative de modification ou suppression de notes existantes.

Pour cette raison, la V1 doit rester prudente: lecture publique, ajout de
propositions, pas de suppression publique. Les suppressions, corrections
administratives et validations doivent rester reservees a un espace controle.

## Strategie V1

La V1 de persistance doit viser:

1. lecture publique des notes existantes ;
2. ajout de propositions humaines ;
3. absence de suppression publique ;
4. absence d'edition publique directe des lignes existantes ;
5. statut `validated: false` par defaut ;
6. usage exclusif de la cle anon cote application publique ;
7. aucune cle service role dans le client ;
8. relecture humaine avant toute promotion vers une transcription validee.

Cette etape ne cree pas encore de formulaire actif. Elle prepare seulement:

- le schema SQL ;
- les variables d'environnement ;
- le helper applicatif ;
- la convention de donnees.

## Variables d'environnement

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Ces valeurs sont publiques au sens Supabase. Elles doivent etre combinees a des
politiques RLS prudentes. Ne jamais exposer de `service_role` dans l'application
Next.js publique.

## Limites actuelles

- Aucun formulaire actif n'est cree dans cette etape.
- Aucune note n'est ecrite automatiquement.
- Aucune base n'est provisionnee par le code.
- Aucune lecture assistee n'est modifiee.
- Aucune transcription n'est validee automatiquement.
