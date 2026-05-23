# Identité Visuelle v0 - Laboratoire Typographique

Ce document établit les fondations de l'identité visuelle de FLE Commons Lab, basée sur la direction **"Laboratoire Typographique"**. Il sert de référence pour le design et l'intégration par l'agent Codex, et doit être mis à jour au fil des itérations.

## 1. Direction retenue
**Le Laboratoire Typographique**. Une approche "brutalisme élégant" qui sublime la structure de l'information, le texte brut et le balisage, en s'éloignant totalement des codes lisses du SaaS marketing.

## 2. Pourquoi cette direction convient au projet
Elle fusionne la rigueur du monde académique (l'index, la fiche cartonnée, la bibliothèque) et l'exigence du monde open source / IA (le Markdown, le code, les métadonnées). Elle est sérieuse sans être austère, originale sans être complexe à coder (essentiellement du CSS).

## 3. Positionnement visuel
Sérieux, radicalement clair, textuel, "en cours de travail" mais impeccable, orienté recherche et expérimentation.

## 4. Métaphore centrale
La fiche cartonnée de laboratoire ou d'archives, remplie à la machine à écrire, rangée dans un index rigoureux. L'interface est l'établi du professeur/chercheur.

## 5. Principes de design
- **Le contour (Outline) roi** : Remplacement des ombres (shadows) par des bordures fines (1px) et nettes (lignes de coupe).
- **Le monospace magnifié** : Utilisation intensive de la typographie monospace pour tout ce qui relève de la taxonomie, des métadonnées et de l'IA.
- **Surlignage (Highlight)** : Plutôt que de mettre du texte en couleur, on utilise des fonds jaunes ou de couleurs pour mimer le coup de marqueur sur un texte.
- **Zéro ornement générique** : Pas d'illustrations plates vectorielles type "startup". L'esthétique naît de la grille et de la typographie.

## 6. Palette principale
- **Fond central (Papier/Bureau)** : `#FFFFFF` (Blanc absolu) pour une clarté maximale.
- **Fond secondaire (Marges/Bordures d'écran)** : `#F5F5F0` (Gris ivoire léger) pour délimiter l'espace de travail.
- **Texte principal (Graphite)** : `#222222` (Presque noir, profond et encré).
- **Couleur de Marque / Accent fort (Violet Sourd)** : `#5B4275` (Améthyste, évoque la réflexion, l'IA, le sérieux).
- **Accent de mise en valeur (Jaune Annotation)** : `#FDE047` (Jaune stabilo pour surligner les mots clés).

## 7. Palette secondaire (Structure)
- **Lignes de coupe / Bordures** : `#000000` (Noir pur, mais appliqué en `1px` avec opacité 10-15%).
- **Texte secondaire (Notes)** : `#666666` (Gris neutre).

## 8. Couleurs de statuts
L'identité se démarque par des statuts qui ressemblent à des étiquettes ou des coups de tampons :
- **Public** : Pas de couleur, état par défaut.
- **Réservé (Future feature)** : Gris plomb (`#4B5563`). Mot-clé : `[ RESTRICTED ]`.
- **Brouillon** : Jaune moutarde (`#CA8A04`). Mot-clé : `[ DRAFT ]`.
- **Testé** : Bleu de travail (`#2563EB`). Mot-clé : `[ TESTED ]`.
- **Validé** : Vert "Bon à tirer" (`#15803D`). Mot-clé : `[ VERIFIED ]`.
- **Archivé** : Rouge brique (`#B91C1C`). Mot-clé : `[ ARCHIVED ]`.
- **IA** : Violet d'accent (`#5B4275`).
- **Numérique (Tech)** : Cyan foncé (`#0E7490`).

## 9. Typographie recommandée
- **Police principale (Titres, Interface, Corps)** : **Inter** (géométrique, très serrée, lisibilité chirurgicale).
- **Police de taxonomie (Badges, Code, Niveaux, Métadonnées)** : **JetBrains Mono** ou **Fira Code** (esthétique machine à écrire / terminal).

## 10. Style des titres
- Les titres `H1` doivent être imposants, gras (`font-black` ou `font-extrabold`), avec un interlettrage très resserré (`tracking-tighter`).
- Ils peuvent être précédés d'un petit préfixe monospace, ex: `SEC. 01 — TITRE`.

## 11. Style des cartes ressources
- Les cartes sont des **fiches d'index**.
- **Bordure** : `border border-black/20`.
- **Pas d'ombre**, ou seulement une ombre noire dure sans flou (`box-shadow: 2px 2px 0 #000`) au survol.
- Coins à peine arrondis (`rounded-sm` soit 2px) ou parfaitement carrés (`rounded-none`).
- En haut à droite de la carte, un numéro de série unique ou un tag généré en monospace (ex: `#RES-409`).

## 12. Style des badges
- Fini les "pilules" arrondies et douces.
- Les badges sont des **étiquettes de classement**.
- Forme rectangulaire stricte, petite bordure noire, fond transparent ou couleur pastel.
- Texte en majuscule, monospace : `[ GRAM: B1 ]`.

## 13. Style des filtres
- Sous forme de cases à cocher rigoureuses ou d'onglets de classeurs.
- Lorsqu'un filtre est actif, on applique le "surlignage jaune" (`bg-[#FDE047]`).

## 14. Style de la page Technologies et IA
- L'IA n'est pas représentée par des étincelles féériques (`✨`). Elle est représentée par le **Violet Sourd** et par l'esthétique du terminal de données.
- Les blocs générés par l'IA ont une bordure gauche épaisse violette (`border-l-4 border-[#5B4275]`) et un entête technique : `// IA_ASSISTANT_OUTPUT`.

## 15. Style futur de l'espace contribution
- Identique au reste de l'application, avec une omniprésence de la police monospace pour visualiser le diff (les différences) et l'édition de code/texte brut. Mode "éditeur de texte avancé" affirmé.

## 16. Style futur des accès membres / institutionnels
- Plutôt que des "cadenas or" ou des badges "Premium", utiliser la sémantique de l'accès aux archives : `Dossier Réservé`, `Collection Institutionnelle`.
- Le badge est sombre et très sobre (Gris plomb).

## 17. Motifs graphiques possibles
- Grille millimétrée très pâle en fond de certaines zones (points ou quadrillage léger).
- Lignes de coupe (petites croix dans les coins des conteneurs, comme en imprimerie).

## 18. Principes d'icônes
- Utiliser un set très fin, "outline" strict, trait de 1px. (Ex: **Lucide Icons** configuré en stroke-width 1 ou 1.25). Pas de formes pleines.

## 19. Ce qu'il faut éviter
- Les ombres diffuses (soft shadows).
- Les gros rayons d'arrondis (`rounded-xl` ou `rounded-full`).
- Les couleurs primaires d'alerte utilisées en fond plein.
- Les illustrations humaines vectorielles.
- Le style enfantin souvent associé (à tort) au FLE.

## 20. Tokens CSS suggérés (Tailwind)

```css
:root {
  /* Colors */
  --color-canvas: #F5F5F0;     /* Extérieur de la zone de travail */
  --color-paper: #FFFFFF;      /* Espace central, fiches */
  --color-ink: #222222;        /* Texte principal */
  --color-ink-light: #666666;  /* Métadonnées classiques */
  
  --color-accent: #5B4275;     /* Améthyste / IA / Marque */
  --color-highlight: #FDE047;  /* Surlignage / Actif */
  
  --color-border: rgba(0, 0, 0, 0.15); /* Lignes de coupe */
  --color-border-hover: rgba(0, 0, 0, 0.8);

  /* Geometry */
  --radius-strict: 2px;
  --shadow-hard: 3px 3px 0 rgba(0, 0, 0, 0.9); /* Ombre brutaliste */
}
```

## 21. Recommandations concrètes pour Codex

Pour intégrer progressivement cette identité sans casser l'architecture :
1. **Appliquer les polices** : Injecter `Inter` (sans) et `JetBrains Mono` (mono) via Google Fonts ou fonts locales dans l'application. Configurer la police globale.
2. **Implémenter les Tokens** : Intégrer les couleurs et variables CSS ci-dessus dans la configuration Tailwind ou CSS globale.
3. **Refondre le composant Card (`ResourceCard`)** : 
   - Supprimer les ombres diffuses.
   - Ajouter `border border-black/20`.
   - Ajuster `rounded` à `rounded-sm` ou `rounded-none`.
   - Ajouter l'effet de hover brutaliste : `hover:shadow-[3px_3px_0_rgba(0,0,0,0.9)] -translate-y-[1px] transition-all`.
4. **Refondre le composant Badge** : 
   - Passer la typographie en `font-mono text-[10px] uppercase tracking-widest`.
   - Mettre une bordure fine et un fond transparent.
5. **Intégrer les assets** : Ajouter le logo et le favicon dans `/public/` et mettre à jour le header.
6. **Ne PAS faire** : Ne pas modifier les types de données métier, ne pas intégrer Supabase, ne pas créer de logique backend pour les accès "réservés" (seulement préparer les couleurs des badges s'ils sont affichés statiquement).
