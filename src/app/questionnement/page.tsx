import Link from "next/link";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Database,
  FileSearch,
  Layers3,
  Search,
  ShieldCheck,
} from "lucide-react";
import { ArchiveSearch } from "@/components/search/archive-search";
import { ArchiveTimeline } from "@/components/timeline/archive-timeline";
import { getArchiveSearchDocuments } from "@/lib/searchIndex";
import { getArchiveTimelineData } from "@/lib/timeline";

const currentState = [
  {
    icon: <FileSearch className="h-5 w-5" />,
    title: "Lots consultables",
    text: "Les images publiees sur R2 et les lectures assistees non validees sont consultables dans /lots.",
  },
  {
    icon: <Search className="h-5 w-5" />,
    title: "Recherche V1",
    text: "Une recherche textuelle simple peut interroger les lectures assistees deja publiees.",
  },
  {
    icon: <Database className="h-5 w-5" />,
    title: "Pas d'embeddings",
    text: "Aucun index semantique, aucune base vectorielle et aucune synthese automatique ne sont actifs.",
  },
  {
    icon: <ShieldCheck className="h-5 w-5" />,
    title: "Validation humaine",
    text: "Les lectures assistees restent des hypotheses de travail a verifier sur les images.",
  },
];

const methodSteps = [
  "Chercher un terme ou un nom dans les lectures assistees publiees.",
  "Ouvrir la page de revue du lot pour regarder l'image et la lecture.",
  "Comparer le resultat avec l'image source avant de le citer.",
  "Noter les incertitudes, les noms propres fragiles et les dates a verifier.",
];

const safeguards = [
  "La recherche V1 n'est pas une recherche semantique.",
  "Aucune question n'est envoyee a OpenAI depuis cette page.",
  "Une lecture assistee n'est pas une transcription validee.",
  "La frise chronologique ne produit pas d'interpretation historique.",
];

export default function QuestionnementPage() {
  const searchDocuments = getArchiveSearchDocuments();
  const timeline = getArchiveTimelineData();

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
            Exploration raisonnée
          </p>
          <h1 className="mt-3 max-w-4xl font-serif text-4xl font-medium text-foreground">
            Interroger prudemment les lots d&apos;archives deja prepares.
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-foreground/80">
            Cette page rassemble les premiers outils de consultation transversale :
            une recherche textuelle simple dans les lectures assistees publiees,
            des liens vers les pages de revue et quelques reperes chronologiques.
            Elle ne produit pas de synthese automatique et ne remplace pas la
            verification sur image.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/lots"
              className="inline-flex items-center justify-center border border-foreground bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
            >
              Consulter les lots
            </Link>
            <Link
              href="/inventaire"
              className="inline-flex items-center justify-center border border-paper-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-foreground"
            >
              Voir le suivi d&apos;inventaire
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl space-y-12 px-6 py-12 lg:px-8">
        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {currentState.map((item) => (
            <InfoCard
              icon={item.icon}
              key={item.title}
              text={item.text}
              title={item.title}
            />
          ))}
        </section>

        <ArchiveSearch documents={searchDocuments} />

        <ArchiveTimeline timeline={timeline} />

        <div className="grid gap-8 md:grid-cols-2">
          <section className="border border-paper-border bg-paper p-6 md:p-8">
            <div className="mb-6 flex items-center gap-3">
              <Layers3 className="h-5 w-5 text-warm" />
              <div>
                <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
                  Méthode de consultation
                </p>
                <h2 className="font-serif text-2xl font-medium text-foreground">
                  Lire un résultat sans le surinterpréter
                </h2>
              </div>
            </div>
            <div className="grid gap-3">
              {methodSteps.map((step, index) => (
                <div
                  className="grid gap-3 border border-paper-border bg-background p-4 sm:grid-cols-[72px_1fr]"
                  key={step}
                >
                  <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
                    Étape {index + 1}
                  </p>
                  <p className="text-sm leading-6 text-foreground/75">{step}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="space-y-6">
            <section className="border border-paper-border bg-paper p-6 md:p-8">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-1 h-5 w-5 shrink-0 text-warm" />
                <div>
                  <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
                    Garde-fous
                  </p>
                  <h2 className="mt-1 font-serif text-xl font-medium text-foreground">
                    Ce que la page ne fait pas
                  </h2>
                </div>
              </div>
              <div className="mt-5 space-y-3">
                {safeguards.map((rule) => (
                  <p
                    className="border border-paper-border bg-background px-4 py-3 text-sm leading-6 text-foreground/80"
                    key={rule}
                  >
                    {rule}
                  </p>
                ))}
              </div>
            </section>

            <section className="border border-paper-border bg-paper p-6 md:p-8">
              <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
                Prochaine étape
              </p>
              <h2 className="mt-2 font-serif text-xl font-medium text-foreground">
                Vers une recherche sourcée
              </h2>
              <p className="mt-3 text-sm leading-6 text-foreground/75">
                La suite logique consiste a consolider les corrections humaines,
                distinguer les niveaux de confiance, puis seulement ensuite
                preparer une recherche semantique citee et verifiable.
              </p>
            </section>
          </div>
        </div>
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
          <h2 className="font-serif text-lg font-medium text-foreground">
            {title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-foreground/75">{text}</p>
        </div>
      </div>
    </article>
  );
}
