"use client";

import { useMemo, useState } from "react";
import { ExternalLink, FolderSearch, ShieldAlert } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { PipelineSteps } from "@/components/inventory/pipeline-steps";

export interface DriveInventoryFile {
  conversionNeeded?: boolean;
  conversionTarget?: "jpg" | "pdf" | "png" | null;
  createdTime?: string;
  fileKind?: "image" | "pdf" | "unknown";
  fileName: string;
  mimeType: string;
  driveFileId: string;
  driveUrl: string;
  ingestionNote?: string;
  modifiedTime?: string;
  preparationNote?: string;
  preparationStatus?:
    | "excluded"
    | "needs_ordering"
    | "ready_for_conversion"
    | "to_inventory";
  probablePageNumber: number | null;
  sampleCandidate?: boolean;
  sampleNote?: string | null;
  sampleOrder?: number | null;
  status: "to_inventory";
}

export interface DriveInventorySource {
  collectionId: string;
  title: string;
  driveFolderUrl: string;
  files: DriveInventoryFile[];
  status: "to_inventory";
}

export interface DriveInventory {
  generatedAt: string;
  fileCount?: number;
  mode: "drive" | "manual_snapshot" | "mock";
  sourceFile?: string;
  sourceCount?: number;
  notes?: string[];
  warning?: string;
  sources: DriveInventorySource[];
}

type SampleFilter = "all" | "sample" | "outside_sample";

interface DriveInventoryBrowserProps {
  inventory: DriveInventory | null;
}

export function DriveInventoryBrowser({ inventory }: DriveInventoryBrowserProps) {
  const [sampleFilter, setSampleFilter] = useState<SampleFilter>("all");
  const allFiles = inventory?.sources.flatMap((source) => source.files) ?? [];
  const totalFiles =
    inventory?.sources.reduce((total, source) => total + source.files.length, 0) ?? 0;
  const imageCount = allFiles.filter((file) => getFileKind(file) === "image").length;
  const conversionNeededCount = allFiles.filter(getConversionNeeded).length;
  const needsOrderingCount = allFiles.filter(
    (file) => getPreparationStatus(file) === "needs_ordering",
  ).length;
  const readyForConversionCount = allFiles.filter(
    (file) => getPreparationStatus(file) === "ready_for_conversion",
  ).length;
  const sampleCount = allFiles.filter(isSampleCandidate).length;
  const isEmptyOrMock = !inventory || inventory.mode === "mock" || totalFiles === 0;
  const isManualSnapshot = inventory?.mode === "manual_snapshot";

  const filteredSources = useMemo(() => {
    if (!inventory) {
      return [];
    }

    return inventory.sources.map((source) => ({
      ...source,
      files: source.files.filter((file) => {
        if (sampleFilter === "sample") {
          return isSampleCandidate(file);
        }

        if (sampleFilter === "outside_sample") {
          return !isSampleCandidate(file);
        }

        return true;
      }),
    }));
  }, [inventory, sampleFilter]);

  const filteredCount = filteredSources.reduce(
    (total, source) => total + source.files.length,
    0,
  );

  return (
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
        <SummaryCard label="Images" value={String(imageCount)} />
        <SummaryCard label="Conversions" value={String(conversionNeededCount)} />
        <SummaryCard label="À ordonner" value={String(needsOrderingCount)} />
        <SummaryCard label="Prêts conversion" value={String(readyForConversionCount)} />
        <SummaryCard label="Échantillon pilote" value={String(sampleCount)} />
      </div>

      <PipelineSteps />

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
                  Inventaire partiel ; les fichiers ne sont pas encore des documents
                  validés.
                </p>
              )}
              <p>Les fichiers n&apos;ont pas été lus.</p>
              <p>Les images n&apos;ont pas été OCRisées.</p>
              <p>Les fichiers listés ne sont pas encore des notices validées.</p>
              <p>
                La conversion fichier → page/document nécessitera une validation
                humaine.
              </p>
              <p>
                Une image HEIC n&apos;est pas encore une page validée : l&apos;ordre
                des fichiers doit être vérifié avant rattachement.
              </p>
              <p>
                La conversion HEIC → JPG est une étape technique préalable ;
                l&apos;OCR ne devra commencer qu&apos;après validation d&apos;un petit
                échantillon.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-8 border border-paper-border bg-paper p-6">
        <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
          Échantillon pilote de conversion
        </p>
        <div className="mt-3 space-y-2 text-sm leading-6 text-foreground/80">
          <p>
            L&apos;échantillon sert uniquement à préparer un futur test de conversion
            HEIC → JPG et de contrôle OCR sur un périmètre réduit.
          </p>
          <p>
            Les fichiers ne sont pas encore convertis, leur ordre reste provisoire
            et ils devront être contrôlés visuellement avant tout OCR.
          </p>
        </div>
      </section>

      <div className="mb-8 flex flex-col gap-3 border border-paper-border bg-paper p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
            Filtre échantillon
          </p>
          <p className="mt-1 text-sm text-foreground/75">
            {filteredCount} fichier{filteredCount > 1 ? "s" : ""} affiché
            {filteredCount > 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterButton
            active={sampleFilter === "all"}
            onClick={() => setSampleFilter("all")}
          >
            Tous
          </FilterButton>
          <FilterButton
            active={sampleFilter === "sample"}
            onClick={() => setSampleFilter("sample")}
          >
            Échantillon pilote
          </FilterButton>
          <FilterButton
            active={sampleFilter === "outside_sample"}
            onClick={() => setSampleFilter("outside_sample")}
          >
            Hors échantillon
          </FilterButton>
        </div>
      </div>

      {isEmptyOrMock && (
        <div className="mb-8 border-2 border-dashed border-paper-border bg-paper/30 p-8 text-center text-sm leading-6 text-warm">
          L&apos;inventaire Drive pilote est prêt, mais aucun fichier réel n&apos;a
          encore été listé.
        </div>
      )}

      {inventory ? (
        <div className="space-y-6">
          {filteredSources.map((source) => (
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
                    Aucun fichier ne correspond au filtre sélectionné.
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
  );
}

function FileRow({ file }: { file: DriveInventoryFile }) {
  return (
    <article
      className={`border bg-background p-4 transition-colors ${
        isSampleCandidate(file)
          ? "border-warm bg-warm/5"
          : "border-paper-border"
      }`}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="font-medium text-foreground flex items-center gap-2">
            {file.fileName}
            {isSampleCandidate(file) && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-warm text-paper">
                Échantillon pilote
              </span>
            )}
          </h3>
          <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-3 text-sm">
            <MetaItem label="Type MIME" value={file.mimeType} />
            <MetaItem
              label="Type interprété"
              value={formatFileKind(getFileKind(file))}
            />
            {getConversionNeeded(file) && (
              <MetaItem
                label="Conversion"
                value={`Vers ${formatConversionTarget(getConversionTarget(file))}`}
              />
            )}
            <MetaItem
              label="Page probable"
              value={file.probablePageNumber?.toString() ?? "N/A"}
            />
            {file.sampleOrder && (
              <MetaItem
                label="Ordre"
                value={String(file.sampleOrder)}
              />
            )}
          </dl>
          {file.ingestionNote && (
            <p className="mt-3 text-sm leading-6 text-warm">{file.ingestionNote}</p>
          )}
          <p className="mt-2 text-sm leading-6 text-foreground/75">
            {getPreparationNote(file)}
          </p>
          {file.sampleNote && (
            <p className="mt-2 text-sm leading-6 text-foreground/75">
              {file.sampleNote}
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap items-start gap-2 lg:justify-end">
          <StatusBadge variant="neutral">À inventorier</StatusBadge>
          <StatusBadge
            variant={getPreparationStatus(file) === "needs_ordering" ? "warning" : "neutral"}
          >
            {formatPreparationStatus(getPreparationStatus(file))}
          </StatusBadge>
          {getConversionNeeded(file) && (
            <StatusBadge variant="warning">Conversion requise</StatusBadge>
          )}
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

function FilterButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`border px-3 py-2 text-sm font-medium transition ${
        active
          ? "border-warm bg-warm text-paper"
          : "border-paper-border bg-background text-warm hover:text-foreground"
      }`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
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

function getFileKind(file: DriveInventoryFile): NonNullable<DriveInventoryFile["fileKind"]> {
  if (file.fileKind) {
    return file.fileKind;
  }

  const mimeType = file.mimeType.toLocaleLowerCase("fr");
  if (mimeType.startsWith("image/")) {
    return "image";
  }

  if (mimeType === "application/pdf") {
    return "pdf";
  }

  return "unknown";
}

function getConversionNeeded(file: DriveInventoryFile): boolean {
  if (typeof file.conversionNeeded === "boolean") {
    return file.conversionNeeded;
  }

  const mimeType = file.mimeType.toLocaleLowerCase("fr");
  return mimeType === "image/heif" || mimeType === "image/heic";
}

function getConversionTarget(file: DriveInventoryFile): DriveInventoryFile["conversionTarget"] {
  if (file.conversionTarget) {
    return file.conversionTarget;
  }

  return getConversionNeeded(file) ? "jpg" : null;
}

function getPreparationStatus(
  file: DriveInventoryFile,
): NonNullable<DriveInventoryFile["preparationStatus"]> {
  if (file.preparationStatus) {
    return file.preparationStatus;
  }

  return getFileKind(file) === "image" ? "needs_ordering" : "to_inventory";
}

function getPreparationNote(file: DriveInventoryFile): string {
  if (file.preparationNote) {
    return file.preparationNote;
  }

  if (getConversionNeeded(file)) {
    return "Image HEIC listée depuis Drive ; conversion nécessaire avant OCR ; ordre et rattachement page/document à vérifier.";
  }

  if (getFileKind(file) === "image") {
    return "Image listée depuis Drive ; ordre et rattachement page/document à vérifier avant toute exploitation.";
  }

  return "Fichier listé depuis Drive ; type et rattachement archivistique à vérifier avant traitement.";
}

function isSampleCandidate(file: DriveInventoryFile): boolean {
  return file.sampleCandidate === true;
}

function formatFileKind(kind: NonNullable<DriveInventoryFile["fileKind"]>): string {
  const labels: Record<NonNullable<DriveInventoryFile["fileKind"]>, string> = {
    image: "Image",
    pdf: "PDF",
    unknown: "Inconnu",
  };

  return labels[kind];
}

function formatConversionTarget(
  target: DriveInventoryFile["conversionTarget"] | undefined,
): string {
  return target ? target.toUpperCase() : "Aucune";
}

function formatPreparationStatus(
  status: NonNullable<DriveInventoryFile["preparationStatus"]>,
): string {
  const labels: Record<NonNullable<DriveInventoryFile["preparationStatus"]>, string> = {
    excluded: "Exclu",
    needs_ordering: "À ordonner",
    ready_for_conversion: "Prêt pour conversion",
    to_inventory: "À inventorier",
  };

  return labels[status];
}
