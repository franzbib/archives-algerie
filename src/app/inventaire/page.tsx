import Link from "next/link";
import { ArrowLeft, ClipboardList, ShieldCheck } from "lucide-react";
import { InventoryDashboard } from "@/components/inventory/inventory-dashboard";
import { StatCard } from "@/components/stat-card";
import {
  getCollections,
  getDocuments,
  hasV1Enrichment,
} from "@/lib/archiveManifest";

export default function InventoryPage() {
  const collections = getCollections();
  const documents = getDocuments();
  const enrichedCount = collections.filter(hasV1Enrichment).length;
  const notEnrichedCount = collections.length - enrichedCount;

  return (
    <main className="min-h-screen bg-background pb-16">
      <div className="border-b border-paper-border bg-paper/60">
        <div className="mx-auto max-w-6xl px-6 py-4 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-warm hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour au catalogue
          </Link>
        </div>
      </div>

      <section className="border-b border-paper-border bg-paper">
        <div className="mx-auto max-w-6xl px-6 py-14 lg:px-8">
          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
            Pilotage du manifeste local
          </p>
          <h1 className="mt-3 font-serif text-4xl font-medium text-foreground">
            Suivi de l&apos;inventaire
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-foreground/80">
            Cette page donne une vue d&apos;ensemble des collections et documents
            décrits dans le manifeste local. Elle sert à suivre le travail
            d&apos;inventaire avant OCR, indexation et recherche sourcée.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Collections" value={collections.length} />
            <StatCard label="Documents" value={documents.length} />
            <StatCard label="Notices V1" value={enrichedCount} />
            <StatCard label="Non enrichies" value={notEnrichedCount} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10 lg:px-8">
        <div className="mb-8 border border-paper-border bg-paper p-6">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-warm" />
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
                Prudence
              </p>
              <p className="mt-2 text-sm leading-6 text-foreground/80">
                Ce suivi reflète uniquement l&apos;état du manifeste local. Il ne
                prouve pas que les documents ont été lus, ne reflète pas encore
                l&apos;OCR et ne remplace pas une validation humaine des notices.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <ClipboardList className="h-5 w-5 text-warm" />
            <div className="flex-1">
              <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
                Tableau de suivi
              </p>
              <h2 className="font-serif text-2xl font-medium text-foreground">
                Collections du manifeste
              </h2>
            </div>
          </div>
        </div>

        <div className="mb-10 grid gap-4 md:grid-cols-3">
          <Link
            href="/inventaire-drive"
            className="group border border-paper-border bg-paper p-5 transition-colors hover:border-warm/50"
          >
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-warm">
              Étape 1
            </p>
            <h3 className="mt-2 font-serif text-lg font-medium text-foreground group-hover:text-warm">
              Inventaire Drive pilote
            </h3>
            <p className="mt-2 text-xs leading-5 text-foreground/70">
              Aperçu brut des fichiers listés depuis Google Drive avant toute conversion ou rattachement archivistique.
            </p>
          </Link>
          <div className="border border-paper-border bg-paper p-5 opacity-75">
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-warm">
              Étape 2
            </p>
            <h3 className="mt-2 font-serif text-lg font-medium text-foreground">
              Pipeline local pilote
            </h3>
            <p className="mt-2 text-xs leading-5 text-foreground/70">
              Suivi des échantillons téléchargés, convertis en JPG, et traités par OCR brut puis nettoyés localement.
            </p>
          </div>
          <div className="border border-paper-border bg-paper p-5 opacity-75">
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-warm">
              Étape 3
            </p>
            <h3 className="mt-2 font-serif text-lg font-medium text-foreground">
              Lecture assistée future
            </h3>
            <p className="mt-2 text-xs leading-5 text-foreground/70">
              Hypothèses de transcription basées sur l&apos;OCR, avec marquage des incertitudes, en attente de validation humaine.
            </p>
          </div>
        </div>

        <InventoryDashboard collections={collections} />
      </section>
    </main>
  );
}
