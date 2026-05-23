# Identité Visuelle v0 - Synthèse Opérationnelle

Ce document synthétise les principes de l'identité visuelle temporaire de FLE Commons Lab, basée sur la direction "La Forge Pédagogique Claire". Il est conçu pour être directement utilisable par l'équipe projet et par Codex pour de futures intégrations.

## A. Résumé de la direction retenue
"La Forge Pédagogique Claire" est une direction minimaliste, lumineuse et axée sur la lisibilité. Elle offre une toile de fond neutre et professionnelle qui s'efface derrière le contenu (les ressources pédagogiques), tout en utilisant une couleur d'accent forte (Teal/Émeraude) pour faire le lien entre la salle de classe et l'univers du logiciel open source.

## B. Positionnement visuel
- **Ce que c'est** : Clair, structure, bienveillant, humain, contemporain, sobre.
- **Ce que ce n'est pas** : Infantile, austère, agressif ("startup tech"), surchargé, brouillon.

## C. Principes de design
1. **Le contenu d'abord** : L'interface doit guider la lecture des fiches et des métadonnées. L'espace blanc est un outil de design majeur.
2. **Hiérarchie claire** : Utilisation stricte des tailles de typographie pour distinguer Titre, Sous-titre, Métadonnée, Corps de texte.
3. **Contraste accessible** : Toutes les couleurs de texte doivent respecter les normes WCAG AA minimum.
4. **Sobriété technique** : Pas de lourdes animations, pas de flous complexes (glassmorphism), pas d'ombres intenses. Un design "plat" mais structuré par des lignes.

## D. Palette principale
- **Fond de l'application (Background)** : `#F8FAFC` (Slate 50) - Un gris-bleu extrêmement clair, plus doux qu'un blanc pur.
- **Fond des surfaces (Cartes, Modals)** : `#FFFFFF` (Blanc) - Pour détacher les blocs de contenu.
- **Texte principal (Text Base)** : `#334155` (Slate 700) - Un gris foncé lisible sans être aussi dur que du noir absolu.
- **Texte titre (Text Intense)** : `#0F172A` (Slate 900) - Presque noir, pour les titres H1/H2.
- **Couleur d'accent (Primary/Teal)** : `#0F766E` (Teal 700) - Couleur de la marque, des boutons principaux, des liens actifs.

## E. Palette secondaire
- **Bordures et séparateurs** : `#E2E8F0` (Slate 200).
- **Texte secondaire (Muted/Métadonnées)** : `#64748B` (Slate 500).
- **Accent secondaire (Orange doux)** : `#F97316` (Orange 500) - Pour attirer l'œil ponctuellement (ex: "Nouveau", ou boutons d'actions secondaires).

## F. Couleurs d'état
- **Succès / Validé** : `#16A34A` (Green 600) avec fond léger `#DCFCE7` (Green 100).
- **Attention / Brouillon** : `#EAB308` (Yellow 500) avec fond léger `#FEF08A` (Yellow 200).
- **Information / Tech / IA** : `#6366F1` (Indigo 500) avec fond léger `#E0E7FF` (Indigo 100).
- **Erreur / Archivé** : `#EF4444` (Red 500) avec fond léger `#FEE2E2` (Red 100).

## G. Typographie recommandée
Pour rester sobre et ne pas dépendre de polices propriétaires :
- **Police principale (Titres et Corps)** : **Inter** (Google Fonts). Si Inter n'est pas disponible, utiliser le system-stack sans-serif.
- **Police de code / Données techniques brutes** : **JetBrains Mono** ou **Fira Code**.
- **Graisses** : `400` pour le corps de texte, `500` pour les libellés de métadonnées, `600` ou `700` pour les titres.

## H. Principes d'icônes
- Utiliser une bibliothèque open source légère avec un trait régulier, sans remplissage (outline), comme **Lucide Icons** ou **Phosphor Icons**.
- **Style** : Trait de 1.5px ou 2px, coins légèrement arrondis. Pas de couleurs multiples dans une icône. L'icône prend la couleur du texte qui l'accompagne.

## I. Style de badges
Les badges (ex: A1, B2, Grammaire) sont cruciaux pour la taxonomie.
- **Apparence** : Très petit rayon de courbure (ex: `4px`), fond de couleur très clair (ex: Slate 100), texte de la couleur correspondante en foncé (ex: Slate 700), texte en petite taille (`text-xs`), sans bordure.
- Ne pas abuser des badges très colorés, réserver les couleurs aux badges de statut (Brouillon, Validé).

## J. Style des cartes ressources
- **Fond** : `#FFFFFF`.
- **Bordure** : Fine de 1px `#E2E8F0`.
- **Ombre** : Absente ou très subtile (`shadow-sm` : `0 1px 2px 0 rgba(0, 0, 0, 0.05)`).
- **Rayon de courbure** : `8px` (`rounded-lg`).
- **Structure interne** : Titre en haut, résumé en dessous, badges de métadonnées alignés en bas.

## K. Style des blocs documentation
- Utiliser des bordures gauches (border-left) épaisses (4px) pour mettre en évidence les "callouts" (Attention, Info).
- Le texte Markdown généré doit bénéficier d'un `line-height` généreux (1.6) pour faciliter la lecture des longues fiches.

## L. Style des pages "technologies et IA"
- Pour différencier les sections "classiques" des sections générées par l'IA ou très techniques, introduire discrètement la couleur d'état **Information (Indigo)**.
- Par exemple, un bloc de métadonnées générées par l'IA pourrait avoir une bordure supérieure subtile Indigo, ou une petite icône "étincelle" (`sparkles`).

## M. Ton visuel général
Calme, structuré, académique sans être ennuyeux. L'interface ressemble à un bel outil de productivité (type Notion ou Linear) appliqué à l'éducation.

## N. Ce qu'il faut éviter
- Les gros aplats de couleurs vives partout.
- Les polices arrondies enfantines (ex: Comic Sans, Fredoka).
- Les ombres massives (Material Design ancien).
- Les illustrations complexes et chargées de type "Corporate Memphis" (personnages abstraits avec de gros bras).

## O. Suggestions de classes ou variables CSS futures (Tokens)

```css
:root {
  /* Colors */
  --bg-app: #F8FAFC;
  --bg-surface: #FFFFFF;
  --text-base: #334155;
  --text-intense: #0F172A;
  --text-muted: #64748B;
  --border-subtle: #E2E8F0;
  
  --primary-main: #0F766E;
  --primary-hover: #115E59;
  
  --status-info: #6366F1;
  --status-success: #16A34A;
  --status-warning: #EAB308;

  /* Typography */
  --font-sans: 'Inter', system-ui, sans-serif;
  
  /* Geometry */
  --radius-badge: 4px;
  --radius-card: 8px;
  --shadow-card: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}
```

## P. Ce que Codex pourra faire ensuite

L'intégration de cette identité visuelle pourra se faire par touches progressives par l'agent Codex, sans nécessiter de refonte complète de l'application v0.
**Tâches suggérées pour Codex :**
1. **Appliquer les tokens de couleur** : Remplacer les couleurs hardcodées ou Tailwind par défaut par la palette définie ci-dessus (dans `tailwind.config.ts` ou le fichier CSS principal).
2. **Harmoniser les polices** : Assurer que `Inter` est chargée et utilisée comme police par défaut.
3. **Ajuster les cartes** : Modifier le composant `ResourceCard` (s'il existe) pour appliquer les principes (bordure fine, fond blanc, pas d'ombre forte, `rounded-lg`).
4. **Intégrer les assets** : Ajouter le logo et le favicon dans le dossier public et mettre à jour les balises `<head>`.
5. **Styliser les badges** : Créer ou mettre à jour un composant `Badge` unifié suivant les recommandations (fond clair, pas de bordure).
