# Repères historiques — V0

## Objectif

Cette couche fournit des repères chronologiques généraux pour aider à situer les
documents pendant la consultation. Elle reste volontairement légère et séparée
des données archivistiques principales.

## Principe méthodologique

“Le module de repères historiques ne produit pas une interprétation des archives. Il fournit seulement des repères chronologiques ou contextuels minimaux, proposés à partir de dates ou d’indices présents dans les documents. Ces repères doivent toujours être lus comme une aide à la consultation, non comme une conclusion historique.”

## Statut des données

- Les repères historiques ne sont pas des données extraites des archives.
- Ils ne sont pas stockés dans le manifeste principal.
- Ils ne modifient pas les documents.
- Ils relèvent d’un contexte éditorial général.

## Fichiers concernés

- `src/data/historical-context.json`
- `src/lib/historicalContext.ts`
- `src/components/historical-context-box.tsx`
- `src/app/documents/[id]/page.tsx`

## Sources générales

- FranceArchives, ressources relatives aux archives produites par les administrations d’Algérie entre 1830 et 1962.
- Archives nationales d’outre-mer, ressources sur les fonds algériens et l’état civil.
- Abderrahmane Bouchène, Jean-Pierre Peyroulou, Ouanassa Siari Tengour, Sylvie Thénault dir., Histoire de l’Algérie à la période coloniale, 1830-1962, La Découverte.
- Benjamin Stora, travaux de synthèse sur l’histoire de l’Algérie coloniale et de la guerre d’Algérie.
- Raphaëlle Branche, travaux sur la guerre d’Algérie.
- Sylvie Thénault, travaux sur l’histoire politique, juridique et répressive de l’Algérie coloniale.

Cette liste indique des sources générales à consolider. Elle ne constitue pas
encore une bibliographie complète.

## Limites de la V0

- La V0 ne repose que sur des grandes périodes.
- Elle ne constitue pas une frise historique.
- Elle n’interprète pas les documents.
- Elle ne gère pas encore les lieux.
- Elle ne gère pas encore les termes administratifs.
- Elle ne gère pas encore les conflits entre plusieurs dates.
- Elle ne remplace pas la lecture du document original.

## Évolutions futures possibles

1. Ajouter un glossaire historique :
   - commune mixte ;
   - indigénat ;
   - état civil ;
   - naturalisation ;
   - département d’Alger ;
   - département d’Oran ;
   - département de Constantine ;
   - FLN ;
   - OAS ;
   - harki ;
   - rapatrié.

2. Ajouter une frise consultable séparément.

3. Ajouter des repères par lieux.

4. Ajouter des repères par institutions productrices.

5. Ajouter un mode “dossier de contexte” pour un ensemble d’archives.

6. Ajouter un système de validation humaine des repères.

7. Ajouter des références bibliographiques plus précises.
