# Archives Algerie

Archives Algerie est une application de consultation documentaire d'archives
scannees relatives a la guerre d'Algerie. Elle sert a publier, parcourir et
questionner prudemment des lots d'images d'archives, tout en conservant la
trace des sources, des traitements techniques et des limites de validation.

## Etat actuel

- Environ 690 pages sont consultables dans l'application.
- 8 lots sont integres dans la consultation par lots.
- La consultation principale passe par `/lots`.
- La recherche V1 est disponible dans `/questionnement`.
- Le suivi technique du corpus est disponible dans `/inventaire`.
- Les anciennes routes V0, notamment `/collections` et `/documents`, restent
  conservees comme reperes de tracabilite ancienne.

## Principes methodologiques

Le projet distingue strictement les couches suivantes:

- image source;
- OCR brut;
- OCR nettoye;
- lecture assistee vision;
- correction humaine;
- transcription validee.

Une lecture assistee n'est pas une transcription validee. Elle doit toujours
etre lue comme une hypothese de travail non validee humainement.

L'OCR peut etre fautif, incomplet ou mal segmente. Les lectures assistees vision
peuvent etre partielles, absentes ou incertaines. L'application ne propose pas
encore de transcription humaine complete du corpus.

Toute citation, indexation historique ou interpretation doit repartir de l'image
source et des metadonnees de tracabilite.

## Architecture

- Next.js App Router, React et TypeScript.
- Export statique de l'application.
- Images publiques publiees sur Cloudflare R2.
- Donnees controlees dans `data/generated/`.
- Donnees locales de travail dans `.local/`, jamais commitees.
- Scripts d'ingestion et de preparation dans `scripts/`.
- Documentation de methode, pipeline et architecture dans `docs/`.

Les fichiers de `data/generated/` sont des manifestes controles. Ils ne doivent
pas etre modifies sans intention explicite. Les fichiers de `.local/` servent au
travail local: telechargements, conversions, OCR, lectures assistees et rapports
temporaires.

## Routes principales

- `/lots`: consultation principale des lots d'archives.
- `/lots/[lotId]`: detail d'un lot, pages disponibles et etat de traitement.
- `/lots/[lotId]/[reviewId]`: consultation d'une image/page technique, avec
  lecture assistee eventuelle et avertissements de validation.
- `/questionnement`: recherche V1 et exploration prudente du corpus.
- `/inventaire`: tableau de bord technique et etat du corpus.
- `/collections`: repere V0 conserve pour la tracabilite ancienne.

## Pipeline de lots

Le pipeline local sert a preparer un lot avant son integration dans `/lots`.
Le flux general est:

1. Ajouter ou verifier le lot dans le registre controle.
2. Lancer l'agent local de lot.
3. Telecharger les fichiers sources autorises.
4. Convertir les images ou pages PDF en JPG de consultation.
5. Produire OCR brut puis OCR nettoye separement.
6. Produire des lectures assistees vision quand c'est possible.
7. Publier les images preparees vers R2.
8. Promouvoir les manifestes controles.
9. Verifier l'integration dans `/lots`.

Les sorties locales restent dans `.local/archive-batches/<lotId>/` et ne doivent
jamais etre commitees. Les lectures assistees produites par le pipeline restent
non validees humainement.

## Recherche V1

La recherche V1 de `/questionnement` fonctionne sans appel OpenAI et sans
embeddings. Elle interroge les lectures assistees disponibles et renvoie vers
les pages de revue.

Cette recherche est simple, non exhaustive et non validee historiquement. Elle
sert a reperer des fragments possibles, pas a etablir une transcription fiable
ou une conclusion historique.

La page `/questionnement` contient aussi une frise chronologique legere. Cette
frise ne produit pas d'interpretation automatique.

## Notes humaines

Le projet prepare un modele de notes humaines et de relecture, visible sur les
pages de revue de lots. La persistance n'est pas encore active.

Les zones de relecture actuelles ne sauvegardent pas d'annotation dans une base
de donnees et ne valident pas les lectures assistees. Elles preparent une future
fonctionnalite de correction humaine persistante.

## Developpement local

Installation:

```powershell
npm install
```

Serveur de developpement:

```powershell
npm.cmd run dev
```

Verification lint:

```powershell
npm.cmd run lint
```

Build statique:

```powershell
npm.cmd run build
```

## Verifications avant commit

Avant de committer, lancer:

```powershell
npm.cmd run lint
npm.cmd run build
git diff --check
git status
```

Verifier aussi:

- aucun fichier `.local/` n'est suivi par Git;
- aucun secret n'apparait dans le diff;
- aucun nouveau lot n'a ete ajoute sans decision explicite;
- aucune lecture assistee n'est presentee comme transcription validee;
- aucun embedding n'a ete cree.

## Limites actuelles

- Les lectures assistees sont partielles et non validees.
- Certains documents sont multilingues, notamment en francais et en arabe.
- La detection linguistique est partielle et ne vaut pas validation humaine.
- Le traitement des lots PDF reste a stabiliser.
- La recherche V1 reste simple et prudente.
- Les notes humaines ne sont pas encore persistantes.
- Le pipeline d'ingestion a ete rendu plus robuste, notamment pour la reprise et
  les rapports locaux, mais il reste perfectible.

## Documentation utile

- `docs/ARCHITECTURE.md`: architecture et routes.
- `docs/MULTI_BATCH_WORKFLOW.md`: workflow multi-lots.
- `docs/BATCH_AGENT_RECOVERY.md`: reprise de l'agent de lots.
- `docs/ASSISTED_READING_SPEC.md`: statut des lectures assistees.
