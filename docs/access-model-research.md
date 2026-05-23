# Rapport d'exploration documentaire : Modèle d'accès de FLE Commons Lab

**Date :** Mai 2026
**Sujet :** Anticipation et modélisation des niveaux d'accès futurs pour FLE Commons Lab.

---

## 1. Contexte et Enjeux

FLE Commons Lab ambitionne de devenir une "forge pédagogique FLE" open source. À l'heure actuelle (v0), la plateforme est statique : elle ne possède ni backend (Supabase n'est pas encore intégré), ni système d'authentification, ni module de paiement, ni intelligence artificielle en production.

Bien que la vocation première du projet soit le "commun pédagogique" (gratuité, ouverture, mutualisation), il est impératif d'anticiper la structure des accès futurs. Cette anticipation permettra d'accueillir des espaces contributeurs, des espaces membres, des ressources privées ou d'éventuels services additionnels sans remettre en cause l'architecture fondamentale du projet.

## 2. Comparaison des Modèles d'Accès Possibles

Voici l'analyse de cinq modèles d'accès potentiels pour la plateforme.

### Modèle A : Tout gratuit et public
- **Cohérence** : Alignement total avec la philosophie originelle du commun ouvert.
- **Risques éthiques** : Très faibles.
- **Risques communautaires** : Risque de "pillages" sans rétribution (freeriding), difficulté à retenir une communauté engagée si l'on ne peut pas lui offrir d'espace privilégié.
- **Complexité technique** : Nulle (statut actuel).
- **Compatibilité Supabase** : Parfaitement compatible, mais sous-utilise les capacités de RLS (Row Level Security).
- **Lisibilité (enseignants)** : Maximale.

### Modèle B : Open source + ressources publiques + espace contributeur
- **Cohérence** : Excellente. Valorise la notion de "forge" (on accède à plus d'outils si l'on participe).
- **Risques éthiques** : Faibles. Le savoir reste libre, seuls les outils de conception sont restreints.
- **Risques communautaires** : Risque de créer une scission entre "producteurs" et "consommateurs" passifs.
- **Complexité technique** : Moyenne. Nécessite une authentification (auth) et la gestion d'un rôle.
- **Compatibilité Supabase** : Excellente. Typique d'une gestion RBAC basique.
- **Lisibilité (enseignants)** : Bonne. Le statut de contributeur est valorisant dans le milieu éducatif.

### Modèle C : Open source + ressources publiques + espace membre (freemium communautaire)
- **Cohérence** : Moyenne. Peut s'éloigner du commun s'il s'agit de cacher les meilleures ressources.
- **Risques éthiques** : Privatisation insidieuse des communs si le "meilleur" contenu devient exclusif aux membres.
- **Risques communautaires** : Perte de confiance si le public a le sentiment que le projet devient un club fermé.
- **Complexité technique** : Moyenne à forte.
- **Compatibilité Supabase** : Excellente.
- **Lisibilité (enseignants)** : Méfiance classique envers les "espaces membres" sur le web.

### Modèle D : Open source + services payants autour de ressources gratuites
- **Cohérence** : Bonne. Le savoir (la ressource) reste un commun, l'outil (générateur IA, conversion, export PDF avancé) devient le produit.
- **Risques éthiques** : Attention à la marchandisation de l'outil pédagogique public.
- **Risques communautaires** : Acceptation généralement bonne si les ressources de base restent gratuites et non bridées.
- **Complexité technique** : Élevée (Auth + Stripe/Paiement + Backend lourd).
- **Compatibilité Supabase** : Complète (intégration Stripe/Auth).
- **Lisibilité (enseignants)** : Très claire. On paie pour gagner du temps (service), pas pour le contenu (commun).

### Modèle E : Ressources publiques + collections privées ou institutionnelles
- **Cohérence** : Forte. Permet à des écoles ou alliances françaises d'utiliser l'outil en circuit fermé tout en contribuant au tronc commun.
- **Risques éthiques** : Fragmentation de la base de données.
- **Risques communautaires** : Moins de ressources reversées au commun.
- **Complexité technique** : Élevée (Architecture multi-tenant, gestion des droits complexes).
- **Compatibilité Supabase** : Excellente (RLS parfait pour le multi-tenant).
- **Lisibilité (enseignants)** : Très bonne ("Mon espace école" vs "Espace public").

## 3. Recommandation Stratégique

Pour garantir le développement sain de FLE Commons Lab, la recommandation est d'adopter une **approche évolutive et prudente** :

1. **Ne rien monétiser dans la v0** : Le projet doit d'abord prouver sa valeur et rassembler une communauté.
2. **Documenter uniquement les niveaux d'accès** : Préparer le terrain conceptuel sans écrire de logique d'authentification coûteuse.
3. **Clarifier la sémantique** : Il est vital de ne pas confondre :
   - *La licence* (ex: CC-BY-SA, droits d'auteur).
   - *Le statut pédagogique* (ex: brouillon, validé).
   - *Le statut contributeur* (ex: auteur, relecteur).
   - *L'accès technique* (ex: public, privé).
4. **Garder le cœur du projet gratuit et ouvert** : Le commun pédagogique est intouchable.
5. **Prévoir l'isolation** : Seuls les services additionnels (IA, exports lourds), les collections de travail privées ou les espaces d'accompagnement institutionnels pourront faire l'objet de barrières d'accès.

## 4. Mini-Taxonomie des Accès

Pour préparer le futur schéma de base de données (sans l'implémenter), voici la taxonomie recommandée pour les niveaux d'accès (`accessLevel`) :

- `public` : Accessible à tous les visiteurs non connectés. (Mode par défaut pour les communs).
- `registered` : Nécessite un compte gratuit (pour éviter le scraping de masse ou pour accéder à des exports de qualité).
- `contributor` : Nécessite un compte ayant des droits d'édition ou de proposition (fork de ressources).
- `member` : Réservé à un groupe spécifique, un abonnement de soutien ou une institution.
- `private` : Espace de travail personnel de l'enseignant, invisible du reste de la communauté.

## 5. Champs de Données Futurs (Propositions)

La structure de données (type `Resource`) devra intégrer à terme les champs suivants :

- `accessLevel` : Enum de la taxonomie (public, private, etc.).
- `license` : Type de droits (CC-BY, domaine public, tous droits réservés).
- `visibility` : Booléen ou Enum (ex: un document peut être "public" mais "non listé" dans les moteurs de recherche).
- `contributionStatus` : État de la collaboration (ouvert aux forks, verrouillé).
- `validationStatus` : Niveau de confiance pédagogique (brouillon, relu, certifié).
- `ownerType` : `user`, `institution`, `system`.
- `reviewedBy` : ID de l'utilisateur ayant validé le contenu.
- `reviewedAt` : Timestamp de validation.

## 6. Actions Concrètes pour l'Agent Codex

Afin de traduire cette réflexion en architecture applicative légère pour la v0, les directives pour l'agent Codex sont les suivantes :

1. **Créer le document de référence** : Créer `docs/access-model.md` reprenant la taxonomie et la vision à long terme.
2. **Mettre à jour les types TypeScript** : Ajouter le champ `accessLevel` (optionnel pour la v0) au type `Resource` principal.
3. **Configuration des données de test** : Assurer que les ressources de démonstration actuelles soient explicitement marquées avec `accessLevel: "public"`.
4. **Documentation des risques** : Ajouter une note dans le README ou le modèle de ressources sur le risque de divergence des taxonomies (confusion entre statut, accès et licence).
5. **Périmètre strict (Ce qu'il ne faut PAS faire)** : Ne **pas** implémenter de système de paiement, d'authentification (NextAuth/Clerk), d'intégration Supabase réelle, ni de requêtes IA en production. Le projet doit rester statique et centré sur la structure de l'information.
