import type { ArchiveCollection, ArchiveDocument, ArchiveFolder } from "@/lib/archive-types";
import Link from "next/link";
import { FileText } from "lucide-react";

interface ArchiveTreeProps {
  collections: ArchiveCollection[];
}

export function ArchiveTree({ collections }: ArchiveTreeProps) {
  return (
    <div className="space-y-8">
      {collections.map((collection) => (
        <section
          key={collection.id}
          className="border border-paper-border bg-paper p-6 lg:p-8"
        >
          <div className="flex flex-col gap-2 border-b border-paper-border pb-5 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="font-mono text-xs font-medium uppercase tracking-widest text-warm">
                Collection {collection.code}
              </p>
              <h2 className="mt-2 font-serif text-2xl font-medium text-foreground">
                {collection.title}
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-foreground/80">
                {collection.description}
              </p>
            </div>
            <div className="text-sm text-warm md:text-right">
              <p className="font-mono">{collection.dateRange.label}</p>
            </div>
          </div>
          <div className="mt-6">
            <FolderList folders={collection.folders} depth={0} />
          </div>
        </section>
      ))}
    </div>
  );
}

function FolderList({ folders, depth }: { folders: ArchiveFolder[]; depth: number }) {
  return (
    <ul className="space-y-5">
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
    <div className="border-l border-warm/30 pl-5" style={{ marginLeft: depth * 16 }}>
      <div className="flex flex-col gap-1 md:flex-row md:items-baseline md:justify-between">
        <div>
          <p className="font-mono text-xs text-warm">{folder.callNumber}</p>
          <h3 className="font-serif text-lg font-medium text-foreground">{folder.title}</h3>
          {folder.description ? (
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-foreground/80">
              {folder.description}
            </p>
          ) : null}
        </div>
        {folder.dateRange ? (
          <span className="font-mono text-xs text-warm">{folder.dateRange.label}</span>
        ) : null}
      </div>

      {folder.documents?.length ? (
        <DocumentList documents={folder.documents} />
      ) : null}

      {folder.children?.length ? (
        <div className="mt-5">
          <FolderList folders={folder.children} depth={depth + 1} />
        </div>
      ) : null}
    </div>
  );
}

function DocumentList({ documents }: { documents: ArchiveDocument[] }) {
  return (
    <ul className="mt-4 space-y-3">
      {documents.map((document) => (
        <li key={document.id} className="group relative border border-paper-border/60 bg-sepia/20 px-4 py-3 transition-colors hover:bg-sepia/40">
          <Link href={`/documents/${document.id}`} className="absolute inset-0" aria-label={`Voir le document ${document.title}`} />
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-3">
              <FileText className="mt-0.5 h-4 w-4 shrink-0 text-warm" />
              <div>
                <p className="font-mono text-[10px] text-warm">{document.callNumber}</p>
                <p className="font-medium text-foreground group-hover:underline decoration-warm underline-offset-4">{document.title}</p>
                <p className="mt-1.5 text-xs text-warm">
                  {formatKind(document.kind)}
                  {document.date ? ` · ${document.date}` : ""}
                  {document.language?.length ? ` · ${document.language.join(", ")}` : ""}
                </p>
                {document.physicalDescription ? (
                  <p className="mt-1 text-xs text-foreground/70">
                    {document.physicalDescription}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="rounded border border-paper-border/80 bg-paper px-2 py-1 font-mono text-[10px] text-warm md:text-right">
              {document.pages.length} page{document.pages.length > 1 ? "s" : ""}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
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
