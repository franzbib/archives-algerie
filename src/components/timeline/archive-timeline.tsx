import Link from "next/link";
import type { ArchiveTimelineData, UnifiedTimelineEvent } from "@/lib/timeline";

type ArchiveTimelineProps = {
  timeline: ArchiveTimelineData;
};

export function ArchiveTimeline({ timeline }: ArchiveTimelineProps) {
  return (
    <section className="border border-paper-border bg-paper p-6 md:p-8">
      <div className="mb-6">
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
        <ol className="space-y-4 border-l border-paper-border pl-5">
          {timeline.events.map((event) => (
            <TimelineItem event={event} key={`${event.kind}-${event.id}`} />
          ))}
        </ol>
      ) : (
        <p className="border border-paper-border bg-background px-4 py-3 text-sm text-warm">
          Aucun repère chronologique disponible pour le moment.
        </p>
      )}

      <div className="mt-6 border border-dashed border-paper-border bg-background p-4 text-xs leading-5 text-warm">
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

function TimelineItem({ event }: { event: UnifiedTimelineEvent }) {
  const isDocument = event.kind === "document";

  return (
    <li className="relative">
      <span className="absolute -left-[26px] top-2 h-2.5 w-2.5 border border-foreground bg-paper" />
      <article className="border border-paper-border bg-background p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
              {formatDate(event.date)}
            </p>
            <h3 className="mt-1 font-serif text-lg font-medium text-foreground">
              {event.title}
            </h3>
          </div>
          <span className="w-fit border border-paper-border px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-warm">
            {isDocument ? "Document" : "Repère"}
          </span>
        </div>

        <p className="mt-3 text-sm leading-6 text-foreground/75">{event.summary}</p>

        {isDocument ? (
          <div className="mt-4 space-y-2 border-t border-paper-border pt-3">
            <p className="text-xs leading-5 text-warm">
              Indice de date : “{event.dateEvidence}”
            </p>
            <p className="font-mono text-[10px] uppercase tracking-widest text-warm">
              {event.lotId} · {event.reviewId}
            </p>
            <Link
              className="inline-flex border border-foreground px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-foreground hover:text-background"
              href={event.href}
            >
              Ouvrir la page de revue
            </Link>
          </div>
        ) : (
          <p className="mt-4 border-t border-paper-border pt-3 text-xs leading-5 text-warm">
            {event.sourceNote}
          </p>
        )}
      </article>
    </li>
  );
}

function formatDate(value: string): string {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}
