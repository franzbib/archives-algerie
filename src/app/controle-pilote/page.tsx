import Link from "next/link";
import { ArrowLeft, ExternalLink, ShieldAlert } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import pilotAssetsManifest from "../../../data/generated/public-pilot-assets.example.json";

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
  collectionId: string;
  assetCount: number;
  warning: string;
  assets: PilotAsset[];
};

const pilotAssets = pilotAssetsManifest as PilotAssetsManifest;

export default function PilotControlPage() {
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
            Publication R2 pilote
          </p>
          <h1 className="mt-3 font-serif text-4xl font-medium text-foreground md:text-5xl">
            Controle pilote des images publiees
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-foreground/80">
            Cette page permet de consulter les images pilotes publiees sur R2
            pour verifier l&apos;affichage, les liens et le rattachement a la
            source Drive. Elle ne valide pas les pages ni les documents.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10 lg:px-8">
        <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard label="Collection" value={pilotAssets.collectionId} />
          <SummaryCard label="Images publiees" value={String(pilotAssets.assetCount)} />
          <SummaryCard label="Publication" value="Pilote R2" />
          <SummaryCard label="Validation" value="Non verifiee" />
        </div>

        <section className="mb-8 border border-paper-border bg-paper p-6">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-1 h-5 w-5 shrink-0 text-warm" />
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
                Avertissement methodologique
              </p>
              <div className="mt-3 space-y-2 text-sm leading-6 text-foreground/80">
                <p>{pilotAssets.warning}</p>
                <p>Ces images sont publiees pour une consultation pilote.</p>
                <p>Les pages et les documents ne sont pas encore valides.</p>
                <p>L&apos;OCR ne doit pas etre affiche comme transcription fiable.</p>
                <p>
                  Tout usage historique devra revenir a l&apos;image source et au
                  fichier Drive d&apos;origine.
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          {pilotAssets.assets.map((asset, index) => (
            <PilotAssetCard asset={asset} key={asset.r2ObjectKey} order={index + 1} />
          ))}
        </div>
      </section>
    </main>
  );
}

function PilotAssetCard({ asset, order }: { asset: PilotAsset; order: number }) {
  return (
    <article className="border border-paper-border bg-paper">
      <div className="border-b border-paper-border bg-background/60 px-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
              Image pilote {order}
            </p>
            <h2 className="mt-1 break-all font-serif text-xl font-medium text-foreground">
              {asset.localJpgFileName}
            </h2>
          </div>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <StatusBadge variant="warning">Image non validee</StatusBadge>
            <StatusBadge variant="neutral">{asset.validationStatus}</StatusBadge>
          </div>
        </div>
      </div>

      <div className="bg-background p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt={`Apercu pilote ${order} - ${asset.localJpgFileName}`}
          className="max-h-[620px] w-full border border-paper-border bg-paper object-contain"
          loading="lazy"
          src={asset.publicUrl}
        />
      </div>

      <div className="space-y-4 px-5 py-5">
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <MetaItem label="Collection" value={asset.collectionId} />
          <MetaItem label="Statut publication" value={asset.publicationStatus} />
          <MetaItem label="Objet R2" value={asset.r2ObjectKey} />
          <MetaItem label="Fichier Drive" value={asset.originalDriveFileId} />
        </dl>

        <p className="text-sm leading-6 text-foreground/75">{asset.note}</p>

        <div className="flex flex-wrap gap-3">
          <a
            className="inline-flex items-center gap-2 text-sm text-warm underline decoration-paper-border underline-offset-4 hover:text-foreground"
            href={asset.publicUrl}
            rel="noreferrer"
            target="_blank"
          >
            Ouvrir l&apos;image R2
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <a
            className="inline-flex items-center gap-2 text-sm text-warm underline decoration-paper-border underline-offset-4 hover:text-foreground"
            href={asset.originalDriveUrl}
            rel="noreferrer"
            target="_blank"
          >
            Fichier Drive d&apos;origine
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
      <p className="mt-2 break-words text-xl font-semibold text-foreground">{value}</p>
    </div>
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
