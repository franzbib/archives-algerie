# Dossiers Documentaires (Concept & Architecture)

## A. Pourquoi cette fonctionnalité ?
Le projet Archives Algérie franchit une nouvelle étape. Après avoir consolidé la **consultation** (exploration des lots) et posé les jalons de la **relecture** (annotations ponctuelles sur des documents), il est temps de permettre la **constitution de dossiers de travail**.

Les utilisateurs ont besoin de regrouper des documents épars (issus de différents lots) pour mener des enquêtes, préparer des chronologies ou rassembler des pièces autour d'un thème précis. Le site passe ainsi d'un simple registre de consultation à un véritable espace de travail documentaire.

## B. Définitions et Terminologie
Pour préserver la rigueur de la salle de consultation, nous utilisons le terme sobre de **"Dossiers documentaires"** (ou *Dossiers de travail*).

- **Dossier documentaire** : Une chemise virtuelle créée par un utilisateur pour regrouper plusieurs pages d'archives autour d'un thème.
- **Item de dossier** : Une référence (lien) vers une page documentaire précise (`lot_id` / `review_id`) ajoutée au dossier.
- **Note de dossier** : Un champ de texte libre rattaché au dossier dans son ensemble (ex: contexte de la recherche).
- **Note de page (dans un dossier)** : Une remarque de l'utilisateur expliquant pourquoi ce document spécifique a été ajouté à ce dossier (indépendante des annotations publiques).
- **Annotation (rappel)** : Une proposition de relecture ou correction attachée publiquement à une page, visible par tous (si publiée).
- **Lecture assistée** : Le texte généré automatiquement (Vision), qui n'est pas une transcription validée.

## C. Cas d'usage
Les "Dossiers documentaires" répondent à de nombreux scénarios :
- **Préparation thématique** : Constituer un dossier "Boghari et les zaouïas" ou "Wilaya IV".
- **Travail de relecture** : Rassembler les "Documents avec des noms propres à vérifier" ou relire les pages identifiées comme `assisted_unavailable`.
- **Enquête ciblée** : Préparer une chronologie locale d'une commune.
- **Travail pédagogique/familial** : Rassembler des documents précis pour illustrer un récit ou une exposition familiale.
- **Comparaison** : Regrouper des pages éparpillées dans plusieurs lots qui traitent d'un même événement.

## D. Principes méthodologiques stricts
1. **L'image source reste la référence absolue.** Un dossier n'est qu'une surcouche de sélection.
2. Une sélection de documents dans un dossier n'est **pas une preuve en soi** ni un lot d'archives officiel.
3. Une note de dossier n'est **pas une validation historique**.
4. Les futures synthèses par IA devront obligatoirement **citer les documents sources** du dossier, sans sur-interpréter au-delà des pièces rassemblées.

## E. Architecture fonctionnelle V1 (Cible)
La première itération devra rester simple et locale (ou protégée) :
- Créer un dossier (titre, description courte).
- Lister les dossiers existants.
- Sur une page documentaire, cliquer sur "Ajouter à un dossier documentaire".
- Retirer une page d'un dossier.
- Ajouter une note contextuelle générale au dossier.
- Ajouter une petite note personnelle sous chaque page du dossier.
- Cliquer sur une page dans le dossier pour l'ouvrir dans la visionneuse principale.

## F. Architecture fonctionnelle V2 (Évolutions)
- Dossiers publics / privés avec système de comptes utilisateurs (Supabase Auth).
- Exports du dossier (Markdown, CSV).
- Interconnexion avec les annotations (voir les annotations existantes depuis le dossier).
- Recherche textuelle ciblée uniquement au sein d'un dossier.
- **Synthèse IA prudente** sur un dossier précis (ex: extraire la chronologie des pièces du dossier).

## G. Architecture technique envisagée (Supabase)
Pour la V1 connectée, l'architecture de base pourrait ressembler à ceci :

```sql
-- Table des dossiers
CREATE TABLE research_folders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text,
  general_note text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des éléments (pages) dans un dossier
CREATE TABLE research_folder_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  folder_id uuid REFERENCES research_folders(id) ON DELETE CASCADE,
  lot_id text NOT NULL,
  review_id text NOT NULL,
  note text,
  position integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(folder_id, lot_id, review_id)
);
```

## H. Sécurité et droits (V1)
Avant de déployer Supabase Auth, la V1 peut être protégée par le **même mot de passe administrateur** que la `/relecture`. Cela permet de tester la création de dossiers documentaires en cercle restreint (équipe de recherche) en utilisant des fonctions RPC vérifiant ce mot de passe.
Aucun `service_role` client ou secret exposé n'est autorisé.

## I. Interface envisagée
- **Esthétique** : Très sobre, reprenant les codes de la "chemise cartonnée" et du carnet de travail (`bg-paper`, bordures fines, typos serif).
- **Routage** :
  - `/dossiers` : Liste des dossiers de travail.
  - `/dossiers/[folderId]` : Vue détaillée d'un dossier (chemise ouverte), listant les documents inclus avec leurs vignettes/notes.
- **Action** : Un bouton "Ajouter au dossier" (icône Bookmark ou FolderPlus) sur les pages documentaires `lots/[lotId]/[reviewId]`.

## J. Limites de la V1
La V1 ne gérera **pas** :
- La collaboration en temps réel entre plusieurs utilisateurs.
- Le partage public d'un dossier via une URL unique.
- La synthèse IA automatique.
- Un système complexe de permissions (juste un mot de passe global).

---
*Ce document sert de feuille de route conceptuelle. Actuellement, la page `/dossiers` est un prototype de présentation et la connexion backend n'est pas encore implémentée.*
