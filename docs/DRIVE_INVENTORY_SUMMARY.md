# Synthese d'inventaire Drive

## Objet du document

Ce document est une synthese de pilotage issue d'un inventaire leger du dossier
Google Drive racine du projet Archives Algerie.

L'inventaire repose sur les metadonnees visibles des dossiers Drive. Il n'a
telecharge aucun fichier lourd, n'a lance aucun OCR, n'a appele aucun service
OpenAI et n'a cree aucun embedding.

Les chiffres ci-dessous sont des estimations de pilotage. Ils ne constituent
pas un comptage valide page par page et ne valident aucun document.

## Resume chiffre

- 54 entrees visibles a la racine Drive.
- 52 dossiers racine identifies comme lots potentiels.
- 2 fichiers non-lots a la racine: `Fab.docx`, `Remi.docx`.
- 8 lots deja publies dans `/lots`.
- 2 lots planifies retrouves dans le registre.
- 42 dossiers racine non encore integres au registre publie.
- 44 lots restent a traiter si l'on inclut les 2 lots planifies.

Estimation du corpus total:

| Hypothese | Pages/fichiers estimes |
|---|---:|
| Basse | 3 582 |
| Mediane | 4 113 |
| Haute | 5 293 |

Estimation du reste a traiter, lots planifies inclus:

| Hypothese | Pages/fichiers estimes |
|---|---:|
| Basse | 2 319 |
| Mediane | 2 850 |
| Haute | 4 030 |

## Etat actuel

Le projet publie actuellement 8 lots consultables dans `/lots`, pour environ
690 pages consultables. Ces pages associent des images publiees, des metadonnees
de tracabilite et, quand elles existent, des lectures assistees vision non
validees humainement.

Les anciennes routes V0 restent disponibles comme reperes de tracabilite, mais
la consultation principale passe par les routes generiques de lots.

## Typologie des lots restants

Classification de pilotage issue de l'inventaire leger:

- Vague 1: lots images simples et courts, 36 candidats.
- Vague 2: lots images volumineux, 2 candidats.
- Vague PDF: 3 candidats.
- Vague triage: 1 dossier imbrique.
- Backlog a qualifier: 1 dossier vide ou non lisible dans l'inventaire leger.
- En pause ou fragile: `SHD GR 1H1646 Lettres et directives FLN Wilaya4`, a
  cause du risque Drive 403/quota deja repere.

Cette typologie sert a ordonner le travail. Elle ne cree aucun nouveau lot dans
le registre et ne modifie aucun manifeste publie.

## Strategie recommandee

Proceder par vagues courtes et verifiables:

1. Integrer d'abord quelques lots images simples, sans commencer par les PDF ni
   par les dossiers imbriques.
2. Limiter chaque vague a 3 a 5 lots avant controle.
3. Apres chaque vague, verifier `/lots`, `/questionnement` et `/inventaire`.
4. Ne pas traiter les PDF avant stabilisation du workflow PDF.
5. Ne pas multiplier les lots arabes ou multilingues sans strategie OCR/langue
   explicite.
6. Continuer a separer publication des images, OCR, lecture assistee et
   validation humaine.

Cette progression evite d'accumuler des lots partiellement publies sans controle
de navigation, de recherche et de lisibilite.

## Risques techniques

- L'inventaire repose sur le rendu HTML public de Google Drive, qui peut changer
  et rester incomplet.
- Les PDF sont comptes comme fichiers visibles, pas comme pages internes.
- Les quotas Drive et R2 peuvent bloquer des lots volumineux.
- Les lots images volumineux peuvent ralentir la revue, la publication et la
  recherche V1.
- Les documents arabes ou multilingues necessitent une strategie OCR/langue
  distincte.
- La recherche V1 peut devenir limitee a grande echelle et devra etre auditee
  avant une forte croissance du corpus.
- La distinction entre image source, OCR brut, OCR nettoye, lecture assistee
  vision, correction humaine et transcription validee doit rester explicite.

Une lecture assistee vision n'est pas une transcription validee. Elle reste une
hypothese non validee humainement.

## Prochaines decisions

- Choisir la premiere vague de lots images simples a integrer.
- Creer une issue dediee au workflow PDF.
- Auditer la recherche V1 avant de depasser environ 2 000 pages consultables.
- Ameliorer progressivement `/lots` avec filtres, regroupements ou navigation
  plus dense si le volume augmente.
- Decider plus tard du statut des annotations humaines persistantes.
- Definir une strategie specifique pour les lots arabes ou multilingues.

## Source locale non versionnee

La synthese provient des rapports locaux:

```text
.local/drive-inventory/drive-root-inventory.json
.local/drive-inventory/drive-root-inventory.md
```

Ces fichiers restent locaux et ne doivent pas etre committes.
