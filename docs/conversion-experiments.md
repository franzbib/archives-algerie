# Rapport d'Exploration : Conversion de Ressources Pédagogiques

## 1. Résumé
Ce rapport explore la faisabilité et la méthodologie de transformation de supports pédagogiques FLE (Français Langue Étrangère) existants (fichiers Word, PDF, HTML, ou textes en vrac) vers un format normalisé compatible avec FLE Commons Lab. L'objectif est d'identifier les approches viables sans recourir à des systèmes lourds ou coûteux, en séparant clairement ce qui peut être automatisé de ce qui requiert l'expertise d'un enseignant, et en gérant rigoureusement les risques liés aux droits d'auteur.

## 2. Modèle de conversion recommandé
Pour assurer une importation robuste, pérenne et facilement lisible, le modèle de conversion recommandé repose sur l'approche **Markdown + Frontmatter YAML** (le frontmatter remplaçant le fichier JSON séparé pour la gestion des fichiers, bien qu'un export JSON reste possible pour l'API). Ce format est le plus robuste pour une première importation car il combine la structuration rigide des métadonnées pour les machines avec la flexibilité du texte pour les humains.

Le processus global recommandé est :
1. **Extraction (brute)** : Conversion du format d'origine en texte brut (via copier-coller ou outils légers).
2. **Normalisation (semi-automatisée)** : Application de la structure cible (titres, blocs) par analyse de mots clés ou assistance légère.
3. **Extraction de métadonnées (automatisée + validation)** : Inférence des champs de métadonnées depuis le texte brut.
4. **Validation (humaine obligataire)** : Relecture, ajustement et validation finale par l'enseignant.

## 3. Trois exemples fictifs convertis

### Exemple 1 : Fiche de grammaire B1 (Les pronoms y et en)

**Version Brute :**
```text
Titre: Les pronoms y et en
Niveau: Intermédiaire
Aujourd'hui on voit y et en.
Exercice 1. Remplacez par y ou en.
1. Je vais à Paris -> J'__ vais.
2. Je mange du pain -> J'__ mange.
Correction : 1. y, 2. en.
À retenir: y = lieu, à + chose. en = quantité, de + chose.
Prof : attention à la place avec la négation (je n'y vais pas).
```

**Version normalisée FLE Commons Lab :**
```markdown
# Les pronoms y et en

## Métadonnées pédagogiques
Niveau B1, Grammaire.

## Objectifs
Comprendre et utiliser les pronoms relatifs "y" et "en".

## Pré-requis
Conjugaison au présent, prépositions "à" et "de".

## Déroulé
1. Découverte de la règle.
2. Exercice d'application.

## Support étudiant
**Règle :**
- **y** remplace un lieu ou "à + chose".
- **en** remplace une quantité ou "de + chose".

**Exercice 1. Remplacez par y ou en.**
1. Je vais à Paris. -> J'__ vais.
2. Je mange du pain. -> J'__ mange.

## Guide professeur
Attention à la place des pronoms avec la négation (ex: Je n'y vais pas).

## Corrigé
1. J'**y** vais.
2. J'**en** mange.
```
**Pertes ou ambiguïtés :** La notion de "Intermédiaire" a été convertie en B1.
**Relecture enseignante :** Vérifier que les objectifs inférés correspondent bien au besoin, s'assurer que la consigne professeur est bien séparée.

### Exemple 2 : Activité orale A2 (Le logement)

**Version Brute :**
```text
Parler de son logement. Pour A2.
Temps : 30 minutes.
Travail en binôme. Demandez à votre voisin de décrire son appartement.
Vocabulaire attendu : pièces, meubles.
Images de 3 appartements de magazines à montrer aux élèves. (Source : magazine déco inconnu).
```

**Version normalisée FLE Commons Lab :**
```markdown
# Parler de son logement

## Métadonnées pédagogiques
Production orale, Travail en binôme, A2, 30 min.

## Objectifs
Décrire son logement et interroger quelqu'un sur son lieu de vie.

## Déroulé
Travail en binôme avec support visuel.

## Support étudiant
Demandez à votre voisin de décrire son appartement ou sa maison. Utilisez le vocabulaire des pièces et des meubles.

## Guide professeur
Afficher au tableau les 3 images (à télécharger séparément).
```
**Pertes ou ambiguïtés :** Les images ne peuvent pas être intégrées directement si elles n'ont pas de lien web clair ou sont perdues au copier-coller.
**Relecture enseignante :** Il faut trouver des images libres de droits pour remplacer celles d'origine et vérifier les droits.

### Exemple 3 : Séquence B2 (IA et esprit critique)

**Version Brute :**
```text
Thème : L'intelligence artificielle nous ment-elle ?
Niveau : Avancé (B2)
Temps : 2 heures.
Lisez cet article du Monde de 2023 sur ChatGPT (lien mort).
Débattez en groupes.
Pour le prof : préparer des arguments contre l'IA si les élèves sont trop pour.
```

**Version normalisée FLE Commons Lab :**
```markdown
# L'intelligence artificielle nous ment-elle ?

## Métadonnées pédagogiques
Compréhension écrite, Production orale, B2, 120 minutes.

## Objectifs
Développer l'esprit critique, argumenter un point de vue nuancé.

## Support étudiant
Lisez l'article fourni par le professeur.
En petits groupes, préparez vos arguments pour le débat.

## Guide professeur
Préparer et distribuer un article récent sur l'IA. Si les élèves sont unanimement favorables, introduisez des contre-arguments (biais cognitifs, fake news).

## Licence et sources
[À VÉRIFIER] Remplacer l'article du Monde par un article libre de droits.
```
**Pertes ou ambiguïtés :** L'article source est inutilisable (lien mort, droits d'auteur).
**Relecture enseignante :** Sélectionner impérativement un nouveau texte support respectant les licences.

## 4. Métadonnées JSON associées

Exemple de génération pour la fiche Grammaire B1 :
```json
{
  "title": "Les pronoms y et en",
  "summary": "Règles et exercices sur les pronoms y et en.",
  "level": ["B1"],
  "durationMinutes": 15,
  "durationCategory": "court",
  "mainSkill": "Grammaire",
  "secondarySkills": [],
  "theme": "Général",
  "lexicalThemes": [],
  "grammarPoints": ["Pronoms relatifs"],
  "resourceType": "fiche",
  "resourceTemplate": "document",
  "activityFormat": "individuel",
  "classroomMode": "présentiel",
  "status": "brouillon",
  "reuseReadiness": "à réviser",
  "license": "CC-BY-SA",
  "authors": ["Enseignant Anonyme"],
  "tags": ["pronoms"],
  "materialNeeded": [],
  "sourceType": "document original",
  "teacherPreparationLevel": "faible",
  "techMetadata": {},
  "aiMetadata": {}
}
```

## 5. Structure Markdown recommandée

La structure Markdown demandée s'avère parfaitement stable et logique :
```markdown
# Titre
## Métadonnées pédagogiques
## Objectifs
## Pré-requis
## Déroulé
## Support étudiant
## Guide professeur
## Corrigé
## Variantes
## Retours d’usage possibles
## Notes numériques / IA
## Licence et sources
## Historique des versions
```
Cette architecture hiérarchique stricte (H1 pour le titre, H2 pour les sections) facilite grandement le parsing par un script sans avoir recours à des expressions régulières trop complexes.

## 6. Ce qui peut être automatisé

- **Extraction des objectifs** : Par détection d'infinitifs en début de ligne (ex: "Comprendre", "Savoir exprimer").
- **Détection des corrigés** : Recherche de mots clés ("Corrigé", "Réponses") et repérage de schémas numérotés correspondant aux exercices.
- **Inférence de champs simples** : `durationMinutes` (extraction de nombres suivis de "min/heures"), `level` (A1-C2).
- **Conversion des tableaux** : Les tableaux copiés de Word/HTML peuvent être transcrits en format Markdown `|---|---|` via des outils classiques (comme Pandoc).

## 7. Ce qui doit rester relu par un enseignant

- **La séparation Support Étudiant / Guide Professeur** : L'algorithme se trompe fréquemment sur le destinataire de la consigne.
- **Le traitement des images** : Une IA ou un script ne peut pas garantir les droits d'une image. L'humain doit ajouter les descriptions (alt) et vérifier la licence.
- **Validation des objectifs** : Les objectifs inférés automatiquement peuvent manquer de précision pédagogique.
- **Validation du niveau et du statut** : Une ressource nouvellement importée doit toujours rester à l'état `brouillon` tant qu'elle n'est pas validée.

## 8. Risques droits d'auteur / licences

- **Textes (presse, etc.)** : Risque critique. L'exception pédagogique ne s'applique pas à la republication sur une plateforme ouverte. Tout article non libre doit être retiré ou remplacé.
- **Images** : Si l'origine est inconnue, elle est protégée.
- **Recommandation** : Forcer un drapeau `[À VÉRIFIER]` dans le Markdown et définir `reuseReadiness: "droits à vérifier"` en JSON dès qu'une source externe est détectée.

## 9. Recommandations pour une future tâche Codex

- Ne pas concevoir de pipeline d'ingestion lourd (pas de scraping, pas d'OCR complexe).
- Développer un module léger qui prend du texte Markdown brut et le formate selon la structure H2 cible.
- Privilégier le **Markdown avec Frontmatter YAML**. C'est le format le plus robuste : il encapsule le JSON (en YAML) et le Markdown dans le même fichier, évitant les désynchronisations, et reste parfaitement lisible pour l'enseignant et l'ordinateur.

## 10. Prochaine expérience à mener

Concevoir un prototype d'interface "bac à sable" (un simple formulaire web local ou script CLI) permettant de coller un texte issu de Word, et qui produit le fichier complet (YAML + Markdown) en retour, afin de tester en conditions réelles les frictions d'édition par un professeur.

---
### Réponses spécifiques aux questions soulevées

1. **Reconnaître les objectifs** : Utiliser des regex pour cibler les infinitifs d'action liés à la pédagogie en début de puce.
2. **Séparer support étudiant/prof** : Chercher les marques de l'impératif 2e personne du pluriel vs 2e personne de courtoisie ("Lisez" vs "Demandez aux élèves"). L'automatisation reste faillible.
3. **Détecter un corrigé** : Pattern matching sur des mots-clés (`/(correction|corrigé|réponses)/i`) ou détection de courtes réponses numérotées.
4. **Traiter les tableaux** : Conversion stricte en syntaxe de tableau Markdown. Si trop complexe (cellules fusionnées), convertir en listes à puces.
5. **Traiter les images** : Remplacer par des placeholders texte `[IMAGE: Description]` jusqu'à remplacement par une image libre.
6. **Signaler une source à vérifier** : Injection automatique du tag `[À VÉRIFIER]` dans la section dédiée et gestion via le JSON (`reuseReadiness`).
7. **Champs inférés automatiquement** : `level`, `durationMinutes`, `tags`, `mainSkill`.
8. **Champs validés par l'enseignant** : `title`, `license`, `objectifs`, pertinence pédagogique.
9. **Risques de mauvaise classification** : Un texte de niveau B1 parlant de préparation au "C1" pourrait induire en erreur le parseur.
10. **Format le plus robuste** : **Markdown + frontmatter YAML**. Il assure l'unité du fichier tout en conservant des métadonnées structurées.
