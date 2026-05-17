import Link from "next/link";
import type { ArchiveTimelineData, UnifiedTimelineEvent } from "@/lib/timeline";

type ArchiveTimelineProps = {
  timeline: ArchiveTimelineData;
};

export function ArchiveTimeline({ timeline }: ArchiveTimelineProps) {
  return (
    <section className="border border-paper-border bg-paper p-6 md:p-10 overflow-hidden">
      <div className="mb-8">
        <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
          Repères chronologiques
        </p>
        <h2 className="mt-2 font-serif text-3xl font-medium text-foreground">
          Situer les documents dans le temps
        </h2>
        <p className="mt-4 max-w-3xl text-base leading-7 text-foreground/80">
          Cette frise permet de croiser les grands repères historiques avec les
          dates extraites des documents d&apos;archives. Sur ordinateur, faites défiler
          horizontalement pour explorer l&apos;ensemble de la chronologie.
        </p>
      </div>

      {timeline.events.length > 0 ? (
        <div className="relative mt-12 mb-4">
          <ol className="flex flex-col md:flex-row md:overflow-x-auto md:scroll-smooth md:snap-x md:pb-8 md:pt-10 border-l md:border-l-0 md:border-t border-paper-border pl-5 md:pl-0 space-y-6 md:space-y-0 md:space-x-6 hide-scrollbar">
            {timeline.events.map((event) => {
              if (event.kind === "historical") {
                return <HistoricalEventItem event={event} key={`hist-${event.id}`} />;
              }
              return <DocumentEventItem event={event} key={`doc-${event.id}`} />;
            })}
            {/* Spacer pour la fin du scroll horizontal */}
            <li className="hidden md:block md:w-8 md:shrink-0" aria-hidden="true" />
          </ol>
        </div>
      ) : (
        <p className="border border-paper-border bg-background px-4 py-3 text-sm text-warm">
          Aucun repère chronologique disponible pour le moment.
        </p>
      )}

      <div className="mt-8 border border-dashed border-paper-border bg-background p-5 text-sm leading-6 text-warm">
        <p>
          <strong className="text-foreground/80 font-medium">Note de lecture :</strong> {timeline.documentEvents.length} document(s)
          actuellement placés sur la frise (limite fixée à {timeline.documentLimit} pour la lisibilité).
          {timeline.omittedDocumentCount > 0
            ? ` ${timeline.omittedDocumentCount} autre(s) document(s) masqué(s).`
            : ""}
        </p>
        <p className="mt-1">
          Les dates partielles ou hors séquence (1954-1962) sont volontairement
          exclues de ce prototype. Les repères proviennent de l&apos;OCR brut non validé.
        </p>
      </div>
    </section>
  );
}

function HistoricalEventItem({ event }: { event: Extract<UnifiedTimelineEvent, { kind: "historical" }> }) {
  return (
    <li className="relative md:shrink-0 md:w-80 md:snap-start">
      {/* Marqueur : aligné verticalement sur mobile, horizontalement sur desktop */}
      <span className="absolute left-[-20px] -translate-x-1/2 top-2 md:left-4 md:translate-x-0 md:top-[-40px] md:-translate-y-1/2 h-3.5 w-3.5 bg-warm" />

      <article className="border border-paper-border bg-paper p-6 h-full shadow-sm">
        <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
          {formatDate(event.date)}
        </p>
        <h3 className="mt-3 font-serif text-2xl font-medium text-foreground">
          {event.title}
        </h3>
        <p className="mt-3 text-sm leading-6 text-foreground/80">{event.summary}</p>

        {event.sourceNote && (
          <p className="mt-5 border-t border-paper-border pt-4 text-xs leading-5 text-warm">
            {event.sourceNote}
          </p>
        )}
      </article>
    </li>
  );
}

function DocumentEventItem({ event }: { event: Extract<UnifiedTimelineEvent, { kind: "document" }> }) {
  return (
    <li className="relative ml-6 md:ml-0 md:mt-8 md:shrink-0 md:w-80 md:snap-start">
      {/* Marqueur document : ml-6 sur mobile donne -20 - 24 = -44px. mt-8 sur desktop donne -40 - 32 = -72px */}
      <span className="absolute left-[-44px] -translate-x-1/2 top-3 md:left-6 md:translate-x-0 md:top-[-72px] md:-translate-y-1/2 h-2.5 w-2.5 rounded-full border-[1.5px] border-warm bg-background" />

      <article className="border border-dashed border-paper-border bg-background p-5 h-full flex flex-col justify-between transition-colors hover:border-warm/50">
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-warm">
            {formatDate(event.date)}
          </p>
          <h3 className="mt-2 font-serif text-lg font-medium text-foreground">
            {event.title}
          </h3>
          <p className="mt-2 text-sm leading-6 text-foreground/75 line-clamp-3">
            {event.summary}
          </p>
        </div>

        <div className="mt-5 flex flex-col gap-4 border-t border-paper-border pt-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs leading-5 text-warm font-medium">
              “{event.dateEvidence}”
            </p>
            <p className="font-mono text-[10px] uppercase tracking-widest text-warm/70">
              {event.lotId}
            </p>
          </div>
          <Link
            className="inline-flex shrink-0 items-center justify-center border border-paper-border bg-paper px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-foreground hover:bg-foreground hover:text-background"
            href={event.href}
          >
            Consulter
          </Link>
        </div>
      </article>
    </li>
  );
}

function formatDate(value: string): string {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}
