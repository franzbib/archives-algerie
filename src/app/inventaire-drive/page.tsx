import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import Link from "next/link";
import { ArrowLeft, ExternalLink, FolderSearch, ShieldAlert } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";

interface DriveInventoryFile {
  createdTime?: string;
  fileName: string;
  mimeType: string;
  driveFileId: string;
  driveUrl: string;
  ingestionNote?: string;
  modifiedTime?: string;
  probablePageNumber: number | null;
  status: "to_inventory";
}

interface DriveInventorySource {
  collectionId: string;
  title: string;
  driveFolderUrl: string;
  files: DriveInventoryFile[];
  status: "to_inventory";
}

interface DriveInventory {
  generatedAt: string;
  fileCount?: number;
  mode: "drive" | "manual_snapshot" | "mock";
  sourceFile?: string;
  sourceCount?: number;
  notes?: string[];
  warning?: string;
  sources: DriveInventorySource[];
}

const inventoryPath = path.join(
  process.cwd(),
  "data",
  "generated",
  "drive-inventory.pilot.json",
);

export default function DriveInventoryPage() {
  const inventory = readPilotInventory();
  const totalFiles =
    inventory?.sources.reduce((total, source) => total + source.files.length, 0) ?? 0;
  const isEmptyOrMock = !inventory || inventory.mode === "mock" || totalFiles === 0;
  const isManualSnapshot = inventory?.mode === "manual_snapshot";

  return (
    <main className="min-h-screen bg-background pb-16">
      <div className="border-b border-paper-border bg-paper/60">
        <div className="mx-auto max-w-6xl px-6 py-4 lg:px-8">
          <Link
            href="/inventaire"
            className="inline-flex items-center gap-2 text-sm text-warm hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour au suivi de l&apos;inventaire
          </Link>
        </div>
      </div>

      <section className="border-b border-paper-border bg-paper">
        <div className="mx-auto max-w-6xl px-6 py-14 lg:px-8">
          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
            Inventaire Drive brut
          </p>
          <h1 className="mt-3 font-serif text-4xl font-medium text-foreground md:text-5xl">
            Inventaire Drive pilote
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-foreground/80">
            Cette page présente la sortie locale du pilote Drive pour une seule
            collection. Elle ne modifie pas le manifeste principal et ne valide
            aucun document.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10 lg:px-8">
        <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard label="Mode" value={formatMode(inventory?.mode)} />
          <SummaryCard
            label="Généré le"
            value={inventory ? formatDate(inventory.generatedAt) : "Non généré"}
          />
          <SummaryCard
            label="Sources"
            value={String(inventory?.sourceCount ?? inventory?.sources.length ?? 0)}
          />
          <SummaryCard
            label="Fichiers listés"
            value={String(inventory?.fileCount ?? totalFiles)}
          />
        </div>

        <section className="mb-8 border border-paper-border bg-paper p-6">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-1 h-5 w-5 shrink-0 text-warm" />
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
                Avertissement méthodologique
              </p>
              <div className="mt-3 space-y-2 text-sm leading-6 text-foreground/80">
                {inventory?.warning && <p>{inventory.warning}</p>}
                <p>Cette page présente un inventaire brut.</p>
                {isManualSnapshot && (
                  <p>
                    Inventaire partiel ; les fichiers ne sont pas encore des
                    documents validés.
                  </p>
                )}
                <p>Les fichiers n&apos;ont pas été lus.</p>
                <p>Les images n&apos;ont pas été OCRisées.</p>
                <p>Les fichiers listés ne sont pas encore des notices validées.</p>
                <p>
                  La conversion fichier → page/document nécessitera une validation
                  humaine.
                </p>
              </div>
            </div>
          </div>
        </section>

        {isEmptyOrMock && (
          <div className="mb-8 border-2 border-dashed border-paper-border bg-paper/30 p-8 text-center text-sm leading-6 text-warm">
            L&apos;inventaire Drive pilote est prêt, mais aucun fichier réel n&apos;a
            encore été listé.
          </div>
        )}

        {inventory ? (
          <div className="space-y-6">
            {inventory.sources.map((source) => (
              <section
                className="border border-paper-border bg-paper p-6"
                key={source.collectionId}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
                      {source.collectionId}
                    </p>
                    <h2 className="mt-2 font-serif text-2xl font-medium text-foreground">
                      {source.title}
                    </h2>
                    <a
                      className="mt-3 inline-flex items-center gap-2 text-sm text-warm underline decoration-paper-border underline-offset-4 hover:text-foreground"
                      href={source.driveFolderUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      Dossier Drive source
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    <StatusBadge variant="neutral">{source.status}</StatusBadge>
                    <StatusBadge variant="neutral">
                      {source.files.length} fichier{source.files.length > 1 ? "s" : ""}
                    </StatusBadge>
                  </div>
                </div>

                <div className="mt-6 border-t border-paper-border pt-5">
                  {source.files.length > 0 ? (
                    <div className="grid gap-3">
                      {source.files.map((file) => (
                        <FileRow file={file} key={file.driveFileId} />
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 text-sm text-warm">
                      <FolderSearch className="h-4 w-4" />
                      Aucun fichier listé dans cette sortie pilote.
                    </div>
                  )}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="border-2 border-dashed border-paper-border bg-paper/30 p-8 text-center text-sm leading-6 text-warm">
            Aucun fichier `data/generated/drive-inventory.pilot.json` n&apos;est
            disponible pour le moment.
          </div>
        )}
      </section>
    </main>
  );
}

function FileRow({ file }: { file: DriveInventoryFile }) {
  return (
    <article className="border border-paper-border bg-background p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="font-medium text-foreground">{file.fileName}</h3>
          <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
            <MetaItem label="Type MIME" value={file.mimeType} />
            <MetaItem
              label="Créé le"
              value={file.createdTime ? formatDate(file.createdTime) : "Non renseigné"}
            />
            <MetaItem
              label="Modifié le"
              value={
                file.modifiedTime ? formatDate(file.modifiedTime) : "Non renseigné"
              }
            />
            <MetaItem
              label="Page probable"
              value={file.probablePageNumber?.toString() ?? "Non renseigné"}
            />
          </dl>
          {file.ingestionNote && (
            <p className="mt-3 text-sm leading-6 text-warm">{file.ingestionNote}</p>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2 lg:justify-end">
          <StatusBadge variant="neutral">À inventorier</StatusBadge>
          <a
            className="inline-flex items-center gap-2 text-sm text-warm underline decoration-paper-border underline-offset-4 hover:text-foreground"
            href={file.driveUrl}
            rel="noreferrer"
            target="_blank"
          >
            Drive
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </article>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-paper-border bg-paper p-4">
      <p className="font-mono text-xs uppercase tracking-wide text-warm">{label}</p>
      <p className="mt-2 text-xl font-semibold text-foreground">{value}</p>
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

function readPilotInventory(): DriveInventory | null {
  if (!existsSync(inventoryPath)) {
    return null;
  }

  const raw = readFileSync(inventoryPath, "utf8");
  return JSON.parse(raw) as DriveInventory;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Europe/Paris",
  }).format(new Date(value));
}

function formatMode(mode: DriveInventory["mode"] | undefined): string {
  const labels: Record<DriveInventory["mode"], string> = {
    drive: "Drive API",
    manual_snapshot: "Snapshot manuel",
    mock: "Mock",
  };

  return mode ? labels[mode] : "Absent";
}
