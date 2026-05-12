import Link from "next/link";
import type { ReactNode } from "react";
import { Archive, BookOpen, FileText, Search } from "lucide-react";
import { CollectionList } from "@/components/collection-list";
import { StatCard } from "@/components/stat-card";
import {
  getArchiveManifestSummary,
  getCollections,
  getDocuments,
} from "@/lib/archiveManifest";

export default function Home() {
  const summary = getArchiveManifestSummary();
  const featuredCollections = getCollections().slice(0, 3);
  const pageCount = getDocuments().reduce(
    (total, document) => total + (document.pages?.length ?? 0),
    0,
  );

  return (
    <main className="min-h-screen bg-background">
      <section className="border-b border-paper-border bg-paper">
        <div className="mx-auto max-w-6xl px-6 py-14 lg:px-8">
          <div className="max-w-4xl">
            <p className="font-mono text-xs uppercase tracking-widest text-warm">
              Archives historiques scannees sur l&apos;Algerie
            </p>
            <h1 className="mt-4 font-serif text-4xl font-medium tracking-tight text-foreground sm:text-5xl">
              Explorer des fonds, cotes, dossiers et documents sans perdre le
              contexte archivistique.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-foreground/80">
              Cette V0 lit un manifeste local JSON pour naviguer dans des
              collections issues de dossiers Drive. Elle prepare la consultation
              image + OCR et une future recherche en langage naturel sourcee,
              sans connecter encore Google Drive, OCR ou IA.
            </p>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Collections" value={summary.collections} />
            <StatCard label="Documents" value={summary.documents} />
            <StatCard label="Pages V0" value={pageCount} />
            <StatCard label="Statuts" value={Object.keys(summary.byStatus).length} />
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/collections"
              className="inline-flex items-center gap-2 border border-foreground bg-foreground px-4 py-2 text-sm font-medium text-background"
            >
              <Archive className="h-4 w-4" />
              Voir les collections
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

      <section className="mx-auto grid max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div className="space-y-5">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-warm">
              Principe V0
            </p>
            <h2 className="mt-2 font-serif text-3xl font-medium text-foreground">
              Une couche manifeste avant les traitements.
            </h2>
          </div>
          <div className="grid gap-3">
            <Principle
              icon={<BookOpen className="h-5 w-5" />}
              title="Respecter le classement"
              text="Le fonds et la cote restent visibles avant le dossier, le document et les pages."
            />
            <Principle
              icon={<FileText className="h-5 w-5" />}
              title="Preparer OCR et image"
              text="Les fiches document montrent deja ou seront affiches l'image scannee et le texte OCR."
            />
            <Principle
              icon={<Search className="h-5 w-5" />}
              title="Sourcer la recherche future"
              text="Les futurs passages OCR et embeddings devront toujours revenir au document et a la cote."
            />
          </div>
        </div>

        <div>
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-warm">
                Apercu
              </p>
              <h2 className="mt-2 font-serif text-3xl font-medium text-foreground">
                Collections principales
              </h2>
            </div>
            <Link
              href="/collections"
              className="text-sm text-warm underline decoration-paper-border underline-offset-4 hover:text-foreground"
            >
              Tout voir
            </Link>
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
