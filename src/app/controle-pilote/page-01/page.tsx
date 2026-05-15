import Link from "next/link";
import {
  ArrowLeft,
  ClipboardCheck,
  ExternalLink,
  FileWarning,
  ShieldAlert,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import pilotAssetsManifest from "../../../../data/generated/public-pilot-assets.example.json";
import assistedReadingExample from "../../../../data/examples/assisted-reading-page-01.example.json";

type PilotAsset = {
  collectionId: string;
  originalDriveFileId: string;
  originalDriveUrl: string;
  localJpgFileName: string;
  r2ObjectKey: string;
  publicUrl: string;
  publicationStatus: "image_published_unvalidated";
  validationStatus: "unverified";
  note: string;
};

type PilotAssetsManifest = {
  assets: PilotAsset[];
};

type AssistedReadingExample = {
  assistedReadingText: string;
  status: "assisted_unverified";
  uncertainties: AssistedReadingUncertainty[];
  humanValidation: {
    validated: boolean;
    validatedBy: string | null;
    validatedAt: string | null;
    notes: string | null;
  };
};

type AssistedReadingUncertainty = {
  fragment: string;
  suggestion: string;
  issue: string;
  confidence: "low" | "medium" | "high";
  note: string;
};

const firstPilotAsset = (pilotAssetsManifest as PilotAssetsManifest).assets[0];
const assistedReading = assistedReadingExample as AssistedReadingExample;

export default function PilotPage01Review() {
  return (
    <main className="min-h-screen bg-background pb-16">
      <div className="border-b border-paper-border bg-paper/60">
        <div className="mx-auto flex max-w-7xl flex-wrap gap-4 px-6 py-4 lg:px-8">
          <Link
            href="/controle-pilote"
            className="inline-flex items-center gap-2 text-sm text-warm hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour au controle pilote
          </Link>
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
        <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
            Controle detaille pilote
          </p>
          <h1 className="mt-3 font-serif text-4xl font-medium text-foreground md:text-5xl">
            Image pilote 01
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-foreground/80">
            Cette page rapproche l&apos;image publiee sur R2 d&apos;une lecture
            assistee exemple deja marquee comme non validee. Elle ne publie pas
            les OCR locaux et ne valide pas la page.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)] lg:px-8">
        <section className="space-y-8">
          <SourceVisual asset={firstPilotAsset} />
          <MethodologyBlock />
        </section>

        <aside className="space-y-8">
          <AssistedReadingPanel reading={assistedReading} />
          <HumanValidationPanel reading={assistedReading} />
        </aside>
      </section>
    </main>
  );
}

function SourceVisual({ asset }: { asset: PilotAsset }) {
  return (
    <section className="border border-paper-border bg-paper">
      <div className="border-b border-paper-border bg-background/60 px-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
              A. Source visuelle
            </p>
            <h2 className="mt-1 break-all font-serif text-2xl font-medium text-foreground">
              {asset.localJpgFileName}
            </h2>
          </div>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <StatusBadge variant="warning">Image pilote non validee</StatusBadge>
            <StatusBadge variant="neutral">{asset.validationStatus}</StatusBadge>
          </div>
        </div>
      </div>

      <div className="bg-background p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt={`Image pilote 01 - ${asset.localJpgFileName}`}
          className="max-h-[850px] w-full border border-paper-border bg-paper object-contain"
          src={asset.publicUrl}
        />
      </div>

      <div className="space-y-5 px-5 py-5">
        <dl className="grid gap-4 text-sm md:grid-cols-2">
          <MetaItem label="Collection" value={asset.collectionId} />
          <MetaItem label="Publication" value={asset.publicationStatus} />
          <MetaItem label="Validation" value={asset.validationStatus} />
          <MetaItem label="Objet R2" value={asset.r2ObjectKey} />
          <MetaItem label="Fichier Drive" value={asset.originalDriveFileId} />
          <MetaItem label="Nom fichier" value={asset.localJpgFileName} />
        </dl>

        <div className="border border-paper-border bg-background p-4 text-sm leading-6 text-foreground/80">
          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
            Prudence
          </p>
          <p className="mt-2">
            Cette image pilote n&apos;est pas encore validee comme page definitive.
            Son ordre, son rattachement documentaire et sa transcription restent
            a verifier.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <SourceLink href={asset.publicUrl}>Lien R2</SourceLink>
          <SourceLink href={asset.originalDriveUrl}>Drive d&apos;origine</SourceLink>
        </div>
      </div>
    </section>
  );
}

function AssistedReadingPanel({ reading }: { reading: AssistedReadingExample }) {
  return (
    <section className="border border-paper-border bg-paper">
      <div className="border-b border-paper-border bg-background/60 px-5 py-4">
        <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
          B. Lecture assistee non validee
        </p>
        <h2 className="mt-1 font-serif text-2xl font-medium text-foreground">
          Texte propose
        </h2>
      </div>

      <div className="space-y-5 px-5 py-5">
        <div className="flex flex-wrap gap-2">
          <StatusBadge variant="warning">{reading.status}</StatusBadge>
          <StatusBadge variant="neutral">
            Validation humaine : {reading.humanValidation.validated ? "oui" : "non"}
          </StatusBadge>
          <StatusBadge variant="warning">
            Confiance : {getOverallConfidence(reading.uncertainties)}
          </StatusBadge>
        </div>

        <div className="border border-paper-border bg-background p-4">
          <div className="flex items-start gap-3 text-sm leading-6 text-foreground/80">
            <ShieldAlert className="mt-1 h-5 w-5 shrink-0 text-warm" />
            <p>
              Cette lecture assistee est un exemple non valide. Elle peut aider
              la consultation, mais les noms propres, lieux, dates et sigles
              doivent etre controles sur l&apos;image.
            </p>
          </div>
        </div>

        <pre className="max-h-[640px] overflow-auto whitespace-pre-wrap border border-paper-border bg-background p-4 font-serif text-sm leading-7 text-foreground">
          {reading.assistedReadingText}
        </pre>

        <section>
          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
            Incertitudes principales
          </p>
          <div className="mt-3 space-y-3">
            {reading.uncertainties.map((uncertainty) => (
              <div
                className="border border-paper-border bg-background p-3 text-sm"
                key={`${uncertainty.issue}-${uncertainty.fragment}`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge variant="warning">{uncertainty.confidence}</StatusBadge>
                  <span className="font-mono text-xs uppercase tracking-widest text-warm">
                    {uncertainty.issue}
                  </span>
                </div>
                <p className="mt-2 font-medium text-foreground">
                  {uncertainty.fragment}
                </p>
                {uncertainty.suggestion && (
                  <p className="mt-1 text-foreground/75">
                    Suggestion : {uncertainty.suggestion}
                  </p>
                )}
                <p className="mt-2 leading-6 text-foreground/75">
                  {uncertainty.note}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}

function MethodologyBlock() {
  return (
    <section className="border border-paper-border bg-paper p-6">
      <div className="flex items-start gap-3">
        <FileWarning className="mt-1 h-5 w-5 shrink-0 text-warm" />
        <div>
          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
            Couches textuelles
          </p>
          <div className="mt-3 space-y-2 text-sm leading-6 text-foreground/80">
            <p>OCR brut produit localement, mais non publie dans l&apos;application.</p>
            <p>OCR nettoye produit localement, mais non publie dans l&apos;application.</p>
            <p>Lecture assistee fournie ici comme exemple non valide.</p>
            <p>Transcription validee non disponible.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function HumanValidationPanel({ reading }: { reading: AssistedReadingExample }) {
  return (
    <section className="border border-paper-border bg-paper p-6">
      <div className="flex items-start gap-3">
        <ClipboardCheck className="mt-1 h-5 w-5 shrink-0 text-warm" />
        <div>
          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
            C. Validation humaine
          </p>
          <h2 className="mt-2 font-serif text-2xl font-medium text-foreground">
            Non valide
          </h2>
          <div className="mt-4 space-y-2 text-sm leading-6 text-foreground/80">
            <p>Statut : {reading.humanValidation.validated ? "Valide" : "Non valide"}</p>
            <p>A verifier sur image.</p>
            <p>
              Les noms propres, lieux, dates et sigles doivent etre controles
              avant toute citation ou indexation.
            </p>
            <p>
              Aucun workflow d&apos;edition n&apos;est actif dans cette etape.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function SourceLink({ children, href }: { children: string; href: string }) {
  return (
    <a
      className="inline-flex items-center gap-2 text-sm text-warm underline decoration-paper-border underline-offset-4 hover:text-foreground"
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      {children}
      <ExternalLink className="h-3.5 w-3.5" />
    </a>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
        {label}
      </dt>
      <dd className="mt-1 break-all font-medium text-foreground">{value}</dd>
    </div>
  );
}

function getOverallConfidence(
  uncertainties: AssistedReadingUncertainty[],
): "low" | "medium" | "high" {
  if (uncertainties.some((uncertainty) => uncertainty.confidence === "low")) {
    return "low";
  }

  if (uncertainties.some((uncertainty) => uncertainty.confidence === "medium")) {
    return "medium";
  }

  return "high";
}
