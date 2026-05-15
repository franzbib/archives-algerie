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
    <section className="border border-dashed border-paper-border bg-paper/40 p-6 md:p-8">
      <div className="flex items-start gap-3">
        <Landmark className="mt-1 h-5 w-5 shrink-0 text-warm" />
        <div>
          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
            Contexte chronologique
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
          Ces repères généraux aident à situer l’époque du document. Seule la
          lecture de l’archive permet d’en comprendre le contenu exact.
        </p>
        <p>{period.summary}</p>
        <p className="border-l-2 border-paper-border pl-4 text-warm">
          {match.matchReason}
        </p>
        <p>{period.methodologicalWarning}</p>
      </div>

      {period.sourceNotes.length > 0 && (
        <div className="mt-5 border-t border-dashed border-paper-border pt-4">
          <details className="group">
            <summary className="cursor-pointer font-mono text-[10px] font-semibold uppercase tracking-widest text-warm hover:text-foreground">
              Voir les sources générales
            </summary>
            <ul className="mt-3 space-y-2 text-xs leading-5 text-foreground/70">
              {period.sourceNotes.map((note) => (
                <li key={note}>- {note}</li>
              ))}
            </ul>
          </details>
        </div>
      )}
    </section>
  );
}
