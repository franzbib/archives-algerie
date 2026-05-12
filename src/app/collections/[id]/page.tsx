import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, FolderArchive } from "lucide-react";
import { DocumentList } from "@/components/document-list";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  getCollectionById,
  getCollections,
  getDocumentsByCollectionId,
  getStatusLabel,
} from "@/lib/archiveManifest";

export function generateStaticParams() {
  return getCollections().map((collection) => ({ id: collection.id }));
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const collection = getCollectionById(id);

  if (!collection) {
    notFound();
  }

  const documents = getDocumentsByCollectionId(collection.id);

  return (
    <main className="min-h-screen bg-background pb-16">
      <div className="border-b border-paper-border bg-paper/60">
        <div className="mx-auto max-w-6xl px-6 py-4 lg:px-8">
          <Link
            href="/collections"
            className="inline-flex items-center gap-2 text-sm text-warm hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux collections
          </Link>
        </div>
      </div>

      <section className="mx-auto max-w-6xl px-6 py-10 lg:px-8">
        <div className="border border-paper-border bg-paper p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-3">
                <p className="font-mono text-xs uppercase tracking-widest text-warm">
                  Fonds / cote : {collection.archiveReference}
                </p>
                <StatusBadge variant={collection.status === "verified" ? "success" : "neutral"}>
                  {getStatusLabel(collection.status)}
                </StatusBadge>
              </div>
              <h1 className="mt-4 font-serif text-4xl font-medium text-foreground">
                {collection.title}
              </h1>
              <p className="mt-5 text-base leading-7 text-foreground/80">
                {collection.description}
              </p>
            </div>
            <a
              href={collection.driveUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-fit items-center gap-2 border border-paper-border bg-background px-4 py-2 text-sm text-foreground"
            >
              Dossier Drive
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>

          <dl className="mt-8 grid gap-4 border-t border-paper-border pt-5 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <MetaItem label="Institution" value={collection.sourceInstitution} />
            <MetaItem label="Region" value={collection.region} />
            <MetaItem label="Periode" value={collection.period} />
            <MetaItem label="Documents" value={String(collection.documentCount)} />
          </dl>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 lg:px-8">
        <div className="mb-5 flex items-center gap-3 border-b border-paper-border pb-4">
          <FolderArchive className="h-5 w-5 text-warm" />
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-warm">
              Dossiers et documents
            </p>
            <h2 className="font-serif text-2xl font-medium text-foreground">
              Documents rattaches a la collection
            </h2>
          </div>
        </div>
        <DocumentList documents={documents} />
      </section>
    </main>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-xs uppercase tracking-widest text-warm">
        {label}
      </dt>
      <dd className="mt-1 text-foreground">{value}</dd>
    </div>
  );
}
