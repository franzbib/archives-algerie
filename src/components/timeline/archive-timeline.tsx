import Link from "next/link";
import type { ArchiveTimelineData, UnifiedTimelineEvent } from "@/lib/timeline";

type ArchiveTimelineProps = {
  timeline: ArchiveTimelineData;
};

export function ArchiveTimeline({ timeline }: ArchiveTimelineProps) {
  return (
    <section className="border border-paper-border bg-paper p-6 md:p-8">
      <div className="mb-8">
        <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
          Repères chronologiques (prototype)
        </p>
        <h2 className="mt-2 font-serif text-2xl font-medium text-foreground">
          Situer quelques repères et documents datés
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-foreground/75">
          Cette frise est une aide de consultation. Les repères historiques sont
          généraux ; les documents sont affichés seulement quand une date complète
          est repérée dans une lecture assistée non validée. Chaque date doit être
          vérifiée sur l&apos;image source.
        </p>
      </div>

      {timeline.events.length > 0 ? (
        <ol className="border-l border-paper-border pl-5">
          {timeline.events.map((event) => {
            if (event.kind === "historical") {
              return <HistoricalEventItem event={event} key={`hist-${event.id}`} />;
            }
            return <DocumentEventItem event={event} key={`doc-${event.id}`} />;
          })}
        </ol>
      ) : (
        <p className="border border-paper-border bg-background px-4 py-3 text-sm text-warm">
          Aucun repère chronologique disponible pour le moment.
        </p>
      )}

      <div className="mt-10 border border-dashed border-paper-border bg-background p-4 text-xs leading-5 text-warm">
        <p>
          Documents affichés : {timeline.documentEvents.length} sur une limite de{" "}
          {timeline.documentLimit}.
          {timeline.omittedDocumentCount > 0
            ? ` ${timeline.omittedDocumentCount} document(s) daté(s) supplémentaire(s) sont masqués pour garder une V1 légère.`
            : ""}
        </p>
        <p className="mt-2">
          Les années seules, dates ambiguës, dates techniques de prise de vue et
          dates hors 1954-1962 ne sont pas intégrées à ce prototype.
        </p>
      </div>
    </section>
  );
}

function HistoricalEventItem({ event }: { event: Extract<UnifiedTimelineEvent, { kind: "historical" }> }) {
  return (
    <li className="relative mb-10 mt-10 first:mt-0 last:mb-0">
      {/* Marqueur massif sur la ligne */}
      <span className="absolute -left-[26px] top-2 h-3 w-3 bg-warm" />

      <article className="border border-paper-border bg-paper p-5">
        <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
          {formatDate(event.date)}
        </p>
        <h3 className="mt-2 font-serif text-xl font-medium text-foreground">
          {event.title}
        </h3>
        <p className="mt-3 text-sm leading-6 text-foreground/80">{event.summary}</p>

        {event.sourceNote && (
          <p className="mt-4 border-t border-paper-border pt-3 text-xs leading-5 text-warm">
            {event.sourceNote}
          </p>
        )}
      </article>
    </li>
  );
}

function DocumentEventItem({ event }: { event: Extract<UnifiedTimelineEvent, { kind: "document" }> }) {
  return (
    <li className="relative mb-5 last:mb-0">
      {/* Marqueur discret sur la ligne */}
      <span className="absolute -left-[26px] top-3 h-2.5 w-2.5 rounded-full border-[1.5px] border-warm bg-background" />

      {/* Fiche document avec indentation */}
      <article className="ml-6 md:ml-12 border border-dashed border-paper-border bg-background p-4 transition-colors hover:border-warm/50">
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-warm">
            {formatDate(event.date)}
          </p>
          <h3 className="mt-1 font-serif text-base font-medium text-foreground">
            {event.title}
          </h3>
          <p className="mt-2 text-sm leading-6 text-foreground/75">
            {event.summary}
          </p>
        </div>

        <div className="mt-4 flex flex-col gap-3 border-t border-paper-border pt-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs leading-5 text-warm">
              Indice : “{event.dateEvidence}”
            </p>
            <p className="font-mono text-[10px] uppercase tracking-widest text-warm/70">
              {event.lotId} · {event.reviewId}
            </p>
          </div>
          <Link
            className="inline-flex shrink-0 items-center border border-paper-border bg-paper px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-foreground hover:bg-foreground hover:text-background"
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
