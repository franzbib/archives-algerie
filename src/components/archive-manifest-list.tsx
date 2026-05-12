import {
  archiveProcessingStatuses,
  getProcessingStatusLabel,
} from "@/lib/archiveManifest";
import type {
  ArchiveManifestCollection,
  ArchiveProcessingStatus,
} from "@/types/archive";

interface ArchiveManifestListProps {
  collections: ArchiveManifestCollection[];
}

export function ArchiveManifestList({ collections }: ArchiveManifestListProps) {
  return (
    <div className="overflow-hidden border border-stone-200 bg-white">
      <div className="grid gap-0 divide-y divide-stone-200">
        {collections.map((collection) => (
          <article
            key={collection.id}
            className="grid gap-4 p-5 lg:grid-cols-[1.3fr_0.9fr_0.8fr_0.8fr_auto]"
          >
            <div>
              <p className="font-mono text-xs uppercase tracking-wide text-stone-500">
                {collection.id}
              </p>
              <h3 className="mt-1 text-lg font-semibold text-stone-950">
                {collection.title}
              </h3>
              {collection.notes ? (
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  {collection.notes}
                </p>
              ) : null}
            </div>

            <ManifestField label="Source" value={collection.source} />
            <ManifestField label="Region" value={collection.region} />
            <ManifestField label="Periode" value={collection.period.label} />

            <div className="flex flex-col gap-3 lg:items-end">
              <StatusBadge status={collection.processingStatus} />
              <a
                className="text-sm font-medium text-stone-950 underline decoration-stone-300 underline-offset-4 hover:decoration-stone-950"
                href={collection.driveFolderUrl}
                rel="noreferrer"
                target="_blank"
              >
                Dossier Drive
              </a>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export function StatusLegend() {
  return (
    <div className="flex flex-wrap gap-2">
      {archiveProcessingStatuses.map((status) => (
        <StatusBadge key={status} status={status} />
      ))}
    </div>
  );
}

function ManifestField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-wide text-stone-500">
        {label}
      </p>
      <p className="mt-1 text-sm leading-6 text-stone-700">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: ArchiveProcessingStatus }) {
  return (
    <span className="w-fit border border-stone-300 bg-stone-50 px-2.5 py-1 font-mono text-xs uppercase tracking-wide text-stone-700">
      {getProcessingStatusLabel(status)}
    </span>
  );
}
