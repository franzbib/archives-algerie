import Link from "next/link";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Database,
  FileText,
  Layers3,
  Quote,
  ScanText,
  Search,
  ShieldCheck,
} from "lucide-react";

const exampleQuestions = [
  "Quels documents mentionnent Boghari entre 1958 et 1960 ?",
  "Quels dossiers concernent la frontière marocaine ?",
  "Quels noms propres apparaissent dans les documents FLN récupérés ?",
  "Quels documents sont prêts pour OCR ?",
];

const futureSteps = [
  {
    title: "Image scannée",
    text: "Conserver le lien entre chaque image, son dossier, son document, sa cote et sa page.",
  },
  {
    title: "OCR",
    text: "Produire une transcription locale, sans remplacer l'image source ni masquer les erreurs possibles.",
  },
  {
    title: "Texte brut conservé",
    text: "Garder la sortie OCR originale pour permettre la vérification et les retours en arrière.",
  },
  {
    title: "Texte nettoyé",
    text: "Créer une version lisible séparée, sans supprimer la trace du texte brut.",
  },
  {
    title: "Chunks",
    text: "Découper le texte en passages courts, toujours rattachés à collection, cote, document et page.",
  },
  {
    title: "Indexation",
    text: "Préparer la recherche plein texte puis, plus tard, les embeddings validés.",
  },
  {
    title: "Recherche",
    text: "Retrouver les passages pertinents avant de formuler une réponse.",
  },
  {
    title: "Réponse sourcée",
    text: "Répondre seulement avec citations, niveau de certitude et limites explicites.",
  },
];

const safeguards = [
  "Pas de réponse sans source consultable.",
  "Distinguer fait attesté, hypothèse et contexte historique.",
  "Mentionner les limites OCR quand le texte est incertain.",
  "Prévoir une validation humaine avant toute conclusion sensible.",
];

export default function QuestionnementPage() {
  return (
    <main className="min-h-screen bg-background pb-16">
      <div className="border-b border-paper-border bg-paper/60">
        <div className="mx-auto max-w-6xl px-6 py-4 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-warm hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour au catalogue
          </Link>
        </div>
      </div>

      <section className="border-b border-paper-border bg-paper">
        <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
            Recherche en langage naturel - méthode future
          </p>
          <h1 className="mt-3 max-w-4xl font-serif text-4xl font-medium text-foreground">
            Préparer une interrogation sourcée des archives, sans simuler une
            recherche active.
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-foreground/80">
            Cette page sert à cadrer la méthode. En V0, la recherche en langage
            naturel n&apos;est pas active : aucune question n&apos;est envoyée à
            une IA, aucun document n&apos;est OCRisé dans l&apos;application,
            aucun embedding n&apos;est créé et aucun résultat n&apos;est généré.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-6 py-12 lg:grid-cols-[1fr_360px] lg:px-8">
        <div className="space-y-8">
          <section className="grid gap-4 md:grid-cols-2">
            <InfoCard
              icon={<Search className="h-5 w-5" />}
              title="Statut actuel"
              text="Page méthodologique uniquement. Le champ de question est désactivé et aucune API n'est appelée."
            />
            <InfoCard
              icon={<ScanText className="h-5 w-5" />}
              title="OCR non actif"
              text="Les fiches préparent l'affichage image + OCR, mais aucune transcription réelle n'est encore produite dans l'application."
            />
            <InfoCard
              icon={<Database className="h-5 w-5" />}
              title="Pas d'embeddings"
              text="Aucun vecteur, index sémantique ou service externe n'est créé à cette étape."
            />
            <InfoCard
              icon={<ShieldCheck className="h-5 w-5" />}
              title="Objectif"
              text="Définir une chaîne de preuve avant d'autoriser une future réponse en langage naturel."
            />
          </section>

          <section className="border border-paper-border bg-paper p-6 md:p-8">
            <div className="mb-6 flex items-center gap-3">
              <Layers3 className="h-5 w-5 text-warm" />
              <div>
                <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
                  Chaîne future
                </p>
                <h2 className="font-serif text-2xl font-medium text-foreground">
                  De la page scannée à la réponse sourcée
                </h2>
              </div>
            </div>

            <div className="grid gap-3">
              {futureSteps.map((step, index) => (
                <div
                  key={step.title}
                  className="grid gap-3 border border-paper-border bg-background p-4 sm:grid-cols-[72px_1fr]"
                >
                  <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
                    Étape {index + 1}
                  </p>
                  <div>
                    <h3 className="font-serif text-lg font-medium text-foreground">
                      {step.title}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-foreground/75">
                      {step.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="border border-paper-border bg-paper p-6 md:p-8">
            <div className="mb-6">
              <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
                Maquette non fonctionnelle
              </p>
              <h2 className="mt-2 font-serif text-2xl font-medium text-foreground">
                Poser une question
              </h2>
            </div>

            <div className="relative">
              <input
                aria-label="Champ de question à venir"
                className="w-full border-2 border-paper-border bg-background px-5 py-4 pr-28 font-serif text-lg text-foreground placeholder:text-warm/50"
                disabled
                placeholder="Ex: Quels dossiers concernent la frontière marocaine ?"
                type="text"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 border border-amber-200 bg-amber-50 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-amber-800">
                À venir
              </span>
            </div>

            <p className="mt-3 text-sm leading-6 text-warm">
              Ce champ est volontairement désactivé. Il ne déclenche ni API IA,
              ni recherche, ni indexation.
            </p>
          </section>

          <section className="border border-paper-border bg-paper p-6 md:p-8">
            <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
              Exemple de format attendu
            </p>
            <div className="mt-4 border border-dashed border-paper-border bg-background p-5">
              <div className="mb-4 flex items-center gap-2 text-warm">
                <Quote className="h-4 w-4" />
                <p className="font-mono text-xs uppercase tracking-widest">
                  Exemple fictif de format - pas un résultat réel
                </p>
              </div>

              <div className="space-y-4 text-sm">
                <SourceLine
                  label="Réponse synthétique"
                  text="Une réponse courte présenterait uniquement ce que les passages retrouvés permettent d'affirmer."
                />
                <SourceLine
                  label="Documents utilisés"
                  text="Liste des notices mobilisées, avec un lien vers chaque fiche document."
                />
                <SourceLine
                  label="Collection"
                  text="Nom exact de la collection issue du manifeste local."
                />
                <SourceLine label="Cote" text="Référence archivistique complète." />
                <SourceLine label="Document" text="Titre de la fiche document." />
                <SourceLine label="Page" text="Page ou image scannée concernée." />
                <SourceLine
                  label="Extrait OCR"
                  text="Court extrait cité, seulement quand l'OCR existe réellement."
                />
                <SourceLine
                  label="Niveau de certitude"
                  text="Élevé, moyen ou faible, selon la qualité de l'OCR et la cohérence des sources."
                />
                <SourceLine
                  label="Limites"
                  text="Lacunes du corpus, OCR incertain, page illisible ou besoin de validation humaine."
                />
              </div>
            </div>
          </section>

          <section className="border border-paper-border bg-paper p-6 md:p-8">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-1 h-5 w-5 shrink-0 text-warm" />
              <div>
                <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
                  Prudence documentaire
                </p>
                <h2 className="mt-1 font-serif text-2xl font-medium text-foreground">
                  Règles avant toute recherche IA
                </h2>
                <div className="mt-4 grid gap-3">
                  {safeguards.map((rule) => (
                    <p
                      className="border border-paper-border bg-background px-4 py-3 text-sm leading-6 text-foreground/80"
                      key={rule}
                    >
                      {rule}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>

        <aside className="h-fit border border-paper-border bg-paper p-6 md:p-8">
          <div className="mb-5 flex items-center gap-3">
            <FileText className="h-5 w-5 text-warm" />
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
                Questions futures
              </p>
              <h2 className="font-serif text-xl font-medium text-foreground">
                Exemples non actifs
              </h2>
            </div>
          </div>
          <div className="space-y-3">
            {exampleQuestions.map((question) => (
              <div
                className="border border-paper-border bg-background px-4 py-3 text-sm leading-6 text-foreground/80"
                key={question}
              >
                &quot;{question}&quot;
              </div>
            ))}
          </div>
          <p className="mt-5 text-xs leading-5 text-warm">
            Ces questions servent à préparer le périmètre de recherche. Elles ne
            produisent actuellement aucun résultat.
          </p>
        </aside>
      </section>
    </main>
  );
}

function InfoCard({
  icon,
  text,
  title,
}: {
  icon: ReactNode;
  text: string;
  title: string;
}) {
  return (
    <article className="border border-paper-border bg-paper p-5">
      <div className="flex items-start gap-3">
        <div className="text-warm">{icon}</div>
        <div>
          <h2 className="font-serif text-xl font-medium text-foreground">
            {title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-foreground/75">{text}</p>
        </div>
      </div>
    </article>
  );
}

function SourceLine({ label, text }: { label: string; text: string }) {
  return (
    <div className="border-t border-paper-border pt-3 first:border-t-0 first:pt-0">
      <p className="font-mono text-[10px] uppercase tracking-widest text-warm">
        {label}
      </p>
      <p className="mt-1 leading-6 text-foreground/80">{text}</p>
    </div>
  );
}
