import Link from "next/link";
import {
  Archive,
  ArrowRight,
  ClipboardList,
  Layers3,
  Search,
  AlertTriangle,
  BookOpen,
  Settings,
} from "lucide-react";
import { StatCard } from "@/components/stat-card";
import {
  getArchiveBatches,
  getArchiveBatchPageCount,
  getArchiveBatchSummary,
  isArchiveBatchReviewReady,
} from "@/lib/archiveBatches";

export default function Home() {
  const batches = getArchiveBatches();
  const reviewReadyBatches = batches.filter(isArchiveBatchReviewReady);
  const consultablePageCount = reviewReadyBatches.reduce(
    (total, batch) => total + getArchiveBatchPageCount(batch),
    0,
  );
  const assistedReadingCount = reviewReadyBatches.reduce(
    (total, batch) => total + getArchiveBatchSummary(batch).assistedReadingCount,
    0,
  );

  return (
    <main className="min-h-screen bg-background">
      {/* 1. BLOC D'OUVERTURE ACCUEILLANT */}
      <section className="border-b border-paper-border bg-paper">
        <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
          <div className="max-w-4xl">
            <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
              Espace de consultation
            </p>
            <h1 className="mt-4 font-serif text-4xl font-medium tracking-tight text-foreground">
              Archives Algérie
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-foreground/80 font-serif">
              Bienvenue dans Archives Algérie, un espace de consultation progressive d&apos;archives numérisées relatives à la guerre d&apos;Algérie. Le site permet de parcourir les images sources, d&apos;accéder à des lectures assistées non validées et de préparer peu à peu une exploration plus fine du corpus.
            </p>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Lots en revue" value={reviewReadyBatches.length} />
            <StatCard label="Pages consultables" value={consultablePageCount} />
            <StatCard label="Lectures assistées" value={assistedReadingCount} />
            <StatCard label="Lots suivis" value={batches.length} />
          </div>
        </div>
      </section>

      {/* 5. ENTRÉES PRINCIPALES */}
      <section className="bg-background py-16 border-b border-paper-border">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <h2 className="font-serif text-2xl font-medium text-foreground mb-8">
            Entrées principales
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {/* Carte 1 */}
            <Link
              href="/lots"
              className="group flex flex-col justify-between border border-paper-border bg-paper p-6 transition-colors hover:border-warm/50"
            >
              <div>
                <Layers3 className="h-6 w-6 text-warm mb-4" />
                <h3 className="font-serif text-xl font-medium text-foreground group-hover:text-warm">
                  Consulter les lots
                </h3>
                <p className="mt-3 text-sm text-foreground/70 leading-relaxed">
                  Accès principal aux lots publiés et aux pages numérisées.
                </p>
              </div>
              <div className="mt-6 flex items-center text-sm font-medium text-foreground group-hover:text-warm">
                Ouvrir <ArrowRight className="ml-2 h-4 w-4" />
              </div>
            </Link>

            {/* Carte 2 */}
            <Link
              href="/questionnement"
              className="group flex flex-col justify-between border border-paper-border bg-paper p-6 transition-colors hover:border-warm/50"
            >
              <div>
                <Search className="h-6 w-6 text-warm mb-4" />
                <h3 className="font-serif text-xl font-medium text-foreground group-hover:text-warm">
                  Explorer et rechercher
                </h3>
                <p className="mt-3 text-sm text-foreground/70 leading-relaxed">
                  Recherche V1 dans les lectures assistées disponibles et premiers repères chronologiques.
                </p>
              </div>
              <div className="mt-6 flex items-center text-sm font-medium text-foreground group-hover:text-warm">
                Ouvrir <ArrowRight className="ml-2 h-4 w-4" />
              </div>
            </Link>

            {/* Carte 3 */}
            <Link
              href="/inventaire"
              className="group flex flex-col justify-between border border-paper-border bg-paper p-6 transition-colors hover:border-warm/50"
            >
              <div>
                <ClipboardList className="h-6 w-6 text-warm mb-4" />
                <h3 className="font-serif text-xl font-medium text-foreground group-hover:text-warm">
                  Comprendre l&apos;état du corpus
                </h3>
                <p className="mt-3 text-sm text-foreground/70 leading-relaxed">
                  État technique des lots, limites actuelles, étapes de travail.
                </p>
              </div>
              <div className="mt-6 flex items-center text-sm font-medium text-foreground group-hover:text-warm">
                Ouvrir <ArrowRight className="ml-2 h-4 w-4" />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. CE QUE VOUS POUVEZ FAIRE MAINTENANT & 4. EN PRÉPARATION */}
      <section className="bg-paper py-16 border-b border-paper-border">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="grid gap-12 md:grid-cols-2">
            <div>
              <h2 className="font-serif text-2xl font-medium text-foreground mb-6 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-warm" />
                Ce que vous pouvez faire aujourd&apos;hui
              </h2>
              <ul className="space-y-4 text-foreground/80 list-disc list-inside">
                <li>Parcourir les lots d&apos;archives publiés</li>
                <li>Ouvrir les images sources page par page</li>
                <li>Consulter les lectures assistées lorsqu&apos;elles existent</li>
                <li>Faire une recherche simple dans les lectures disponibles</li>
                <li>Suivre l&apos;état du corpus dans l&apos;inventaire technique</li>
              </ul>
            </div>
            <div>
              <h2 className="font-serif text-2xl font-medium text-foreground mb-6 flex items-center gap-2">
                <Settings className="h-5 w-5 text-foreground/50" />
                Ce qui est en préparation
              </h2>
              <ul className="space-y-4 text-foreground/80 list-disc list-inside text-sm">
                <li>Annotations humaines persistantes</li>
                <li>Meilleure recherche</li>
                <li>Chronologie plus complète</li>
                <li>Meilleure prise en compte des documents arabes</li>
                <li>Stabilisation des lots PDF</li>
                <li>Amélioration progressive du pipeline</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 3. A LIRE AVEC PRUDENCE */}
      <section className="bg-background py-16 border-b border-paper-border">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="border border-paper-border bg-paper/50 p-8">
            <h2 className="font-serif text-xl font-medium text-foreground mb-6 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-foreground/70" />
              À lire avec prudence
            </h2>
            <ul className="grid gap-4 sm:grid-cols-2 text-sm text-foreground/80">
              <li className="flex items-start gap-3">
                <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-warm/50"></span>
                <span>Les lectures assistées ne sont pas validées humainement.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-warm/50"></span>
                <span>L&apos;OCR brut peut contenir des erreurs.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-warm/50"></span>
                <span>Certaines pages n&apos;ont pas encore de lecture.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-warm/50"></span>
                <span>Les documents multilingues (notamment arabes) nécessitent une stratégie spécifique.</span>
              </li>
              <li className="flex items-start gap-3 sm:col-span-2 mt-2">
                <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-warm"></span>
                <strong className="text-foreground">L&apos;image source reste toujours le point de référence.</strong>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 6. FOOTER / REPERES V0 */}
      <section className="bg-background">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row lg:px-8">
          <p className="text-sm text-foreground/60">
            Repère V0 / ancienne structuration / traçabilité
          </p>
          <Link
            href="/collections"
            className="inline-flex shrink-0 items-center gap-2 border border-paper-border bg-paper px-4 py-2 text-xs font-medium text-foreground transition-colors hover:bg-paper-border/50"
          >
            <Archive className="h-3.5 w-3.5" />
            Voir le manifeste V0
          </Link>
        </div>
      </section>
    </main>
  );
}
