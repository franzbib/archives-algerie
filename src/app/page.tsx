import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  getArchiveBatches,
  getArchiveBatchPageCount,
  isArchiveBatchReviewReady,
} from "@/lib/archiveBatches";

export default function Home() {
  const batches = getArchiveBatches();
  const reviewReadyBatches = batches.filter(isArchiveBatchReviewReady);
  const consultablePageCount = reviewReadyBatches.reduce(
    (total, batch) => total + getArchiveBatchPageCount(batch),
    0,
  );

  return (
    <main className="min-h-screen bg-background">
      {/* 1. Grand bloc d'accueil */}
      <section className="bg-paper border-b border-paper-border">
        <div className="mx-auto max-w-4xl px-6 py-24 lg:px-8 text-center">
          <h1 className="font-serif text-4xl font-medium tracking-tight text-foreground md:text-5xl">
            Bienvenue dans Archives Algérie.
          </h1>
          <p className="mt-8 text-xl leading-relaxed text-foreground/80 font-serif">
            Ce site propose une consultation progressive d&apos;archives numérisées relatives à la guerre d&apos;Algérie. Il permet d&apos;ouvrir les images sources, de parcourir les lots déjà publiés et d&apos;explorer, avec prudence, des lectures assistées encore non validées humainement.
          </p>
        </div>
      </section>

      {/* 2. Par où commencer ? */}
      <section className="bg-background py-20 border-b border-paper-border">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <h2 className="font-serif text-3xl font-medium text-foreground text-center mb-12">
            Par où commencer ?
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {/* Carte 1 */}
            <Link
              href="/lots"
              className="group flex flex-col justify-between border border-paper-border bg-paper p-8 transition-colors hover:border-warm/50"
            >
              <div>
                <h3 className="font-serif text-xl font-medium text-foreground group-hover:text-warm">
                  Je veux consulter les archives
                </h3>
                <p className="mt-4 text-sm text-foreground/70 leading-relaxed">
                  Ouvrir les lots publiés et parcourir les pages numérisées.
                </p>
              </div>
              <div className="mt-8 flex items-center text-sm font-medium text-foreground group-hover:text-warm">
                Parcourir <ArrowRight className="ml-2 h-4 w-4" />
              </div>
            </Link>

            {/* Carte 2 */}
            <Link
              href="/questionnement"
              className="group flex flex-col justify-between border border-paper-border bg-paper p-8 transition-colors hover:border-warm/50"
            >
              <div>
                <h3 className="font-serif text-xl font-medium text-foreground group-hover:text-warm">
                  Je cherche un mot, un lieu ou un thème
                </h3>
                <p className="mt-4 text-sm text-foreground/70 leading-relaxed">
                  Explorer les lectures assistées disponibles et quelques premiers repères chronologiques.
                </p>
              </div>
              <div className="mt-8 flex items-center text-sm font-medium text-foreground group-hover:text-warm">
                Rechercher <ArrowRight className="ml-2 h-4 w-4" />
              </div>
            </Link>

            {/* Carte 3 */}
            <Link
              href="/inventaire"
              className="group flex flex-col justify-between border border-paper-border bg-paper p-8 transition-colors hover:border-warm/50"
            >
              <div>
                <h3 className="font-serif text-xl font-medium text-foreground group-hover:text-warm">
                  Je veux comprendre l&apos;état du corpus
                </h3>
                <p className="mt-4 text-sm text-foreground/70 leading-relaxed">
                  Voir ce qui est déjà publié, ce qui reste en préparation et les limites actuelles.
                </p>
              </div>
              <div className="mt-8 flex items-center text-sm font-medium text-foreground group-hover:text-warm">
                Consulter <ArrowRight className="ml-2 h-4 w-4" />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* 3. Comment lire les documents ? */}
      <section className="bg-paper py-20 border-b border-paper-border">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <h2 className="font-serif text-2xl font-medium text-foreground mb-8">
            Comment lire les documents ?
          </h2>
          <div className="space-y-4 text-foreground/80 leading-relaxed">
            <p>
              Les archives présentées ici sont complexes. L&apos;objectif de ce projet est de faciliter leur consultation sans jamais se substituer à elles. Gardez toujours à l&apos;esprit que :
            </p>
            <ul className="space-y-3 list-none pl-2 mt-4">
              <li className="flex gap-3">
                <span className="text-warm/80 shrink-0 mt-0.5">■</span>
                <span><strong>L&apos;image source reste toujours le document de référence.</strong></span>
              </li>
              <li className="flex gap-3">
                <span className="text-warm/80 shrink-0 mt-0.5">■</span>
                <span>Les lectures assistées peuvent aider mais <strong>ne sont pas des transcriptions validées humainement</strong>.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-warm/80 shrink-0 mt-0.5">■</span>
                <span>L&apos;OCR peut contenir des erreurs.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-warm/80 shrink-0 mt-0.5">■</span>
                <span>Certaines pages n&apos;ont pas encore de lecture.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-warm/80 shrink-0 mt-0.5">■</span>
                <span>Certains documents peuvent être multilingues ou difficiles à interpréter.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 4. Un site en construction */}
      <section className="bg-background py-20 border-b border-paper-border">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <h2 className="font-serif text-2xl font-medium text-foreground mb-8">
            Un site en construction
          </h2>
          <div className="space-y-4 text-foreground/80 leading-relaxed">
            <p>
              Ce projet avance progressivement, par étapes. Le site s&apos;enrichit :
            </p>
            <ul className="space-y-2 list-disc list-inside pl-2">
              <li>par l&apos;intégration de nouveaux lots ;</li>
              <li>par des relectures successives ;</li>
              <li>par divers enrichissements ;</li>
              <li>par l&apos;amélioration continue de la recherche ;</li>
              <li>par la préparation de futures annotations persistantes ;</li>
              <li>par une meilleure prise en compte des documents arabes et des PDF.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 5. État actuel du corpus */}
      <section className="bg-paper py-16 border-b border-paper-border text-sm text-foreground/70">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <p className="uppercase tracking-widest text-xs font-semibold mb-6 text-warm">
            État actuel du corpus
          </p>
          <div className="flex flex-wrap gap-x-12 gap-y-4">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-warm/50"></span>
              {consultablePageCount > 1000 ? "Plus d'un millier de pages consultables" : `Environ ${consultablePageCount} pages consultables`}
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-warm/50"></span>
              Plusieurs vagues de lots déjà publiées
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-warm/50"></span>
              Recherche textuelle simple disponible
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-warm/50"></span>
              Registre technique du corpus accessible
            </div>
          </div>
        </div>
      </section>

      {/* 6. Repère V0 */}
      <section className="bg-background">
        <div className="mx-auto flex max-w-4xl flex-col items-center justify-center px-6 py-12 lg:px-8">
          <Link
            href="/collections"
            className="text-xs text-foreground/40 hover:text-foreground/80 transition-colors"
          >
            Repère V0 / traçabilité ancienne
          </Link>
        </div>
      </section>
    </main>
  );
}

