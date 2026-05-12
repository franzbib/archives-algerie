import Link from "next/link";
import { ExternalLink, FileText } from "lucide-react";
import {
  getDocumentTypeLabel,
  getStatusLabel,
} from "@/lib/archiveManifest";
import type { Document } from "@/types/archive";
import { StatusBadge } from "@/components/ui/status-badge";

interface DocumentListProps {
  documents: Document[];
}

export function DocumentList({ documents }: DocumentListProps) {
  if (documents.length === 0) {
    return (
      <div className="border border-dashed border-paper-border bg-paper/60 p-6 text-sm text-warm">
        Aucun document n&apos;est encore rattache a cette collection dans le manifeste.
      </div>
    );
  }

  return (
    <div className="overflow-hidden border border-paper-border bg-paper">
      <div className="divide-y divide-paper-border">
        {documents.map((document) => (
          <article key={document.id} className="p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <p className="font-mono text-xs uppercase tracking-widest text-warm">
                  {document.archiveReference ?? document.collectionId}
                  {document.folderTitle ? ` / ${document.folderTitle}` : ""}
                </p>
                <h3 className="mt-2 font-serif text-xl font-medium text-foreground">
                  <Link
                    href={`/documents/${document.id}`}
                    className="underline-offset-4 hover:underline"
                  >
                    {document.title}
                  </Link>
                </h3>
                <p className="mt-2 text-sm leading-6 text-foreground/80">
                  {document.summary}
                </p>
              </div>

              <div className="flex shrink-0 flex-col gap-3 lg:items-end">
                <StatusBadge variant={document.ocrStatus === "ocr_done" ? "success" : "warning"}>
                  {getStatusLabel(document.ocrStatus)}
                </StatusBadge>
                <a
                  href={document.driveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-warm underline decoration-paper-border underline-offset-4 hover:text-foreground"
                >
                  Source Drive
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Tag>{getDocumentTypeLabel(document.documentType)}</Tag>
              <Tag>{document.dateLabel}</Tag>
              <Tag>{document.place}</Tag>
              {document.keywords.slice(0, 4).map((keyword) => (
                <Tag key={keyword}>{keyword}</Tag>
              ))}
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs text-warm">
              <FileText className="h-4 w-4" />
              <span>
                {document.pages?.length ?? 0} page
                {(document.pages?.length ?? 0) > 1 ? "s" : ""} referencee
                {(document.pages?.length ?? 0) > 1 ? "s" : ""}
              </span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function Tag({ children }: { children: string }) {
  return (
    <span className="border border-paper-border/70 bg-sepia px-2 py-1 font-mono text-[10px] uppercase tracking-wide text-warm">
      {children}
    </span>
  );
}
