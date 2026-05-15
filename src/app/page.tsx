import Link from "next/link";
import type { ReactNode } from "react";
import {
  Archive,
  BookOpen,
  ClipboardList,
  FileText,
  Layers3,
  Search,
} from "lucide-react";
import { CollectionList } from "@/components/collection-list";
import { StatCard } from "@/components/stat-card";
import {
  getArchiveManifestSummary,
  getCollections,
  getDocuments,
} from "@/lib/archiveManifest";
import {
  getArchiveBatches,
  getArchiveBatchPageCount,
  getArchiveBatchSummary,
  isArchiveBatchReviewReady,
} from "@/lib/archiveBatches";

export default function Home() {
  const summary = getArchiveManifestSummary();
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
  const featuredCollections = getCollections().slice(0, 3);
  const pageCount = getDocuments().reduce(
    (total, document) => total + (document.pages?.length ?? 0),
    0,
  );

  return (
    <main className="min-h-screen bg-background">
      <section className="border-b border-paper-border bg-paper">
        <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
          <div className="max-w-4xl">
            <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
              Archives historiques scannees sur l&apos;Algerie
            </p>
            <h1 className="mt-4 font-serif text-4xl font-medium tracking-tight text-foreground">
              Explorer les lots d&apos;archives publies sans perdre le contexte
              archivistique.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-foreground/80">
              Les lots consultables regroupent les images publiees, leurs
              lectures assistees non validees et les liens vers les sources. La
              couche collections V0 reste disponible comme manifeste
              archivistique, mais la consultation principale passe maintenant par
              les lots.
            </p>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Lots en revue" value={reviewReadyBatches.length} />
            <StatCard label="Pages consultables" value={consultablePageCount} />
            <StatCard label="Lectures assistees" value={assistedReadingCount} />
            <StatCard label="Lots suivis" value={batches.length} />
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/lots"
              className="inline-flex items-center gap-2 border border-foreground bg-foreground px-4 py-2 text-sm font-medium text-background"
            >
              <Layers3 className="h-4 w-4" />
              Explorer les lots d&apos;archives
            </Link>
            <Link
              href="/inventaire"
              className="inline-flex items-center gap-2 border border-paper-border bg-background px-4 py-2 text-sm font-medium text-foreground"
            >
              <ClipboardList className="h-4 w-4" />
              Suivi technique
            </Link>
            <Link
              href="/collections"
              className="inline-flex items-center gap-2 border border-paper-border bg-background px-4 py-2 text-sm font-medium text-foreground"
            >
              <Archive className="h-4 w-4" />
              Manifeste V0
            </Link>
            <Link
              href="/questionnement"
              className="inline-flex items-center gap-2 border border-paper-border bg-background px-4 py-2 text-sm font-medium text-foreground"
            >
              <Search className="h-4 w-4" />
              Recherche future
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-12 px-6 py-12 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div className="space-y-6">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
              Principe V0
            </p>
            <h2 className="mt-2 font-serif text-3xl font-medium text-foreground">
              Des lots consultables, une couche manifeste conservee.
            </h2>
          </div>
          <div className="grid gap-3">
            <Principle
              icon={<Layers3 className="h-5 w-5" />}
              title="Consulter les lots"
              text="Les lots publies donnent acces aux images, aux lectures assistees non validees et aux liens de source."
            />
            <Principle
              icon={<BookOpen className="h-5 w-5" />}
              title="Distinguer le manifeste V0"
              text="Les collections V0 decrivent les fonds et cotes ; elles ne remplacent pas les lots effectivement traites."
            />
            <Principle
              icon={<FileText className="h-5 w-5" />}
              title="Ne pas valider automatiquement"
              text="Une image publiee ou une lecture assistee reste non validee tant qu'une relecture humaine n'a pas eu lieu."
            />
            <Principle
              icon={<Search className="h-5 w-5" />}
              title="Sourcer la recherche future"
              text="Les futurs passages OCR et embeddings devront toujours revenir au document et a la cote."
            />
          </div>
        </div>

        <div>
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
                Apercu
              </p>
              <h2 className="mt-2 font-serif text-3xl font-medium text-foreground">
                Couche manifeste V0
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-foreground/70">
                Ces collections restent utiles pour les cotes et notices, mais la
                consultation des images traitees se fait dans les lots.
              </p>
            </div>
            <Link
              href="/collections"
              className="text-sm text-warm underline decoration-paper-border underline-offset-4 hover:text-foreground"
            >
              Tout voir
            </Link>
          </div>
          <div className="mb-6 grid gap-3 sm:grid-cols-3">
            <StatCard label="Collections V0" value={summary.collections} />
            <StatCard label="Documents V0" value={summary.documents} />
            <StatCard label="Pages V0" value={pageCount} />
          </div>
          <CollectionList collections={featuredCollections} />
        </div>
      </section>
    </main>
  );
}

function Principle({
  icon,
  title,
  text,
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="border border-paper-border bg-paper p-5">
      <div className="flex items-start gap-3">
        <div className="text-warm">{icon}</div>
        <div>
          <h3 className="font-serif text-xl font-medium text-foreground">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-foreground/75">{text}</p>
        </div>
      </div>
    </div>
  );
}
