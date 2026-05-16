"use client";

import Link from "next/link";
import { ExternalLink, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { StatusBadge } from "@/components/ui/status-badge";
import type { ArchiveBatchAsset, ArchiveBatchReviewItem } from "@/lib/archiveBatches";
import type { PageLanguageDetection } from "@/lib/languageDetection";

type LotReviewBrowserProps = {
  lotId: string;
  assets: ArchiveBatchAsset[];
  languageDetections: PageLanguageDetection[];
  reviewItems: ArchiveBatchReviewItem[];
};

type NumberedAsset = {
  asset: ArchiveBatchAsset;
  languageDetection: PageLanguageDetection | undefined;
  order: number;
  reviewItem: ArchiveBatchReviewItem | undefined;
};

type AssetGroup = {
  label: string;
  assets: NumberedAsset[];
};

export function LotReviewBrowser({
  lotId,
  assets,
  languageDetections,
  reviewItems,
}: LotReviewBrowserProps) {
  const [query, setQuery] = useState("");
  const languageDetectionById = useMemo(
    () => new Map(languageDetections.map((item) => [item.reviewId, item])),
    [languageDetections],
  );
  const reviewById = useMemo(
    () => new Map(reviewItems.map((item) => [item.reviewId, item])),
    [reviewItems],
  );

  const numberedAssets = useMemo(
    () =>
      assets.map((asset, index) => ({
        asset,
        languageDetection: languageDetectionById.get(asset.reviewId),
        order: index + 1,
        reviewItem: reviewById.get(asset.reviewId),
      })),
    [assets, languageDetectionById, reviewById],
  );

  const filteredAssets = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return numberedAssets;

    return numberedAssets.filter(({ asset }) =>
      [
        asset.reviewId,
        asset.localJpgFileName,
        asset.r2ObjectKey,
        asset.originalDriveFileId,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [numberedAssets, query]);

  const groups = useMemo(() => groupAssetsByRange(filteredAssets), [filteredAssets]);

  return (
    <section className="space-y-8">
      <div className="border border-paper-border bg-paper p-5">
        <label
          className="font-mono text-xs font-semibold uppercase tracking-widest text-warm"
          htmlFor="lot-page-search"
        >
          Filtrer dans le lot
        </label>
        <div className="mt-3 flex items-center gap-3 border border-paper-border bg-background px-3 py-2">
          <Search className="h-4 w-4 shrink-0 text-warm" />
          <input
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-foreground/45"
            id="lot-page-search"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher par reviewId, nom de fichier ou identifiant Drive"
            type="search"
            value={query}
          />
        </div>
        <p className="mt-3 text-sm text-foreground/65">
          {filteredAssets.length} page{filteredAssets.length > 1 ? "s" : ""} affichee
          {filteredAssets.length > 1 ? "s" : ""} sur {assets.length}.
        </p>
      </div>

      {groups.length > 0 ? (
        groups.map((group) => (
          <section className="space-y-4" key={group.label}>
            <div className="border-b border-paper-border pb-3">
              <h2 className="font-serif text-2xl font-medium text-foreground">
                Pages {group.label}
              </h2>
              <p className="mt-1 text-sm text-foreground/65">
                {group.assets.length} item{group.assets.length > 1 ? "s" : ""} dans
                cette tranche.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {group.assets.map(({ asset, languageDetection, order, reviewItem }) => (
                <LotAssetCard
                  asset={asset}
                  key={asset.r2ObjectKey}
                  languageDetection={languageDetection}
                  lotId={lotId}
                  order={order}
                  reviewItem={reviewItem}
                />
              ))}
            </div>
          </section>
        ))
      ) : (
        <section className="border border-paper-border bg-paper p-8">
          <h2 className="font-serif text-2xl font-medium text-foreground">
            Aucun item trouve
          </h2>
          <p className="mt-3 text-sm leading-6 text-foreground/75">
            Aucun reviewId ou nom de fichier ne correspond au filtre saisi.
          </p>
        </section>
      )}
    </section>
  );
}

function LotAssetCard({
  asset,
  languageDetection,
  lotId,
  order,
  reviewItem,
}: {
  asset: ArchiveBatchAsset;
  languageDetection: PageLanguageDetection | undefined;
  lotId: string;
  order: number;
  reviewItem: ArchiveBatchReviewItem | undefined;
}) {
  return (
    <article className="border border-paper-border bg-paper">
      <div className="border-b border-paper-border bg-background/60 px-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
              Page technique {order} - {asset.reviewId}
            </p>
            <h3 className="mt-1 break-all font-serif text-xl font-medium text-foreground">
              {asset.localJpgFileName}
            </h3>
          </div>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            {reviewItem?.reviewStatus === "assisted_unverified" ? (
              <StatusBadge variant="success">Lecture assistee disponible</StatusBadge>
            ) : (
              <StatusBadge variant="neutral">Lecture assistee non disponible</StatusBadge>
            )}
            <StatusBadge variant="warning">Non valide</StatusBadge>
            {languageDetection && (
              <StatusBadge variant="neutral">
                {getLanguageBadgeLabel(languageDetection)}
              </StatusBadge>
            )}
          </div>
        </div>
      </div>

      <div className="bg-background p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt={`Image du lot ${lotId} - ${asset.localJpgFileName}`}
          className="max-h-[620px] w-full border border-paper-border bg-paper object-contain"
          loading="lazy"
          src={asset.publicUrl}
        />
      </div>

      <div className="space-y-4 px-5 py-5">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <MetaItem label="ReviewId" value={asset.reviewId} />
          <MetaItem label="Fichier source" value={asset.localJpgFileName} />
          <MetaItem label="Collection" value={asset.collectionId} />
          <MetaItem label="Validation" value={asset.validationStatus} />
          {languageDetection && (
            <MetaItem
              label="Langue detectee"
              value={`${getLanguageBadgeLabel(languageDetection)} (${languageDetection.confidence})`}
            />
          )}
        </dl>
        <p className="text-sm leading-6 text-foreground/75">{asset.note}</p>
        <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-center">
          <Link
            className="inline-flex flex-1 items-center justify-center gap-2 border border-foreground bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
            href={`/lots/${lotId}/${asset.reviewId}`}
          >
            Revoir en detail
          </Link>
          <div className="flex flex-1 flex-wrap items-center gap-4 sm:justify-end">
            <SourceLink href={asset.publicUrl}>Image R2</SourceLink>
            <SourceLink href={asset.originalDriveUrl}>Drive</SourceLink>
          </div>
        </div>
      </div>
    </article>
  );
}

function getLanguageBadgeLabel(detection: PageLanguageDetection): string {
  const languages = detection.detectedLanguages;

  if (languages.includes("fr+ar") || (languages.includes("fr") && languages.includes("ar"))) {
    return "francais + arabe";
  }
  if (languages.includes("ar")) return "arabe";
  if (languages.includes("fr")) return "francais";
  if (languages.includes("other")) return "autre";
  if (languages.includes("illegible")) return "illisible";

  return "langue non renseignee";
}

function groupAssetsByRange(assets: NumberedAsset[]): AssetGroup[] {
  const groups = new Map<string, NumberedAsset[]>();

  assets.forEach((item) => {
    const start = Math.floor((item.order - 1) / 25) * 25 + 1;
    const end = start + 24;
    const label = `${start}-${end}`;
    groups.set(label, [...(groups.get(label) ?? []), item]);
  });

  return Array.from(groups.entries()).map(([label, groupAssets]) => ({
    label,
    assets: groupAssets,
  }));
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-[10px] font-semibold uppercase tracking-widest text-warm">
        {label}
      </dt>
      <dd className="mt-1 break-all font-medium text-foreground">{value}</dd>
    </div>
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
