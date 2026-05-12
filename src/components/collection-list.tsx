import Link from "next/link";
import { Archive, ExternalLink, FileText } from "lucide-react";
import {
  getStatusLabel,
} from "@/lib/archiveManifest";
import type { Collection } from "@/types/archive";
import { StatusBadge } from "@/components/ui/status-badge";

interface CollectionListProps {
  collections: Collection[];
}

export function CollectionList({ collections }: CollectionListProps) {
  if (collections.length === 0) {
    return (
      <div className="border-2 border-dashed border-paper-border bg-paper/30 p-8 text-center text-sm leading-6 text-warm">
        Aucune collection ne correspond à ces critères.
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {collections.map((collection) => (
        <article
          key={collection.id}
          className="group relative border-2 border-paper-border bg-paper p-6 transition-all hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#e4e2db] hover:border-warm"
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
                Fonds / cote : {collection.archiveReference}
              </p>
              <h2 className="mt-2 font-serif text-2xl font-medium text-foreground">
                <Link
                  href={`/collections/${collection.id}`}
                  className="underline-offset-4 hover:underline"
                >
                  {collection.title}
                </Link>
              </h2>
              <p className="mt-3 text-sm leading-6 text-foreground/80">
                {collection.description}
              </p>
            </div>

            <div className="flex shrink-0 flex-col gap-3 lg:items-end">
              <StatusBadge variant={collection.status === "verified" ? "success" : "neutral"}>
                {getStatusLabel(collection.status)}
              </StatusBadge>
              <a
                href={collection.driveUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm text-warm underline decoration-paper-border underline-offset-4 hover:text-foreground"
              >
                Dossier Drive
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          <dl className="mt-5 grid gap-3 border-t border-paper-border pt-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <MetaItem label="Institution" value={collection.sourceInstitution} />
            <MetaItem label="Region" value={collection.region} />
            <MetaItem label="Periode" value={collection.period} />
            <div>
              <dt className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
                Documents
              </dt>
              <dd className="mt-1 flex items-center gap-2 text-foreground">
                <FileText className="h-4 w-4 text-warm" />
                {collection.documentCount}
              </dd>
            </div>
          </dl>

          <div className="mt-4 flex items-center gap-2 text-xs text-warm">
            <Archive className="h-4 w-4" />
            <span>Fonds classe par cote, dossier, document et pages futures.</span>
          </div>
        </article>
      ))}
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
        {label}
      </dt>
      <dd className="mt-1 font-medium text-foreground">{value}</dd>
    </div>
  );
}
