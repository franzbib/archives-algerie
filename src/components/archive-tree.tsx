import type { ArchiveCollection, ArchiveDocument, ArchiveFolder } from "@/lib/archive-types";

interface ArchiveTreeProps {
  collections: ArchiveCollection[];
}

export function ArchiveTree({ collections }: ArchiveTreeProps) {
  return (
    <div className="space-y-4">
      {collections.map((collection) => (
        <section
          key={collection.id}
          className="border border-stone-200 bg-white p-5 shadow-sm"
        >
          <div className="flex flex-col gap-2 border-b border-stone-200 pb-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-wide text-stone-500">
                Collection {collection.code}
              </p>
              <h2 className="mt-1 text-xl font-semibold text-stone-950">
                {collection.title}
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
                {collection.description}
              </p>
            </div>
            <div className="text-sm text-stone-600 md:text-right">
              <p>{collection.dateRange.label}</p>
              <p className="mt-1 capitalize">{formatStatus(collection.status)}</p>
            </div>
          </div>
          <div className="mt-4">
            <FolderList folders={collection.folders} depth={0} />
          </div>
        </section>
      ))}
    </div>
  );
}

function FolderList({ folders, depth }: { folders: ArchiveFolder[]; depth: number }) {
  return (
    <ul className="space-y-3">
      {folders.map((folder) => (
        <li key={folder.id}>
          <FolderNode folder={folder} depth={depth} />
        </li>
      ))}
    </ul>
  );
}

function FolderNode({ folder, depth }: { folder: ArchiveFolder; depth: number }) {
  return (
    <div className="border-l border-stone-300 pl-4" style={{ marginLeft: depth * 14 }}>
      <div className="flex flex-col gap-1 md:flex-row md:items-baseline md:justify-between">
        <div>
          <p className="font-mono text-xs text-stone-500">{folder.callNumber}</p>
          <h3 className="text-base font-medium text-stone-900">{folder.title}</h3>
          {folder.description ? (
            <p className="mt-1 max-w-3xl text-sm leading-6 text-stone-600">
              {folder.description}
            </p>
          ) : null}
        </div>
        {folder.dateRange ? (
          <span className="text-sm text-stone-500">{folder.dateRange.label}</span>
        ) : null}
      </div>

      {folder.documents?.length ? (
        <DocumentList documents={folder.documents} />
      ) : null}

      {folder.children?.length ? (
        <div className="mt-3">
          <FolderList folders={folder.children} depth={depth + 1} />
        </div>
      ) : null}
    </div>
  );
}

function DocumentList({ documents }: { documents: ArchiveDocument[] }) {
  return (
    <ul className="mt-3 space-y-2">
      {documents.map((document) => (
        <li key={document.id} className="bg-stone-50 px-3 py-3">
          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="font-mono text-xs text-stone-500">{document.callNumber}</p>
              <p className="font-medium text-stone-900">{document.title}</p>
              <p className="mt-1 text-sm text-stone-600">
                {formatKind(document.kind)}
                {document.date ? ` · ${document.date}` : ""}
                {document.language?.length ? ` · ${document.language.join(", ")}` : ""}
              </p>
              {document.physicalDescription ? (
                <p className="mt-1 text-sm text-stone-600">
                  {document.physicalDescription}
                </p>
              ) : null}
            </div>
            <div className="font-mono text-xs text-stone-500 md:text-right">
              {document.pages.length} page{document.pages.length > 1 ? "s" : ""}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function formatStatus(status: ArchiveCollection["status"]) {
  const labels: Record<ArchiveCollection["status"], string> = {
    inventoried: "inventorie",
    processing: "en traitement",
    restricted: "restreint",
  };

  return labels[status];
}

function formatKind(kind: ArchiveDocument["kind"]) {
  const labels: Record<ArchiveDocument["kind"], string> = {
    correspondence: "Correspondance",
    register: "Registre",
    map: "Carte ou plan",
    photograph: "Photographie",
    "administrative-file": "Dossier administratif",
    other: "Autre document",
  };

  return labels[kind];
}
