import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  Clock,
  Layers,
  MapPin,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { InventoryDashboard } from "@/components/inventory/inventory-dashboard";
import { StatCard } from "@/components/stat-card";
import {
  getCollections,
  getDocuments,
  hasV1Enrichment,
} from "@/lib/archiveManifest";
import {
  getArchiveBatches,
  getArchiveBatchPageCount,
  isArchiveBatchReviewReady,
} from "@/lib/archiveBatches";
import type { ArchiveBatch } from "@/lib/archiveBatches";

export default function InventoryPage() {
  const collections = getCollections();
  const documents = getDocuments();
  const enrichedCount = collections.filter(hasV1Enrichment).length;
  const notEnrichedCount = collections.length - enrichedCount;

  const batches = getArchiveBatches();
  const readyBatches = batches.filter(isArchiveBatchReviewReady);
  const plannedBatches = batches.filter((b) => !isArchiveBatchReviewReady(b));

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
            Suivi technique du pipeline d&apos;archives
          </p>
          <h1 className="mt-3 font-serif text-4xl font-medium text-foreground">
            Tableau de bord des traitements
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-foreground/80">
            Cette page donne une vue d&apos;ensemble de l&apos;avancement technique des lots, du pipeline OCR, et de l&apos;activation des briques fonctionnelles du projet. Elle est destinee au pilotage et non a la consultation.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10 lg:px-8 space-y-16">

        {/* Avertissement Consultation */}
        <div className="border border-foreground bg-background p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
                Avertissement
              </p>
              <p className="mt-2 text-sm font-medium text-foreground">
                Cette page suit le traitement technique des lots.
              </p>
            </div>
            <Link
              href="/lots"
              className="inline-flex shrink-0 items-center justify-center border border-foreground bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
            >
              Consulter les archives dans /lots
            </Link>
          </div>
        </div>

        {/* Lots publies */}
        <div>
          <div className="mb-6 flex items-center gap-3">
            <Layers className="h-5 w-5 text-warm" />
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
                Production
              </p>
              <h2 className="font-serif text-2xl font-medium text-foreground">
                Lots traites et publies
              </h2>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {readyBatches.map((batch) => (
              <TechnicalBatchCard batch={batch} key={batch.lotId} />
            ))}
          </div>
        </div>

        {/* Lots en preparation */}
        <div>
          <div className="mb-6 flex items-center gap-3">
            <Clock className="h-5 w-5 text-warm" />
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
                Pipeline
              </p>
              <h2 className="font-serif text-2xl font-medium text-foreground">
                Lots en preparation
              </h2>
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {plannedBatches.map((batch) => (
              <div key={batch.lotId} className="border border-paper-border bg-paper p-5">
                <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-warm">
                  {batch.lotId}
                </p>
                <h3 className="mt-1 font-serif text-lg font-medium text-foreground">
                  {batch.title}
                </h3>
                <p className="mt-2 text-xs leading-5 text-foreground/70">
                  {batch.notes}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Briques fonctionnelles */}
        <div>
          <div className="mb-6 flex items-center gap-3">
            <ClipboardList className="h-5 w-5 text-warm" />
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
                Architecture
              </p>
              <h2 className="font-serif text-2xl font-medium text-foreground">
                Fonctionnalites du projet
              </h2>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureStatus icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />} label="Navigation publique multi-lots" status="Disponible" />
            <FeatureStatus icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />} label="Images R2" status="Disponible (lots publies)" />
            <FeatureStatus icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />} label="Lectures assistees (Vision)" status="Disponible (lots publies)" />
            <FeatureStatus icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />} label="Relecture humaine statique" status="Disponible" />
            <FeatureStatus icon={<Clock className="h-4 w-4 text-amber-600" />} label="Traitement PDF" status="A stabiliser localement" />
            <FeatureStatus icon={<Clock className="h-4 w-4 text-amber-600" />} label="Notes persistantes (Supabase)" status="Prepare / A configurer" />
            <FeatureStatus icon={<Clock className="h-4 w-4 text-amber-600" />} label="Recherche plein texte" status="Prevue / Locale partielle" />
            <FeatureStatus icon={<XCircle className="h-4 w-4 text-rose-600" />} label="Embeddings" status="Non actives" />
            <FeatureStatus icon={<XCircle className="h-4 w-4 text-rose-600" />} label="Recherche langage naturel" status="Non activee" />
            <FeatureStatus icon={<XCircle className="h-4 w-4 text-rose-600" />} label="Validation humaine complete" status="Non activee" />
          </div>

          <div className="mt-6 border border-paper-border bg-paper p-5">
            <h3 className="font-serif text-lg font-medium text-foreground">
              Limites actuelles
            </h3>
            <ul className="mt-3 list-disc pl-5 text-sm leading-6 text-foreground/75 space-y-1">
              <li>La recherche naturelle n&apos;est pas encore disponible dans l&apos;interface.</li>
              <li>Les embeddings ne sont pas generes.</li>
              <li>Les notes persistantes necessitent encore Supabase.</li>
              <li>Les corrections humaines ne sont pas encore sauvegardees en base.</li>
              <li>Les OCR bruts ne sont pas publies.</li>
              <li>Les lectures assistees ne sont pas des transcriptions validees.</li>
            </ul>
          </div>
        </div>

        {/* Roadmap */}
        <div>
          <div className="mb-6 flex items-center gap-3">
            <MapPin className="h-5 w-5 text-warm" />
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
                Feuille de route
              </p>
              <h2 className="font-serif text-2xl font-medium text-foreground">
                Prochaines etapes
              </h2>
            </div>
          </div>
          <div className="border border-paper-border bg-paper p-6">
            <ol className="list-decimal pl-5 text-sm leading-7 text-foreground/80 space-y-2">
              <li>Integrer le lot <code className="bg-background px-1 py-0.5 text-xs text-warm">lot-fln-w4-003</code> si non fait.</li>
              <li>Stabiliser le traitement de conversion et extraction PDF.</li>
              <li>Configurer Supabase pour l&apos;enregistrement des notes persistantes.</li>
              <li>Ameliorer la fonction de recherche.</li>
              <li>Preparer la generation des embeddings seulement apres la politique de validation humaine.</li>
            </ol>
          </div>
        </div>

        {/* Reperes V0 */}
        <div className="border-t border-paper-border pt-12">
          <div className="mb-6 flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-warm" />
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
                Tracabilite
              </p>
              <h2 className="font-serif text-2xl font-medium text-foreground">
                Reperes V0 conserves
              </h2>
              <p className="mt-2 text-sm leading-6 text-foreground/70">
                Ces anciens compteurs et routes de suivi reflètent l&apos;état du tout premier manifeste local.
              </p>
            </div>
          </div>

          <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Collections V0" value={collections.length} />
            <StatCard label="Documents V0" value={documents.length} />
            <StatCard label="Notices V1" value={enrichedCount} />
            <StatCard label="Non enrichies" value={notEnrichedCount} />
          </div>

          <div className="mb-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <Link
              href="/inventaire-drive"
              className="group border border-paper-border bg-paper p-5 transition-colors hover:border-warm/50"
            >
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-warm">Étape 1</p>
              <h3 className="mt-2 font-serif text-lg font-medium text-foreground group-hover:text-warm">
                Inventaire Drive pilote
              </h3>
            </Link>
            <div className="border border-paper-border bg-paper p-5 opacity-75">
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-warm">Étape 2</p>
              <h3 className="mt-2 font-serif text-lg font-medium text-foreground">
                Pipeline local pilote
              </h3>
            </div>
            <div className="border border-paper-border bg-paper p-5 opacity-75">
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-warm">Étape 3</p>
              <h3 className="mt-2 font-serif text-lg font-medium text-foreground">
                Lecture assistée future
              </h3>
            </div>
            <Link
              href="/controle-pilote"
              className="group border border-paper-border bg-paper p-5 transition-colors hover:border-warm/50"
            >
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-warm">Historique</p>
              <h3 className="mt-2 font-serif text-lg font-medium text-foreground group-hover:text-warm">
                Pilotes publies
              </h3>
            </Link>
            <Link
              href="/controle-batch"
              className="group border border-paper-border bg-paper p-5 transition-colors hover:border-warm/50"
            >
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-warm">Historique</p>
              <h3 className="mt-2 font-serif text-lg font-medium text-foreground group-hover:text-warm">
                Boghari V0
              </h3>
            </Link>
          </div>

          <InventoryDashboard collections={collections} />
        </div>
      </section>
    </main>
  );
}

function FeatureStatus({ icon, label, status }: { icon: React.ReactNode; label: string; status: string }) {
  return (
    <div className="flex items-start gap-3 border border-paper-border bg-paper p-4">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-foreground/60">{status}</p>
      </div>
    </div>
  );
}

function TechnicalBatchCard({ batch }: { batch: ArchiveBatch }) {
  const pageCount = getArchiveBatchPageCount(batch);

  return (
    <div className="border border-paper-border bg-paper flex flex-col justify-between">
      <div className="p-5">
        <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-warm">
          {batch.lotId}
        </p>
        <h3 className="mt-1 font-serif text-xl font-medium text-foreground">
          {batch.title}
        </h3>

        <dl className="mt-4 grid gap-x-4 gap-y-2 text-xs sm:grid-cols-2">
          <div>
            <dt className="text-foreground/60">Collection</dt>
            <dd className="font-medium text-foreground">{batch.collectionId}</dd>
          </div>
          <div>
            <dt className="text-foreground/60">Pages</dt>
            <dd className="font-medium text-foreground">{pageCount}</dd>
          </div>
          <div>
            <dt className="text-foreground/60">Images R2</dt>
            <dd className="font-medium text-emerald-600">Disponibles</dd>
          </div>
          <div>
            <dt className="text-foreground/60">Lectures assistees</dt>
            <dd className="font-medium text-emerald-600">Disponibles</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-foreground/60">Validation humaine</dt>
            <dd className="font-medium text-amber-600">Non validee</dd>
          </div>
        </dl>
      </div>

      <div className="border-t border-paper-border bg-background/50 p-4">
        <Link
          href={`/lots/${batch.lotId}`}
          className="text-sm font-medium text-warm hover:text-foreground inline-flex items-center gap-1"
        >
          Ouvrir le lot dans /lots
        </Link>
      </div>
    </div>
  );
}
