import { ChevronRight } from "lucide-react";

export function PipelineSteps() {
  const steps = [
    { label: "Drive listé", status: "done" },
    { label: "Fichier qualifié", status: "done" },
    { label: "Échantillon", status: "done" },
    { label: "Téléchargé", status: "pending" },
    { label: "Converti JPG", status: "pending" },
    { label: "OCR brut", status: "pending" },
    { label: "OCR nettoyé", status: "pending" },
    { label: "Lecture assistée", status: "future" },
    { label: "Validation humaine", status: "future" },
  ];

  return (
    <div className="mb-8 border border-paper-border bg-paper p-6">
      <p className="mb-4 font-mono text-xs font-semibold uppercase tracking-widest text-warm">
        Pipeline archivistique local
      </p>
      <div className="flex flex-wrap items-center gap-y-3">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          const isDone = step.status === "done";
          const isPending = step.status === "pending";

          return (
            <div key={step.label} className="flex items-center">
              <span
                className={`inline-flex items-center px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest border-2 ${
                  isDone
                    ? "border-warm bg-warm/10 text-warm"
                    : isPending
                      ? "border-warm/40 bg-transparent text-foreground/80"
                      : "border-paper-border border-dashed text-foreground/50"
                }`}
              >
                {step.label}
              </span>
              {!isLast && (
                <ChevronRight className="mx-2 h-4 w-4 shrink-0 text-warm/40" />
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-xs leading-5 text-foreground/70 max-w-3xl">
        L&apos;inventaire Drive actuel s&apos;arrête à la sélection de l&apos;échantillon. 
        Les étapes suivantes (téléchargement, conversion, OCR, normalisation) sont gérées localement. 
        La lecture assistée et la validation finale interviendront ultérieurement.
      </p>
    </div>
  );
}
