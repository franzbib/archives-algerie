import { Landmark } from "lucide-react";
import type { HistoricalContextMatch } from "@/lib/historicalContext";

type HistoricalContextBoxProps = {
  match: HistoricalContextMatch | null;
};

export function HistoricalContextBox({ match }: HistoricalContextBoxProps) {
  if (!match) {
    return null;
  }

  const { period } = match;

  return (
    <section className="border border-paper-border bg-paper p-6 md:p-8">
      <div className="flex items-start gap-3">
        <Landmark className="mt-1 h-5 w-5 shrink-0 text-warm" />
        <div>
          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
            Repères historiques possibles
          </p>
          <h2 className="mt-1 font-serif text-2xl font-medium text-foreground">
            {period.title}
          </h2>
          <p className="mt-1 font-mono text-xs uppercase tracking-widest text-warm">
            {period.periodLabel}
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-4 text-sm leading-6 text-foreground/80">
        <p>
          Ces repères servent à situer le document. Ils ne constituent pas une
          interprétation.
        </p>
        <p>
          Ce document peut être rapproché chronologiquement de ce repère à partir
          des dates ou indices disponibles.
        </p>
        <p>{period.summary}</p>
        <p className="border-l-2 border-paper-border pl-4 text-warm">
          {match.matchReason}
        </p>
        <p>
          {period.methodologicalWarning} Cette indication ne constitue pas une
          interprétation du document. À vérifier dans le document original.
        </p>
      </div>

      {period.sourceNotes.length > 0 && (
        <div className="mt-5 border-t border-paper-border pt-4">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-warm">
            Sources générales à consolider
          </p>
          <ul className="mt-3 space-y-2 text-xs leading-5 text-foreground/70">
            {period.sourceNotes.map((note) => (
              <li key={note}>- {note}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
